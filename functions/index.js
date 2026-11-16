
const {setGlobalOptions} = require("firebase-functions/v2");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

// Firebase 사용자 인증
const {verifyUser} = require("./middleware/auth");

// Firestore 사용자 프로필 관리
const {getProfile, saveProfile} = require("./modules/core/profile");

// 지도·생활정보 API
const {
  handlePlacesRequest,
} = require("./modules/map/placesHandler");

// Google Places API 키 (비밀정보)
// 실제 API 키 값은 이 파일에 작성하지 않습니다.
const placesApiKey = defineSecret("PLACES_API_KEY");

// 팀 공통 모듈
const core = require("./modules/core");
const finance = require("./modules/finance");
const refrigerator = require("./modules/refrigerator");
const sharing = require("./modules/sharing");
const map = require("./modules/map");
const emergency = require("./modules/emergency");
const ai = require("./modules/ai");

// 팀 공통 모듈 등록
const modules = [
  core,
  finance,
  refrigerator,
  sharing,
  map,
  emergency,
  ai,
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
      secrets: [placesApiKey],
    },
    async (req, res) => {
      // ====================================
      // 1. 서버 상태 확인
      // ====================================
      if (
        req.method === "GET" &&
        req.path === "/health"
      ) {
        return res.status(200).json({
          success: true,
          service: "solo-living-ai",
          status: "running",
          timestamp: new Date().toISOString(),
        });
      }

      // ====================================
      // 2. 전체 모듈 조회
      // ====================================
      if (
        req.method === "GET" &&
        req.path === "/modules"
      ) {
        return res.status(200).json({
          success: true,
          count: modules.length,
          modules: modules,
        });
      }

      // ====================================
      // 3. 개별 모듈 상태 확인
      // ====================================
      const match = req.path.match(
          /^\/modules\/([a-z]+)\/status\/?$/,
      );

      if (
        req.method === "GET" &&
        match
      ) {
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

      // ====================================
      // 4. 지도·생활정보 API
      // ====================================
      const placesPaths = [
        "/places/nearby",
        "/places/search",
        "/places/details",
        "/places/address-search",
      ];

      if (placesPaths.includes(req.path)) {
        // 현재 지도 API는 GET만 지원
        if (req.method !== "GET") {
          return res.status(404).json({
            error: "요청한 주소가 없습니다.",
          });
        }

        // Firebase 로그인 사용자 검증
        const user = await verifyUser(req, res);

        if (!user) {
          return;
        }

        // 기존 Node.js 지도 서버와 동일한
        // 요청·응답 구조를 유지하는 처리기
        return handlePlacesRequest(
            req,
            res,
            placesApiKey.value(),
        );
      }

      // ====================================
      // 5. 로그인한 사용자 정보 확인
      // ====================================
      if (
        req.method === "GET" &&
        req.path === "/auth/me"
      ) {
        const user = await verifyUser(req, res);

        if (!user) {
          return;
        }

        return res.status(200).json({
          success: true,
          user: user,
        });
      }

      // ====================================
      // 6. 내 프로필 조회
      // ====================================
      if (
        req.method === "GET" &&
        req.path === "/profile"
      ) {
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
          console.error(
              "Profile read failed:",
              error,
          );

          return res.status(500).json({
            success: false,
            error: "프로필 조회 중 오류가 발생했습니다.",
          });
        }
      }

      // ====================================
      // 7. 내 프로필 저장 및 수정
      // ====================================
      if (
        req.method === "PUT" &&
        req.path === "/profile"
      ) {
        const user = await verifyUser(req, res);

        if (!user) {
          return;
        }

        const nickname = req.body && req.body.nickname;

        // 닉네임 규칙(2~12자, 한글·영문·숫자)과 중복 검사는 saveProfile 이 합니다.
        try {
          const profile = await saveProfile(
              user.uid,
              user.email,
              nickname,
          );

          return res.status(200).json({
            success: true,
            profile: profile,
          });
        } catch (error) {
          if (error.code === "nickname/invalid") {
            return res.status(400).json({
              success: false,
              field: "nickname",
              error: error.message,
            });
          }
          if (error.code === "nickname/taken") {
            return res.status(409).json({
              success: false,
              field: "nickname",
              error: error.message,
            });
          }
          console.error(
              "Profile save failed:",
              error,
          );

          return res.status(500).json({
            success: false,
            error: "프로필 저장 중 오류가 발생했습니다.",
          });
        }
      }

      // ====================================
      // 8. 정의되지 않은 API
      // ====================================
      return res.status(404).json({
        success: false,
        error: "존재하지 않는 API 경로입니다.",
      });
    },
);

// 회원 탈퇴 정리: 로그인 계정이 삭제되면 users/{uid} 전체(하위 컬렉션 포함)와 닉네임 선점 문서를 지웁니다.
const functionsV1 = require("firebase-functions/v1");
const {cleanupUserData} = require("./modules/core/accountCleanup");

exports.cleanupDeletedUser = functionsV1
    .region("asia-northeast3")
    .auth.user()
    .onDelete(async (user) => {
      const result = await cleanupUserData(user.uid);
      console.log("Deleted user data cleaned:", result);
    });
