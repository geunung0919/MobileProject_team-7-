// 더보기 > 생활 데이터 수정 화면 문구와 선택지. icon 은 MaterialCommunityIcons 이름입니다.
// initial 은 처음 가입할 때 입력한 값으로 교체하세요. (period 는 periods 의 id, goal 은 goals 의 id, tools 는 tools 의 id 목록 또는 ['none'])

export const lifeDataForm = {
  title: '생활 데이터 수정',
  subtitle: '생활 기본 정보를 확인하고 수정해요.',
  monthsLabel: '자취한 지 얼마나 되었나요?',
  periods: [
    { id: 'under1m', label: '1개월 미만' },
    { id: '1m', label: '1개월 이상' },
    { id: '6m', label: '6개월 이상' },
    { id: '1y', label: '1년 이상' },
  ],
  goalLabel: '지금 가장 중요한 목표는 무엇인가요?',
  goalHint: '하나만 선택할 수 있어요.',
  goals: [
    {
      id: 'saving',
      title: '생활비 절약',
      description: '불필요한 지출을 줄이고\n똑똑하게 생활하고 싶어요',
      icon: 'piggy-bank-outline',
    },
    {
      id: 'food',
      title: '식재료 낭비 줄이기',
      description: '음식을 낭비하지 않고\n알뜰하게 사용하고 싶어요',
      icon: 'carrot',
    },
    {
      id: 'habit',
      title: '생활 습관 만들기',
      description: '규칙적인 생활 습관을\n만들고 싶어요',
      icon: 'calendar-check-outline',
    },
  ],
  toolsLabel: '주로 사용하는 조리 도구는 무엇인가요?',
  toolsHint: '보유한 조리 도구를 모두 선택해 주세요.',
  tools: [
    { id: 'microwave', label: '전자레인지', icon: 'microwave' },
    { id: 'gas', label: '가스레인지', icon: 'fire' },
    { id: 'cooker', label: '밥솥', icon: 'pot-steam-outline' },
    { id: 'airfryer', label: '에어프라이어', icon: 'fan' },
  ],
  noneTool: { id: 'none', title: '없음', description: '조리 도구가 없어요', icon: 'cancel' },
  toolsEmptyNotice: '조리 도구를 한 가지 이상 선택하거나 "없음"을 선택해 주세요.',
  cookDaysLabel: '일주일에 며칠 요리하나요?',
  cookDaysHint: '0~7일 중 선택해요.',
  saveLabel: '수정 완료',
  initial: { period: '1m', goal: 'saving', tools: ['microwave', 'gas'], cookDays: 2 },
};
