from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from .schemas import Onboarding, Diagnosis, IntegratedView, Card, OnboardingAction, OnboardingPreview

def preview_onboarding(profile: Onboarding) -> OnboardingPreview:
    actions = [OnboardingAction(
        code='set_budget' if profile.monthly_budget_krw is None else 'view_budget',
        label='예산 설정하기' if profile.monthly_budget_krw is None else '예산 확인하기',
        target='/spending', owner_module=2)]
    if profile.initial_inventory_state == 'needs_registration':
        actions.append(OnboardingAction(code='register_inventory', label='재료 등록하기',
                                        target='/inventory', owner_module=3))
    actions.append(OnboardingAction(code='create_routine', label='생활 루틴 설정하기',
                                    target='/routines', owner_module=5))
    preferred = {'save_money': 2, 'reduce_waste': 3, 'build_routine': 5}.get(profile.priority)
    actions.sort(key=lambda action: action.owner_module != preferred)
    return OnboardingPreview(profile=profile, diagnosis=diagnose(profile), actions=actions)

def diagnose(profile: Onboarding) -> Diagnosis:
    tools = profile.cooking_tools
    environment = ('unknown' if tools is None else 'no_tools' if not tools else
                   'microwave_only' if tools == ['microwave'] else 'equipped')
    actions = []
    if profile.monthly_budget_krw is None:
        actions.append('set_budget')
    if profile.initial_inventory_state == 'needs_registration':
        actions.append('register_inventory')
    if profile.priority == 'build_routine':
        actions.append('create_routine')
    return Diagnosis(
        experience='unknown' if profile.living_months is None else 'new' if profile.living_months < 6 else 'experienced',
        cooking_environment=environment,
        cooking_frequency='unknown' if profile.cooking_days_per_week is None else 'rare' if profile.cooking_days_per_week < 3 else 'regular',
        missing_fields=[k for k, v in profile.model_dump().items() if v is None]
                       + (['initial_inventory_state'] if profile.initial_inventory_state == 'not_entered' else []),
        suggested_actions=actions,
    )

def integrate(profile, modules, now=None):
    now = now or datetime.now(timezone.utc)
    today = now.astimezone(ZoneInfo('Asia/Seoul')).date()
    status = {key: ('missing' if value is None else 'stale' if now - value.source_updated_at > timedelta(hours=24) else 'available')
              for key, value in modules.items()}
    # 과거 월 예산은 최신 수신이어도 현재 예산 카드에 사용하지 않는다.
    spending = modules['spending']
    if spending and spending.data.period != today.strftime('%Y-%m'):
        status['spending'] = 'stale'
    cards = []
    if profile is None:
        cards.append(Card(kind='onboarding', title='생활 설정을 입력해 주세요', target='/onboarding'))
    if spending and status['spending'] == 'available' and spending.data.remaining_krw is not None and spending.data.remaining_krw < 0:
        cards.append(Card(kind='budget', title='이번 달 예산을 초과했어요', target='/spending'))
    inventory = modules['inventory']
    if inventory and status['inventory'] == 'available':
        items = sorted((i for i in inventory.data.items if i.target_date), key=lambda i: i.target_date)
        for item in items:
            days = (item.target_date - today).days
            if days <= 3:
                label = '제품 표시 날짜' if item.date_source == 'label' else '추정 소진일'
                timing = f'{abs(days)}일 지남' if days < 0 else f'D-{days}'
                cards.append(Card(kind='inventory', title=f'{item.name}: {label} {timing}', target=f'/inventory/{item.item_id}'))
    life = modules['life']
    if life and status['life'] == 'available':
        for routine in life.data.routines:
            if not routine.completed and routine.due_date <= today:
                cards.append(Card(kind='routine', title=routine.title, target='/routines'))
    return IntegratedView(generated_at=now, profile=profile, diagnosis=diagnose(profile) if profile else None,
                          modules=modules, module_status=status, cards=cards[:5])
