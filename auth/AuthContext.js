import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import {
  emailOf, loadAccount, signOutAccount, signUpWithEmail, signInWithEmail, saveOnboarding, withdrawAccount,
  updateProfileData, changeNickname, isNicknameAvailable,
} from './firebaseAccount';
import { emitAccountEvent } from './accountEvents';
import { regionInfo } from './regions';
import { normalizeEmail, validatePassword, validateBirthDate, authErrorMessage } from './authRules';
import { normalizeNickname } from './nickname';
import { diagnose, EMPTY_PROFILE } from './onboardingRules';

// 회원·온보딩 기능 (1번 모듈). 화면(UI)은 담지 않고, 화면에서 부를 함수와 상태만 제공합니다.
//
//   const auth = useAuth();
//   auth.stage                     'loading' | 'login' | 'onboarding' | 'app' | 'error'  ← 어떤 화면을 보여 줄지
//   auth.signIn({email, password})                        → 실패 시 throw (error.field, error.message 포함)
//   auth.signUp({email, password, confirm, birthDate?})   → 실패 시 throw (birthDate 는 받는 경우에만)
//   auth.completeOnboarding({nickname, profile})          → 저장 후 {nickname, profile, diagnosis} 반환
//   auth.finishOnboarding()        결과 화면에서 [시작하기]를 누를 때 → stage 가 'app' 으로
//   auth.updateProfile(changes)    생활 데이터 수정: 바꾼 항목만 넘기면 기존 값과 합쳐 저장 → 새 profile 반환
//   auth.updateNickname(nickname)  닉네임만 변경 (중복이면 field='nickname' 오류)
//   auth.checkNickname(nickname)   입력 중 중복 확인 → {status:'available'|'taken'|'invalid'|'error', message} (훅: useNicknameCheck)
//   auth.setRegion(code)           지역 검색 결과(regions.searchRegions)에서 고른 법정동 코드 저장 → 'regionChanged' 이벤트
//   로그아웃·탈퇴 직전에는 'logout' 이벤트가 나갑니다 (accountEvents.js — 다른 파트의 캐시·알림 정리용)
//   auth.user.uid / auth.member.nickname / auth.profile    로그인 사용자·닉네임·생활 정보
//   auth.logout() / auth.withdraw(password) / auth.reloadAccount()
const AuthContext = createContext(null);

const EMPTY = { member: null, profile: null, onboarded: false };

// 화면에서 바로 쓰도록 오류에 field(어느 칸에 표시할지)와 message(보여 줄 문구)를 붙입니다.
function fail(field, message, code) {
  const error = new Error(message);
  error.field = field;
  error.code = code || `validation/${field}`;
  return error;
}
function asFieldError(e) {
  if (e?.field) return e;
  const { field, message } = authErrorMessage(e?.code);
  return fail(field, message, e?.code);
}

