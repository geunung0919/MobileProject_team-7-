import { pad } from './format';

// "19:00" -> "오후 07:00"
export const formatRoutineTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${pad(hour12)}:${pad(m)}`;
};

// 루틴의 "오늘 완료" 체크를 모두 해제한 새 목록 (날이 바뀌었을 때 사용).
// 체크된 루틴이 하나도 없으면 같은 목록을 그대로 돌려줘서 불필요한 화면 갱신을 막습니다.
export const clearRoutineChecks = (routines) =>
  routines.some((r) => r.doneToday)
    ? routines.map((r) => (r.doneToday ? { ...r, doneToday: false } : r))
    : routines;

// ('pm', 7, 0) -> "19:00"   (period: 'am' | 'pm', hour12: 1~12)
export const to24HourString = (period, hour12, minute) =>
  `${pad((hour12 % 12) + (period === 'pm' ? 12 : 0))}:${pad(minute)}`;
