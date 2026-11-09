import { pad } from './format';

// "19:00" -> "오후 07:00"
export const formatRoutineTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${pad(hour12)}:${pad(m)}`;
};

// 루틴의 "오늘 완료" 체크를 모두 해제 (체크된 게 없으면 같은 배열을 그대로 반환)
export const clearRoutineChecks = (routines) =>
  routines.some((r) => r.doneToday)
    ? routines.map((r) => (r.doneToday ? { ...r, doneToday: false } : r))
    : routines;

// ('pm', 7, 0) -> "19:00"   (period: 'am' | 'pm', hour12: 1~12)
export const to24HourString = (period, hour12, minute) =>
  `${pad((hour12 % 12) + (period === 'pm' ? 12 : 0))}:${pad(minute)}`;
