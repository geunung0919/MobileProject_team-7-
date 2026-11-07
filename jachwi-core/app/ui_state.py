"""Account-scoped UI adapter over the existing ledger/inventory contracts."""
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import String, JSON, update
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base
import json
import hashlib
from datetime import datetime, timezone
from .database import ProfileRow, InventoryRow, SnapshotRow, NotificationSettingsRow
from .fintech import LedgerRow, ExpenseInput, current_period
from .schemas import Inventory, InventorySnapshot, LifeSnapshot
from pydantic import ValidationError
from sqlalchemy.orm.exc import StaleDataError
from zoneinfo import ZoneInfo

class UIStateRow(Base):
    __tablename__ = 'ui_workspace'
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON)

class UIState(BaseModel):
    model_config = ConfigDict(extra='forbid')
    revision: str = ''
    transactions: list[dict] = Field(default_factory=list, max_length=5000)
    fridgeItems: list[dict] = Field(default_factory=list, max_length=500)
    todos: list[dict] = Field(default_factory=list, max_length=500)
    routines: list[dict] = Field(default_factory=list, max_length=500)
    profile: dict = Field(default_factory=dict)
    settings: dict = Field(default_factory=dict)

def revision(db, user):
    values = []
    for model in (UIStateRow, LedgerRow, InventoryRow):
        row = db.get(model, user)
        values.append(row.payload if row else None)
    life = db.get(SnapshotRow, (user, 'life'))
    values.append(life.payload if life else None)
    return hashlib.sha256(json.dumps(values, sort_keys=True).encode()).hexdigest()

