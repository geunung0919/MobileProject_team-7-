// 1234567 -> "1,234,567"
export const formatNumber = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// "2026-11-02" -> "11.02"
export const formatMonthDay = (dateStr) => dateStr.slice(5).replace('-', '.');

// "2026-11-02" -> "2026.11.02"
export const formatDotDate = (dateStr) => dateStr.replace(/-/g, '.');

// 7 -> "07" (두 자리로 맞추기)
export const pad = (n) => String(n).padStart(2, '0');

const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

// Date -> "YYYY-MM-DD" (기기의 현지 날짜 기준)
export const toDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// "YYYY-MM-DD" 에 일수를 더한 "YYYY-MM-DD"
export const addDays = (dateStr, days) => {
  const d = new Date(parseDate(dateStr) + days * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

// 두 날짜("YYYY-MM-DD") 사이의 일수 (to - from)
export const daysBetween = (fromStr, toStr) =>
  Math.round((parseDate(toStr) - parseDate(fromStr)) / 86400000);

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// Date -> "11월 4일 수요일"
export const formatKoreanDate = (date) =>
  `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;

// "2026-11-08" -> "11월 8일"
export const formatKoreanMonthDay = (dateStr) => {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}월 ${d}일`;
};

// Date -> "2026년 11월 2일 월요일"
export const formatKoreanDateWithYear = (date) => `${date.getFullYear()}년 ${formatKoreanDate(date)}`;

// Date -> "2026년 11월 8일 (일)"
export const formatKoreanDateShort = (date) =>
  `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;

// "2026-11-04" -> 기기 현지 시간의 Date (날짜 시트에 넘기는 용도)
export const fromDateString = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// 날짜(date: "YYYY-MM-DD") 최신순 정렬용 비교 함수. 같은 날짜면 순서를 바꾸지 않습니다.
export const compareDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

// 금액/수량 입력값을 안전한 숫자로 바꿉니다. 숫자가 아니거나 0 이하, 무한대면 0 입니다.
export const parseAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// "YYYY-MM-DD" 모양이고 실제로 있는 날짜인지 확인합니다. (예: "2026-02-31" 은 false)
export const isValidDateString = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};
