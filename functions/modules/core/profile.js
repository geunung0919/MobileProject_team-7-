
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

// Firestore 사용자 컬렉션
const usersCollection = () => {
  return getFirestore().collection("users");
};

// 사용자 프로필 조회
const getProfile = async (uid) => {
  const doc = await usersCollection().doc(uid).get();

  if (!doc.exists) {
    return null;
  }

  return {
    uid: doc.id,
    ...doc.data(),
  };
};

// 사용자 프로필 저장 및 수정
const saveProfile = async (uid, email, nickname) => {
  const userRef = usersCollection().doc(uid);
  const snapshot = await userRef.get();

  const profileData = {
    email: email || null,
    nickname: nickname,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // 최초 등록 시에만 생성일 기록
  if (!snapshot.exists) {
    profileData.createdAt = FieldValue.serverTimestamp();
  }

  await userRef.set(profileData, {merge: true});

  return getProfile(uid);
};

module.exports = {
  getProfile,
  saveProfile,
};
