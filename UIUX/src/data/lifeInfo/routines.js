// 생활 루틴 더미 데이터.
// - time: 24시간제 "HH:mm" 문자열 (예: 오후 7시 = "19:00")
// - doneToday: 오늘 완료 여부 (날이 바뀌면 AppDataContext 가 false 로 초기화)

export const routineData = {
  sortLabel: '이른 시간 순',
  items: [
    { id: 'r1', title: '일어나서 물 한 잔 마시기', time: '07:00', doneToday: true },
    { id: 'r2', title: '창문 열고 환기하기', time: '07:30', doneToday: false },
    { id: 'r3', title: '아침 식사 챙겨 먹기', time: '08:00', doneToday: true },
    { id: 'r4', title: '점심 먹고 가볍게 걷기', time: '12:30', doneToday: false },
    { id: 'r5', title: '저녁 먹고 설거지하기', time: '19:00', doneToday: false },
    { id: 'r6', title: '잠들기 전 10분 정리하기', time: '22:30', doneToday: false },
  ],
};
