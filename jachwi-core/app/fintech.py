"""2번 소비 관리: 사용자별 원장, 월 예산, 공통 SpendingSnapshot 연결."""
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo
from uuid import uuid4
from typing import Annotated, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import Field
from sqlalchemy import String, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm.exc import StaleDataError
from .database import Base, ProfileRow
from .schemas import Contract, Money, Spending, SpendingSnapshot

Period = Annotated[str, Field(pattern=r'^[0-9]{4}-(0[1-9]|1[0-2])$')]
class LedgerRow(Base):
    __tablename__ = 'fintech_ledgers'
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    __mapper_args__ = {'version_id_col': version}

class ExpenseInput(Contract):
    title: str = Field(min_length=1, max_length=100)
    amount_krw: Annotated[int, Field(strict=True, gt=0, le=1_000_000_000)]
    spent_on: date
    category: Literal['food', 'groceries', 'living', 'transport', 'other']

class BudgetInput(Contract):
    budget_krw: Money | None


def current_period():
    return datetime.now(ZoneInfo('Asia/Seoul')).strftime('%Y-%m')


def snapshot_for(row, period):
    data = row.payload
    spent = sum(e['amount_krw'] for e in data['expenses'] if e['spent_on'][:7] == period)
    budget = data['budgets'].get(period)
    return SpendingSnapshot(source_updated_at=data['updated_at'], data=Spending(
        period=period, budget_krw=budget, spent_krw=spent,
        remaining_krw=None if budget is None else budget-spent))


def register_fintech(app, current_user, db):
    router = APIRouter(prefix='/api/v1/me/spending', tags=['2번 소비 관리'])

    def ledger(session, user):
        return session.get(LedgerRow, user)

    def ensure(session, user):
        row = ledger(session, user)
        if row is None:
            row = LedgerRow(user_id=user, payload={'expenses': [], 'budgets': {}, 'updated_at': datetime.now(timezone.utc).isoformat()})
            session.add(row)
        return row

    def save(session, row, payload):
        # 공통 계약의 월 지출 상한을 넘으면 저장하지 않는다.
        totals = {}
        for e in payload['expenses']:
            p = e['spent_on'][:7]
            totals[p] = totals.get(p, 0) + e['amount_krw']
        if any(v > 1_000_000_000 for v in totals.values()):
            raise HTTPException(422, '월 누적 지출은 10억원 이하여야 합니다.')
        row.payload = {**payload, 'updated_at': datetime.now(timezone.utc).isoformat()}
        try:
            session.commit()
        except StaleDataError:
            session.rollback()
            raise HTTPException(409, '다른 요청이 먼저 저장됐습니다. 새로 조회 후 다시 시도하세요.')

    @router.get('')
    def summary(period: Annotated[str | None, Query(pattern=r'^[0-9]{4}-(0[1-9]|1[0-2])$')] = None,
                user=Depends(current_user), session=Depends(db)):
        period = period or current_period()
        row = ledger(session, user)
        profile = session.get(ProfileRow, user)
        suggested = profile.payload.get('monthly_budget_krw') if profile else None
        snapshot = snapshot_for(row, period) if row else None
        data = snapshot.data if snapshot else Spending(period=period, spent_krw=0)
        expenses = sorted([e for e in row.payload['expenses'] if e['spent_on'][:7] == period],
                          key=lambda e: (e['spent_on'], e['id']), reverse=True) if row else []
        warning = ('unset' if data.budget_krw is None else 'exceeded' if data.spent_krw > data.budget_krw
                   else 'reached' if data.spent_krw == data.budget_krw
                   else 'near_limit' if data.spent_krw * 100 >= data.budget_krw * 80 else 'normal')
        return {'data': data, 'expenses': expenses, 'warning': warning,
                'suggested_budget_krw': suggested, 'source_updated_at': snapshot.source_updated_at if snapshot else None}

    @router.put('/budgets/{period}')
    def budget(period: Period, body: BudgetInput, user=Depends(current_user), session=Depends(db)):
        row = ensure(session, user)
        save(session, row, {**row.payload, 'budgets': {**row.payload['budgets'], period: body.budget_krw}})
        return {'saved': True}

    @router.post('/expenses', status_code=201)
    def add(body: ExpenseInput, user=Depends(current_user), session=Depends(db)):
        row = ensure(session, user)
        entry = {'id': str(uuid4()), **body.model_dump(mode='json')}
        save(session, row, {**row.payload, 'expenses': [*row.payload['expenses'], entry]})
        return entry

    @router.put('/expenses/{expense_id}')
    def edit(expense_id: str, body: ExpenseInput, user=Depends(current_user), session=Depends(db)):
        row = ledger(session, user)
        if row is None or not any(e['id'] == expense_id for e in row.payload['expenses']):
            raise HTTPException(404, '소비 내역을 찾을 수 없습니다.')
        entry = {'id': expense_id, **body.model_dump(mode='json')}
        save(session, row, {**row.payload, 'expenses': [entry if e['id'] == expense_id else e for e in row.payload['expenses']]})
        return entry

    @router.delete('/expenses/{expense_id}')
    def delete(expense_id: str, user=Depends(current_user), session=Depends(db)):
        row = ledger(session, user)
        if row is None or not any(e['id'] == expense_id for e in row.payload['expenses']):
            raise HTTPException(404, '소비 내역을 찾을 수 없습니다.')
        save(session, row, {**row.payload, 'expenses': [e for e in row.payload['expenses'] if e['id'] != expense_id]})
        return {'deleted': True}

    app.include_router(router)
