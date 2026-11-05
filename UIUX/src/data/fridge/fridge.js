// 냉장고 화면 더미 데이터.
// 추후 Firebase 연동 시 이 파일의 값을 API 호출 결과로 교체하면 됩니다.
//
// - daysFromToday: 더미용 값. "오늘로부터 며칠 뒤가 유통기한인지"를 뜻합니다.
//   덕분에 앱을 언제 열어도 디자인과 같은 화면이 나옵니다.
// - 실제 데이터에는 daysFromToday 대신 expiry("YYYY-MM-DD")를 넣으면 됩니다.
//   FridgeScreen 은 expiry 가 있으면 그 값을 우선 사용합니다.
// - icon 은 MaterialCommunityIcons 아이콘 이름입니다.
// - amount / unit: 수량 숫자와 단위 (식재료 수정 화면이 이 값을 불러옵니다).
//   detail: 제품 규격처럼 수정하지 않는 덧붙임 (예: '1L'). 목록에는 "1개 · 1L" 로 표시됩니다.
//   quantity: 목록에 보여줄 글자. 수정하면 amount + unit + detail 로 다시 만들어집니다.

export const fridgeData = {
  urgentWithinDays: 3,
  // 식재료 추가 화면에서 만든 항목에 쓰는 기본 아이콘
  defaultIcon: 'food-variant',
  // 식재료 추가 화면의 "단위 선택" 시트에 나오는 단위들
  unitOptions: ['개', '봉', '모', '팩', '병', '캔', 'g', 'kg', 'ml', 'L'],
  items: [
    { id: 'f1', name: '우유', quantity: '1개 · 1L', amount: 1, unit: '개', detail: '1L', daysFromToday: 0, icon: 'bottle-tonic-outline' },
    { id: 'f2', name: '두부', quantity: '1모 · 300g', amount: 1, unit: '모', detail: '300g', daysFromToday: 1, icon: 'cube-outline' },
    { id: 'f3', name: '시금치', quantity: '1봉 · 200g', amount: 1, unit: '봉', detail: '200g', daysFromToday: 2, icon: 'sprout-outline' },
    { id: 'f4', name: '당근', quantity: '2개', amount: 2, unit: '개', daysFromToday: 6, icon: 'carrot' },
    { id: 'f5', name: '달걀', quantity: '6개', amount: 6, unit: '개', daysFromToday: 10, icon: 'egg-outline' },
    { id: 'f6', name: '사과', quantity: '3개', amount: 3, unit: '개', daysFromToday: 12, icon: 'food-apple-outline' },
  ],
};
