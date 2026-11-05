// 소비 분석 화면 더미 데이터 (화면에 "예시 데이터" 라벨이 붙어 있는 값들).
// 추후 Firebase 연동 시 이 파일의 값을 API 호출 결과로 교체하면 됩니다.
// 비율(%)과 전월 대비 증감은 화면에서 금액으로 직접 계산하므로 여기에는 금액만 둡니다.

export const analysisData = {
  period: { year: 2026, month: 10 },
  budget: 1000000,
  spent: 654500,
  // 카테고리별 지출. color 는 도넛 차트/목록 점 색상입니다.
  categories: [
    { id: 'grocery', name: '식료품', amount: 261800, color: '#65C695' },
    { id: 'meal', name: '식비', amount: 196350, color: '#9ECCB6' },
    { id: 'cafe', name: '카페·간식', amount: 130900, color: '#C2D9A8' },
    { id: 'living', name: '생활용품', amount: 65450, color: '#D9DED7' },
  ],
  // 월별 지출. 마지막 항목이 "이번 달" 입니다.
  months: [
    { month: 7, amount: 720000 },
    { month: 8, amount: 680000 },
    { month: 9, amount: 770000 },
    { month: 10, amount: 654500 },
  ],
};

export const analysisTexts = {
  title: '소비 분석',
  periodSpentLabel: '이번 달 지출금',
  budgetLabel: '이번 달 예산',
  remainingLabel: '남은 예산',
  tabs: [
    { value: 'category', label: '카테고리별 지출' },
    { value: 'month', label: '월별 소비 비교' },
  ],
  sampleBadge: '예시 데이터',
  categoryTitle: '어디에 가장 많이 썼을까요?',
  categorySubtitle: '이번 달 지출을 카테고리별로 나눠봤어요.',
  topLabel: '가장 많이 쓴 곳',
  emptyText: '아직 분석할 지출이 없어요.',
  chartUnit: '단위: 만원',
  tableSpentLabel: '지출금',
  tableDiffLabel: '전월 대비',
};
