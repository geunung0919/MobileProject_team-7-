
const {setGlobalOptions} = require("firebase-functions/v2");
const {onRequest} = require("firebase-functions/v2/https");

// Firebase 사용자 인증
const {verifyUser} = require("./middleware/auth");

// Firestore 사용자 프로필 관리
const {getProfile, saveProfile} = require("./modules/core/profile");

// 팀 공통 모듈
const core = require("./modules/core");
const finance = require("./modules/finance");
const refrigerator = require("./modules/refrigerator");
const sharing = require("./modules/sharing");
const map = require("./modules/map");
const emergency = require("./modules/emergency");

// 팀 공통 모듈 등록
const modules = [
  core,
  finance,
  refrigerator,
  sharing,
  map,
  emergency,
];

// Firebase Cloud Functions 기본 설정
setGlobalOptions({
  region: "asia-northeast3",
  maxInstances: 3,
});

// 팀 공통 HTTP API
exports.api = onRequest(
    {
      cors: true,
    },
    async (req, res) => {
      // 1. 서버 상태 확인
      if (req.method === "GET" && req.path === "/health") {
        return res.status(200).json({
          success: true,
          service: "solo-living-ai",
          status: "running",
          timestamp: new Date().toISOString(),
        });
      }

      // 2. 전체 모듈 조회
      if (req.method === "GET" && req.path === "/modules") {
        return res.status(200).json({
          success: true,
          count: modules.length,
          modules: modules,
        });
      }

      // 3. 개별 모듈 상태 확인
      const match = req.path.match(
          /^\/modules\/([a-z]+)\/status\/?$/,
      );

      if (req.method === "GET" && match) {
        const moduleId = match[1];

        const selectedModule = modules.find(
            (item) => item.id === moduleId,
        );

        if (!selectedModule) {
          return res.status(404).json({
            success: false,
            error: "등록되지 않은 모듈입니다.",
          });
        }

        return res.status(200).json({
          success: true,
          module: selectedModule,
        });
      }

      // 4. 로그인한 사용자 정보 확인
      if (req.method === "GET" && req.path === "/auth/me") {
        const user = await verifyUser(req, res);

        if (!user) {
          return;
        }

        return res.status(200).json({
          success: true,
          user: user,
        });
      }

      // 5. 내 프로필 조회
      if (req.method === "GET" && req.path === "/profile") {
        const user = await verifyUser(req, res);

        if (!user) {
          return;
        }

        try {
          const profile = await getProfile(user.uid);

          return res.status(200).json({
            success: true,
            profile: profile,
          });
        } catch (error) {
          console.error("Profile read failed:", error);

          return res.status(500).json({
            success: false,
            error: "프로필 조회 중 오류가 발생했습니다.",
          });
        }
      }

      // 6. 내 프로필 저장 및 수정
      if (req.method === "PUT" && req.path === "/profile") {
        const user = await verifyUser(req, res);

        if (!user) {
          return;
        }

        const nickname = req.body && req.body.nickname;

        // 닉네임 입력값 검증
        if (
          typeof nickname !== "string" ||
          nickname.trim().length === 0 ||
          nickname.trim().length > 30
        ) {
          return res.status(400).json({
            success: false,
            error: "닉네임은 1~30자 사이여야 합니다.",
          });
        }

        try {
          const profile = await saveProfile(
              user.uid,
              user.email,
              nickname.trim(),
          );

          return res.status(200).json({
            success: true,
            profile: profile,
          });
        } catch (error) {
          console.error("Profile save failed:", error);

          return res.status(500).json({
            success: false,
            error: "프로필 저장 중 오류가 발생했습니다.",
          });
        }
      }

      // 7. 정의되지 않은 API
      return res.status(404).json({
        success: false,
        error: "존재하지 않는 API 경로입니다.",
      });
    },
);
