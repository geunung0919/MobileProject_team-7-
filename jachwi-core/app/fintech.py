"""2번 소비 관리: 사용자별 원장, 월 예산, 공통 SpendingSnapshot 연결."""
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from uuid import uuid4
import hashlib
import re
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


ImportSource = Literal['sms', 'notification', 'kakao', 'ocr', 'commerce', 'unknown']


class ImportPreviewInput(Contract):
    raw_text: str = Field(min_length=3, max_length=5000)
    source: ImportSource = 'unknown'


class ImportConfirmInput(ExpenseInput):
    raw_text: str = Field(min_length=3, max_length=5000)
    source: ImportSource = 'unknown'


_AMOUNT_PATTERNS = [
    re.compile(
        r'(?:결제\s*금액|승인\s*금액|이용\s*금액|합계|총액|총\s*결제|받을\s*금액)'
        r'\s*[:：]?\s*([0-9][0-9,]{0,15})(?:\s*원)?',
        re.I,
    ),
    re.compile(r'([0-9][0-9,]{0,15})\s*원\s*(?:승인|결제|이용)', re.I),
]
_GENERIC_AMOUNT_RE = re.compile(r'([0-9][0-9,]{0,15})\s*원')
_FULL_DATE_RE = re.compile(
    r'(?<!\d)(20\d{2})[./-](0?[1-9]|1[0-2])[./-](0?[1-9]|[12]\d|3[01])(?!\d)'
)
_SHORT_DATE_RE = re.compile(
    r'(?<![\d./-])(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])(?!\d)'
)
_KO_DATE_RE = re.compile(
    r'(?:(20\d{2})년\s*)?(0?[1-9]|1[0-2])월\s*(0?[1-9]|[12]\d|3[01])일'
)
_TIME_RE = re.compile(r'\b(?:[01]?\d|2[0-3]):[0-5]\d\b')
_ISSUER_TOKENS = (
    '국민카드', 'KB국민', '신한카드', '삼성카드', '현대카드',
    '롯데카드', '하나카드', '우리카드', 'NH카드', 'BC카드',
)
_GENERIC_MERCHANTS = {
    '카카오페이', '네이버페이', '토스페이', '삼성페이',
    '영수증', 'receipt', '승인', '결제', '결제완료', '주문완료',
}
_CATEGORY_RULES = [
    ('transport', ('택시', '카카오t', '버스', '지하철', '코레일', 'srt', '주유', '충전소', '주차', '통행료', '톨게이트')),
    ('groceries', ('이마트', '홈플러스', '롯데마트', '하나로마트', '마트', '슈퍼', 'gs25', 'cu', '세븐일레븐', '편의점', '장보기')),
    ('food', ('스타벅스', '카페', '커피', '배달의민족', '배민', '요기요', '쿠팡이츠', '맥도날드', '버거', '식당', '음식점', '치킨', '피자', '분식', '베이커리')),
    ('living', ('다이소', '올리브영', '약국', '세탁', '생활용품', '문구', '잡화')),
]


def normalize_import_text(value):
    return '\n'.join(
        ' '.join(line.split())
        for line in value.replace('\r', '\n').split('\n')
        if line.strip()
    )


def import_fingerprint(source, raw_text):
    normalized = normalize_import_text(raw_text).casefold()
    return hashlib.sha256((source + '\n' + normalized).encode('utf-8')).hexdigest()[:24]


def _amount_value(value):
    try:
        amount = int(value.replace(',', ''))
    except ValueError:
        return None
    return amount if 0 < amount <= 1_000_000_000 else None


# Conservative extraction: totals/balances/discounts are not a new purchase.
_NON_TRANSACTION_AMOUNT_RE = re.compile(r'누적|잔액|한도|청구|할인|적립|포인트|거스름')
_NON_PURCHASE_EVENT_RE = re.compile(
    r'(?:승인|결제)\s*(?:취소|거절|실패)|취소\s*완료|환불\s*(?:완료|금액)'
)


def is_non_purchase_event(text):
    return bool(_NON_PURCHASE_EVENT_RE.search(normalize_import_text(text)))


