"""화면 표시 정보와 서버 입력 계약을 함께 제공한다."""
from typing import Any, Literal
from pydantic import Field
from .schemas import Contract, Onboarding


class FormField(Contract):
    name: str
    label: str
    widget: Literal['integer', 'single_select', 'multi_select', 'region_search']
    option_labels: dict[str, str] = Field(default_factory=dict)
    skip_value: str | None = None
    empty_label: str | None = None
    help_text: str


class FormStep(Contract):
    id: str
    title: str
    fields: list[FormField]


class OnboardingForm(Contract):
    form_version: Literal['1.0'] = '1.0'
    steps: list[FormStep]
    input_schema: dict[str, Any]


def get_onboarding_form() -> OnboardingForm:
    return OnboardingForm(input_schema=Onboarding.model_json_schema(), steps=[
        FormStep(id='experience', title='자취 상태', fields=[
            FormField(name='living_months', label='자취한 지 얼마나 됐나요?', widget='integer',
                      help_text='개월 단위로 입력해 주세요. 건너뛰면 미입력으로 저장해요.'),
            FormField(name='priority', label='자취하는 목표는 무엇인가요?', widget='single_select',
                      option_labels={'save_money': '생활비 절약', 'reduce_waste': '식재료 낭비 줄이기',
                                     'build_routine': '생활 습관 만들기'},
                      help_text='가장 먼저 이루고 싶은 목표 하나를 선택해 주세요.'),
        ]),
        FormStep(id='cooking', title='요리 환경', fields=[
            FormField(name='cooking_tools', label='어떤 조리 도구가 있나요?', widget='multi_select',
                      option_labels={'microwave': '전자레인지', 'stove': '가스레인지·인덕션',
                                     'rice_cooker': '밥솥', 'air_fryer': '에어프라이어'},
                      empty_label='보유한 도구 없음',
                      help_text='여러 개 선택할 수 있어요. 없음은 빈 목록([]), 건너뛰기는 null로 전송해요.'),
            FormField(name='cooking_days_per_week', label='일주일에 며칠 요리하나요?', widget='integer',
                      help_text='0일부터 7일까지 입력해 주세요.'),
        ]),
        FormStep(id='budget_region', title='예산·지역', fields=[
            FormField(name='monthly_budget_krw', label='월 생활비 목표는 얼마인가요?', widget='integer',
                      help_text='원 단위로 입력해 주세요. 0원과 미입력은 달라요.'),
            FormField(name='region_code', label='거주 지역을 선택해 주세요', widget='region_search',
                      help_text='지역 검색은 별도 연결이 필요해요. 선택한 법정동 코드 10자리만 보내며 건너뛸 수 있어요.'),
        ]),
        FormStep(id='inventory', title='초기 재고', fields=[
            FormField(name='initial_inventory_state', label='냉장고는 어떤 상태인가요?', widget='single_select',
                      option_labels={'empty': '보유한 재료 없음', 'needs_registration': '재료 등록 필요',
                                     'not_entered': '나중에 설정'}, skip_value='not_entered',
                      help_text='실제 재료 목록은 냉장고 화면에서 등록해요.'),
        ]),
    ])
