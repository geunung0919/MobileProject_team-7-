// 홈 화면 문구. 홈의 숫자는 utils/homeSummary.js 가 저장소 데이터로 계산하므로 여기에 적지 않습니다.

// tasks[].route: 눌렀을 때 이동할 화면 이름 (RootNavigator 에 등록된 이름)

export const homeData = {
  hero: {
    label: '오늘의 한마디',
    badge: 'AI 리포트',
    title: '나를 챙기는 한 끼로,\n이번 주를 시작해요.',
    // 자동 생성되는 첫 줄 아래에 붙는 문장
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
