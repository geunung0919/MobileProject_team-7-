import { pad, formatNumber } from './format';
import { getFridgeEntries } from './recipes';
import { getHeroLine } from './homeSummary';

// AI 리포트(AI 한마디, 리포트 상세)에 쓰는 값을 저장소 데이터로 계산합니다.
// TODO: AI 한마디(comment)와 AI 제안(tips)은 지금 규칙으로 만든 문장입니다. 실제 AI 응답으로 바꾸려면 이 파일의 buildComment / buildTips 를 교체하세요.

const sum = (list) => list.reduce((total, t) => total + t.amount, 0);

// 예산 사용률 -> 태그: { label, warn }
export function getBudgetTag(percent) {
  if (percent > 100) return { label: '예산 초과', warn: true };
  if (percent > 70) return { label: '예산 근접', warn: true };
  return { label: '예산 지킴', warn: false };
}

function buildComment({ month, spent, budget, usedPercent, first }) {
  let spendingLine;
  if (spent === 0) spendingLine = `${month}월 지출 기록이 아직 없어요.`;
  else if (spent > budget) spendingLine = `이번 달 예산을 ${formatNumber(spent - budget)}원 넘겼어요.`;
  else spendingLine = `이번 달 예산의 ${usedPercent}%를 썼고, ${formatNumber(budget - spent)}원이 남았어요.`;
  return `${spendingLine} ${getHeroLine(first)}`;
}

function buildTips({ spent, usedPercent, categories, urgentNames, expiredNames }) {
  const tips = [];
  if (expiredNames.length) tips.push(`기한이 지난 식재료(${expiredNames.join(', ')})는 확인하고 정리하세요.`);
  if (urgentNames.length) tips.push(`기한이 임박한 식재료(${urgentNames.join(', ')})부터 먼저 드세요.`);
  const top = categories[0];
  if (spent > 0 && top && top.percent >= 40) {
    tips.push(`${top.name} 지출이 ${top.percent}%로 가장 커요. 이번 주 지출을 한 번 점검해 보세요.`);
  }
  if (usedPercent >= 80) tips.push(`예산의 ${usedPercent}%를 썼어요. 남은 기간 지출을 조금 줄여 보세요.`);
  if (!tips.length) tips.push('지금처럼 소비와 냉장고를 꾸준히 기록해 보세요.');
  return tips.slice(0, 3);
}

// 이번 달 리포트. 반환: { year, month, periodLabel, spent, budget, remaining, usedPercent,
//   prevDiffPercent(지난달 같은 기간 대비 %, 비교할 값이 없으면 null), categories: [{ name, amount, percent }],
//   fridge: { total, urgent, expired }, comment, tips }
export function getMonthlyReport({ transactions, fridgeItems, budget, now, baseDate, urgentWithinDays }) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const monthKey = `${year}-${pad(month)}`;

  const thisMonth = transactions.filter((t) => t.date.startsWith(monthKey));
  const spent = sum(thisMonth);
  const usedPercent = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  const prev = new Date(year, month - 2, 1);
  const prevKey = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
  const prevSpent = sum(
    transactions.filter((t) => t.date.startsWith(prevKey) && Number(t.date.slice(8, 10)) <= day),
  );
  const prevDiffPercent = prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 100) : null;

  const byCategory = {};
  thisMonth.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  });
  const categories = Object.entries(byCategory)
    .map(([name, amount]) => ({ name, amount, percent: Math.round((amount / spent) * 100) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const entries = getFridgeEntries(fridgeItems, baseDate, urgentWithinDays);
  const expired = entries.filter((e) => e.daysLeft < 0);
  const urgent = entries.filter((e) => e.urgent && e.daysLeft >= 0);
  const names = (list) => list.slice(0, 3).map((e) => e.name);

  const report = {
    year,
    month,
    periodLabel: `${month}월 1일 ~ ${month}월 ${day}일 기준`,
    spent,
    budget,
    remaining: budget - spent,
    usedPercent,
    prevDiffPercent,
    categories,
    fridge: { total: entries.length, urgent: urgent.length, expired: expired.length },
  };
  const first = entries[0] ? { name: entries[0].name, daysLeft: entries[0].daysLeft } : null;
  report.comment = buildComment({ month, spent, budget, usedPercent, first });
  report.tips = buildTips({
    spent,
    usedPercent,
    categories,
    urgentNames: names(urgent),
    expiredNames: names(expired),
  });
  return report;
}

// 지난 리포트(더미 snapshot)를 getMonthlyReport 와 같은 모양으로 바꿉니다.
// snapshot.monthsAgo 는 "몇 달 전 리포트인지"입니다 (더미가 언제 봐도 자연스럽도록).
export function buildPastReport(snapshot, now) {
  const d = new Date(now.getFullYear(), now.getMonth() - snapshot.monthsAgo, 1);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return {
    id: snapshot.id,
    year,
    month,
    periodLabel: `${month}월 1일 ~ ${month}월 ${lastDay}일`,
    spent: snapshot.spent,
    budget: snapshot.budget,
    remaining: snapshot.budget - snapshot.spent,
    usedPercent: Math.round((snapshot.spent / snapshot.budget) * 100),
    prevDiffPercent: null,
    categories: snapshot.categories.map((c) => ({ ...c, amount: Math.round((snapshot.spent * c.percent) / 100) })),
    fridge: snapshot.fridge,
    comment: snapshot.comment,
    tips: snapshot.tips,
  };
}
