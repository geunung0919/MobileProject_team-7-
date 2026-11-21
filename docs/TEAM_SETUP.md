# 팀원용 설치·실행 안내 (최종 통합본)

이 브랜치를 받아서 휴대폰·PC 에서 앱을 실행하는 방법입니다.
Firebase(로그인·DB·Functions·AI)는 이미 클라우드에 있고, **영수증 OCR 서버만 PC 에서 켭니다.**
(OCR 서버를 클라우드에 배포했다면 PC 에서 켤 필요 없이 `.env.local` 에 주소만 넣으면 됩니다.)

## 준비물
- Node.js 22 LTS, Git
- 휴대폰: 안드로이드는 **Expo Go**(SDK 58 지원), 아이폰은 **Safari** 로도 실행 가능
- 영수증 OCR 서버를 켤 PC: Python 3.11~3.13, **Tesseract OCR + 한국어(kor)**
  - Windows: https://github.com/UB-Mannheim/tesseract/wiki 설치 시 "Additional language data → Korean" 체크
  - 확인: `"C:/Program Files/Tesseract-OCR/tesseract.exe" --list-langs` 에 `kor`, `eng` 가 있어야 함

## 1. 코드 받기
```
git clone https://github.com/geunung0919/MobileProject_team-7-.git
cd MobileProject_team-7-
git checkout <최종 브랜치 이름>
```
GitHub 기본 브랜치는 아직 옛 `main` 이라 **브랜치를 꼭 바꿔야** 합니다. (그냥 clone 하면 앱이 안 켜져요)

## 2. 앱 패키지 설치 (맨 위 폴더)
```
npm ci
```
- `UIUX` 폴더 안에는 `node_modules` 가 **없어야** 합니다. 있으면 삭제하세요.
- PowerShell 이 스크립트 실행을 막으면: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

## 3. 앱 설정 파일 `.env.local`
```
Copy-Item .env.example .env.local
```
예시 그대로 쓰면 됩니다. `.env.local` 이 없으면 **흰 화면**만 나옵니다.

## 4. 영수증 OCR 서버 (PC 한 대에서만)
```
cd jachwi-core
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```
`jachwi-core/.env` 에서
- `TESSERACT_CMD=C:/Program Files/Tesseract-OCR/tesseract.exe`
- 앱 로그인 계정으로 인증하려면(`.env.local` 의 `EXPO_PUBLIC_RECEIPT_AUTH_MODE=firebase`): `CORE_AUTH_MODE=firebase`
- Firebase 키 파일은 `jachwi-core/secrets/firebase-service-account.json` 에 둡니다 (팀장에게 직접 받기, **git·채팅에 올리지 말 것**)

실행 (창 1):
```
./.venv/Scripts/python.exe -m uvicorn app.main:create_app --factory --port 8000
```
확인: 브라우저에서 http://127.0.0.1:8000/health → `{"status":"ok"}`

## 5. 앱 실행 (창 2, 맨 위 폴더)
```
npm run receipt:web              # 같은 Wi-Fi
npm run receipt:web -- --tunnel  # 다른 네트워크·학교 Wi-Fi
```
- 휴대폰 브라우저(아이폰 Safari)로 터미널에 나온 주소를 열거나, 안드로이드는 Expo Go 로 QR 을 찍습니다.
- 휴대폰이 보낸 영수증 사진은 **앱 개발 서버 → 같은 PC 의 OCR 서버(8000번)** 로 전달됩니다. OCR 주소·방화벽 설정이 필요 없습니다.

## 6. 영수증 찍기
- 소비 → 영수증 저장 → **사진첩에서 선택 후 분석**
  - 아이폰은 선택 창에서 **"사진 찍기"** 를 고르면 바로 촬영됩니다.
- 종이 영수증을 밝은 곳에서, 영수증이 화면을 가득 채우게 찍으세요. 기울어져도 되고 그림자도 자동으로 보정합니다.
- **모니터 화면에 띄운 영수증을 찍으면 거의 못 읽습니다.** 종이 영수증이나 사진첩의 원본 이미지를 쓰세요.
- 결과는 항상 확인 화면을 거칩니다. 틀린 값은 고친 뒤 저장하세요.

## 자주 나는 문제
| 증상 | 해결 |
| --- | --- |
| 흰 화면 (`EXPO_PUBLIC_DEV_HOST가 없습니다`) | 3번 `.env.local` 만들기 |
| `npm ci` 실패, `Cannot find module` | 1번에서 최종 브랜치로 바꿨는지 확인 |
| `Cannot read property 'text' of undefined` / `property is not writable` | `UIUX/node_modules` 삭제 후 `npx expo start -c` |
| "PC 의 영수증 OCR 서버가 꺼져 있거나…" | 4번 OCR 서버 창이 켜져 있는지, `/health` 확인 |
| OCR 서버가 `NoSuchModuleError: firestore` | `pip install -r requirements.txt` 다시 실행 |
| `Tesseract OCR이 설치되지 않았어요` | Tesseract 설치 + `.env` 의 `TESSERACT_CMD` 경로 |
| 한글을 거의 못 읽음 | `--list-langs` 에 `kor` 가 있는지 확인 (설치 시 Korean 체크) |
| "영수증 글자를 읽지 못했어요" | 종이 영수증을 밝게·가까이 다시 찍기, 또는 직접 입력 |

## 서버를 직접 배포해야 하는 사람만 (선택)
프로젝트 소유자가 권한을 준 사람만 가능합니다.
- Functions·AI: `firebase login` → `firebase use solo-living-ai` → `firebase deploy --only functions`
  (AI 키는 `firebase functions:secrets:set ANTHROPIC_API_KEY`. 키를 저장소·채팅에 올리지 마세요)
- OCR 서버를 클라우드에: `gcloud run deploy jachwi-receipt-ocr --source jachwi-core --region asia-northeast3`
  배포 후 `.env.local` 에 `EXPO_PUBLIC_RECEIPT_OCR_BASE_URL=<배포 주소>` 를 넣으면 PC 에서 OCR 서버를 켤 필요가 없습니다.
