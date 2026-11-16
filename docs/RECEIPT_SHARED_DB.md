# 영수증·소비·냉장고 공통 DB 연결 (구현 및 남은 작업)

## 기준
- integration/full-app-20261114의 functions/index.js 공통 HTTP api에 추가.
- 프로젝트 solo-living-ai, 리전 asia-northeast3, 기본 Firestore.
- 배포된 코드와 이 Git 브랜치가 동일한지는 확인되지 않았다.
- 첨부 ZIP에는 API_DB_SPEC.md가 없었다. COMMON_DB_CHANGES.md와 receiptInventory.mjs를 비교했다.
- 실제 클라우드 로그인/배포/DB 저장은 아직 미검증. 루트 Expo 앱에서 기능을 켜면 연결된 화면을 열 수 있다.

## 구현 API
모든 경로는 api 함수 URL 기준. Authorization: Bearer <Firebase ID token> 필수.
서버 verifyUser가 검증한 UID만 사용하며 본문의 UID는 사용하지 않는다.

|메서드|경로|응답|
|---|---|---|
|POST|/finance/receipts/confirm|201 신규 저장, 200 동일 영수증 재시도|
|POST|/finance/transactions|직접 입력. 영수증 확정과 같은 구매 데이터 형식 사용, 서버가 source=manual 지정 (201/200)|
|POST|/refrigerator/items|식재료 직접 등록. 소비 기록은 만들지 않음 (201/200)|
|GET|/finance/transactions|{items: [...], limit: 500, possiblyTruncated: boolean}|
|GET|/refrigerator/items|{items: [...], limit: 500, possiblyTruncated: boolean}|

조회는 최대 500건이며 정렬·기간·페이지 이동은 아직 없다. 전체 월 합계 계산에 이 제한 목록을 사용하지 않는다.
검증 실패422, 같은 ID 다른 내용409, 인증 실패401, 저장소 오류503.

```json
{
  "requestId": "save-001",
  "receiptId": "receipt-001",
  "title": "마트",
  "purchasedAt": "2026-11-15",
  "amount": 5000,
  "items": [
    {"receiptItemId":"line-001","rawName":"우유900ML","name":"우유",
     "itemType":"ingredient","reviewStatus":"confirmed","inventorySelected":true,
     "quantity":2,"unit":"팩","linePaidAmount":3000,
     "storageMethod":"refrigerated","dateType":"unknown","expiresAt":null},
    {"receiptItemId":"line-002","name":"사과주스","itemType":"other",
     "reviewStatus":"confirmed","inventorySelected":false,"linePaidAmount":2000}
  ]
}
```

- ID는 영문/숫자/하이픈/밑줄, 1~80자. 화면 순서 변경·저장 재시도 시 ID 유지.
- expenseId와 inventoryId는 서버에서 결정. 같은 영수증 ID를 다시 보내면 기존 결과 반환.
- 품목 reviewStatus confirmed 필수. AI 결과를 확인 없이 confirmed로 바꾸지 않는다.
- itemType ingredient/prepared_food/household/other/unknown. 자동 냉장고 등록은 ingredient만.
- quantity는 구매 팩 수가 아니라 사용자가 확인한 재고량. 포장 수로 g/ml를 추측하지 않는다.
- unit g/ml/개/팩. kg/L 입력 정규화는 호출 전에 정확한 배율로 처리.
- linePaidAmount는 해당 줄 전체 할인 후 결제액(원 정수) 또는 null. 단가와 다르다.
- 품목 금액 합계가 결제액보다 크면 거부. 부족한 차액은 미분류 금액으로 남기며 임의 배분하지 않는다.
- 구매일은 YYYY-MM-DD, 한국 현재 날짜 이후 거부.
- storageMethod refrigerated/frozen/room.
- dateType package/reference/unknown. unknown은 expiresAt null. 표시 소비기한과 보관 참고일 구분.
- 냉장고 remainingCost는 사용하면서 줄어들 수 있으나 영수증 linePaidAmount는 보존.

## 저장 경로
사용자별 users/{uid} 아래:
- transactions/{expenseId}: 소비. amount/date/title/category/items (기존 AI 소비 조회와 일치).
- receipts/{receiptId}: 확인 영수증, payload digest, 저장 결과.
- receipts/{receiptId}/items/{receiptItemId}: 품목별 확인 정보.
- fridgeItems/{inventoryId}: 재고, sourceReceiptId/sourceReceiptItemId/sourceExpenseId, version.
- receiptInventoryLinks/{inventoryId}: 삭제/소진 후에도 유지하는 출처 연결.
- importRequests/{requestId}: 소비·영수증 요청 내용 digest와 결과.
- fridgeRequests/{id}: 식재료 직접 등록 중복 방지. 재고 소진·삭제 후에도 유지한다.

저장 한 건에 필요한 문서는 각각 하나의 Firestore transaction으로 create한다. 소비만 저장되고 재고 저장이 실패하는 부분 성공을 방지한다.
서버는 읽기를 모두 끝낸 뒤 쓴다. 영수증 보존 기록으로 동시 요청과 재고 소진 후 재시도를 처리한다.
영수증/요청/연결 기록을 임의 삭제하지 않는다. 다른 receiptId로 같은 사진을 재업로드하는 중복 감지는 아직 미구현.
반품·소비 수정·부분 재고 추가 등록은 별도 작업 API가 필요하며 현재 confirm은 최초 확정만 지원한다.

## AI 호환
ai_manager/functions/src/adapters.ts:
- 새 confirmed 품목은 ingredient/prepared_food의 linePaidAmount를 식비로 사용한다.
- 냉장고 선택 여부로 식비를 결정하지 않는다.
- 재고 purchasedAt/expiresAt을 읽으며 기존 purchaseDate/expiry도 계속 지원.
- 알려지지 않은 품목 금액은 식비에 추정 추가하지 않는다(따라서 식비는 일부 누락 가능).

