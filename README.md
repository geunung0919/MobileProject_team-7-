# 자취생존 AI — 팀 7 최종 앱 실행 안내서

React Native + Expo 기반 자취 생활 관리 앱입니다. Firebase Authentication/Firestore/Cloud Functions, 별도 AI Cloud Functions, 지도·생활정보, 소비·영수증, 냉장고·식사 기록, 생활 루틴, 비상 매뉴얼 기능을 연결합니다.

> **최종 앱 기준:** `release/final-app` 브랜치의 **프로젝트 루트** (`C:\Projects\solo-living-app`)에서 실행합니다. `UIUX/`는 화면 코드이며 독립 실행 프로젝트로 실행하지 않습니다. 이전 `mobile/` Expo Router 앱과 `server/` Node 서버는 최종 브랜치에서 제외하는 중입니다. 현재 내용은 확인된 코드와 설정을 바탕으로 작성했으며, 깨끗한 환경에서의 전체 빌드·배포 검증은 별도로 필요합니다.

## 1. 빠른 실행: 이미 배포된 Firebase 사용

### 준비물

- Windows PowerShell 및 Git
- Node.js와 npm (`node --version`, `npm.cmd --version`). 앱은 Expo SDK 58을 사용합니다. 팀에서 검증한 Node.js 버전을 통일하세요. 일반 Firebase Functions의 배포 런타임은 Node.js 22, AI Functions의 배포 런타임은 Node.js 24로 설정돼 있습니다.
- Expo Go를 지원하는 iPhone/Android 기기 또는 개발 빌드. **Android 결제 알림 읽기 기능은 네이티브 Development Build가 필요하며 Expo Go에서 보장되지 않습니다.**
- 인터넷 연결 및 Firebase 프로젝트 `solo-living-ai` 접근 권한. 휴대전화에서 Expo LAN 모드로 접속할 때 PC와 같은 네트워크 사용

### 내려받기 및 의존성 설치

```powershell
# 원하는 작업 폴더에서 실행
git clone --branch release/final-app https://github.com/geunung0919/MobileProject_team-7-.git solo-living-app
cd solo-living-app
npm.cmd ci
```

이미 클론한 프로젝트라면 다시 클론하지 말고 해당 폴더에서 `npm.cmd ci`를 실행합니다. `node_modules/`는 Git에 포함되지 않습니다.

### 환경 변수 설정

프로젝트 **루트**에 `.env.local` 파일을 만듭니다. 아래 값은 이미 배포된 Firebase API를 사용하는 개발 실행 예시입니다.

```dotenv
EXPO_PUBLIC_SHARED_RECEIPTS=true
EXPO_PUBLIC_FIREBASE_TARGET=cloud
EXPO_PUBLIC_PLACE_API_MODE=firebase
EXPO_PUBLIC_CLOUD_API_BASE_URL=https://asia-northeast3-solo-living-ai.cloudfunctions.net/api

# 영수증 OCR 은 주소를 넣지 않아도 됩니다. 같은 PC 에서 jachwi-core(8000번)를 켜 두면
# 앱 개발 서버가 /__ocr 로 중계합니다 (같은 Wi-Fi·핫스팟·--tunnel 모두). 아래 줄은 별도 OCR 서버를 쓸 때만:
# EXPO_PUBLIC_RECEIPT_OCR_BASE_URL=https://<승인된-OCR-서버-도메인>
# EXPO_PUBLIC_RECEIPT_AUTH_MODE=firebase
```

**중요:** `EXPO_PUBLIC_` 접두사가 붙은 변수는 클라이언트 앱에 포함될 수 있습니다. 여기에 Firebase 서비스 계정 JSON, Anthropic 비밀키, Places 서버 비밀키, 개인 개발 토큰을 입력하지 마세요. `.env.local`은 `.gitignore` 대상이므로 커밋하지 않습니다. 다른 팀원에게는 값이 제거된 예시 파일만 공유하세요.

### Expo 실행

```powershell
npx.cmd expo start --clear --lan
```

터미널에 표시된 QR 코드로 Expo 앱을 실행합니다. 앱 진입점은 `index.js → App.js → UIUX/App`입니다. **`EXPO_PUBLIC_SHARED_RECEIPTS=true`가 빠지면 전체 팀 앱 대신 개발용 단일 화면이 나타날 수 있습니다.**

