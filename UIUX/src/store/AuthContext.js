import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../services/client';
import { diagnoseOnboarding } from '../utils/diagnosis';
import { loadSession, saveSession, clearSession } from '../services/sessionStore';

// 로그인 세션과 온보딩(30초 자취 진단) 상태.
// - AC-02: 세션은 기기 안전 저장소(services/sessionStore.js)에 저장하고, 앱을 열 때 /me/identity 로 다시 확인합니다.
//   만료·폐기(401/403)된 세션은 지우고 다시 로그인하게 합니다. 서버 연결 실패는 세션을 지우지 않고 다시 시도할 수 있게 둡니다.
// - AC-10: 로그아웃하면 서버 세션 폐기 + 기기 세션 삭제 + 메모리의 사용자 데이터 초기화.
// - 시연 모드 온보딩은 서버가 없으므로 기기에 저장하고, 진단은 서버와 같은 규칙(utils/diagnosis.js)으로 계산합니다.
const DEMO_ONBOARDING_KEY = 'jachwi:demo:onboarding';

const Context = createContext(null);

async function readJson(key) {
  try { return JSON.parse((await AsyncStorage.getItem(key)) || 'null'); } catch { return null; }
}
async function writeJson(key, value) {
  try {
    if (value == null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch { /* 저장 실패해도 현재 화면 상태는 유지합니다. */ }
}

// 서버 세션 확인 + 온보딩 조회. 온보딩이 없으면(404) profile/diagnosis 는 null.
async function loadServerAccount(next) {
  await request(next.base, next.token, '/api/v1/me/identity');
  try {
    const result = await request(next.base, next.token, '/api/v1/me/onboarding');
    return { profile: result.profile, diagnosis: result.diagnosis || null };
  } catch (e) {
    if (e.status !== 404) throw e;
    return { profile: null, diagnosis: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [canRetryRestore, setCanRetryRestore] = useState(false);
  // 첫 온보딩 저장 직후 진단 결과 화면을 보여 줄지 (확인을 누르면 홈으로 이동)
  const [firstDiagnosis, setFirstDiagnosis] = useState(false);

  const api = (path, method, body) => request(session.base, session.token, path, method, body);

  const apply = (next, account) => {
    setOnboarding(account.profile);
    setDiagnosis(account.diagnosis);
    setSession(next);
  };

  // 앱 시작(및 다시 시도): 저장된 세션 복원
  const restore = useCallback(async () => {
    setRestoring(true); setRestoreError(''); setCanRetryRestore(false);
    const saved = await loadSession();
    try {
      if (!saved) return;
      if (saved.demo) {
        const profile = await readJson(DEMO_ONBOARDING_KEY);
        apply(saved, { profile, diagnosis: profile ? diagnoseOnboarding(profile) : null });
      } else {
        apply(saved, await loadServerAccount(saved));
      }
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        await clearSession();
        setRestoreError('로그인이 만료되었어요. 다시 로그인해 주세요.');
      } else {
        setCanRetryRestore(true);
        setRestoreError(`서버에 연결하지 못해 저장된 로그인을 확인하지 못했어요. (${e.message})`);
      }
    } finally {
      setRestoring(false);
    }
  }, []);
  useEffect(() => { restore(); }, [restore]);

  const login = useCallback(async (next) => {
    let account;
    if (next.demo) {
      const profile = await readJson(DEMO_ONBOARDING_KEY);
      account = { profile, diagnosis: profile ? diagnoseOnboarding(profile) : null };
    } else {
      account = await loadServerAccount(next);
    }
    await saveSession(next);
    setRestoreError(''); setCanRetryRestore(false);
    apply(next, account);
  }, []);

  // 온보딩 저장. 반환값은 진단 결과입니다.
  const finish = async (profile) => {
    let result;
    if (session.demo) {
      result = { profile, diagnosis: diagnoseOnboarding(profile) };
      await writeJson(DEMO_ONBOARDING_KEY, profile);
    } else {
      result = await api('/api/v1/me/onboarding', 'PUT', profile);
    }
    if (!onboarding) setFirstDiagnosis(true);
    setOnboarding(result.profile);
    setDiagnosis(result.diagnosis || null);
    return result.diagnosis || null;
  };
  const dismissFirstDiagnosis = () => setFirstDiagnosis(false);

  const logout = async () => {
    if (session?.token && !session.demo) {
      try { await request(session.base, '', '/api/v1/auth/logout', 'POST', { token: session.token }); }
      catch { /* 오프라인이어도 기기 세션은 지웁니다. 서버 세션은 24시간 뒤 만료됩니다. */ }
    }
    await clearSession(); // 시연 온보딩·시연 데이터(계정 정보 없음)는 다음 시연을 위해 남겨 둡니다.
    setSession(null); setOnboarding(null); setDiagnosis(null); setFirstDiagnosis(false);
  };

  return (
    <Context.Provider value={{ session, onboarding, diagnosis, restoring, restoreError, canRetryRestore, retryRestore: restore, firstDiagnosis, dismissFirstDiagnosis, login, finish, logout, api }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
