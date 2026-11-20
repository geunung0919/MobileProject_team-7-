# 팀원용 설치·실행 안내 (자취메이트 통합본)

이 브랜치를 받아서 휴대폰(Expo Go)으로 앱을 실행하는 방법입니다.
서버(Firebase Functions, Firestore, 영수증 OCR 서버)는 이미 클라우드에 올라가 있어서 **받는 사람이 서버를 켤 필요는 없습니다.**

## 준비물
- Node.js 22 LTS (Node 24 이상은 일부 도구에서 문제가 생길 수 있어요)
- Git
- 휴대폰에 **Expo Go** 앱 (SDK 58 지원 버전)
- Expo 계정 (무료)
- 팀 리더에게 받을 것: `.env` 에 넣을 **서버 주소 2개** (아래 3번)

## 1. 코드 받기
```
git clone https://github.com/geunung0919/MobileProject_team-7-.git
cd MobileProject_team-7-
git checkout integration/final
```
이미 받은 폴더가 있다면 `git fetch origin` 후 `git checkout integration/final`, `git pull`.

## 2. 패키지 설치
프로젝트 **맨 위 폴더**에서:
```
npm install
```
- `UIUX` 폴더 안에는 `node_modules` 가 **없어야** 합니다. 있으면 삭제하세요. (있으면 "property is not writable" 오류가 납니다)
- PowerShell 이 스크립트 실행을 막으면 새 창마다 한 번: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

## 3. `.env` 만들기
맨 위 폴더의 `.env.example` 을 복사해 `.env` 로 만들고 주소를 채웁니다.
```
Copy-Item .env.example .env
```
- `EXPO_PUBLIC_CLOUD_API_BASE_URL` : Firebase Functions `api` 주소
- `EXPO_PUBLIC_RECEIPT_OCR_BASE_URL` : 영수증 OCR 서버 주소
- 나머지(`SHARED_RECEIPTS=true`, `FIREBASE_TARGET=cloud`, `RECEIPT_AUTH_MODE=firebase`)는 예시 그대로

`.env` 는 git 에 올라가지 않습니다. **절대 커밋하지 마세요.** 비밀 키는 앱 `.env` 에 넣지 않습니다.

## 4. 실행
```
npx expo login        # 처음 한 번 (Expo 계정)
npx expo start -c
```
터미널의 QR 코드를 Expo Go 로 스캔합니다. (PC 와 폰은 같은 와이파이)

## 5. 앱 사용
- 첫 화면에서 이메일/비밀번호로 **회원가입** 후 프로필을 입력하면 홈으로 들어갑니다.
- 영수증 저장은 "소비 → 영수증 저장 → 사진첩에서 선택 후 분석" 이 가장 안정적입니다.

## 자주 나는 문제
| 증상 | 해결 |
| --- | --- |
| `Cannot read property 'text' of undefined` / `property is not writable` | `UIUX/node_modules` 삭제 후 `npx expo start -c` |
| `fetch failed: A server with the specified hostname could not be found` | `.env` 의 서버 주소 오타·누락, 또는 인터넷 연결 확인 |
| `Cannot find module ...` | 맨 위 폴더에서 `npm install` |
| Expo Go "not signed in" | `npx expo login` |
| 영수증 금액 인식 실패 | 종이 영수증을 밝은 곳에서 가까이 찍거나 사진첩 원본 사용. 직접 입력으로 수정 가능 |
| AI 한마디가 기본 문장 | 서버 권한/배포 설정이 필요한 경우가 있어요. 앱은 기본 문장으로 계속 동작합니다 |

## 서버를 직접 배포해야 하는 사람만 (선택)
프로젝트 소유자가 계정에 권한을 준 사람만 가능합니다.
- Functions: `firebase login` → `firebase use solo-living-ai` → `firebase deploy --only functions`
  (AI 키는 `firebase functions:secrets:set ANTHROPIC_API_KEY` 로 설정. 키를 저장소나 채팅에 올리지 마세요)
- OCR 서버: `gcloud auth login` → `gcloud config set project solo-living-ai` →
  `cd jachwi-core` → `gcloud run deploy jachwi-receipt-ocr --source . --region asia-northeast3`
- 줄바꿈(CRLF) lint 오류가 나면 `functions` 폴더에서 `npx eslint . --fix`