def extract_amount(text):
    lines = [line for line in text.split('\n') if not _NON_TRANSACTION_AMOUNT_RE.search(line)]
    for patterns in (_AMOUNT_PATTERNS, [_GENERIC_AMOUNT_RE]):
        amounts = {
            amount
            for line in lines
            for pattern in patterns
            for match in pattern.finditer(line)
            if (amount := _amount_value(match.group(1))) is not None
        }
        if amounts:
            # Multiple plausible amounts require a person to choose, not first-match wins.
            return next(iter(amounts)) if len(amounts) == 1 else None
    return None


def _safe_date(year, month, day):
    try:
        return date(year, month, day)
    except ValueError:
        return None


def extract_date(text, today=None):
    today = today or datetime.now(ZoneInfo('Asia/Seoul')).date()

    match = _FULL_DATE_RE.search(text)
    if match:
        parsed = _safe_date(*map(int, match.groups()))
        if parsed:
            return parsed, False

    match = _KO_DATE_RE.search(text)
    if match:
        year = int(match.group(1)) if match.group(1) else today.year
        parsed = _safe_date(year, int(match.group(2)), int(match.group(3)))
        if parsed:
            if not match.group(1) and parsed > today + timedelta(days=7):
                parsed = _safe_date(year - 1, parsed.month, parsed.day)
            return parsed, False

    match = _SHORT_DATE_RE.search(text)
    if match:
        parsed = _safe_date(today.year, int(match.group(1)), int(match.group(2)))
        if parsed:
            if parsed > today + timedelta(days=7):
                parsed = _safe_date(today.year - 1, parsed.month, parsed.day)
            return parsed, False

    return today, True


def _clean_merchant(value):
    cleaned = value.strip(' -|:：[]()')
    cleaned = re.split(
        r'\s+(?:잔액|누적|일시불|할부|승인번호|카드번호)\b',
        cleaned,
        maxsplit=1,
    )[0].strip()
    cleaned = re.sub(r'\b(?:승인|결제완료|결제|주문완료)\b', ' ', cleaned)
    return ' '.join(cleaned.split())[:100].strip()


