const {getFirestore} = require("firebase-admin/firestore");

// 회원 탈퇴 정리 (1번 모듈). 로그인 계정이 삭제되면 그 사람의 데이터를 모두 지웁니다.
// - users/{uid} 문서와 그 아래 하위 컬렉션 전체
//   (소비 transactions, 영수증 receipts, 냉장고 fridgeItems 등)
// - nicknames 의 본인 닉네임 선점 문서
// 앱에서 먼저 지운 경우에도 다시 실행해도 안전합니다(없는 문서는 건너뜀).
// users/{uid} 밖에 사용자 데이터를 두는 모듈이 생기면 여기에 함께 추가해야 합니다.
const cleanupUserData = async (uid, db = getFirestore()) => {
  if (typeof uid !== "string" || !uid) {
    throw new Error("uid 가 필요합니다.");
  }
  const claims = await db.collection("nicknames").where("uid", "==", uid).get();
  await Promise.all(claims.docs.map((doc) => doc.ref.delete()));
  await db.recursiveDelete(db.collection("users").doc(uid));
  return {uid, nicknamesDeleted: claims.docs.length};
};

module.exports = {cleanupUserData};
