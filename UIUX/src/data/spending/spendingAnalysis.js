// 소비 분석 화면 문구와 차트 설정. 금액과 비율은 실제 지출 내역(transactions)으로
// utils/spendingAnalysis.js 가 계산하므로 여기에는 적지 않습니다.

export const analysisConfig = {
  // 월별 비교에 보여줄 개월 수 (선택한 달 포함)
  monthCount: 4,
  // 카테고리 이름 -> 도넛 차트/목록 점 색상. 지출 카테고리를 새로 만들면 여기에 색을 추가하세요.
  categoryColors: {
    식료품: '#65C695',
    식비: '#9ECCB6',
    '카페·간식': '#C2D9A8',
    생활용품: '#D9DED7',
  },
  // 위에 없는 카테고리(기타 등)에 차례로 쓰는 색
  fallbackColors: ['#B7CFA0', '#8FBFA6', '#CFE0C0', '#BFC8C2'],
};

// word: 선택한 달이 이번 달이면 '이번 달', 아니면 '10월' 같은 글자
export const analysisTexts = {
  title: '소비 분석',
  spentLabel: (word) => `${word} 지출금`,
  budgetLabel: (word) => `${word} 예산`,
  remainingLabel: '남은 예산',
  tabs: [
    { value: 'category', label: '카테고리별 지출' },
    { value: 'month', label: '월별 소비 비교' },
  ],
  categoryTitle: '어디에 가장 많이 썼을까요?',
  categorySubtitle: (word) => `${word} 지출을 카테고리별로 나눠봤어요.`,
  topLabel: '가장 많이 쓴 곳',
  emptyText: '아직 분석할 지출이 없어요.',
  chartUnit: '단위: 만원',
  tableSpentLabel: '지출금',
  tableDiffLabel: '전월 대비',
};
