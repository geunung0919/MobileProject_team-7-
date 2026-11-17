import { maskEmail } from './authRules';

// 최근 로그인 계정 기억 (AC-04). 순수 로직이라 테스트에서 가짜 저장소를 끼워 확인합니다.
// - 기본은 기억 안 함. 사용자가 켜야(동의) 로그인 성공 시 가린 이메일만 저장합니다. 전체 이메일·비밀번호는 저장하지 않습니다.
// - 표시된 계정은 안내용일 뿐이고, 실제 로그인은 반드시 비밀번호 입력(signIn)으로만 됩니다.
// - 기억 끄기 = 기록도 함께 지움. 로그아웃해도 기록은 남습니다(AC-10, 사용자가 켠 경우).
export const RECENT_KEY = 'jachwi.recentAccount';

const EMPTY = { remember: false, maskedEmail: null, savedAt: null };

export function createRecentAccountStore(storage, now = () => new Date().toISOString()) {
  async function read() {
    try {
      const raw = await storage.getItem(RECENT_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') return { ...EMPTY };
      return {
        remember: data.remember === true,
        maskedEmail: data.remember === true && typeof data.maskedEmail === 'string' ? data.maskedEmail : null,
        savedAt: data.remember === true ? data.savedAt || null : null,
      };
    } catch {
      return { ...EMPTY };
    }
  }
  const write = async (data) => { await storage.setItem(RECENT_KEY, JSON.stringify(data)); return data; };

  return {
    read,
    // 기억 켜기·끄기. 끄면 기록도 지웁니다.
    async setRemember(on) {
      const current = await read();
      return write(on ? { ...current, remember: true } : { ...EMPTY });
    },
    // 로그인 성공 후 호출. 기억이 켜져 있을 때만 가린 이메일을 저장합니다.
    async recordLogin(email) {
      const current = await read();
      if (!current.remember) return current;
      const maskedEmail = maskEmail(email);
      if (!maskedEmail) return current;
      return write({ remember: true, maskedEmail, savedAt: now() });
    },
    // 기록만 지우기 (기억 설정은 유지)
    async clear() {
      const current = await read();
      return write({ ...EMPTY, remember: current.remember });
    },
  };
}
