import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../services/client';
import { diagnoseOnboarding } from '../utils/diagnosis';

// 로그인 세션과 온보딩(30초 자취 진단) 상태.
// - 세션은 기기에 저장해 앱을 다시 열어도 유지합니다. 서버 세션은 시작할 때 /me/identity 로 다시 확인합니다.
// - 시연 모드 온보딩은 서버가 없으므로 기기에 저장하고, 진단은 서버와 같은 규칙(utils/diagnosis.js)으로 계산합니다.
// 주의: AsyncStorage 는 암호화 저장소가 아닙니다. 수업 시연용이며, 실서비스라면 expo-secure-store 로 바꾸세요.
const SESSION_KEY = 'jachwi:auth:session';
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
  // 첫 온보딩 저장 직후 진단 결과 화면을 보여 줄지 (확인을 누르면 홈으로 이동)
  const [firstDiagnosis, setFirstDiagnosis] = useState(false);

  const api = (path, method, body) => request(session.base, session.token, path, method, body);

  const apply = (next, account) => {
    setOnboarding(account.profile);
    setDiagnosis(account.diagnosis);
    setSession(next);
  };

  // 앱 시작: 저장된 세션 복원
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await readJson(SESSION_KEY);
      try {
        if (!saved) return;
        if (saved.demo) {
          const profile = await readJson(DEMO_ONBOARDING_KEY);
          if (!cancelled) apply(saved, { profile, diagnosis: profile ? diagnoseOnboarding(profile) : null });
        } else {
          const account = await loadServerAccount(saved);
          if (!cancelled) apply(saved, account);
        }
      } catch (e) {
        // 만료(401)·서버 꺼짐 등: 저장된 세션을 지우고 로그인 화면에서 다시 시작합니다.
        await writeJson(SESSION_KEY, null);
        if (!cancelled) setRestoreError(`저장된 로그인을 확인하지 못했어요. 다시 로그인해 주세요. (${e.message})`);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (next) => {
    let account;
    if (next.demo) {
      const profile = await readJson(DEMO_ONBOARDING_KEY);
      account = { profile, diagnosis: profile ? diagnoseOnboarding(profile) : null };
    } else {
      account = await loadServerAccount(next);
    }
    await writeJson(SESSION_KEY, next);
    setRestoreError('');
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
    await writeJson(SESSION_KEY, null); // 시연 온보딩·시연 데이터는 다음 시연을 위해 남겨 둡니다.
    setSession(null); setOnboarding(null); setDiagnosis(null); setFirstDiagnosis(false);
  };

  return (
    <Context.Provider value={{ session, onboarding, diagnosis, restoring, restoreError, firstDiagnosis, dismissFirstDiagnosis, login, finish, logout, api }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
