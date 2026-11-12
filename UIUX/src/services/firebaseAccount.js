import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { requireFirebase, getFirebase } from './firebase';
import { loginIdToEmail, emailToLoginId } from '../utils/authRules';
import { nicknameKey } from '../utils/nickname';
import { regionInfo } from '../utils/regions';
import { diagnoseOnboarding } from '../utils/diagnosis';

// 아이디·비밀번호 계정(Firebase Authentication + Firestore).
// Firestore 구조 (팀 보고서 제안과 같음):
//   users/{uid}           { account: {login_id, birth_date, created_at}, member: {nickname, nickname_key, region_code, updated_at}, profile: {...온보딩} }
//   nicknames/{닉네임 키}  { uid }  ← 닉네임 중복을 막는 선점 문서 (Firestore 에는 유일 제약이 없음)
const userRef = (db, uid) => doc(db, 'users', uid);
const nicknameRef = (db, key) => doc(db, 'nicknames', key);

const toSession = (user) => ({ firebase: true, userId: user.uid, loginId: emailToLoginId(user.email) || '' });

export async function signUpWithId({ loginId, password, birthDate }) {
  const { auth, db } = requireFirebase();
  const credential = await createUserWithEmailAndPassword(auth, loginIdToEmail(loginId), password);
  try {
    await setDoc(userRef(db, credential.user.uid), {
      account: { login_id: loginId, birth_date: birthDate, created_at: serverTimestamp() },
    }, { merge: true });
  } catch (e) {
    // 계정 정보 저장에 실패하면 반쯤 만들어진 로그인 계정을 지우고 처음부터 다시 하게 합니다.
    await deleteUser(credential.user).catch(() => {});
    throw e;
  }
  return toSession(credential.user);
}

export async function signInWithId({ loginId, password }) {
  const { auth } = requireFirebase();
  const credential = await signInWithEmailAndPassword(auth, loginIdToEmail(loginId), password);
  return toSession(credential.user);
}

// 앱을 다시 열었을 때: Firebase 가 기억하는 로그인 사용자 (없으면 null)
export async function currentFirebaseSession() {
  const fb = getFirebase();
  if (!fb) return null;
  await fb.auth.authStateReady();
  return fb.auth.currentUser ? toSession(fb.auth.currentUser) : null;
}

export async function loadFirebaseAccount(uid) {
  const { db } = requireFirebase();
  const snap = await getDoc(userRef(db, uid));
  const data = snap.exists() ? snap.data() : {};
  const member = data.member?.nickname
    ? { nickname: data.member.nickname, region: regionInfo(data.member.region_code ?? null) } : null;
  const profile = data.profile || null;
  return { member, profile, diagnosis: profile ? diagnoseOnboarding(profile) : null };
}

export async function isNicknameFree(uid, nickname) {
  const { db } = requireFirebase();
  const snap = await getDoc(nicknameRef(db, nicknameKey(nickname)));
  return !snap.exists() || snap.data().uid === uid;
}

// 닉네임·지역 저장. 닉네임 선점 문서와 회원 정보를 한 트랜잭션으로 바꿔 동시 가입에서도 중복을 막습니다.
export async function saveFirebaseMember(uid, { nickname, region_code }) {
  const { db } = requireFirebase();
  const key = nicknameKey(nickname);
  return runTransaction(db, async (tx) => {
    const user = await tx.get(userRef(db, uid));
    const claimed = await tx.get(nicknameRef(db, key));
    if (claimed.exists() && claimed.data().uid !== uid) {
      const error = new Error('이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.');
      error.code = 'nickname/taken';
      throw error;
    }
    const before = user.exists() ? user.data() : {};
    const oldKey = before.member?.nickname_key;
    if (!claimed.exists()) tx.set(nicknameRef(db, key), { uid });
    if (oldKey && oldKey !== key) tx.delete(nicknameRef(db, oldKey));
    const next = { member: { nickname, nickname_key: key, region_code: region_code ?? null, updated_at: serverTimestamp() } };
    if (before.profile) next.profile = { ...before.profile, region_code: region_code ?? null };
    tx.set(userRef(db, uid), next, { merge: true });
    return { nickname, region: regionInfo(region_code ?? null), region_changed: (before.member?.region_code ?? null) !== (region_code ?? null) };
  });
}

export async function saveFirebaseProfile(uid, profile) {
  const { db } = requireFirebase();
  await setDoc(userRef(db, uid), { profile }, { merge: true });
  return { profile, diagnosis: diagnoseOnboarding(profile) };
}

export async function signOutFirebase() {
  const fb = getFirebase();
  if (fb) await signOut(fb.auth);
}

// 회원 탈퇴: 비밀번호로 다시 인증 → 닉네임 선점 문서·회원 문서 삭제 → 로그인 계정 삭제.
// 다른 모듈이 users/{uid} 아래에 만든 하위 컬렉션은 앱에서 지울 수 없어서 Cloud Function 이 필요합니다(팀 확인 필요).
export async function withdrawFirebase(password) {
  const { auth, db } = requireFirebase();
  const user = auth.currentUser;
  if (!user) { const e = new Error('로그인이 필요해요.'); e.code = 'auth/requires-recent-login'; throw e; }
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  const snap = await getDoc(userRef(db, user.uid));
  const key = snap.exists() ? snap.data().member?.nickname_key : null;
  if (key) await deleteDoc(nicknameRef(db, key));
  await deleteDoc(userRef(db, user.uid));
  await deleteUser(user);
}