## Expo Go 없이 웹에서 확인

저장 API 배포가 완료된 뒤 저장소 루트에서 `npm ci`, `npm run receipt:web`을 실행한다.
이 명령은 `solo-living-ai`의 배포된 API를 연결한 소비·냉장고 웹 화면을 띄운다.
PC는 터미널에 나온 웹 주소를 연다. 아이폰 Safari로 열려면 PC 서버를 켠 채 같은 Wi-Fi에서
터미널의 `Metro waiting on` 주소 중 `exp://`를 `http://`로 바꿔 접속한다.
개발 서버의 LAN 주소이므로 공개 Wi-Fi에서는 사용하지 않는다.
첫 검증은 로그인 후 사진 없이 **소비 → 서버 소비 기록 → 소비 직접 입력**을 이용한다. 냉장고에서 별도 **식재료 추가 → 서버에 저장**도 확인한다. 두 직접 입력 기능은 해당 서버 코드가 배포된 이후 동작한다.

## 앱에서 확인하는 순서
루트 `.env.local`에 다음을 설정하고 루트에서 `npm ci`, `npx expo start --clear`를 실행한다. 개발 클라이언트는 새 네이티브 패키지가 들어간 빌드가 필요할 수 있다.

```dotenv
EXPO_PUBLIC_SHARED_RECEIPTS=true
EXPO_PUBLIC_FIREBASE_TARGET=cloud
EXPO_PUBLIC_CLOUD_API_BASE_URL=https://<팀 api 함수 URL>
# 선택: main의 OCR 파이프라인을 별도로 실행
EXPO_PUBLIC_RECEIPT_OCR_BASE_URL=http://<개발 PC의 LAN IP>:8000
```

1. 소비 탭 → 로그인 → 소비 화면 복귀 → 영수증 저장.
2. 구매일·실제 결제 금액 확인. 우유는 식재료로 분류하고 냉장고 등록을 선택. 사과주스는 소비만 저장.
3. 실제 수량·단위·보관 방법을 입력. 기한을 모르면 미입력.
4. 저장 후 소비·냉장고의 서버 목록 확인. 기존 로컬 시연 데이터와 분리해 읽기 전용으로 표시한다.
5. 응답이 끊기면 같은 요청으로 재시도. 앱은 계정별로 대기 중인 확인 데이터를 보관한다.

클라우드 대상은 새 함수가 배포된 뒤에 저장 가능. 콘솔 관리자 계정과 앱 로그인 계정은 별도다.
OCR은 `main`의 `jachwi-core` 서버를 별도 실행하고 `jachwi-core/docs/RECEIPT_OCR.md`의 설정을 따른다. 개발 실행에서만 촬영·사진첩 입력이 나타난다. 화면에서 OCR 서버의 개발 토큰을 입력한다. 인식된 줄 금액은 참고로만 보여 주며 할인 반영 여부를 확인해 입력한다. OCR fingerprint가 같은 경우 영수증 ID를 재사용한다. 재촬영으로 분석 결과가 달라지면 중복 감지가 보장되지 않는다.

첨부 냉장고 초안은 식품 기한 미입력을 거부한다. 그 모듈로 이동할 때 unknown/null 수용과 저장 경로를 맞춘다. 기존 로컬 예산과 샘플 목록은 팀 공통 DB와 아직 통합되지 않았다. 서버 지출·재고의 수정·취소·차감·삭제는 후속 작업이다.

## 검증/배포
- node --test functions/tests/receipts.test.js: 메모리 DB 테스트(실제 에뮬레이터 아님).
- npm --prefix functions run lint
- npm --prefix ai_manager/functions run build
- Auth/Firestore 에뮬레이터와 공통 HTTP 핸들러: `npx firebase-tools emulators:exec --project demo-shared-receipts --config firebase.receipt-test.json --only auth,firestore "node functions/tests/shared-receipt-e2e.mjs"` (127.0.0.1의 포트 9099/8080 설정).
- 실제 클라우드 Firestore와 휴대폰 사진 촬영은 미검증.
- Firebase 인증된 PC에서 배포할 경우 대상 프로젝트를 명시하고 변경 범위를 한정한다:
  firebase deploy --project solo-living-ai --only functions:api
- AI 어댑터 변경은 AI 코드베이스 배포를 별도로 검토한다. 기존 함수 전체를 무작정 덮어쓰지 않는다.
- 비밀키/사용자 비밀번호/ID 토큰을 Git에 넣지 않는다. Firestore 규칙을 테스트 모드로 열 필요 없다.

### 식재료 직접 등록 요청
```json
{
  "requestId": "fridge-example-001",
  "name": "쌀",
  "quantity": 2,
  "unit": "kg",
  "purchasedAt": null,
  "storageMethod": "room",
  "dateType": "unknown",
  "expiresAt": null
}
```
- kg와 L은 g와 ml로 변환한다. 구입가를 모르므로 직접 등록의 remainingCost는 null이다.
- 201이면 신규, 같은 요청/같은 내용은 200으로 기존 ID를 반환하고 내용이 다르면 409로 막는다.
- 직접 입력 화면에서 확인되지 않은 응답은 같은 요청으로 재시도한다. 냉장고 직접 입력의 재시도 상태는 화면이 열려 있는 동안 유지한다.
- 기존 예시 데이터는 별도이며 새 클라우드 데이터를 생성하지 않는다. 테스트 시 앱 화면의 서버 목록 또는 로그인 UID 아래 문서를 확인한다.
