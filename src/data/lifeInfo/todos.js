// 할 일 더미 데이터.
// - daysFromToday: 더미 전용. 오늘로부터 며칠 뒤가 마감인지 (음수 = 지남, null = 기한 없음)
//   실제 데이터에는 due("YYYY-MM-DD", 없으면 null)를 넣으세요.
// - done: 완료 여부

export const todoData = {
  sortLabel: '마감일 가까운 순',
  items: [
    { id: 'td1', title: '도시가스 요금 납부하기', daysFromToday: -1, done: false },
    { id: 'td2', title: '전기요금 납부하기', daysFromToday: 0, done: false },
    { id: 'td3', title: '분리수거 내놓기', daysFromToday: 1, done: false },
    { id: 'td4', title: '겨울 이불 세탁하기', daysFromToday: 6, done: false },
    { id: 'td5', title: '옷장 정리하기', daysFromToday: null, done: false },
    { id: 'td6', title: '생필품 주문하기', daysFromToday: -1, done: true },
    { id: 'td7', title: '욕실 청소하기', daysFromToday: null, done: true },
  ],
};