로컬에서 명령어로 환경 변수를 지정하는 방법도 가능합니다.

```powershell
$env:EXPO_PUBLIC_SHARED_RECEIPTS="true"
$env:EXPO_PUBLIC_FIREBASE_TARGET="cloud"
$env:EXPO_PUBLIC_PLACE_API_MODE="firebase"
$env:EXPO_PUBLIC_CLOUD_API_BASE_URL="https://asia-northeast3-solo-living-ai.cloudfunctions.net/api"
npx.cmd expo start --clear --lan
```

> `npm.cmd start`도 Expo를 시작하지만 필요한 환경 변수는 별도로 지정되어야 합니다. 루트 `README`의 과거 설명인 “`npm start`가 `test.js` 실행”은 현재 코드와 맞지 않습니다.

## 2. 프로젝트 구조와 역할

| 위치 | 역할 |
| --- | --- |
| `index.js`, `App.js` | Expo 등록 및 전체 앱/개발 화면 분기 |
| `UIUX/App.js`, `UIUX/src/` | 최종 앱 화면, UI 컴포넌트, 상태 관리, 루틴·냉장고 등 |
| `api/`, `services/`, `config/` | Firebase/HTTP API 연동, 환경 설정 |
| `firebase/`, `firestore.rules`, `.firebaserc`, `firebase.json` | Firebase 클라이언트 초기화 및 배포 구성 |
| `functions/` | Firebase 공통 HTTP API (`api` 함수, Node.js 22) |
| `ai_manager/functions/` | AI callable Functions 및 보고서·채팅·추천 기능 (Node.js 24 배포 설정) |
| `modules/payment-notifications/` | Android 결제 알림 네이티브 모듈 |
| `jachwi-core/` | 별도 Python 분석/OCR 서비스 소스. 최종 앱의 직접 import 대상은 아니지만 별도 서버 운영 시 필요 |
| `assets/`, `scripts/` | 이미지/아이콘 및 개발 실행 보조 스크립트 |

루트 `package.json`을 기준으로 앱 의존성을 설치하세요. `UIUX/package.json`은 별도 버전의 의존성을 포함하고 있어 최종 앱 실행 지점으로 사용하지 않습니다.

## 3. Firebase 연결 방식

### 클라우드 모드 (최종 앱 시연 권장)

```dotenv
EXPO_PUBLIC_SHARED_RECEIPTS=true
EXPO_PUBLIC_FIREBASE_TARGET=cloud
EXPO_PUBLIC_PLACE_API_MODE=firebase
EXPO_PUBLIC_CLOUD_API_BASE_URL=https://asia-northeast3-solo-living-ai.cloudfunctions.net/api
```

- Firebase Authentication/Firestore는 프로젝트 설정에 따라 실제 클라우드 서비스를 사용합니다.
- 일반 HTTP API는 위 `CLOUD_API_BASE_URL`로 요청합니다.
- AI 기능은 Firebase callable Functions(`asia-northeast3`)를 호출합니다. 일반 HTTP API와 별도로 배포·권한 확인이 필요합니다.
- Firebase 로그인 및 네트워크 접속이 필요하며, 계정과 Firestore 권한에 따라 기능이 제한될 수 있습니다.

### 에뮬레이터 모드 (개발/테스트 전용)

```dotenv
EXPO_PUBLIC_SHARED_RECEIPTS=true
EXPO_PUBLIC_FIREBASE_TARGET=emulator
EXPO_PUBLIC_PLACE_API_MODE=firebase
EXPO_PUBLIC_DEV_HOST=<개발-PC의-LAN-IPv4>
```

`EXPO_PUBLIC_DEV_HOST`는 휴대전화에서 접근할 수 있는 PC의 LAN IP 주소입니다. iPhone에서 `127.0.0.1`을 넣으면 PC의 에뮬레이터에 연결되지 않습니다. 에뮬레이터 기본 포트는 Auth `9099`, Functions `5001`, Firestore `8080`, UI `4000`입니다.

