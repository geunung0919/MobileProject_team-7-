import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../services/client';
import { diagnoseOnboarding } from '../utils/diagnosis';
import { normalizeNickname } from '../utils/nickname';
import { regionInfo } from '../utils/regions';
import { loadSession, saveSession, clearSession } from '../services/sessionStore';
import { clearRecentAccount } from '../services/recentAccount';
import {
  currentFirebaseSession, loadFirebaseAccount, isNicknameFree, saveFirebaseMember, saveFirebaseProfile,
  signOutFirebase, withdrawFirebase,
} from '../services/firebaseAccount';

// 로그인 세션, 회원 프로필(닉네임·지역), 온보딩(30초 자취 진단) 상태.
// - AC-02: 세션은 기기 안전 저장소(services/sessionStore.js)에 저장하고, 앱을 열 때 서버에서 다시 확인합니다.
//   만료·폐기(401/403)된 세션은 지우고 다시 로그인하게 합니다. 서버 연결 실패는 세션을 지우지 않고 다시 시도할 수 있게 둡니다.
// - AC-05~09: 첫 가입 때 닉네임·지역을 정하고(프로필 → 진단 → 홈), 더보기 > 개인정보 관리에서 수정합니다.
// - AC-10: 로그아웃하면 서버 세션 폐기 + 기기 세션 삭제 + 메모리의 사용자 데이터 초기화.
// - AC-11: 회원 탈퇴는 Google 재인증 후 서버가 계정과 데이터를 삭제하고, 기기의 세션·최근 계정 기록도 지웁니다.
// - 아이디·비밀번호 계정(session.firebase)은 Firebase 인증을 쓰고, 회원·온보딩을 Firestore users/{uid} 에 저장합니다.
//   로그인 유지는 Firebase 가 하므로 앱을 열 때 Firebase 의 로그인 사용자로 다시 확인합니다.
// - 시연 모드는 서버가 없으므로 프로필·온보딩을 기기에 저장하고, 진단은 서버와 같은 규칙으로 계산합니다.
const DEMO_ONBOARDING_KEY = 'jachwi:demo:onboarding';
const DEMO_MEMBER_KEY = 'jachwi:demo:member';

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
const orNullOn404 = (promise) => promise.catch((e) => { if (e.status === 404) return null; throw e; });

