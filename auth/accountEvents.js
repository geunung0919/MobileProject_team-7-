// 회원 상태가 바뀔 때 다른 파트가 정리·갱신할 수 있게 알려 주는 연결 지점 (AC-09, AC-10).
//
//   import { onAccountEvent } from '../auth/accountEvents';
//   useEffect(() => onAccountEvent('logout', async ({ uid }) => { /* 내 파트 캐시·알림 지우기 */ }), []);
//
// 이벤트
//   'logout'        로그아웃·탈퇴 직전. { uid, reason: 'logout' | 'withdraw' }  ← 기기 캐시, 개인 알림 예약을 지우세요
//   'regionChanged' 거주 지역이 바뀐 뒤. { uid, from: {code, name}, to: {code, name} } ← 지역 의존 정보(날씨·지도 등)를 갱신하세요
//
// 등록 함수는 해제 함수를 돌려줍니다. 한 파트의 정리가 실패해도 나머지 정리와 로그아웃은 계속 진행합니다.
const listeners = { logout: new Set(), regionChanged: new Set() };

export function onAccountEvent(event, fn) {
  if (!listeners[event]) throw new Error(`알 수 없는 회원 이벤트예요: ${event}`);
  listeners[event].add(fn);
  return () => listeners[event].delete(fn);
}

export async function emitAccountEvent(event, payload) {
  const results = await Promise.allSettled([...(listeners[event] || [])].map((fn) => fn(payload)));
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) console.warn(`[account] ${event} 처리 중 ${failed.length}개 실패`);
  return { total: results.length, failed: failed.length };
}