```powershell
# 터미널 A: Firebase CLI 설치·로그인 및 에뮬레이터 실행 (처음 한 번 설치)
npm.cmd install --global firebase-tools
firebase.cmd login
firebase.cmd emulators:start --project solo-living-ai --only auth,firestore,functions

# 터미널 B: 앱 실행 (.env.local 설정 완료 후)
npx.cmd expo start --clear --lan
```

에뮬레이터용 `functions/`와 `ai_manager/functions/`의 의존성 및 AI TypeScript 빌드 결과가 필요할 수 있습니다(5절 참조). `scripts/start-dev.ps1`은 PC IP를 검색해 `.env.local`을 에뮬레이터 기준으로 갱신하므로 **클라우드용 설정을 유지하려는 경우 무심코 실행하지 마세요.**

## 4. 환경 변수 설명

| 변수 | 용도 | 예시/주의 |
| --- | --- | --- |
| `EXPO_PUBLIC_SHARED_RECEIPTS` | 전체 팀 앱 및 공유 DB 모드 활성화 | `true` |
| `EXPO_PUBLIC_FIREBASE_TARGET` | Firebase 접속 대상 | `cloud` 또는 `emulator` |
| `EXPO_PUBLIC_PLACE_API_MODE` | 지도 장소 API 방식 | `firebase`(권장), 레거시 `node` 모드 존재 |
| `EXPO_PUBLIC_CLOUD_API_BASE_URL` | 클라우드 공통 HTTP API 기본 URL | Cloud 모드에 필요; HTTPS |
| `EXPO_PUBLIC_DEV_HOST` | 로컬 에뮬레이터에 접근할 PC IP | Emulator 모드에서 필요 |
| `EXPO_PUBLIC_RECEIPT_OCR_BASE_URL` | 별도 OCR/결제 문자 분석 서버 URL | 미설정 시 개발 서버가 같은 PC 의 jachwi-core(8000번)로 중계 |
| `EXPO_PUBLIC_RECEIPT_AUTH_MODE` | OCR 서버 인증 방식 | `firebase` 또는 개발 전용 `development`(기본값) |

OCR을 클라우드 Firebase 인증으로 사용할 경우 `EXPO_PUBLIC_RECEIPT_AUTH_MODE=firebase`와 **HTTPS OCR 서버**가 필요합니다. `development` 모드는 개발 토큰을 사용하는 별도 테스트 방식으로, 실제 배포에 사용하지 마세요.

Firebase 앱 구성값은 `firebase/firebaseConfig.js`, 공통 API 선택은 `config/environment.js`에서 관리합니다. Firebase Web API Key는 서버 관리자 비밀키와 다른 성격이지만, **인증·Firestore 보안 규칙·API 사용 제한이 반드시 필요**합니다. Android 지도 키는 `app.json`에 들어 있으므로 Google Cloud Console에서 Android 패키지와 서명 인증서 SHA-1 등을 이용한 제한이 필요합니다. 키 자체를 README에 다시 기재하지 마세요.

## 5. Firebase 서버 개발·배포

이 섹션은 서버를 수정하거나 재배포하는 팀원용입니다. **앱만 실행한다면 이미 배포된 서비스가 살아 있는 한 서버를 새로 배포할 필요가 없습니다.** 실제 배포는 프로젝트 권한이 있는 담당자만 진행하세요.

### 일반 HTTP API: `functions/`

```powershell
npm.cmd --prefix functions ci
npm.cmd --prefix functions run lint

# 프로젝트 권한·비밀키 설정이 준비된 경우에만
firebase.cmd deploy --only functions:default:api --project solo-living-ai
```

- Firebase Functions 배포 설정: `firebase.json`의 `codebase: default`, 실행 영역 `asia-northeast3`.
- 대표 상태 점검 주소: `https://asia-northeast3-solo-living-ai.cloudfunctions.net/api/health`
- 지도 Places API는 서버 비밀값 `PLACES_API_KEY`를 사용합니다. 비밀값이 없는 새 프로젝트에서는 관리자 권한으로 별도 등록이 필요합니다.

### AI callable Functions: `ai_manager/functions/`

```powershell
npm.cmd --prefix ai_manager/functions ci
npm.cmd --prefix ai_manager/functions run build
```