def extract_merchant(text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    label_re = re.compile(
        r'^(?:가맹점|사용처|상호|매장|판매자)\s*[:：]\s*(.+)$',
        re.I,
    )
    for line in lines:
        match = label_re.match(line)
        if match:
            merchant = _clean_merchant(match.group(1))
            if merchant:
                return merchant, False

    tail_re = re.compile(
        r'(?:20\d{2}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[/-]\d{1,2})'
        r'(?:\s+(?:[01]?\d|2[0-3]):[0-5]\d)?\s+(.+)$'
    )
    for line in lines:
        match = tail_re.search(line)
        if match:
            merchant = _clean_merchant(match.group(1))
            if (
                merchant
                and not _TIME_RE.fullmatch(merchant)
                and merchant.casefold() not in _GENERIC_MERCHANTS
                and not _GENERIC_AMOUNT_RE.search(merchant)
            ):
                return merchant, False

    for line in lines:
        merchant = _clean_merchant(line)
        lowered = merchant.casefold()

        if not merchant or len(merchant) < 2 or len(merchant) > 100:
            continue
        if lowered in _GENERIC_MERCHANTS:
            continue
        if merchant in {'감사합니다', '고객님', '승인내역', '결제내역'}:
            continue
        if (
            _GENERIC_AMOUNT_RE.search(line)
            or _FULL_DATE_RE.search(line)
            or _SHORT_DATE_RE.search(line)
            or _TIME_RE.search(line)
        ):
            continue
        if any(token.casefold() in lowered for token in _ISSUER_TOKENS):
            continue
        if merchant in {'카카오페이', '네이버페이', '토스페이', '삼성페이'}:
            continue
        return merchant, False

    return '사용처 확인 필요', True


def suggest_category(title, raw_text):
    haystack = (title + '\n' + raw_text).casefold()
    for category, keywords in _CATEGORY_RULES:
        if any(keyword.casefold() in haystack for keyword in keywords):
            return category
    return 'other'


_OCR_TOTALS = (
    r'결제대상금액|결제금액|총결제금액|승인금액|받을금액',
    r'총합계|합계|총액',
    r'카드결제|카드청구액',
)


def extract_receipt_amount(text):
    for labels in _OCR_TOTALS:
        spaced = '|'.join(r'\s*'.join(label) for label in labels.split('|'))
        pattern = re.compile(r'^(?:' + spaced + r')\s*[:：]?\s*([0-9][0-9,]*)\s*원?$')
        amounts = {
            amount for line in text.splitlines()
            if (match := pattern.fullmatch(line))
            and (amount := _amount_value(match.group(1))) is not None
        }
        if amounts:
            return next(iter(amounts)) if len(amounts) == 1 else None
    return extract_amount(text)


def extract_receipt_merchant(text):
    for line in text.splitlines():
        match = re.match(r'^(?:상호(?:명)?|가맹점(?:명)?|매장명|사용처)\s*[:：]\s*(.+)$', line)
        if match and re.search(r'[가-힣A-Za-z]', match.group(1)):
            return _clean_merchant(match.group(1)), False

    for line in text.splitlines():
        compact = re.sub(r'\s+', '', line)
        if re.search(r'상품명|품목명|단가수량|\d{4}[./-]\d{1,2}[./-]\d{1,2}', compact):
            break
        if re.search(r'POS|사업자|전화|주소|영수증|고객|교환|환불|구매|카드|단말기|거래번호|매출전표', compact, re.I):
            continue
        heading = re.split(r'\s+(?=\(?0\d{1,2}(?:\)|-)|TEL\b)', line, maxsplit=1, flags=re.I)[0]
        if re.search(r'(?:점|마트|상회|편의점|식당|카페)$', heading) and not re.search(r'^[0-9]', heading):
            return _clean_merchant(heading), False

    return '사용처 확인 필요', True


_RECEIPT_POLICY = re.compile(
    r'(?:취소|교환|환불)(?:시|안내|문의|규정|은|는)|영수증(?:지참|이없으면)|환불은|환불불가'
)
_RECEIPT_TOTAL_MARKERS = re.compile(
    r'(?:결제대상금액|카드청구액|카드결제|받을금액|총합계|합계)'
    r'\s*[:：]?\s*((?:\d{1,3}(?:[,.]\d{3})+|\d+))(?![\d,.])'
)


def receipt_block_reason(text):
    compact = re.sub(r'\s+', '', text)
    ticket = bool(re.search(r'영화입장권|전체발권|관람가', compact))
    bill = bool(re.search(r'\[계산서\]|테이블:', compact))
    retail = bool(re.search(r'상품명|상품코드|품목명|카드청구액|카드결제|(?:마트|MART).*?점', compact, re.I))
    totals = {
        amount for match in _RECEIPT_TOTAL_MARKERS.finditer(text)
        if (amount := _amount_value(match.group(1).replace('.', ','))) is not None and amount >= 100
    }
    if sum((ticket, bill, retail)) > 1 or len(totals) >= 3:
        return '여러 영수증이나 티켓이 섞여 있어요. 저장할 영수증 한 장만 잘라 다시 올려 주세요.'
    for line in text.splitlines():
        compact_line = re.sub(r'\s+', '', line)
        if re.search(r'승인취소|결제취소|취소완료|승인거절|결제실패|환불완료|환불금액', compact_line) and (
            not _RECEIPT_POLICY.search(compact_line)
            or re.match(r'^\[?(?:승인취소|결제취소|취소완료|승인거절|결제실패|환불완료|환불금액)\]?(?:[:：]|\d|$)', compact_line)
        ):
            return '취소·거절·실패·환불 내역은 새 지출로 가져올 수 없어요.'
    return None


def parse_import_candidate(raw_text, source='unknown', today=None):
    text = normalize_import_text(raw_text)
    if source == 'ocr':
        amount = extract_receipt_amount(text)
        date_text = re.sub(r'(?<=\d)[ \t]*([./-])[ \t]*(?=\d)', r'\1', text)
        spent_on, date_inferred = extract_date(date_text, today=today)
        title, title_inferred = extract_receipt_merchant(text)
    else:
        amount = extract_amount(text)
        spent_on, date_inferred = extract_date(text, today=today)
        title, title_inferred = extract_merchant(text)

    warnings = []
    blocked_reason = receipt_block_reason(text) if source == 'ocr' else (
        '취소·거절·실패·환불 내역은 새 지출로 가져올 수 없어요.' if is_non_purchase_event(text) else None
    )
    if blocked_reason:
        warnings.append(blocked_reason)
        amount = None
    if amount is None:
        warnings.append('금액을 자동 추출하지 못했어요.')
    if date_inferred:
        warnings.append('날짜가 없어 오늘 날짜로 채웠어요.')
    if title_inferred:
        warnings.append('사용처를 자동 추출하지 못했어요.')

    category = suggest_category(title, "" if source == "ocr" else text)
    confidence = 0.0
    confidence += 0.45 if amount is not None else 0
    confidence += 0.25 if not date_inferred else 0.1
    confidence += 0.2 if not title_inferred else 0
    confidence += 0.1 if source != 'unknown' else 0

    return {
        'candidate': {
            'title': title,
            'amount_krw': amount,
            'spent_on': spent_on.isoformat(),
            'category': category,
        },
        'source': source,
        'fingerprint': import_fingerprint(source, raw_text),
        'confidence': round(min(confidence, 0.99), 2),
        'needs_review': bool(warnings) or confidence < 0.8,
        'warnings': warnings,
        'blocked_reason': blocked_reason,
    }


def current_period():
    return datetime.now(ZoneInfo('Asia/Seoul')).strftime('%Y-%m')


def snapshot_for(row, period):
    data = row.payload
    spent = sum(
        e['amount_krw']
        for e in data['expenses']
        if e['spent_on'][:7] == period
    )
    budget = data['budgets'].get(period)
    return SpendingSnapshot(
        source_updated_at=data['updated_at'],
        data=Spending(
            period=period,
            budget_krw=budget,
            spent_krw=spent,
            remaining_krw=None if budget is None else budget - spent,
        ),
    )


def register_fintech(app, current_user, db):
    router = APIRouter(prefix='/api/v1/me/spending', tags=['2번 소비 관리'])

    def ledger(session, user):
        return session.get(LedgerRow, user)

    def ensure(session, user):
        row = ledger(session, user)
        if row is None:
            row = LedgerRow(
                user_id=user,
                payload={
                    'expenses': [],
                    'budgets': {},
                    'imported_fingerprints': [],
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                },
            )
            session.add(row)
        return row

    def save(session, row, payload):
        totals = {}
        for expense in payload['expenses']:
            period = expense['spent_on'][:7]
            totals[period] = totals.get(period, 0) + expense['amount_krw']

        if any(value > 1_000_000_000 for value in totals.values()):
            raise HTTPException(422, '월 누적 지출은 10억원 이하여야 합니다.')

        row.payload = {
            **payload,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        try:
            session.commit()
        except StaleDataError:
            session.rollback()
            raise HTTPException(
                409,
                '다른 요청이 먼저 저장됐습니다. 새로 조회 후 다시 시도하세요.',
            )

    @router.get('')
    def summary(
        period: Annotated[
            str | None,
            Query(pattern=r'^[0-9]{4}-(0[1-9]|1[0-2])$'),
        ] = None,
        user=Depends(current_user),
        session=Depends(db),
    ):
        period = period or current_period()
        row = ledger(session, user)
        profile = session.get(ProfileRow, user)
        suggested = profile.payload.get('monthly_budget_krw') if profile else None
        snapshot = snapshot_for(row, period) if row else None
        data = snapshot.data if snapshot else Spending(period=period, spent_krw=0)
        expenses = (
            sorted(
                [
                    expense
                    for expense in row.payload['expenses']
                    if expense['spent_on'][:7] == period
                ],
                key=lambda expense: (expense['spent_on'], expense['id']),
                reverse=True,
            )
            if row
            else []
        )
        warning = (
            'unset'
            if data.budget_krw is None
            else 'exceeded'
            if data.spent_krw > data.budget_krw
            else 'reached'
            if data.spent_krw == data.budget_krw
            else 'near_limit'
            if data.spent_krw * 100 >= data.budget_krw * 80
            else 'normal'
        )
        return {
            'data': data,
            'expenses': expenses,
            'warning': warning,
            'suggested_budget_krw': suggested,
            'source_updated_at': snapshot.source_updated_at if snapshot else None,
        }

    @router.put('/budgets/{period}')
    def budget(
        period: Period,
        body: BudgetInput,
        user=Depends(current_user),
        session=Depends(db),
    ):
        row = ensure(session, user)
        save(
            session,
            row,
            {
                **row.payload,
                'budgets': {
                    **row.payload['budgets'],
                    period: body.budget_krw,
                },
            },
        )
        return {'saved': True}

    @router.post('/imports/preview')
    def import_preview(
        body: ImportPreviewInput,
        user=Depends(current_user),
    ):
        return parse_import_candidate(body.raw_text, body.source)

    @router.post('/imports/confirm', status_code=201)
    def import_confirm(
        body: ImportConfirmInput,
        user=Depends(current_user),
        session=Depends(db),
    ):
        blocked_reason = parse_import_candidate(body.raw_text, body.source)['blocked_reason']
        if blocked_reason:
            raise HTTPException(422, blocked_reason)
        row = ensure(session, user)
        fingerprint = import_fingerprint(body.source, body.raw_text)
        imported = row.payload.get('imported_fingerprints', [])

        if fingerprint in imported:
            raise HTTPException(409, '이미 가져온 결제 내역이에요.')

        entry = {
            'id': str(uuid4()),
            'title': body.title,
            'amount_krw': body.amount_krw,
            'spent_on': body.spent_on.isoformat(),
            'category': body.category,
            'import_source': body.source,
            'import_fingerprint': fingerprint,
        }
        save(
            session,
            row,
            {
                **row.payload,
                'expenses': [*row.payload['expenses'], entry],
                'imported_fingerprints': [*imported, fingerprint],
            },
        )
        return entry

    @router.post('/expenses', status_code=201)
    def add(
        body: ExpenseInput,
        user=Depends(current_user),
        session=Depends(db),
    ):
        row = ensure(session, user)
        entry = {
            'id': str(uuid4()),
            **body.model_dump(mode='json'),
        }
        save(
            session,
            row,
            {
                **row.payload,
                'expenses': [*row.payload['expenses'], entry],
            },
        )
        return entry

    @router.put('/expenses/{expense_id}')
    def edit(
        expense_id: str,
        body: ExpenseInput,
        user=Depends(current_user),
        session=Depends(db),
    ):
        row = ledger(session, user)
        if row is None or not any(
            expense['id'] == expense_id
            for expense in row.payload['expenses']
        ):
            raise HTTPException(404, '소비 내역을 찾을 수 없습니다.')

        previous = next(
            expense
            for expense in row.payload['expenses']
            if expense['id'] == expense_id
        )
        entry = {
            'id': expense_id,
            **body.model_dump(mode='json'),
        }
        if 'import_source' in previous:
            entry['import_source'] = previous['import_source']
        if 'import_fingerprint' in previous:
            entry['import_fingerprint'] = previous['import_fingerprint']

        save(
            session,
            row,
            {
                **row.payload,
                'expenses': [
                    entry if expense['id'] == expense_id else expense
                    for expense in row.payload['expenses']
                ],
            },
        )
        return entry

    @router.delete('/expenses/{expense_id}')
    def delete(
        expense_id: str,
        user=Depends(current_user),
        session=Depends(db),
    ):
        row = ledger(session, user)
        if row is None or not any(
            expense['id'] == expense_id
            for expense in row.payload['expenses']
        ):
            raise HTTPException(404, '소비 내역을 찾을 수 없습니다.')

        removed = next(
            expense
            for expense in row.payload['expenses']
            if expense['id'] == expense_id
        )
        fingerprints = row.payload.get('imported_fingerprints', [])
        if removed.get('import_fingerprint'):
            fingerprints = [
                value
                for value in fingerprints
                if value != removed['import_fingerprint']
            ]

        save(
            session,
            row,
            {
                **row.payload,
                'expenses': [
                    expense
                    for expense in row.payload['expenses']
                    if expense['id'] != expense_id
                ],
                'imported_fingerprints': fingerprints,
            },
        )
        return {'deleted': True}

    app.include_router(router)
