const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {normalizeNickname, nicknameKey} = require("./nickname");

// 회원 정보 (1번 모듈: 중앙 코어). 앱(auth/firebaseAccount.js)과 같은 Firestore 구조를 씁니다.
//   users/{uid}  { account, member: {nickname, nickname_key, updated_at},
//                  profile, onboarding }
//   nicknames/{닉네임 키}  { uid }   ← 닉네임 중복 방지
// db 는 테스트에서 바꿔 끼울 수 있게 인자로 받습니다.

const codedError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

// 사용자 프로필 조회 (없으면 null)
const getProfile = async (uid, db = getFirestore()) => {
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  return {
    uid: doc.id,
    ...data,
    nickname: (data.member && data.member.nickname) || data.nickname || null,
    onboarded: Boolean(data.onboarding && data.onboarding.completed_at),
  };
};

// 닉네임 저장·변경. 규칙 위반: code 'nickname/invalid', 다른 사람이 사용 중: code 'nickname/taken'
const saveProfile = async (uid, email, rawNickname, db = getFirestore()) => {
  const {nickname, message} = normalizeNickname(rawNickname);
  if (!nickname) {
    throw codedError("nickname/invalid", message);
  }
  const key = nicknameKey(nickname);
  const userRef = db.collection("users").doc(uid);
  const claimRef = db.collection("nicknames").doc(key);

  await db.runTransaction(async (tx) => {
    const user = await tx.get(userRef);
    const claimed = await tx.get(claimRef);
    if (claimed.exists && claimed.data().uid !== uid) {
      throw codedError(
          "nickname/taken",
          "이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.",
      );
    }
    const member = user.exists ? user.data().member : null;
    const oldKey = member ? member.nickname_key : null;
    if (!claimed.exists) {
      tx.set(claimRef, {uid});
    }
    if (oldKey && oldKey !== key) {
      tx.delete(db.collection("nicknames").doc(oldKey));
    }
    tx.set(userRef, {
      member: {
        nickname,
        nickname_key: key,
        updated_at: FieldValue.serverTimestamp(),
      },
    }, {merge: true});
  });

  return getProfile(uid, db);
};

module.exports = {
  getProfile,
  saveProfile,
};
