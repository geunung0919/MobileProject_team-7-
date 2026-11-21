# Firebase(Firestore) 저장 설정

팀 DB를 Firebase 로 정해서, `jachwi-core` 서버가 저장하는 모든 데이터를 Firestore 에 저장할 수 있게 했습니다.
API 주소와 응답은 그대로라서 `mobile/` 앱 화면은 바꾸지 않아도 됩니다.

```text
휴대폰 앱(mobile/)  ──영수증 사진/텍스트──▶  jachwi-core 서버  ──분석(OCR)──▶  결과 확인
                     ◀──────── 결과 ────────
사용자 확인 후 저장  ──────────────────────▶  jachwi-core 서버  ──저장──▶  Firestore
```

- **소비 내역**: 영수증 확인 후 저장(`imports/confirm`)하면 `spending_ledger` 문서에 들어갑니다.
- **냉장고 식재료**: 영수증 식재료는 기기 냉장고에 넣은 뒤 바로 서버 재고(`PUT /me/inventory`)로 보내 `inventory` 문서에 들어갑니다.
  처음 연결하는 계정은 덮어쓸 위험이 없을 때(서버가 비었거나, 기기가 비었거나, 둘이 같을 때) 자동으로 연결됩니다.
  기기와 서버에 서로 다른 재고가 있으면 자동으로 덮어쓰지 않고, 냉장고 > 서버 재고 연결 화면에서 기준을 고르게 합니다.
- 온보딩, 알림 설정, 통합 현황도 같은 Firestore 를 씁니다.

## 1. Firebase 콘솔 (팀에서 한 명만)

1. https://console.firebase.google.com 에서 프로젝트를 만듭니다. (Google Analytics 는 꺼도 됩니다)
2. 빌드 > **Firestore Database** > 데이터베이스 만들기
   - 위치: `asia-northeast3 (서울)` 권장 (나중에 바꿀 수 없음)
   - **프로덕션 모드**로 시작
3. Firestore > 규칙 탭에 `jachwi-core/firestore.rules` 내용을 붙여 넣고 게시합니다.
   서버는 관리자 키로 접속해서 규칙과 상관없이 읽고 쓸 수 있고, 다른 곳에서의 직접 접근은 막힙니다.
4. 프로젝트 설정(톱니바퀴) > **서비스 계정** > Firebase Admin SDK > **새 비공개 키 생성** → JSON 파일이 내려받아집니다.

> 이 JSON 키는 Firestore 전체 관리자 권한입니다. **git, 카톡 단체방, 앱 코드에 올리지 마세요.**
> 서버를 실행하는 PC에만 두고, 유출되면 콘솔에서 키를 삭제하고 새로 만드세요.

## 2. 서버 PC 설정

```powershell
cd jachwi-core
.\.venv\Scripts\python.exe -m pip install -r requirements.txt   # google-cloud-firestore 추가됨
mkdir secrets
# 내려받은 키 파일을 jachwi-core\secrets\firebase-service-account.json 으로 옮깁니다 (secrets/ 는 git 제외)
```

`.env` 에서 DB 줄을 바꿉니다.

```dotenv
# DATABASE_URL=sqlite:///./core.db
DATABASE_URL=firestore://
FIREBASE_CREDENTIALS=./secrets/firebase-service-account.json
```

서버를 평소처럼 실행합니다.

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --reload --host 0.0.0.0 --port 8000
```

휴대폰 앱에서 영수증을 저장한 뒤 Firebase 콘솔 > Firestore 에서 `users/demo-a/core/spending_ledger`,
`users/demo-a/core/inventory` 문서가 생겼는지 확인하세요. (`demo-a` 는 `.env` 의 `DEV_TOKENS_JSON` 사용자 id)

## 3. 기존 SQLite 데이터 옮기기 (선택)

`core.db` 에 있던 데이터를 Firestore 로 복사합니다. 원본은 그대로 남고, Firestore 에 같은 문서가 있으면 덮어씁니다.

```powershell
.\.venv\Scripts\python.exe tools/migrate_sqlite_to_firestore.py sqlite:///./core.db firestore://
```

## Firestore 문서 구조

| 경로 | 내용 | 예전 테이블 |
| --- | --- | --- |
| `users/{userId}/core/profile` | 온보딩 프로필 (`payload`) | `core_profiles` |
| `users/{userId}/core/notification_settings` | 알림 설정 (`payload`) | `core_notification_settings` |
| `users/{userId}/core/spending_ledger` | 소비 내역·예산·영수증 품목·중복 방지 기록 (`payload`, `version`) | `fintech_ledgers` |
| `users/{userId}/core/inventory` | 서버 재고 (`payload`, `revision`) | `core_inventory` |
| `users/{userId}/core/snapshot_{module}` | 개발용 모듈 스냅샷 | `core_module_snapshots` |

- 동시 저장 충돌 확인(`version`, `revision`)은 Firestore 트랜잭션으로 그대로 지킵니다. 충돌하면 예전처럼 409 를 돌려줍니다.
- 최상위 컬렉션 이름은 `FIRESTORE_ROOT_COLLECTION` (기본 `users`) 으로 바꿀 수 있습니다.
- Firestore 문서 하나는 최대 1MiB 입니다. 소비 원장은 한 문서라 영수증이 수백 장 쌓이면 한계에 가까워질 수 있어요.
  시연·과제 규모에서는 문제없지만, 실제 서비스로 키우면 지출을 하위 컬렉션으로 나누는 작업이 필요합니다.

## 테스트

Firestore 에 접속하지 않는 메모리 저장소(`firestore-memory://이름`)로 테스트합니다.

```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_firestore_storage.py
```

## 아직 남은 것

- 로그인: 지금은 `.env` 의 개발 토큰으로 사용자를 구분합니다. Firebase Authentication 을 붙이면 토큰 대신 Firebase ID 토큰을 확인하도록 `main.py` 의 `current_user` 를 바꾸면 됩니다.
- 기기에만 저장되는 데이터: 식사 기록, 장보기, 폐기 기록, 생활 루틴은 지금도 휴대폰(AsyncStorage)에만 있습니다.
