import { daysBetween, pad } from './format';
import { getFridgeEntries, badgeDueLabel } from './recipes';

// 홈 화면의 요약 값을 저장소 데이터로 계산합니다.

// 이번 달 소비 요약 (소비 탭과 같은 기준): { month, spent, budget, remaining }
export function getSpendingSummary(transactions, budget, now) {
  const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const spent = transactions
    .filter((t) => t.date.startsWith(monthKey))
    .reduce((sum, t) => sum + t.amount, 0);
  return { month: now.getMonth() + 1, spent, budget, remaining: budget - spent };
}

// 냉장고 요약: { total, urgentCount, first }. first 는 유통기한이 가장 빠른 식재료 (없으면 null)
export function getFridgeSummary(fridgeItems, baseDate, urgentWithinDays) {
  const entries = getFridgeEntries(fridgeItems, baseDate, urgentWithinDays);
  const first = entries[0];
  return {
    total: entries.length,
    urgentCount: entries.filter((e) => e.urgent).length,
    first: first
      ? {
          name: first.name,
          label: first.detail ? `${first.name} ${first.detail}` : first.name, // 예: "우유 1L"
          tag: badgeDueLabel(first.daysLeft),
          urgent: first.urgent,
          daysLeft: first.daysLeft,
        }
      : null,
  };
}

// "오늘의 한마디" 첫 줄: 가장 먼저 상하는 식재료 안내
export function getHeroLine(first) {
  if (!first) return '냉장고에 식재료를 추가해 보세요.';
  if (first.daysLeft < 0) return `기한이 지난 ${first.name}부터 확인해 보세요.`;
  if (first.daysLeft === 0) return `오늘까지인 ${first.name}부터 챙겨보세요.`;
  return `${first.daysLeft}일 남은 ${first.name}부터 챙겨보세요.`;
}

// "오늘 챙길 일"의 루틴/할 일 줄에 보여줄 상태와 요약 글자
export function getTaskSummaries(routines, todos, baseDate) {
  // 루틴: 아직 안 한 것 (이른 시간 순)
  const pendingRoutines = routines
    .filter((r) => !r.doneToday)
    .sort((a, b) => a.time.localeCompare(b.time));
  const doneRoutines = routines.length - pendingRoutines.length;

  // 할 일: 아직 안 한 것 (마감 빠른 순, 기한 없는 것은 맨 뒤)
  const pendingTodos = todos
    .filter((t) => !t.done)
    .map((t) => ({ ...t, daysLeft: t.due ? daysBetween(baseDate, t.due) : Infinity }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const titles = (list) => list.slice(0, 2).map((x) => x.title).join(' · ');

  return {
    routine: {
      status: routines.length ? `${doneRoutines} / ${routines.length} 완료` : '루틴 없음',
      summary: !routines.length
        ? '생활 루틴을 추가해 보세요.'
        : pendingRoutines.length
          ? `${titles(pendingRoutines)} 남음`
          : '오늘 루틴을 모두 마쳤어요.',
    },
    todo: {
      status: pendingTodos.length
        ? `${pendingTodos.length}개 남음`
        : todos.length
          ? '모두 완료'
          : '할 일 없음',
      summary: pendingTodos.length
        ? titles(pendingTodos)
        : todos.length
          ? '남은 할 일이 없어요.'
          : '할 일을 추가해 보세요.',
    },
  };
}
