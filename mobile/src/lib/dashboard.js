import { won } from './api.js';

export const moduleNames = { spending: '소비·예산', inventory: '식재료·재고', life: '생활 루틴' };
export function moduleSummary(view, key) {
  const status = view.module_status[key];
  const snapshot = view.modules[key];
  if (status === 'missing' || !snapshot) return '아직 전달된 데이터가 없어요.';
  if (status === 'stale') return '오래된 정보예요. 현재 상태로 판단하지 않아요.';
  if (status !== 'available') return '데이터 상태를 확인할 수 없어요.';
  const data = snapshot.data;
  if (key === 'spending') return `사용 ${won(data.spent_krw)} · 남은 예산 ${won(data.remaining_krw)}`;
  if (key === 'inventory') return `등록된 재료 ${data.items.length}종`;
  if (key === 'life') return `전달된 루틴 ${data.routines.length}개 · 미완료 ${data.routines.filter(item => !item.completed).length}개`;
  return '연결 준비 중';
}
// 서버 문자열을 그대로 이동 경로로 사용하지 않는다. 구현된 화면만 허용한다.
export function cardRoute(target) {
  return ['/onboarding', '/spending'].includes(target) ? target : null;
}
