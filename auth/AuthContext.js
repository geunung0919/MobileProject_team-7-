import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import {
  loginIdOf, loadAccount, signOutAccount, signUpWithId, signInWithId, saveOnboarding, withdrawAccount,
  updateProfileData, changeNickname,
} from './firebaseAccount';
import { normalizeLoginId, validatePassword, validateBirthDate, authErrorMessage } from './authRules';
import { normalizeNickname } from './nickname';
import { diagnose, EMPTY_PROFILE } from './onboardingRules';

// 회원·온보딩 기능 (1번 모듈). 화면(UI)은 담지 않고, 화면에서 부를 함수와 상태만 제공합니다.
//
//   const auth = useAuth();
//   auth.stage                     'loading' | 'login' | 'onboarding' | 'app' | 'error'  ← 어떤 화면을 보여 줄지
//   auth.signIn({loginId, password})                      → 실패 시 throw (error.field, error.message 포함)
//   auth.signUp({loginId, password, confirm, birthDate})  → 실패 시 throw (error.field, error.message 포함)
//   auth.completeOnboarding({nickname, profile})          → 저장 후 {nickname, profile, diagnosis} 반환
//   auth.finishOnboarding()        결과 화면에서 [시작하기]를 누를 때 → stage 가 'app' 으로
//   auth.updateProfile(changes)    생활 데이터 수정: 바꾼 항목만 넘기면 기존 값과 합쳐 저장 → 새 profile 반환
//   auth.updateNickname(nickname)  닉네임만 변경 (중복이면 field='nickname' 오류)
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

    return {
      stage,
      user: state.user,
      loginId: loginIdOf(state.user),
      member: account.member,
      profile: account.profile,

      async signIn({ loginId, password }) {
        if (!String(loginId || '').trim()) throw fail('loginId', '아이디를 입력해 주세요.');
        if (!password) throw fail('password', '비밀번호를 입력해 주세요.');
        const id = normalizeLoginId(loginId).id;
        // 형식이 틀린 아이디도 "없는 아이디"라고 따로 알리지 않습니다(계정 존재 여부 노출 방지).
        if (!id) throw asFieldError({ code: 'auth/invalid-credential' });
        try { await signInWithId({ loginId: id, password }); } catch (e) { throw asFieldError(e); }
      },

      async signUp({ loginId, password, confirm, birthDate }) {
        const id = normalizeLoginId(loginId);
        if (id.message) throw fail('loginId', id.message);
        const pw = validatePassword(password, id.id);
        if (pw) throw fail('password', pw);
        if (confirm !== undefined && confirm !== password) {
          throw fail('confirm', confirm ? '비밀번호가 서로 달라요.' : '비밀번호를 한 번 더 입력해 주세요.');
        }
        const birth = validateBirthDate(birthDate);
        if (birth) throw fail('birthDate', birth);
        setSigningUp(true);
        try { await signUpWithId({ loginId: id.id, password, birthDate }); } catch (e) { throw asFieldError(e); }
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
        const next = { ...EMPTY_PROFILE, ...(account.profile || {}), ...changes };
        try { await updateProfileData(state.user.uid, next); } catch (e) { throw asFieldError(e); }
        setState((prev) => (typeof prev.account === 'object' ? { ...prev, account: { ...prev.account, profile: next } } : prev));
        return next;
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
      logout: signOutAccount,
      async withdraw(password) {
        try { await withdrawAccount(password); } catch (e) { throw asFieldError(e); }
      },
      reloadAccount: () => (auth.currentUser ? load(auth.currentUser) : Promise.resolve()),
    };
  }, [state, signingUp, holdOnboarding]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
