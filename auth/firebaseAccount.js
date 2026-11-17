import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { nicknameKey } from './nickname';

// 이메일·비밀번호 계정 (Firebase Authentication + Firestore). 1번 모듈(회원) 담당.
// 이메일 인증 메일 발송은 아직 하지 않습니다(필요하면 sendEmailVerification 추가).
// Firestore 구조:
//   users/{uid}            { account: {email, birth_date, created_at},        ← 회원가입
//                            member: {nickname, nickname_key, updated_at},     ← 온보딩 1단계(닉네임)
//                            profile: {living_months, priority, ...},           ← 온보딩 2~4단계
//                            onboarding: {completed_at, rule_version} }
//   nicknames/{닉네임 키}   { uid }   ← 닉네임 중복 방지용 선점 문서 (Firestore 에는 유일 제약이 없음)
// 다른 모듈은 users/{uid} 의 다른 필드나 하위 컬렉션을 쓰면 되고, account·member 는 이 파일만 씁니다.
const userRef = (uid) => doc(db, 'users', uid);
const nicknameRef = (key) => doc(db, 'nicknames', key);

// 인터넷이 끊기면 Firestore 는 계속 재시도하므로, 가입 화면이 멈추지 않게 시간 제한을 둡니다.
const SAVE_TIMEOUT_MS = 15000;
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('회원 정보 저장 시간이 초과됐어요.');
      error.code = 'auth/network-request-failed';
      reject(error);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export const emailOf = (user) => user?.email || '';

function nicknameTaken() {
  const error = new Error('이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.');
  error.code = 'nickname/taken';
  return error;
}

// 가입: 로그인 계정 생성 → 계정 정보(이메일·생년월일) 저장. 닉네임은 온보딩 1단계에서 받습니다.
// 저장에 실패하면 방금 만든 로그인 계정을 지워서, 같은 이메일로 처음부터 다시 가입할 수 있게 합니다.
export async function signUpWithEmail({ email, password, birthDate }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await withTimeout(setDoc(userRef(credential.user.uid), {
      account: { email, birth_date: birthDate || null, created_at: serverTimestamp() },
    }, { merge: true }), SAVE_TIMEOUT_MS);
  } catch (e) {
    await deleteUser(credential.user).catch(() => {});
    throw e;
  }
  return credential.user;
}

// 온보딩 저장: (한 트랜잭션) 닉네임 선점·변경 + 회원 정보 + 생활 정보.
// 닉네임을 바꾸면 예전 선점 문서를 지웁니다. 같은 닉네임을 다른 사람이 쓰고 있으면 nickname/taken 오류.
export async function saveOnboarding(uid, { nickname, profile, ruleVersion }) {
  await claimNickname(uid, nickname, {
    profile,
    onboarding: { completed_at: serverTimestamp(), rule_version: ruleVersion },
  });
}

// 닉네임만 바꾸기 (생활 데이터 수정·마이페이지)
export async function changeNickname(uid, nickname) {
  await claimNickname(uid, nickname, {});
}

// 생활 정보만 바꾸기 (생활 데이터 수정). profile 은 전체를 넘깁니다(빠진 항목이 지워지지 않게 화면에서 기존 값과 합쳐서).
export async function updateProfileData(uid, profile) {
  await withTimeout(setDoc(userRef(uid), { profile, profile_updated_at: serverTimestamp() }, { merge: true }), SAVE_TIMEOUT_MS);
}

// 한 트랜잭션: 새 닉네임 선점 → 예전 선점 문서 삭제 → 회원 정보(+추가 필드) 저장
async function claimNickname(uid, nickname, extra) {
  const key = nicknameKey(nickname);
  await withTimeout(runTransaction(db, async (tx) => {
    const user = await tx.get(userRef(uid));
    const claimed = await tx.get(nicknameRef(key));
    if (claimed.exists() && claimed.data().uid !== uid) throw nicknameTaken();
    const oldKey = user.exists() ? user.data().member?.nickname_key : null;
    if (!claimed.exists()) tx.set(nicknameRef(key), { uid });
    if (oldKey && oldKey !== key) tx.delete(nicknameRef(oldKey));
    tx.set(userRef(uid), {
      member: { nickname, nickname_key: key, updated_at: serverTimestamp() },
      ...extra,
    }, { merge: true });
  }), SAVE_TIMEOUT_MS);
}

export async function signInWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// 회원 정보와 생활 정보. 온보딩을 끝내지 않았으면 onboarded=false.
export async function loadAccount(uid) {
  const snap = await getDoc(userRef(uid));
  const data = snap.exists() ? snap.data() : {};
  return {
    member: data.member?.nickname ? { nickname: data.member.nickname } : null,
    profile: data.profile || null,
    onboarded: Boolean(data.onboarding?.completed_at && data.member?.nickname),
  };
}

export const signOutAccount = () => signOut(auth);

// 회원 탈퇴: 비밀번호로 다시 인증 → 닉네임 선점 문서·회원 문서 삭제 → 로그인 계정 삭제.
// 다른 모듈이 users/{uid} 아래에 만든 하위 컬렉션(소비·냉장고 등)은 로그인 계정이 지워질 때
// Cloud Function(functions/modules/core/accountCleanup.js)이 모두 지웁니다.
export async function withdrawAccount(password) {
  const user = auth.currentUser;
  if (!user) { const e = new Error('로그인이 필요해요.'); e.code = 'auth/requires-recent-login'; throw e; }
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  const snap = await getDoc(userRef(user.uid));
  const key = snap.exists() ? snap.data().member?.nickname_key : null;
  if (key) await deleteDoc(nicknameRef(key));
  await deleteDoc(userRef(user.uid));
  await deleteUser(user);
}
