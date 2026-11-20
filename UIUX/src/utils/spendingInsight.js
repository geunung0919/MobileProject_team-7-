import { getCategoryTotals } from './spendingAnalysis';
import { formatNumber } from './format';

// 소비 분석 'AI 한마디'의 기본 문장 (AI 서버가 안 될 때·기다리는 동안 쓰는 문장). 증감은 코드로 계산합니다.
export function previousMonth(year, month) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

const won = (n) => `${formatNumber(n)}원`;

// categories / prev: [{ name, amount }] (많이 쓴 순). 서버에도 이 형태로 보냅니다.
export function buildLocalInsight(categories, prev) {
  const total = categories.reduce((s, c) => s + c.amount, 0);
  if (total <= 0) return null;
  const prevTotal = prev.reduce((s, c) => s + c.amount, 0);
  if (prevTotal <= 0) {
    const top = categories[0];
    return `${top.name} 지출이 ${won(top.amount)}으로 가장 많아요. 다음 달과 비교할 수 있도록 계속 기록해 보세요.`;
  }
  const prevMap = new Map(prev.map((c) => [c.name, c.amount]));
  const diffs = categories.map((c) => ({ name: c.name, diff: c.amount - (prevMap.get(c.name) ?? 0) }));
  prev.forEach((p) => {
    if (!categories.some((c) => c.name === p.name)) diffs.push({ name: p.name, diff: -p.amount });
  });
  const up = diffs.filter((d) => d.diff > 0).sort((a, b) => b.diff - a.diff)[0];
  const down = diffs.filter((d) => d.diff < 0).sort((a, b) => a.diff - b.diff)[0];
  const totalDiff = total - prevTotal;
  if (up && totalDiff > 0) {
    return `저번 달보다 ${up.name} 지출이 ${won(up.diff)} 더 많아요. ${up.name} 소비를 조금 줄여 보는 게 좋겠어요.`;
  }
  if (down && totalDiff < 0) {
    return `저번 달보다 전체 지출이 ${won(-totalDiff)} 줄었어요. 특히 ${down.name} 지출이 ${won(-down.diff)} 줄었어요. 잘하고 있어요!`;
  }
  return '저번 달과 지출이 비슷해요. 지금처럼 유지해 보세요.';
}

export function toInsightRows(transactions, year, month, palette) {
  return getCategoryTotals(transactions, year, month, palette).map((c) => ({ name: c.name, amount: c.amount }));
}
