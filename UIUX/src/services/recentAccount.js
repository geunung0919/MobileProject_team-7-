import AsyncStorage from '@react-native-async-storage/async-storage';

// 최근 로그인 계정 표시 (AC-04).
// - 사용자가 동의(스위치)한 경우에만, 마스킹한 이메일만 기기에 저장합니다. 토큰·전체 이메일은 저장하지 않습니다.
// - 표시된 이메일로 로그인이 끝나지 않습니다. 계정 선택과 인증은 항상 Google 로그인 화면에서 합니다.
const KEY = 'jachwi:recent-account';

export function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!local || !domain) return '';
  const shown = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(3, local.length - shown.length))}@${domain}`;
}

export async function loadRecentAccount() {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) || 'null') || { enabled: false, masked: '' }; }
  catch { return { enabled: false, masked: '' }; }
}

export async function saveRecentAccount(value) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(value)); } catch { /* 표시 기능이라 실패해도 로그인은 계속 */ }
}

// 기록 지우기·기억 끄기·탈퇴 시
export async function clearRecentAccount(keepEnabled = false) {
  await saveRecentAccount({ enabled: keepEnabled, masked: '' });
}
