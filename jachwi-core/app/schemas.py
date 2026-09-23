"""팀 공통 계약. 금액=KRW 정수, 시간=timezone 포함 ISO8601, 미입력=null."""
from datetime import date, datetime
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Money = Annotated[int, Field(strict=True, ge=0, le=1_000_000_000)]

class Contract(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

class Onboarding(Contract):
    living_months: int | None = Field(default=None, ge=0, le=1200, strict=True)
    cooking_days_per_week: int | None = Field(default=None, ge=0, le=7, strict=True)
    cooking_tools: list[Literal['microwave', 'stove', 'rice_cooker', 'air_fryer']] | None = Field(default=None, max_length=4)
    monthly_budget_krw: Money | None = None
    region_code: str | None = Field(default=None, pattern=r'^[0-9]{10}$')
    priority: Literal['save_money', 'reduce_waste', 'build_routine'] | None = None
    # 실제 재고는 3번에서 등록. 미입력과 빈 냉장고를 구별한다.
    initial_inventory_state: Literal['not_entered', 'empty', 'needs_registration'] = 'not_entered'

    @model_validator(mode='after')
    def unique_tools(self):
        if self.cooking_tools is not None and len(set(self.cooking_tools)) != len(self.cooking_tools):
            raise ValueError('조리 도구를 중복 선택할 수 없습니다.')
        return self

class Diagnosis(Contract):
    rule_version: str = '1.1'
    experience: Literal['unknown', 'new', 'experienced']
    cooking_environment: Literal['unknown', 'no_tools', 'microwave_only', 'equipped']
    cooking_frequency: Literal['unknown', 'rare', 'regular']
    missing_fields: list[str]
    suggested_actions: list[str]

class OnboardingResult(Contract):
    profile: Onboarding
    diagnosis: Diagnosis

class OnboardingAction(Contract):
    code: str
    label: str
    target: str
    owner_module: Literal[2, 3, 5]

class OnboardingPreview(OnboardingResult):
    # 미리보기는 저장된 프로필을 변경하지 않는다.
    saved: Literal[False] = False
    actions: list[OnboardingAction]

class Spending(Contract):
    # 2번이 계산한 결과를 전달한다. 1번은 예산을 재계산하지 않는다.
    period: str = Field(pattern=r'^\d{4}-(0[1-9]|1[0-2])$')
    budget_krw: Money | None = None
    spent_krw: Money
    remaining_krw: int | None = Field(default=None, strict=True, ge=-1_000_000_000, le=1_000_000_000)
    @model_validator(mode='after')
    def check_balance(self):
        if self.budget_krw is None:
            if self.remaining_krw is not None:
                raise ValueError('예산 미설정 시 remaining_krw는 null이어야 합니다.')
        elif self.remaining_krw != self.budget_krw - self.spent_krw:
            raise ValueError('예산 잔액이 예산-지출과 일치하지 않습니다.')
        return self

class InventoryItem(Contract):
    item_id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=100)
    quantity: float = Field(gt=0, le=1_000_000, allow_inf_nan=False)
    unit: Literal['g', 'ml', 'piece', 'pack']
    storage: Literal['fridge', 'freezer', 'room']
    target_date: date | None = None
    date_source: Literal['label', 'estimate', 'unknown'] = 'unknown'
    @model_validator(mode='after')
    def check_date(self):
        if (self.target_date is None) != (self.date_source == 'unknown'):
            raise ValueError('날짜와 날짜 출처를 함께 지정하세요.')
        return self

class Inventory(Contract):
    items: list[InventoryItem] = Field(max_length=500)
    @model_validator(mode='after')
    def unique_ids(self):
        ids = [x.item_id for x in self.items]
        if len(ids) != len(set(ids)):
            raise ValueError('중복 item_id입니다.')
        return self

class Routine(Contract):
    routine_id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=100)
    due_date: date
    completed: bool = Field(strict=True)

class Life(Contract):
    routines: list[Routine] = Field(max_length=500)
    exhausted: bool = Field(default=False, strict=True)
    @model_validator(mode='after')
    def unique_ids(self):
        ids = [x.routine_id for x in self.routines]
        if len(ids) != len(set(ids)):
            raise ValueError('중복 routine_id입니다.')
        return self

class SnapshotBase(Contract):
    schema_version: Literal['1.0'] = '1.0'
    source_updated_at: datetime
    @model_validator(mode='after')
    def require_timezone(self):
        if self.source_updated_at.tzinfo is None:
            raise ValueError('source_updated_at에는 시간대가 필요합니다.')
        return self

class SpendingSnapshot(SnapshotBase):
    data: Spending
class InventorySnapshot(SnapshotBase):
    data: Inventory
class LifeSnapshot(SnapshotBase):
    data: Life

class Card(Contract):
    kind: str
    title: str
    target: str

class IntegratedView(Contract):
    schema_version: Literal['1.0'] = '1.0'
    generated_at: datetime
    profile: Onboarding | None
    diagnosis: Diagnosis | None
    modules: dict[str, SpendingSnapshot | InventorySnapshot | LifeSnapshot | None]
    module_status: dict[str, Literal['missing', 'available', 'stale']]
    cards: list[Card]
