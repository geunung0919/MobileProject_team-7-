
const {initializeApp, getApps} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");

// Firebase Admin SDK 초기화
if (getApps().length === 0) {
  initializeApp();
}

// Firebase ID 토큰을 검증하는 공통 함수
const verifyUser = async (req, res) => {
  const authorization = req.headers.authorization;

  // 토큰이 없는 경우
  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "로그인이 필요합니다.",
    });
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      error: "인증 토큰이 없습니다.",
    });
    return null;
  }

  try {
    // Firebase Authentication 토큰 검증
    const decodedToken = await getAuth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "유효하지 않은 인증 토큰입니다.",
    });
    return null;
  }
};

module.exports = {verifyUser};
