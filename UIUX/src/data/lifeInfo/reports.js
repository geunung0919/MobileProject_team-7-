// AI 리포트 화면의 문구와 "지난 리포트" 더미 데이터.
// - monthsAgo: 몇 달 전 리포트인지 (실제 월은 화면에서 오늘 기준으로 계산). 실제 데이터에는 year / month 를 쓰세요.
// - categories: [{ name, percent }], fridge: { total, urgent, expired }
// TODO: 지난 리포트는 서버에 저장된 월별 리포트를 불러와 snapshot 모양으로 넘기세요. (이번 달 리포트는 utils/reportSummary.js 가 계산합니다.)

export const reportTexts = {
  detail: {
    aiLabel: 'AI 한마디',
    spendingTitle: '소비',
    fridgeTitle: '냉장고',
    tipsTitle: 'AI 제안',
    noSpendingText: '아직 지출 기록이 없어요.',
    fridgeLabels: { total: '보관 중', urgent: '임박', expired: '기한 지남' },
  },
  list: {
    title: '지난 리포트',
    subtitle: '월별로 쌓인 리포트를 다시 볼 수 있어요',
    chartTitle: '월별 예산 사용률',
    listTitle: '리포트 목록',
    emptyText: '아직 지난 리포트가 없어요.',
  },
};

export const pastReports = [
  {
    id: 'r1',
    monthsAgo: 1,
    spent: 590000,
    budget: 1000000,
    categories: [
      { name: '식료품', percent: 41 },
      { name: '식비', percent: 27 },
      { name: '생활용품', percent: 14 },
    ],
    fridge: { total: 11, urgent: 1, expired: 0 },
    comment: '장보기를 계획적으로 했어요. 이 흐름을 유지해 보세요.',
    tips: ['식료품 비중이 높지만 예산 안에서 잘 관리했어요.', '냉장고를 꾸준히 확인하는 습관을 이어 가세요.'],
  },
  {
    id: 'r2',
    monthsAgo: 2,
    spent: 660000,
    budget: 1000000,
    categories: [
      { name: '식비', percent: 38 },
      { name: '식료품', percent: 30 },
      { name: '카페·간식', percent: 16 },
    ],
    fridge: { total: 9, urgent: 3, expired: 2 },
    comment: '외식이 늘고 기한이 지난 식재료도 있었어요.',
    tips: ['외식 횟수를 조금 줄여 보세요.', '기한이 지난 식재료는 바로 정리하세요.'],
  },
  {
    id: 'r3',
    monthsAgo: 3,
    spent: 520000,
    budget: 1000000,
    categories: [
      { name: '식료품', percent: 45 },
      { name: '생활용품', percent: 25 },
      { name: '식비', percent: 18 },
    ],
    fridge: { total: 12, urgent: 2, expired: 0 },
    comment: '고정 지출이 안정적이었어요.',
    tips: ['지금처럼 소비와 냉장고를 꾸준히 기록해 보세요.'],
  },
  {
    id: 'r4',
    monthsAgo: 4,
    spent: 600000,
    budget: 1000000,
    categories: [
      { name: '카페·간식', percent: 33 },
      { name: '식료품', percent: 32 },
      { name: '식비', percent: 20 },
    ],
    fridge: { total: 10, urgent: 3, expired: 1 },
    comment: '더운 날씨로 음료·간식 지출이 늘었어요.',
    tips: ['카페·간식 지출이 큰 편이에요. 이번 달은 횟수를 정해 보세요.'],
  },
];