export function AuthProvider({ children }) {
  // account: 'loading' | 'error' | {member, profile, onboarded}
  const [state, setState] = useState({ ready: false, user: null, account: 'loading' });
  const [signingUp, setSigningUp] = useState(false);       // 가입 저장이 끝날 때까지 'login' 단계 유지
  const [holdOnboarding, setHoldOnboarding] = useState(false); // 결과 화면을 볼 때까지 'onboarding' 단계 유지

  const load = async (user) => {
    setState((prev) => ({ ...prev, account: 'loading' }));
    try {
      const account = await loadAccount(user.uid);
      setState((prev) => (prev.user?.uid === user.uid ? { ...prev, account } : prev));
    } catch {
      setState((prev) => (prev.user?.uid === user.uid ? { ...prev, account: 'error' } : prev));
    }
  };

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setState({ ready: true, user, account: user ? 'loading' : EMPTY });
    if (user) load(user);
  }), []);

  const value = useMemo(() => {
    const account = typeof state.account === 'object' ? state.account : EMPTY;
    const stage = !state.ready ? 'loading'
      : !state.user || signingUp ? 'login'
      : state.account === 'loading' ? 'loading'
      : state.account === 'error' ? 'error'
      : !account.onboarded || holdOnboarding ? 'onboarding'
      : 'app';

    const api = {
      stage,
      user: state.user,
      email: emailOf(state.user),
      member: account.member,
      profile: account.profile,

      async signIn({ email, password }) {
        const mail = normalizeEmail(email);
        if (mail.message) throw fail('email', mail.message);
        if (!password) throw fail('password', '비밀번호를 입력해 주세요.');
        try { await signInWithEmail({ email: mail.email, password }); } catch (e) { throw asFieldError(e); }
      },

      async signUp({ email, password, confirm, birthDate }) {
        const mail = normalizeEmail(email);
        if (mail.message) throw fail('email', mail.message);
        const pw = validatePassword(password, mail.email);
        if (pw) throw fail('password', pw);
        if (confirm !== undefined && confirm !== password) {
          throw fail('confirm', confirm ? '비밀번호가 서로 달라요.' : '비밀번호를 한 번 더 입력해 주세요.');
        }
        // 생년월일은 화면에서 받는 경우에만 확인합니다(현재 UI 시안에는 없음).
        const birth = birthDate ? validateBirthDate(birthDate) : '';
        if (birth) throw fail('birthDate', birth);
        setSigningUp(true);
        try { await signUpWithEmail({ email: mail.email, password, birthDate }); } catch (e) { throw asFieldError(e); }
        finally { setSigningUp(false); }
      },

      async completeOnboarding({ nickname, profile }) {
        const name = normalizeNickname(nickname);
        if (name.message) throw fail('nickname', name.message);
        if (!state.user) throw asFieldError({ code: 'auth/requires-recent-login' });
        const merged = { ...EMPTY_PROFILE, ...(profile || {}) };
        const diagnosis = diagnose(merged);
        try {
          await saveOnboarding(state.user.uid, { nickname: name.nickname, profile: merged, ruleVersion: diagnosis.rule_version });
        } catch (e) { throw asFieldError(e); }
        setHoldOnboarding(true);
        setState((prev) => ({ ...prev, account: { member: { nickname: name.nickname }, profile: merged, onboarded: true } }));
        return { nickname: name.nickname, profile: merged, diagnosis };
      },

      finishOnboarding: () => setHoldOnboarding(false),

      async updateProfile(changes) {
        if (!state.user) throw asFieldError({ code: 'auth/requires-recent-login' });
        const unknown = Object.keys(changes || {}).filter((k) => !(k in EMPTY_PROFILE));
        if (unknown.length) throw fail('form', `알 수 없는 항목이에요: ${unknown.join(', ')}`, 'validation/unknown-field');
        const before = { ...EMPTY_PROFILE, ...(account.profile || {}) };
        const next = { ...before, ...changes };
        try { await updateProfileData(state.user.uid, next); } catch (e) { throw asFieldError(e); }
        setState((prev) => (typeof prev.account === 'object' ? { ...prev, account: { ...prev.account, profile: next } } : prev));
        if (before.region_code !== next.region_code || before.region_name !== next.region_name) {
          await emitAccountEvent('regionChanged', {
            uid: state.user.uid,
            from: { code: before.region_code, name: before.region_name },
            to: { code: next.region_code, name: next.region_name },
          });
        }
        return next;
      },

      // 지역 검색 결과에서 고른 법정동 코드로 지역 저장 (AC-08·09). 이름은 '시도 시군구 동' 전체로 저장합니다.
      async setRegion(code) {
        if (code == null) return api.updateProfile({ region_code: null, region_name: null });
        const info = regionInfo(String(code));
        if (!info) throw fail('region', '지역을 목록에서 다시 선택해 주세요.', 'validation/region');
        return api.updateProfile({ region_code: info.code, region_name: info.label });
      },

      async checkNickname(nickname) {
        const name = normalizeNickname(nickname);
        if (name.message) return { status: 'invalid', message: name.message };
        if (!state.user) return { status: 'error', message: '로그인 후 확인할 수 있어요.' };
        try {
          const free = await isNicknameAvailable(state.user.uid, name.nickname);
          return free
            ? { status: 'available', message: '사용할 수 있는 닉네임이에요.' }
            : { status: 'taken', message: authErrorMessage('nickname/taken').message };
        } catch {
          return { status: 'error', message: '중복 확인을 하지 못했어요. 저장할 때 다시 확인해요.' };
        }
      },

      async updateNickname(nickname) {
        const name = normalizeNickname(nickname);
        if (name.message) throw fail('nickname', name.message);
        if (!state.user) throw asFieldError({ code: 'auth/requires-recent-login' });
        try { await changeNickname(state.user.uid, name.nickname); } catch (e) { throw asFieldError(e); }
        setState((prev) => (typeof prev.account === 'object'
          ? { ...prev, account: { ...prev.account, member: { ...(prev.account.member || {}), nickname: name.nickname } } } : prev));
        return name.nickname;
      },
      // 로그아웃 (AC-10): 다른 파트에 'logout' 이벤트로 캐시·개인 알림 정리를 맡긴 뒤 로그아웃하고, 화면 상태를 비웁니다.
      async logout() {
        const uid = state.user?.uid;
        if (uid) await emitAccountEvent('logout', { uid, reason: 'logout' });
        setHoldOnboarding(false);
        await signOutAccount();
      },
      async withdraw(password) {
        const uid = state.user?.uid;
        try { await withdrawAccount(password); } catch (e) { throw asFieldError(e); }
        if (uid) await emitAccountEvent('logout', { uid, reason: 'withdraw' });
        setHoldOnboarding(false);
      },
      reloadAccount: () => (auth.currentUser ? load(auth.currentUser) : Promise.resolve()),
    };
    return api;
  }, [state, signingUp, holdOnboarding]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
