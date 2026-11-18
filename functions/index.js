
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
        const region = req.body?.region;
        if (region !== undefined &&
            (typeof region !== "string" || region.trim().length > 100)) {
          return res.status(400).json({error: "거주 지역을 확인해 주세요."});
        }

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
              region?.trim(),
          );

          return res.status(200).json({
            success: true,
            profile: profile,
          });
        } catch (error) {
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

      if (req.path === "/finance/budget" || req.path === "/routines" ||
          req.path === "/onboarding") {
        const user = await verifyUser(req, res);
        if (!user) return;
        const {getFirestore} = require("firebase-admin/firestore");
        try {
          const handler = req.path === "/finance/budget" ?
            require("./modules/finance/budgets").handleBudget :
            req.path === "/onboarding" ?
              require("./modules/core/onboarding").handleOnboarding :
              require("./modules/routines").handleRoutines;
          return await handler(getFirestore(), user.uid, req, res);
        } catch (error) {
          console.error("Shared finance or routine request failed", {
            path: req.path, code: error.code, message: error.message,
          });
          return res.status(503).json({error: "서버 연결을 확인해 주세요."});
        }
      }

      if (req.path === "/refrigerator/items/change" && req.method === "POST") {
        const user = await verifyUser(req, res);
        if (!user) return;
        const {getFirestore} = require("firebase-admin/firestore");
        const {changeFridgeItem} = require(
            "./modules/refrigerator/manualItems");
        try {
          return res.json(await changeFridgeItem(getFirestore(), user.uid,
              req.body));
        } catch (error) {
          return res.status(error.status || 503).json({
            error: error.status ? error.message : "저장소를 확인해 주세요.",
          });
        }
      }

      if (req.path === "/finance/receipts/confirm" ||
          req.path === "/finance/transactions" ||
          req.path === "/refrigerator/items") {
        const user = await verifyUser(req, res);
        if (!user) return;
        const {getFirestore} = require("firebase-admin/firestore");
        const db = getFirestore();
        try {
          if ((req.path === "/finance/receipts/confirm" ||
              req.path === "/finance/transactions") && req.method === "POST") {
            const {confirmReceipt} = require("./modules/finance/receipts");
            const source = req.path === "/finance/transactions" ?
              (req.body?.source ?? "manual") : "ocr";
            const result = await confirmReceipt(db, user.uid,
                {...req.body, source});
            return res.status(result.replayed ? 200 : 201).json(result);
          }
          if (req.path === "/refrigerator/items" && req.method === "POST") {
            const {createManualItem} = require(
                "./modules/refrigerator/manualItems");
            const result = await createManualItem(db, user.uid, req.body);
            return res.status(result.replayed ? 200 : 201).json(result);
          }
          if (req.method === "GET" &&
              req.path !== "/finance/receipts/confirm") {
            const collection = req.path === "/finance/transactions" ?
              "transactions" : "fridgeItems";
            const snapshot = await db
                .collection(`users/${user.uid}/${collection}`);
            const records = await (collection === "transactions" ?
              snapshot.orderBy("date", "desc") : snapshot).limit(501).get();
            return res.json({items: records.docs.slice(0, 500).map((doc) =>
              ({...doc.data(), id: doc.id})),
            limit: 500, possiblyTruncated: records.size > 500});
          }
          return res.status(405).json({error: "지원하지 않는 메서드입니다."});
        } catch (error) {
          return res.status(error.status || 503).json({
            error: error.status ?
              error.message : "저장소 연결을 확인해 주세요.",
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
