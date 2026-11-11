# 자취메이트 팀 API 규약 v1.1 (합의용 초안)

작성: 이현동(중앙 코어) · 2026-11-11 · 기준 브랜치 `feature/core-snack-integration`
v1.0(`team-contract.md`)을 현재 코드와 발표 자료 역할에 맞게 갱신한 문서입니다.

표시
- **[현재]** 서버 코드에 이미 구현되어 테스트로 확인된 규칙
- **[제안]** 아직 코드나 합의가 없어서 이 문서가 처음 제안하는 규칙. 담당자 확인 전까지 바뀔 수 있습니다.

## 1. 담당과 모듈 이름

기존 v1.0 문서와 서버 코드 태그는 예전 번호(2~6번)를 씁니다. 발표 자료 번호와 다르므로 아래 표로 맞춰 읽어 주세요.

| 담당 | 발표 자료 모듈 | v1.0·코드 태그 | 이 규약에서 맡는 데이터 |
|---|---|---|---|
| 이현동 | M1 자취 진단 · 중앙 코어 | 1번 | USER(회원), PROFILE(온보딩), 알림 선호, 통합 조회(dashboard, ai-context), 인증 |
| 김선웅 | M2 소비관리 · M6 생활 루틴 | 2번(소비) · 5번(생활) | BUDGET, EXPENSE, EXPENSE_ITEM, ROUTINE, ROUTINE_LOG |
| 양민혁 | M3 냉장고 · AI 레시피 | 3번 | INVENTORY, INVENTORY_USAGE_LOG |
| 최연규 | 홈 · Common Platform | 4번 | 홈 화면 (dashboard 사용) |
| 정진혁 | M5 AI 자취 매니저 | 6번 | AI_REPORT (ai-context 사용) |
| 김근형 | M4 생활정보(지도·비상) | 없음 | SAVED_PLACE, 비상 매뉴얼 콘텐츠 |

원칙 [현재]
- 데이터를 만든 모듈이 생성·수정·저장 규칙을 책임집니다. 다른 모듈은 정해진 형식으로 받아서 읽기만 합니다.
- 중앙 코어는 다른 모듈의 계산(예산, OCR, 재고 차감, 소비기한, 루틴, AI 응답)을 대신하지 않습니다. 규격 검증과 통합 조회만 합니다.

## 2. 인증

[현재]
- 모든 `/api/v1/me/...` 요청에 `Authorization: Bearer <토큰>` 헤더를 붙입니다.
- 토큰은 두 종류입니다.
  - Google 로그인 세션 토큰: `POST /api/v1/auth/google/start` → 브라우저 인증 → `POST /api/v1/auth/google/poll`로 받습니다. 유효 기간은 24시간(`expires_in: 86400`)입니다.
  - 개발 토큰: 서버 `.env`의 `DEV_TOKENS_JSON`에 적은 16자 이상 문자열입니다. 개발·시연용입니다.
- **user_id는 서버가 토큰에서 정합니다.** 요청 본문이나 주소에 user_id를 넣지 않습니다. 넣어도 서버는 무시하거나 거부합니다.
- 내 user_id가 필요하면 `GET /api/v1/me/identity` → `{"user_id": "..."}`.
- 토큰이 없거나 만료되면 401이고, 앱은 로그인 화면으로 보냅니다.
- 로그아웃은 `POST /api/v1/auth/logout`입니다. 서버 세션이 폐기됩니다.

## 3. 공통 데이터 규칙

[현재] 중앙 코어 API와 스키마(`app/schemas.py`, `schemas/*.json`)가 지키는 규칙입니다. 다른 모듈도 같은 규칙을 권장합니다.

| 항목 | 규칙 |
|---|---|
| JSON 키 | snake_case (`monthly_budget_krw`, `source_updated_at`) |
| 금액 | 원 단위 정수, 0 이상 10억 이하. 필드 이름 끝에 `_krw` |
| 날짜 | `YYYY-MM-DD` (예: `2026-11-11`) |
| 시각 | 시간대가 들어간 ISO 8601 (예: `2026-11-11T10:30:00+09:00`). 시간대 없으면 422 |
| 월 | `YYYY-MM` |
| `null` | 모름·미입력·미설정 |
| `[]` | 확인된 0건 (`null`과 다름) |
| 알 수 없는 필드 | 거부 (422). 필드를 추가하려면 `schema_version`을 올리고 합의 |
| 수량 | 수량과 단위를 항상 함께. 단위는 `g`, `ml`, `piece`, `pack` |

[제안] UIUX 앱 내부 상태는 지금 camelCase(`fridgeItems`, `doneToday`)입니다. 서버로 보낼 때는 snake_case로 바꾸는 것을 원칙으로 하고, 바꾸는 위치는 각 모듈의 API 호출 함수 한 곳으로 모읍니다.

## 4. 오류 응답

