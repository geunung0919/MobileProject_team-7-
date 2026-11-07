// 30초 자취 진단 규칙 (서버 jachwi-core/app/services.py 의 diagnose, rule_version 1.1 과 같은 규칙).
// 서버 연결 시에는 서버가 돌려준 진단을 쓰고, 서버 없는 시연 모드에서만 이 함수로 계산합니다.
// 규칙을 바꿀 때는 서버와 이 파일을 함께 바꾸세요.

// 서버 Onboarding 모델의 필드 순서 (missing_fields 순서를 서버와 맞추기 위함)
const FIELDS = [
  'living_months', 'cooking_days_per_week', 'cooking_tools',
  'monthly_budget_krw', 'region_code', 'priority', 'initial_inventory_state',
];

export function diagnoseOnboarding(profile) {
  const p = profile || {};
  const tools = p.cooking_tools ?? null;
  const cooking_environment = tools == null ? 'unknown'
    : tools.length === 0 ? 'no_tools'
    : tools.length === 1 && tools[0] === 'microwave' ? 'microwave_only'
    : 'equipped';
  const suggested_actions = [];
  if (p.monthly_budget_krw == null) suggested_actions.push('set_budget');
  if (p.initial_inventory_state === 'needs_registration') suggested_actions.push('register_inventory');
  if (p.priority === 'build_routine') suggested_actions.push('create_routine');
  const missing_fields = FIELDS.filter((k) => k !== 'initial_inventory_state' && p[k] == null);
  if ((p.initial_inventory_state ?? 'not_entered') === 'not_entered') missing_fields.push('initial_inventory_state');
  return {
    rule_version: '1.1',
    experience: p.living_months == null ? 'unknown' : p.living_months < 6 ? 'new' : 'experienced',
    cooking_environment,
    cooking_frequency: p.cooking_days_per_week == null ? 'unknown' : p.cooking_days_per_week < 3 ? 'rare' : 'regular',
    missing_fields,
    suggested_actions,
  };
}

// 화면 표시용 문구
export const diagnosisLabels = {
  experience: { unknown: '자취 기간 미입력', new: '자취 새내기 (6개월 미만)', experienced: '자취 경험자 (6개월 이상)' },
  cooking_environment: {
    unknown: '조리 도구 미입력', no_tools: '조리 도구 없음', microwave_only: '전자레인지만 있음', equipped: '조리 도구 갖춤',
  },
  cooking_frequency: { unknown: '요리 빈도 미입력', rare: '요리는 가끔 (주 3일 미만)', regular: '요리를 자주 해요 (주 3일 이상)' },
  actions: {
    set_budget: '월 예산을 입력하면 홈·소비 탭에서 남은 예산을 보여드려요.',
    register_inventory: '냉장고 탭에서 가지고 있는 재료를 등록해 보세요.',
    create_routine: '생활정보 > 루틴에서 생활 루틴을 만들어 보세요.',
  },
  fields: {
    living_months: '자취 기간', cooking_days_per_week: '주간 요리 일수', cooking_tools: '조리 도구',
    monthly_budget_krw: '월 예산', region_code: '지역', priority: '목표', initial_inventory_state: '냉장고 상태',
  },
};
