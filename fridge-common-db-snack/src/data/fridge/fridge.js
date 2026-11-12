// 냉장고 더미 데이터.
// - daysFromToday: 더미 전용. 오늘로부터 며칠 뒤가 유통기한인지 (실제 데이터에는 expiry "YYYY-MM-DD" 를 넣으세요)
// - icon: MaterialCommunityIcons 이름
// - amount / unit: 수량 숫자와 단위 (수정 화면이 불러옴). detail: 수정하지 않는 규격 덧붙임 (예: '1L')
// - quantity: 목록에 보이는 글자. 수정하면 amount + unit + detail 로 다시 만들어집니다.

export const fridgeData = {
  urgentWithinDays: 3,
  // 식재료 추가 화면에서 만든 항목에 쓰는 기본 아이콘
  defaultIcon: 'food-variant',
  // 식재료 추가 화면의 "단위 선택" 시트에 나오는 단위들
  unitOptions: ['개', '공기', '봉', '모', '팩', '병', '캔', 'g', 'kg', 'ml', 'L'],
  items: [
    { id: 'f1', name: '우유', quantity: '1개 · 1L', amount: 1, unit: '개', detail: '1L', daysFromToday: 0, icon: 'bottle-tonic-outline' },
    { id: 'f2', name: '두부', quantity: '1모 · 300g', amount: 1, unit: '모', detail: '300g', daysFromToday: 1, icon: 'cube-outline' },
    { id: 'f3', name: '시금치', quantity: '1봉 · 200g', amount: 1, unit: '봉', detail: '200g', daysFromToday: 2, icon: 'sprout-outline' },
    { id: 'f4', name: '당근', quantity: '2개', amount: 2, unit: '개', daysFromToday: 6, icon: 'carrot' },
    { id: 'f5', name: '달걀', quantity: '6개', amount: 6, unit: '개', daysFromToday: 10, icon: 'egg-outline' },
    { id: 'f6', name: '사과', quantity: '3개', amount: 3, unit: '개', daysFromToday: 12, icon: 'food-apple-outline' },
  ],
};