def register_ui_state(app, current_user, sessions):
    @app.get('/api/v1/me/ui-state', tags=['통합 UI'])
    def get_state(user=Depends(current_user)):
        with sessions() as db:
            row = db.get(UIStateRow, user)
            result = dict(row.payload) if row else UIState().model_dump()
            ledger = db.get(LedgerRow, user)
            if ledger:
                details = {x['id']: x for x in result.get('transactions', [])}
                result['transactions'] = [{**details.get(x['id'], {}), 'id':x['id'],
                    'title':x['title'], 'amount':x['amount_krw'], 'date':x['spent_on'],
                    'category':details.get(x['id'], {}).get('category', x['category']),
                    'icon':details.get(x['id'], {}).get('icon', 'wallet-outline')}
                    for x in ledger.payload['expenses']]
            inv = db.get(InventoryRow, user)
            if inv:
                details = {x['id']:x for x in result.get('fridgeItems', [])}
                units = {'piece':'개','pack':'팩','g':'g','ml':'ml'}
                result['fridgeItems'] = [{**details.get(x['item_id'],{}), 'id':x['item_id'],
                    'name':x['name'], 'amount':x['quantity'], 'unit':units[x['unit']],
                    'quantity':str(x['quantity'])+units[x['unit']], 'expiry':x['target_date'],
                    'storage':x['storage'], 'date_source':x['date_source'], 'icon':'food-apple-outline'}
                    for x in inv.payload['data']['items']]
            preferences = db.get(NotificationSettingsRow,user)
            if preferences:
                result['settings'] = {**result.get('settings',{}),'notifySpending':preferences.payload['spending_alerts'],'notifyFridge':preferences.payload['inventory_alerts'],'notifyRoutine':preferences.payload['routine_reminders']}
            return {**result, 'revision':revision(db,user)}

    @app.put('/api/v1/me/ui-state', tags=['통합 UI'])
    def put_state(body: UIState, user=Depends(current_user)):
        payload = body.model_dump(exclude={'revision'})
        if len(json.dumps(payload).encode()) > 2_000_000:
            raise HTTPException(413, '저장할 데이터가 너무 큽니다.')
        try:
            categories = {'식비':'food','식료품':'groceries','생활용품':'living','교통':'transport'}
            expenses = []
            for x in body.transactions:
                cat = categories.get(x.get('category'),x.get('category','other'))
                if cat not in ('food','groceries','living','transport','other'): cat='other'
                entry = ExpenseInput(title=x['title'],amount_krw=x['amount'],spent_on=x['date'],category=cat)
                expenses.append({'id':str(x['id']), **entry.model_dump(mode='json')})
            if len({x['id'] for x in expenses}) != len(expenses): raise ValueError('duplicate ids')
            totals = {}
            for x in expenses:
                month=x['spent_on'][:7]; totals[month]=totals.get(month,0)+x['amount_krw']
            if any(v>1_000_000_000 for v in totals.values()): raise ValueError('monthly limit')
            units = {'개':'piece','모':'piece','병':'piece','캔':'piece','봉':'pack','팩':'pack','g':'g','kg':'g','ml':'ml','L':'ml'}
            inventory = Inventory(items=[dict(item_id=x['id'],name=x['name'],quantity=x['amount'] * (1000 if x['unit'] in ('kg','L') else 1),
                unit=units[x['unit']],storage=x.get('storage','fridge'),target_date=x.get('expiry'),
                date_source=x.get('date_source','label') if x.get('expiry') else 'unknown') for x in body.fridgeItems])
        except (KeyError, ValueError, TypeError, ValidationError):
            raise HTTPException(422, '금액·날짜·식재료 수량을 확인하세요.') from None
        with sessions() as db:
            if body.revision != revision(db,user):
                raise HTTPException(409, '다른 기기에서 변경됐습니다. 로그아웃 후 다시 연결해 주세요.')
            ledger = db.get(LedgerRow,user)
            old = ledger.payload if ledger else {'budgets':{},'imported_fingerprints':[]}
            metadata = {x['id']:x for x in old.get('expenses',[])}
            expenses = [{**metadata.get(x['id'],{}),**x} for x in expenses]
            budgets = dict(old.get('budgets',{}))
            profile = db.get(ProfileRow,user)
            if profile: budgets[current_period()] = profile.payload.get('monthly_budget_krw')
            data = {**old,'expenses':expenses,'budgets':budgets,'updated_at':datetime.now(timezone.utc).isoformat()}
            if ledger: ledger.payload=data
            else: db.add(LedgerRow(user_id=user,payload=data))
            inv=db.get(InventoryRow,user)
            snapshot = InventorySnapshot(source_updated_at=datetime.now(timezone.utc),data=inventory).model_dump(mode='json')
            if inv:
                result = db.execute(update(InventoryRow).where(InventoryRow.user_id==user, InventoryRow.revision==inv.revision).values(revision=inv.revision+1,payload=snapshot))
                if result.rowcount != 1: raise HTTPException(409, '재고 동시 저장 충돌입니다.')
            else: db.add(InventoryRow(user_id=user,revision=1,payload=snapshot))
            today = datetime.now(ZoneInfo('Asia/Seoul')).date().isoformat()
            try:
                routines = [dict(routine_id=x['id'],title=x['title'],due_date=today,completed=bool(x.get('doneToday'))) for x in body.routines]
                previous_ui = db.get(UIStateRow,user)
                ui_ids = {x['id'] for x in (previous_ui.payload.get('routines',[]) if previous_ui else [])} | {x['id'] for x in body.routines}
                previous_life = db.get(SnapshotRow,(user,'life'))
                if previous_life:
                    routines += [x for x in previous_life.payload['data']['routines'] if x['routine_id'] not in ui_ids]
                life = LifeSnapshot(source_updated_at=datetime.now(timezone.utc),data={'routines':routines,'exhausted':previous_life.payload['data'].get('exhausted',False) if previous_life else False})
            except (KeyError, ValueError, TypeError): raise HTTPException(422, '루틴을 확인하세요.') from None
            db.merge(SnapshotRow(user_id=user,module='life',payload=life.model_dump(mode='json')))
            db.merge(NotificationSettingsRow(user_id=user,payload={'spending_alerts':bool(body.settings.get('notifySpending')), 'inventory_alerts':bool(body.settings.get('notifyFridge')), 'routine_reminders':bool(body.settings.get('notifyRoutine'))}))
            db.merge(UIStateRow(user_id=user, payload=payload))
            try: db.commit()
            except StaleDataError:
                db.rollback(); raise HTTPException(409, '동시 저장 충돌입니다. 다시 연결하세요.') from None
            return {'saved': True, 'revision':revision(db,user)}
