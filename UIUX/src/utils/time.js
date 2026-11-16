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

// ---- 루틴 반복 요일 (0=일요일 ... 6=토요일, Date.getDay() 와 같은 번호) ----
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 루틴의 반복 요일 (days 가 없거나 비어 있으면 매일)
export const getRoutineDays = (routine) =>
  Array.isArray(routine.days) && routine.days.length > 0 ? routine.days : ALL_DAYS;

// 그 요일(0~6)에 하는 루틴인지
export const isRoutineOnDay = (routine, day) => getRoutineDays(routine).includes(day);

// [0..6] -> '매일', [1,2,3,4,5] -> '평일', [0,6] -> '주말', [2] -> '매주 화요일', 그 밖에는 '월·수·금'
export const formatRepeatDays = (days) => {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const key = sorted.join('');
  if (sorted.length === 7) return '매일';
  if (key === '12345') return '평일';
  if (key === '06') return '주말';
  if (sorted.length === 1) return `매주 ${DAY_LABELS[sorted[0]]}요일`;
  return sorted.map((d) => DAY_LABELS[d]).join('·');
};