`firebase.json`에는 AI 코드베이스(`codebase: ai`, `source: ai_manager/functions`)가 등록되어 있습니다. AI Functions는 Node.js **24** 런타임이 설정돼 있으며 `ANTHROPIC_API_KEY` Firebase Secret을 사용합니다. 서버 담당자는 올바른 Node 런타임 지원, 빌드, IAM 권한, 비밀값 연결 및 요금 정책을 확인한 후 배포해야 합니다. 비밀값은 채팅·README·Git 커밋에 공유하지 마세요.

AI 서비스가 배포되어 있지 않거나 인증이 되지 않으면 일부 AI 리포트·레시피·채팅 기능이 실패할 수 있습니다.

### 영수증 OCR: `jachwi-core/`

**시연·개발 실행 (주소 설정 불필요):**

```bash
# 창 1: OCR 서버 (jachwi-core/.env 는 .env.example 복사 후 Firebase 키 경로 설정, Tesseract 한국어 설치 필요)
cd jachwi-core
./.venv/Scripts/python.exe -m uvicorn app.main:create_app --factory --port 8000

# 창 2: 앱 (아이폰 Safari·안드로이드·PC 모두, 다른 네트워크면 --tunnel)
npm run receipt:web            # 같은 Wi-Fi
npm run receipt:web -- --tunnel
```

휴대폰의 "사진 촬영 후 분석"은 앱 개발 서버의 `/__ocr` 경로로 보내지고, 개발 서버가 같은 PC 의 `127.0.0.1:8000` 으로 넘깁니다. 방화벽·IP 설정이 필요 없습니다. 자세한 내용은 `docs/RECEIPT_SHARED_DB.md`.

`api/receiptRecognition.js`는 OCR 서버에 요청을 보내 영수증 사진과 결제 문자를 분석합니다. 이는 Firebase의 일반 `/api` 서버와 **별도로 구성되는 서비스**입니다. Python 서버의 설치·실행·배포 세부 사항은 `jachwi-core/README.md` 및 해당 폴더의 요구사항 파일을 확인하세요. OCR 서버를 운영하지 않는 경우 수동 소비 입력 등 다른 기능과 구분하여 테스트해야 합니다.

## 6. 플랫폼별 차이

| 플랫폼 | 참고 사항 |
| --- | --- |
| iOS | Expo 앱의 기본 기능 확인에 사용. Android 전용 결제 알림 읽기는 제공되지 않음 |
| Android | `modules/payment-notifications/`는 Expo 자동 연결 도구가 탐지함. 실제 기기 기능은 **Android Development Build 및 알림 접근 권한**이 필요하며, 최종 빌드 성공은 별도 검증해야 함 |
| Web | 일부 네이티브/알림 관련 기능이 지원되지 않을 수 있음. 기능 검증 시 모바일 결과와 구분 |

`android/`와 `ios/` 네이티브 생성 폴더는 현재 `.gitignore` 대상입니다. GitHub에 포함되지 않으므로 Android 네이티브 빌드는 사용 중인 Expo SDK·모듈 버전에 맞춰 재생성 및 테스트해야 합니다. `react-native-maps`, Google 지도 키 및 네이티브 모듈 호환성도 검증 항목입니다.

## 7. 동작 확인 체크리스트

- [ ] `.env.local`을 올바른 모드로 준비한 후 Expo 앱이 실행된다.
- [ ] Firebase 로그인, 프로필 수정, 로그아웃이 동작한다.
- [ ] 홈·지도·비상 매뉴얼 화면을 이동할 수 있다.
- [ ] 냉장고 재고 등록·사용량 차감·식사 기록·소비기한 알림이 동작한다.
- [ ] 소비 내역을 추가하고 사용자 지정 카테고리를 생성·재시작 후 복원할 수 있다.
- [ ] **사용자 지정 소비 카테고리가 실제 Firebase 거래 기록에도 저장되는지** 확인한다. 이 항목은 최종 검증이 필요하다.
- [ ] 할 일을 추가·완료·삭제하고 앱을 재실행한 뒤 상태가 유지된다. 이 기록은 현재 계정별 **기기 로컬 저장**으로 다른 기기로 자동 동기화되지 않는다.
- [ ] AI 리포트·AI 채팅·레시피 추천 응답을 확인한다(서버 인증 및 제한에 따라 달라짐).
- [ ] OCR 서버가 준비된 경우 영수증 촬영·문자 분석을 확인한다.
- [ ] Android 개발 빌드에서 결제 알림 네이티브 모듈의 인식과 권한 처리를 점검한다.