[현재] 모든 오류는 같은 모양입니다.

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "입력 형식을 확인하세요.",
             "details": [ { "field": "body.amount_krw", "message": "..." } ] } }
```

| HTTP | `code` | 언제 | 앱 처리 |
|---|---|---|---|
| 401 | `"401"` | 토큰 없음·만료 | 로그인 화면으로 |
| 404 | `"404"` | 아직 저장된 데이터 없음 (예: 온보딩 전) | "아직 없음" 화면. 오류로 표시하지 않음 |
| 409 | `"409"` 또는 `WRITE_CONFLICT` | 다른 기기·요청이 먼저 저장함 | 다시 조회한 뒤 재시도 |
| 413 | `"413"` | 저장 데이터가 너무 큼 | 메시지 표시 |
| 422 | `VALIDATION_ERROR` 또는 `"422"` | 형식·범위 오류 | `details`의 필드 표시 |

`details`는 422 형식 오류에만 있습니다. 앱은 `message`를 그대로 사용자에게 보여 줘도 되도록 서버가 한국어로 씁니다.

[제안] 숫자 문자열 코드(`"409"`) 대신 의미 있는 코드(`CONFLICT`, `NOT_FOUND`, `UNAUTHORIZED`)로 통일합니다. 바꾸기 전까지 앱은 HTTP 상태 코드로 분기합니다.

## 5. 모듈이 중앙 코어에 주는 데이터

중앙 코어는 아래 세 가지를 모아 dashboard와 ai-context를 만듭니다. 모두 `{ schema_version, source_updated_at, data }` 형태의 스냅샷입니다.

- `source_updated_at`은 원본 데이터가 바뀐 시각입니다. 다시 조회만 했다고 현재 시각으로 바꾸지 않습니다.
- 24시간이 지나면 `stale`, 없으면 `missing`, 그 외는 `available`입니다. 소비는 이번 달이 아니어도 `stale`입니다.

### 5-1. 소비 (김선웅) — SpendingSnapshot [현재]
소비 API(`/api/v1/me/spending...`)가 같은 서버에 있어서 중앙 코어가 가계부에서 이번 달 요약을 읽습니다.

```json
{ "period": "2026-11", "budget_krw": 500000, "spent_krw": 120000, "remaining_krw": 380000 }
```
- `budget_krw`가 `null`이면 `remaining_krw`도 `null`이어야 합니다. 값이 있으면 `remaining_krw = budget_krw - spent_krw`입니다.
- `budget_krw`는 가계부의 실제 월 예산(BUDGET)입니다. 온보딩의 `monthly_budget_krw`(생활비 목표)와 **자동으로 맞추지 않습니다.** 목표를 예산에 반영하려면 소비 모듈이 사용자 확인을 받은 뒤 반영합니다.

### 5-2. 재고 (양민혁) — InventorySnapshot [현재]
`PUT /api/v1/me/inventory`로 전체 목록을 교체 저장합니다. 동시 저장은 `expected_revision`으로 막습니다. 처음은 0이고, 성공할 때마다 1씩 오릅니다.

```json
{ "expected_revision": 3,
  "data": { "items": [ { "item_id": "egg-1", "name": "계란", "quantity": 10, "unit": "piece",
                         "storage": "fridge", "target_date": "2026-11-20", "date_source": "label" } ] } }
```
- `date_source`는 `label`(제품 표시), `estimate`(추정), `unknown`입니다. `target_date`가 `null`이면 `unknown`이어야 하고, 그 반대도 같습니다.
- `item_id`는 목록 안에서 중복되면 안 됩니다. 최대 500개입니다.

### 5-3. 생활 루틴 (김선웅) — LifeSnapshot [현재 형식, 경로는 개발용]
```json
{ "routines": [ { "routine_id": "r1", "title": "분리수거", "due_date": "2026-11-11", "completed": false } ],
  "exhausted": false }
```
지금은 개발용 `PUT /api/v1/dev/me/modules/life`만 있습니다. [제안] 루틴 모듈의 실제 저장 API를 정하면 중앙 코어가 거기서 읽도록 바꿉니다.

## 6. 중앙 코어가 주는 데이터

### 6-1. 홈 (최연규) — `GET /api/v1/me/dashboard` [현재]
`profile`, `diagnosis`, `modules`(5장 스냅샷), `module_status`, `cards`를 줍니다. `cards`는 최대 5개이고 `{ kind, title, target }` 형태입니다.
- `kind`: `onboarding`, `budget`(예산 초과), `inventory`(날짜 3일 이내·지남), `routine`(오늘까지 미완료)
- [제안] `target`은 지금 `/spending`, `/inventory/<id>`, `/routines`, `/onboarding` 같은 경로 문자열입니다. UIUX 앱은 React Navigation 화면 이름(`Spending` 등)을 쓰므로 홈에서 아래처럼 바꿔 연결합니다. 바꾸는 표는 홈 담당이 관리합니다.

| `target` | UIUX 화면 (제안) |
|---|---|
| `/onboarding` | `Onboarding` |
| `/spending` | 소비 탭 |
| `/inventory/<item_id>` | 냉장고 탭 (해당 품목) |
| `/routines` | 루틴 화면 |

### 6-2. AI (정진혁) — `GET /api/v1/me/ai-context` [현재]
```json
{ "schema_version": "1.0", "generated_at": "...", "preferences": { "priority": "save_money", "...": "..." },
  "module_status": { "spending": "available", "inventory": "missing", "life": "stale" },
  "modules": { "spending": { "...": "available인 것만" } },
  "constraints": [ "구매 기록은 실제 섭취량이 아닙니다.", "데이터가 없으면 추측하지 마세요.", "..." ] }
