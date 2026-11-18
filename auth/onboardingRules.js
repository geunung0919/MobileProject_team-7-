// 온보딩(생활 진단) 선택지·진단 규칙. 1번 모듈.
// 저장 형식은 서버 jachwi-core 온보딩과 같은 필드 이름을 씁니다 (region 만 이름 문자열로 따로 저장).
// 진단 규칙도 서버 rule_version 1.1 과 같습니다(6개월 미만=새내기, 주 3일 미만=가끔).

// 자취 기간: 화면은 4칸, 저장은 구간 시작 개월 수. "1년 이상"은 12로 저장합니다.
export const LIVING_OPTIONS = [
  { value: 0, label: '1개월 미만' },  // 진짜 처음 자취하는 사람
  { value: 1, label: '1개월 이상' },  // 배달 시켜 먹으며 여유 부리는 시기
  { value: 6, label: '6개월 이상' },  // 생활비가 많이 나가는 걸 깨닫고 요리를 시작하는 시기
  { value: 12, label: '1년 이상' },
];
export const livingLabel = (months) => {
  if (months == null) return '선택 안 함';
  return [...LIVING_OPTIONS].reverse().find((o) => months >= o.value)?.label ?? '선택 안 함';
};

export const PRIORITY_OPTIONS = [
  { value: 'save_money', label: '생활비 절약', desc: '불필요한 지출을 줄이고\n똑똑하게 생활하고 싶어요', icon: 'piggy-bank-outline' },
  { value: 'reduce_waste', label: '식재료 낭비 줄이기', desc: '음식을 낭비하지 않고\n알뜰하게 사용하고 싶어요', icon: 'carrot' },
  { value: 'build_routine', label: '생활 습관 만들기', desc: '규칙적인 생활 습관을\n만들고 싶어요', icon: 'calendar-check-outline' },
];

export const TOOL_OPTIONS = [
  { value: 'microwave', label: '전자레인지', icon: 'microwave' },
  { value: 'stove', label: '가스레인지·인덕션', icon: 'fire' },
  { value: 'rice_cooker', label: '밥솥', icon: 'pot-steam-outline' },
  { value: 'air_fryer', label: '에어프라이어', icon: 'weather-windy' },
];
export const toolsLabel = (tools) => {
  if (tools == null) return '선택 안 함';
  if (tools.length === 0) return '없음';
  return TOOL_OPTIONS.filter((o) => tools.includes(o.value)).map((o) => o.label).join(', ');
};

export const BUDGET_PRESETS = [500000, 700000, 1000000, 1500000];
export const BUDGET_MAX = 1000000000;
export const formatWon = (n) => (n == null ? '' : Number(n).toLocaleString('ko-KR'));
export const budgetLabel = (n) => (n == null ? '선택 안 함' : `${formatWon(n)}원`);
export const manwon = (n) => (n % 10000 === 0 ? `${formatWon(n / 10000)}만원` : `${formatWon(n)}원`);
export const digitsOnly = (text) => {
  const d = String(text || '').replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
  if (!d) return null;
  return Math.min(Number(d), BUDGET_MAX);
};

export const EMPTY_PROFILE = {
  living_months: null,
  priority: null,
  cooking_tools: null,
  cooking_days_per_week: null,
  monthly_budget_krw: null,
  region_name: null,
  region_code: null, // 지역 검색이 붙으면 법정동 코드 10자리
  initial_inventory_state: 'not_entered', // 시안에 냉장고 질문이 없어 '나중에 설정'으로 저장
};

export function diagnose(profile) {
  const p = profile || {};
  const tools = p.cooking_tools ?? null;
  return {
    rule_version: '1.1',
    experience: p.living_months == null ? 'unknown' : p.living_months < 6 ? 'new' : 'experienced',
    cooking_environment: tools == null ? 'unknown'
      : tools.length === 0 ? 'no_tools'
      : tools.length === 1 && tools[0] === 'microwave' ? 'microwave_only'
      : 'equipped',
    cooking_frequency: p.cooking_days_per_week == null ? 'unknown' : p.cooking_days_per_week < 3 ? 'rare' : 'regular',
  };
}

export const EXPERIENCE_LABELS = { unknown: '자취 생활 시작', new: '자취 새내기', experienced: '자취 경험자' };

// 진단 카드 설명 문구 (자취 유형 이름은 아직 정하지 않아 경험 구분만 씁니다)
export function diagnosisSummary(profile) {
  const p = profile || {};
  const goal = PRIORITY_OPTIONS.find((o) => o.value === p.priority);
  const d = diagnose(p);
  const parts = [];
  if (goal) parts.push(`${goal.label}이 가장 중요한 ${d.experience === 'experienced' ? '자취 경험자' : '자취 초반'}이에요.`);
  else parts.push(d.experience === 'experienced' ? '자취 경험이 있는 편이에요.' : '이제 막 자취를 시작했어요.');
  if (p.cooking_days_per_week != null) {
    parts.push(p.cooking_days_per_week === 0
      ? '아직 요리는 하지 않아서 간단한 요리부터 시작하면 좋아요.'
      : `주 ${p.cooking_days_per_week}일 요리하고 있어서 식비 관리부터 시작하면 효과가 커요.`);
  }
  return parts.join(' ');
}

// 추천 기능 3개. 고른 목표에 해당하는 기능을 맨 위로 올립니다. target 은 앱 화면 연결용 논리 경로입니다.
export function recommendations(profile) {
  const p = profile || {};
  const tools = p.cooking_tools;
  const toolText = tools && tools.length
    ? `${TOOL_OPTIONS.filter((o) => tools.includes(o.value)).map((o) => o.label).join('·')} 레시피를 받아요`
    : '가진 재료로 만들 수 있는 레시피를 받아요';
  const list = [
    {
      key: 'budget', goal: 'save_money', icon: 'wallet-outline', target: '/spending',
      title: p.monthly_budget_krw == null ? '월 예산 정하기' : '월 예산 관리 시작하기',
      desc: p.monthly_budget_krw == null ? '한 달 예산을 정하고 지출을 기록해요' : `${manwon(p.monthly_budget_krw)} 예산으로 지출을 기록해요`,
    },
    { key: 'fridge', goal: 'reduce_waste', icon: 'fridge-outline', target: '/inventory', title: '식재료 등록하고 레시피 받기', desc: toolText },
    {
      key: 'routine', goal: 'build_routine', icon: 'calendar-check-outline', target: '/routines', title: '생활 루틴 만들기',
      desc: p.cooking_days_per_week ? `주 ${p.cooking_days_per_week}일 요리 루틴부터 시작해 보세요` : '작은 생활 루틴부터 시작해 보세요',
    },
  ];
  return [...list.filter((x) => x.goal === p.priority), ...list.filter((x) => x.goal !== p.priority)];
}
