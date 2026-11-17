# 선웅 담당 모듈 테스트·배포 메모

이 브랜치는 공통 Firebase/Auth를 연결한 앱 테스트 브랜치다. 최신 UIUX main의 디렉터리·앱 진입점과 차이가 있어 기능별 통합이 필요하다.

| 영역 | 구현·검증 | 실제 앱 테스트 |
| --- | --- | --- |
| 소비 | 직접 입력, 영수증, 결제 문자/알림톡/주문내역을 계정별 소비 기록으로 저장. 취소·환불 후보 차단, 같은 요청으로 재시도 시 중복 방지 | 소비 → 서버 소비 기록에서 실제 계정으로 저장·새로고침·재로그인 |
| 영수증 | main의 전처리/상품행·품목 분류·데이터셋 파이프라인을 OCR 서버에 반영. 복수 영수증 거부, 상품명 미확인·분류 불명 품목은 검토 후에만 저장 | 실제 한국어 영수증 사진 촬영·갤러리, 카페/마트/복수 영수증과 네트워크 장애 확인 |
| 냉장고 연결 | 영수증에서 직접 선택한 식재료만 소비와 같은 Firestore 트랜잭션으로 저장 | 우유와 사과주스를 같이 등록해 한 품목만 냉장고에 나타나는지 확인 |
| 월 예산 | 선택 월의 쓰기·잔액·초과 표시. 지출은 서버 합산, 분석은 서버 목록을 사용 | 이 달 예산과 기본 월 예산을 각각 설정해 다른 달과 비교 |
| 온보딩 연계 | 같은 UID의 `users/{uid}.profile.monthly_budget_krw`에 있는 기본 예산을 읽음. 월별 예산을 우선 적용. 앱에서도 기본 예산을 설정 가능 | 중앙 코어의 온보딩 완료 화면에서 같은 Firebase 사용자 문서에 해당 필드를 저장하도록 통합해야 함. 기존 SQLite를 자동 마이그레이션하지 않음 |
| 루틴 | 생성·수정·요일 지정·삭제(보관)·날짜별 완료 저장. 한국 시간 날짜 기준. 기기별 알림 동의, 표시 알림 및 예약 정리 | Android/iOS 빌드에서 권한 허용·거절, 예약 시간 도래, 완료/편집/삭제 후 예약 정리 실측 |
| Android 결제 수집 | 로컬 모듈이 후보를 기기에 보관하며 앱에서 선택한 항목만 분석. 서버 쓰기 확인 뒤 해당 후보를 수집함에서 제거 | 개발 빌드에서 알림 접근 권한 켜기 → 카드 승인 알림 받기 → 수집함 → 검토·저장. iOS는 복사/붙여넣기 방식으로 확인 |

## 첫 실행

공통 Firebase에 배포할 때 팀과 같은 기준 커밋인지 확인하고 API 함수만 배포한다.

```bash
npm ci --prefix functions
npx firebase-tools deploy --project solo-living-ai --only functions:api
npm ci
npm run receipt:web
```

영수증 사진·결제 텍스트 분석은 별도 FastAPI 주소가 필요하다. 아래는 개발 PC 기준이며 서버와 앱은 별도 터미널에서 실행한다. 팀 토큰은 저장소에 커밋하지 않는다.

```bash
cd jachwi-core
python -m pip install -r requirements-lock.txt
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000
```

루트의 로컬 Expo 환경에 `EXPO_PUBLIC_RECEIPT_OCR_BASE_URL`을 등록한다. PC 웹은 `http://127.0.0.1:8000`, 실제 휴대폰은 같은 네트워크의 개발 PC 주소를 사용한다. 웹 주소가 기본 허용 출처와 다르면 FastAPI의 `CORS_ORIGINS`에 실제 웹 주소를 지정한다. Tesseract 한국어/영어 언어팩 또는 PaddleOCR 설치는 [OCR 서버 안내](../jachwi-core/docs/RECEIPT_OCR.md) 참고. 앱은 개발 모드에서 분석 서버의 개발 인증 토큰을 별도로 입력받는다. 다중 사용자 공개 배포 전에는 분석 서버에 운영 인증·HTTPS를 적용해야 한다.

네이티브 확인은 Android Studio가 설치된 PC에서 `npx expo run:android --device --no-bundler`로 개발 빌드를 만든 뒤 `npm run receipt:native`를 실행한다. iOS 빌드는 macOS/Xcode 또는 팀 개발 빌드가 필요하다. 웹에서는 수집함/기기 예약 알림을 확인할 수 없다.

## 데이터/API