```
- 개인정보를 줄이려고 `region_code`, `living_months`는 빼고 보냅니다. `available`인 모듈만 `modules`에 넣습니다.
- `missing`을 0원·0개로 해석하지 마세요.
- [제안] AI_REPORT 저장 형식은 AI 담당이 정합니다. 홈에 보여 줄 "오늘의 한마디"가 필요하면 `{ report_id, created_at, summary, based_on: ["spending", ...] }` 정도를 제안합니다.

## 7. 모듈 사이 전달: 소비 → 재고 [제안]

영수증·결제 내역에서 산 식재료를 냉장고에 넣을 때 쓰는 형식입니다. 소비 모듈이 만들고, 냉장고 모듈이 사용자 확인 후 재고로 등록합니다.

```json
{ "expense_id": "exp-123", "name": "두부", "quantity": 1, "unit": "piece",
  "purchased_on": "2026-11-11", "source": "receipt" }
```
- `source`: `receipt`, `manual`, `sms` 중 하나
- OCR은 소비기한을 읽지 않습니다. 그래서 이 형식에는 날짜가 없습니다. 냉장고 등록 화면에서 사용자가 날짜를 넣거나, 비워 두고 `date_source: "unknown"`으로 저장합니다.
- 재고로 등록된 뒤의 수정·삭제는 냉장고 모듈 책임입니다. 소비 기록을 지워도 재고는 자동으로 지우지 않습니다.

## 8. 지금 통합 코드에서 규약과 어긋나는 부분 (정리 예정)

`feature/core-snack-integration`의 Snack 시연 연결(`app/ui_state.py`, `PUT /api/v1/me/ui-state`)은 시연을 빠르게 이으려고 만든 임시 어댑터입니다. 아래는 이 규약 기준으로 고쳐야 합니다.

1. 앱의 소비 내역과 냉장고 목록을 가계부·재고 테이블에 **직접** 씁니다. → 각 모듈의 API나 서비스 함수를 거치도록 바꿉니다.
2. ~~저장할 때 온보딩 `monthly_budget_krw`를 이번 달 가계부 예산으로 덮어씁니다.~~ → **v1.1에서 고침.** 이제 통합 UI 저장은 가계부 예산을 건드리지 않습니다(`tests/test_api_contract.py`로 확인). UIUX 홈·소비 화면이 온보딩 목표를 예산처럼 보여 주는 부분은 소비 담당과 정할 화면 문제로 남아 있습니다.
3. 개발용 스냅샷 경로(`/api/v1/dev/me/modules/*`)는 `ENABLE_DEMO_ENDPOINTS=true`일 때만 열립니다. 실서비스에서는 쓰지 않습니다.

## 9. 아직 정해지지 않은 것 (담당자 확인 요청)

| 담당 | 확인할 것 |
|---|---|
| 김선웅 | 5-1의 예산 규칙, 7장 소비→재고 형식, 루틴 저장 API 경로 |
| 양민혁 | 5-2 재고 형식이 냉장고 화면 데이터와 맞는지, 7장 등록 흐름 |
| 최연규 | 6-1 카드 `target` → 화면 연결 표 |
| 정진혁 | 6-2 ai-context로 충분한지, AI_REPORT 형식 |
| 김근형 | SAVED_PLACE 저장 위치. 지도 브랜치의 `server/server.js`를 이 서버와 합칠지, 따로 둘지 |
| 전체 | 4장 오류 코드 통일, 3장 camelCase ↔ snake_case 변환 위치 |

## 변경 기록
- v1.1 (2026-11-11): 발표 자료 담당·모듈 번호 대조표 추가, Google 로그인 인증 반영, 오류 응답 형식 명시, 소비→재고 전달 형식·카드 target 연결·AI_REPORT 제안, 통합 코드의 규약 위반 목록 추가. 통합 UI 저장이 가계부 예산을 온보딩 목표로 덮어쓰던 문제 수정.
- v1.0: `team-contract.md` (온보딩·스냅샷·통합 조회 초안)
