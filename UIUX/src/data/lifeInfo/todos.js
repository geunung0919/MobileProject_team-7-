// 할 일 화면 더미 데이터.
// 추후 Firebase 연동 시 이 파일의 값을 API 호출 결과로 교체하면 됩니다.
//
// - daysFromToday: 더미용 값. "오늘로부터 며칠 뒤가 마감일인지"를 뜻합니다 (음수 = 이미 지남, null = 기한 없음).
//   덕분에 앱을 언제 열어도 디자인과 같은 화면이 나옵니다.
// - 실제 데이터에는 daysFromToday 대신 due("YYYY-MM-DD", 기한이 없으면 null)를 넣으면 됩니다.
//   TodoScreen 은 due 가 있으면 그 값을 우선 사용합니다.
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