- `GET /finance/budget?month=YYYY-MM`: 해당 월 총지출, 예산, 예산 출처를 반환한다.
- `POST /finance/budget`: `{ month, budget, useAsDefault }`. 기본 예산은 사용자 `profile`에 병합. 월별 예산은 `budgets/{YYYY-MM}`에 저장.
- `POST /finance/transactions`: 수기 또는 결제 분석 후보를 확인한 뒤 저장. `source`는 manual/sms/kakao/notification/commerce. 분석 원문·Android 알림 ID를 Firestore에 보내지 않는다. 영수증 확인 경로는 기존 API를 사용.
- `GET/POST /routines`: 목록과 오늘 완료 상태를 조회. `action`에 save/complete/archive 사용. `routines/{id}` 및 `routine_logs/{date}_{id}`. AI 서비스는 별도 배포해야 날짜별 완료 기록을 읽는다.

남은 통합 범위: 실제 운영 Firebase·OCR 배포/기기 테스트, 중앙 코어 온보딩 완료 화면과의 연결, 최종 UI 브랜치 병합. 기존 샘플 홈/냉장고의 별도 기능까지 공통 DB로 전환한 것은 아니다.

## 화면 통합 수정

- 홈 요약은 로그인 계정의 Firestore 지출·예산·재고·루틴을 조회한다. 데이터가 아직 없으면 예시 숫자 대신 대시를 표시한다.
- 냉장고 직접 등록은 기기에 계정·환경별 요청을 보관해 서버 응답이 끊긴 뒤 다시 열어도 같은 ID를 재사용한다.
- `POST /refrigerator/items/change`는 `{ action, id, version }`과 수정 값을 받는다. 버전이 다르면 409. 재고 수량을 줄일 때는 냉장고에서 해당 품목을 열어 남은 수량을 입력한다. 레시피 확인만으로 재고를 자동 삭제하지 않는다.
- 루틴 삭제는 `routine_archive/{id}`로 옮기고, `routine_logs`의 완료 이력을 유지한다. 목록 및 등록 한도에서는 삭제된 행을 제외한다.
- 더보기에서 Firebase 로그아웃, 개인 프로필의 닉네임·거주 지역, 기기 루틴 알림을 연결했다. 리포트는 배포된 AI Functions의 `listReports`와 `generateDailyReport`가 필요하다.
- 실제 Firebase 및 별도 OCR 서버 배포, 지도·권한·알림의 실기기 검증은 이 브랜치의 소스/에뮬레이터 검사에 포함되지 않는다. 사진 OCR과 결제 원문 분석을 출시 빌드에서 열려면 운영 인증을 갖춘 HTTPS 분석 서버가 필요하다.

## 생활 설정(온보딩)

로그인 뒤 **내 생활 설정**, 또는 **더보기 → 내 생활 설정**에서 자취 기간·요리 빈도·도구·기본 월 예산·목표·재고 상태를 저장한다. 인증된 `GET/PUT /onboarding`이 현재 계정 `users/{uid}.profile`을 조회·병합한다. 월별 예산이 이미 있으면 해당 월 예산이 우선하고, 없을 때는 소비·홈·AI 일간 리포트에서 기본 값을 사용한다. 독립 FastAPI 앱의 기존 SQLite 자료는 자동으로 이전하지 않는다.

## 출시용 분석 서버

운영에서는 아래처럼 FastAPI 분석 전용으로 실행한다. Google Cloud에서 서비스 계정의 기본 인증을 사용하고, 개인 서비스 계정 키 파일을 Git에 넣지 않는다.

```bash
cd jachwi-core
python -m pip install -r requirements-firebase.txt
CORE_AUTH_MODE=firebase FIREBASE_PROJECT_ID=solo-living-ai uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000
```

- 앞단에 고정 HTTPS 주소와 요청/본문 크기 제한을 둔다. 브라우저에서 쓰면 `CORS_ORIGINS`에 배포 앱의 정확한 출처를 등록한다.
- 앱 빌드 설정에 `EXPO_PUBLIC_RECEIPT_AUTH_MODE=firebase`, `EXPO_PUBLIC_RECEIPT_OCR_BASE_URL=https://<팀 분석 서버>`를 넣는다. 해당 주소에는 팀이 관리하는 분석 서버만 사용한다.
- 앱은 이미 로그인한 계정의 Firebase ID 토큰을 분석 요청에 사용한다. 배포용 분석 서버는 개발 토큰과 Auth 에뮬레이터를 허용하지 않고, 사진/원문 분석 및 상태 확인 경로만 공개한다.
- 분석 자체는 소비를 저장하지 않는다. 사용자가 결과를 확인하고 저장하면 공통 Firebase API가 Firestore에 쓴다.

운영 컨테이너는 `docker build -t team7-receipt-analysis ./jachwi-core`로 빌드한다. 한국어·영어 OCR 언어팩이 포함되어 있고, 구동 시 Firebase 프로젝트 ID와 실제 CORS 출처는 호스팅 설정에서 주입한다. 실제 배포는 팀 클라우드 권한으로 진행하고, 배포 후 테스트 계정으로 먼저 검증한다.
