import { profileSetupData } from '../data/auth/profileSetup';
import { lifeDataForm } from '../data/more/lifeData';
import { formatNumber } from './format';

// 50만원처럼 만 원 단위로 떨어지면 "50만원", 아니면 "1,234,500원"
export const formatBudget = (won) =>
  won > 0 && won % 10000 === 0 ? `${won / 10000}만원` : `${formatNumber(won)}원`;

export const periodLabel = (id) => lifeDataForm.periods.find((p) => p.id === id)?.label ?? '';
export const goalTitle = (id) => lifeDataForm.goals.find((g) => g.id === id)?.title ?? '';

// 고른 조리 도구를 "전자레인지, 가스레인지/인덕션" 처럼 이어 붙입니다. 없음이면 "없음".
export function toolsLabel(tools) {
  const names = tools
    .filter((id) => id !== 'none')
    .map((id) => lifeDataForm.tools.find((t) => t.id === id)?.label)
    .filter(Boolean);
  return names.length ? names.join(', ') : lifeDataForm.noneTool.title;
}

// 프로필 설정 입력값 → 진단 결과.
// 입력: { period, goal, tools, cookDays, budget }
// 반환: { type, description, stats: [{ key, label, value }], recommendations: [{ icon, title, description, to }] }
export function getDiagnosis({ period, goal, tools, cookDays, budget }) {
  const d = profileSetupData.diagnosis;
  const r = profileSetupData.result;
  const hasTools = tools.some((id) => id !== 'none');

  const cookKey = cookDays === 0 ? 'none' : cookDays >= 4 ? 'often' : 'some';
  const description = `${d.goalSentence[goal].replace('{period}', periodLabel(period))} ${d.cookSentence[cookKey].replace('{n}', cookDays)}`;

  const toolsSentence = hasTools
    ? d.toolsSentence.some.replace('{list}', toolsLabel(tools))
    : d.toolsSentence.none;

  return {
    type: `${d.periodWord[period]} ${d.goalType[goal]}`,
    description,
    stats: [
      { key: 'period', label: r.statLabels.period, value: periodLabel(period) },
      { key: 'budget', label: r.statLabels.budget, value: formatBudget(budget) },
      { key: 'cookDays', label: r.statLabels.cookDays, value: `주 ${cookDays}일` },
    ],
    recommendations: d.recommendations[goal].map((rec) => ({
      ...rec,
      description: rec.description
        .replace('{budget}', formatBudget(budget))
        .replace('{tools}', toolsSentence),
    })),
  };
}
