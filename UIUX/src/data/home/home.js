// 홈 화면 문구 데이터.
// 홈의 숫자(남은 예산, 기한 임박 개수, 남은 할 일 등)는 이 파일에 적지 않습니다.
// 소비/냉장고/할 일/루틴 데이터(store/AppDataContext.js)에서 utils/homeSummary.js 가 계산해서 보여줍니다.
// 그래서 다른 탭에서 데이터를 바꾸면 홈에도 바로 반영됩니다.

// tasks[].route: 홈의 "오늘 챙길 일" 줄을 눌렀을 때 이동할 화면 이름 (navigation/RootNavigator.js 에 등록된 이름)

export const homeData = {
  hero: {
    label: '오늘의 한마디',
    badge: 'AI 리포트',
    title: '나를 챙기는 한 끼로,\n이번 주를 시작해요.',
    // 첫 줄은 가장 먼저 상하는 식재료로 자동 생성되고, 이 문장이 그 아래 줄에 붙습니다.
    closing: '작은 돌봄 하나면 충분한 시작이에요.',
  },
  spending: {
    title: '소비',
  },
  fridge: {
    title: '냉장고',
    headline: '기한 임박',
    emptyText: '보관 중인 식재료가 없어요',
  },
  tasks: [
    { id: 'routine', route: 'Routine', title: '루틴' },
    { id: 'todo', route: 'Todo', title: '할 일' },
  ],
};