현재까지 iPhone에서는 할 일 삭제·저장 및 일부 UI 간격 변경이 검증됐지만, **새로운 클론 환경에서 전체 앱/Android Development Build/AI·OCR·Firebase 모든 시나리오가 성공했다는 뜻은 아닙니다.**

## 8. 자주 발생하는 오류

**앱이 전체 화면 대신 비상 매뉴얼 등 개발 화면만 시작함**

`EXPO_PUBLIC_SHARED_RECEIPTS=true`를 설정했는지 확인하고 Expo를 재시작합니다.

**에뮬레이터 연결 실패**

`EXPO_PUBLIC_FIREBASE_TARGET`, `EXPO_PUBLIC_DEV_HOST`, PC와 휴대전화의 네트워크, 방화벽, 9099/5001/8080 포트를 점검합니다.

**지도 장소 검색이 되지 않음**

Firebase 로그인 상태, Cloud Functions `/health`, `PLACES_API_KEY` 서버 Secret, Google Maps Platform API 활성화·키 제한·결제 설정 등을 관리자와 확인합니다.

**AI 호출에 실패함**

Firebase 로그인 상태 및 AI Functions 배포, `asia-northeast3`, 사용량 제한, 서버 로그를 확인합니다.

**OCR 촬영·문자 분석에 실패함**

같은 PC 에서 jachwi-core 가 8000번으로 켜져 있는지(`curl http://127.0.0.1:8000/health`), Tesseract 한국어(kor) 설치, `.env.local` 에 예전 `EXPO_PUBLIC_RECEIPT_OCR_BASE_URL` 이 남아 있지 않은지 확인합니다. OCR 서버가 꺼져 있으면 화면에 안내가 뜨고 직접 입력으로 저장할 수 있습니다.

**Android에서 결제 알림 수집을 사용할 수 없음**

Expo Go 여부, Development Build 설치, 모듈 자동 연결과 네이티브 빌드, 알림 접근 권한을 확인합니다.

**Git에서 LF/CRLF 경고가 표시됨**

Windows 줄바꿈 관련 안내일 수 있습니다. JavaScript 오류를 뜻하지 않습니다.

## 9. Git 작업과 보안

- 작업 브랜치: `release/final-app`. 기존 `integration/final-uiux-20261118` 및 `main`은 별도 유지합니다.
- 개발용 별도 `mobile/` Expo Router 앱과 과거 `server/`는 최종 실행본에서 제외하는 방향으로 정리 중입니다. 기존 브랜치에는 기록이 남습니다.
- `node_modules/`, `.expo/`, `android/`, `ios/`, `.env.local`, 에뮬레이터 데이터, 로그·백업 파일은 커밋하지 않습니다.
- Firebase 실제 서비스 배포와 GitHub 푸시는 별도 작업입니다. 코드를 푸시한다고 Firebase 서버가 자동으로 배포되는 것은 아닙니다.
- **팀원이 처음 클론한 환경에서 앱 실행/서버 호출/Android 기능을 다시 검증한 후** 최종본을 `main`에 병합하는 것을 권장합니다.

## 10. 기술 구성 요약

- 앱: React Native, Expo SDK 58, JavaScript, React Navigation
- 인증·저장: Firebase Authentication, Firestore, AsyncStorage
- API: Firebase Cloud Functions (일반 HTTP API 및 AI callable Functions)
- 지도: 지도 컴포넌트 및 서버 측 Places API
- AI: 별도 AI Cloud Functions, 필요 시 Secret 연동
- OCR: 별도 Python 분석 서버(`jachwi-core`)를 환경 변수로 연결
- Android 결제 알림: 로컬 Expo 네이티브 모듈, Development Build 필요

---

**제출 전 남은 검증:** 깨끗한 Git 클론에서 `npm ci`/Expo 실행, Firebase 소비 카테고리 실제 저장, Android Development Build, OCR 서버 설정, 보안 키 제한 및 AI Functions 배포 상태.
