import { pad } from './format';

// 소비 분석 화면에 필요한 값을 실제 지출 내역(transactions)으로 계산합니다.

// 해당 연/월의 지출 합계 (transactions[].date 는 "YYYY-MM-DD", amount 는 숫자)
function sumMonth(transactions, year, month) {
  const key = `${year}-${pad(month)}`;
  return transactions
    .filter((t) => t.date.startsWith(key))
    .reduce((sum, t) => sum + t.amount, 0);
}

// 카테고리 이름 -> 도넛 차트/목록 색상. 정해 둔 색이 없으면 fallbackColors 를 차례로 씁니다.
function colorFor(name, index, { categoryColors, fallbackColors }) {
  return categoryColors[name] ?? fallbackColors[index % fallbackColors.length];
}

// 선택한 달의 카테고리별 지출 (많이 쓴 순). 지출이 없는 카테고리는 넣지 않습니다.
// 반환: [{ id, name, amount, color }]
export function getCategoryTotals(transactions, year, month, palette) {
  const key = `${year}-${pad(month)}`;
  const totals = new Map();
  transactions
    .filter((t) => t.date.startsWith(key) && t.amount > 0)
    .forEach((t) => {
      const name = t.category || '기타';
      totals.set(name, (totals.get(name) ?? 0) + t.amount);
    });
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount], index) => ({
      id: name,
      name,
      amount,
      color: colorFor(name, index, palette),
    }));
}

// 선택한 달을 마지막으로 하는 최근 monthCount 개월의 월별 지출 (오래된 달부터)
// 반환: [{ year, month, amount }]
export function getMonthlyTotals(transactions, year, month, monthCount) {
  const months = [];
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const index = year * 12 + (month - 1) - i;
    const y = Math.floor(index / 12);
    const m = (index % 12) + 1;
    months.push({ year: y, month: m, amount: sumMonth(transactions, y, m) });
  }
  return months;
}

// 막대 차트 눈금 간격(만원). 지출이 커지면 눈금이 너무 많아지지 않게 넓힙니다.
export function getTickStep(months) {
  const maxMan = Math.max(0, ...months.map((m) => m.amount)) / 10000;
  if (maxMan <= 160) return 40;
  if (maxMan <= 400) return 100;
  return 200;
}