// 서버 세션 확인 + 회원 프로필·온보딩 조회 (없으면 null)
async function loadServerAccount(next) {
  await request(next.base, next.token, '/api/v1/me/identity');
  const [member, result] = await Promise.all([
    orNullOn404(request(next.base, next.token, '/api/v1/me/member')),
    orNullOn404(request(next.base, next.token, '/api/v1/me/onboarding')),
  ]);
  return { member, profile: result?.profile || null, diagnosis: result?.diagnosis || null };
}
async function loadDemoAccount() {
  const [stored, profile] = await Promise.all([readJson(DEMO_MEMBER_KEY), readJson(DEMO_ONBOARDING_KEY)]);
  const member = stored ? { nickname: stored.nickname, region: regionInfo(stored.region_code) } : null;
  return { member, profile, diagnosis: profile ? diagnoseOnboarding(profile) : null };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [member, setMember] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [canRetryRestore, setCanRetryRestore] = useState(false);
  // 첫 온보딩 저장 직후 진단 결과 화면을 보여 줄지 (확인을 누르면 홈으로 이동)
  const [firstDiagnosis, setFirstDiagnosis] = useState(false);

  const api = (path, method, body) => {
    if (session?.firebase) return Promise.reject(new Error('아이디 계정에서는 아직 서버 기능(영수증 OCR 등)을 쓸 수 없어요.'));
    return request(session.base, session.token, path, method, body);
  };
  const loadAccount = (next) => (next.firebase ? loadFirebaseAccount(next.userId)
    : next.demo ? loadDemoAccount() : loadServerAccount(next));

  const apply = (next, account) => {
    setMember(account.member);
    setOnboarding(account.profile);
    setDiagnosis(account.diagnosis);
    setSession(next);
  };
  const reset = () => {
    setSession(null); setMember(null); setOnboarding(null); setDiagnosis(null); setFirstDiagnosis(false);
  };

  // 앱 시작(및 다시 시도): 저장된 세션 복원
  const restore = useCallback(async () => {
    setRestoring(true); setRestoreError(''); setCanRetryRestore(false);
    const saved = await loadSession();
    try {
      if (!saved) return;
      if (saved.firebase) {
        const current = await currentFirebaseSession();
        if (!current || current.userId !== saved.userId) {
          await clearSession();
          setRestoreError('로그인이 만료되었어요. 다시 로그인해 주세요.');
          return;
        }
      }
      apply(saved, await loadAccount(saved));
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
    const account = await loadAccount(next);
    await saveSession(next);
    setRestoreError(''); setCanRetryRestore(false);
    apply(next, account);
  }, []);

  // 닉네임 사용 가능 여부 (AC-06, AC-07). 서버 모드는 서버가 중복을 판단합니다.
  const checkNickname = async (raw) => {
    const { nickname, message } = normalizeNickname(raw);
    if (!nickname) return { valid: false, available: false, message };
    if (session.demo) return { nickname, valid: true, available: true, message: '사용할 수 있는 닉네임이에요. (시연 모드: 중복 확인 안 함)' };
    if (session.firebase) {
      const available = await isNicknameFree(session.userId, nickname);
      return { nickname, valid: true, available, message: available ? '사용할 수 있는 닉네임이에요.' : '이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.' };
    }
    return api(`/api/v1/nicknames/availability?nickname=${encodeURIComponent(nickname)}`);
  };

  // 프로필 저장 (AC-05, AC-09). 반환: { nickname, region, region_changed }
  const saveMember = async ({ nickname: raw, region_code }) => {
    const { nickname, message } = normalizeNickname(raw);
    if (!nickname) throw new Error(message);
    let saved;
    if (session.demo) {
      const previous = (await readJson(DEMO_MEMBER_KEY))?.region_code ?? null;
      await writeJson(DEMO_MEMBER_KEY, { nickname, region_code: region_code ?? null });
      if (onboarding && onboarding.region_code !== (region_code ?? null)) {
        const nextProfile = { ...onboarding, region_code: region_code ?? null };
        await writeJson(DEMO_ONBOARDING_KEY, nextProfile);
        setOnboarding(nextProfile);
      }
      saved = { nickname, region: regionInfo(region_code), region_changed: previous !== (region_code ?? null) };
    } else if (session.firebase) {
      saved = await saveFirebaseMember(session.userId, { nickname, region_code });
      if (onboarding) setOnboarding({ ...onboarding, region_code: region_code ?? null });
    } else {
      saved = await api('/api/v1/me/member', 'PUT', { nickname, region_code: region_code ?? null });
      // 서버가 온보딩 region_code 도 같은 값으로 맞춥니다. 화면 상태도 맞춥니다.
      if (onboarding) setOnboarding({ ...onboarding, region_code: region_code ?? null });
    }
    setMember({ nickname: saved.nickname, region: saved.region });
    return saved;
  };

  // 온보딩 저장. 반환값은 진단 결과입니다.
  const finish = async (profile) => {
    const withRegion = { ...profile, region_code: member?.region?.code ?? profile.region_code ?? null };
    let result;
    if (session.demo) {
      result = { profile: withRegion, diagnosis: diagnoseOnboarding(withRegion) };
      await writeJson(DEMO_ONBOARDING_KEY, withRegion);
    } else if (session.firebase) {
      result = await saveFirebaseProfile(session.userId, withRegion);
    } else {
      result = await api('/api/v1/me/onboarding', 'PUT', withRegion);
    }
    if (!onboarding) setFirstDiagnosis(true);
    setOnboarding(result.profile);
    setDiagnosis(result.diagnosis || null);
    return result.diagnosis || null;
  };
  const dismissFirstDiagnosis = () => setFirstDiagnosis(false);

  const logout = async () => {
    if (session?.firebase) await signOutFirebase().catch(() => {});
    else if (session?.token && !session.demo) {
      try { await request(session.base, '', '/api/v1/auth/logout', 'POST', { token: session.token }); }
      catch { /* 오프라인이어도 기기 세션은 지웁니다. 서버 세션은 24시간 뒤 만료됩니다. */ }
    }
    await clearSession(); // 시연 프로필·온보딩·데이터(계정 정보 없음)는 다음 시연을 위해 남겨 둡니다.
    reset();
  };

  // 회원 탈퇴 (AC-11): start → 브라우저에서 Google 재인증 → confirm 을 반복 호출 → deleted 면 finishWithdrawal
  const startWithdrawal = () => api('/api/v1/me/withdrawal/start', 'POST');
  const confirmWithdrawal = (state, secret) => api('/api/v1/me/withdrawal/confirm', 'POST', { state, secret });
  // 아이디 계정 탈퇴: 비밀번호로 다시 인증한 뒤 회원 문서와 로그인 계정을 지웁니다.
  const withdrawWithPassword = async (password) => {
    const uid = session.userId;
    await withdrawFirebase(password);
    await AsyncStorage.removeItem(`jachwi:ui:firebase:${uid}`).catch(() => {});
  };
  const finishWithdrawal = async () => {
    await clearSession();
    await clearRecentAccount(false);
    reset();
  };

  return (
    <Context.Provider value={{
      session, member, onboarding, diagnosis, restoring, restoreError, canRetryRestore, retryRestore: restore,
      firstDiagnosis, dismissFirstDiagnosis, login, checkNickname, saveMember, finish, logout,
      startWithdrawal, confirmWithdrawal, withdrawWithPassword, finishWithdrawal, api,
    }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
