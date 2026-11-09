# 자취메이트 UI · 온보딩 · Google 로그인 · 영수증 OCR 통합

## 어떤 파일을 쓰나요?
- **UIUX/**: 실제 실행할 팀 디자인 기반 앱. Snack에 넣는 것은 이 폴더의 내용입니다.
- **jachwi-core/**: 온보딩, 진단, 가계부, 재고, Google 로그인, OCR 서버.
- **mobile/**: 기존 팀 Expo Router SDK 57 앱 보존. Android 알림 수집/로컬 알림/기존 재고 고급기능은 여기에 있습니다. UIUX 앱으로 모두 이식되었다는 의미는 아닙니다.
- **PATCH_NOTES_UI_LOGIN_OCR.md**: 변경 사항과 검증 범위.

## 서버 실행 (Windows PowerShell)
`jachwi-core` 폴더에서 실행합니다.
```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000
```
이미 .env가 있으면 복사로 덮어쓰지 말고 새 Google 설정 항목만 추가합니다.
휴대폰에서는 127.0.0.1 대신 PC의 Wi-Fi IP를 사용합니다. Snack 웹에서 HTTP 서버 호출은 차단될 수 있으므로 HTTPS 서버를 권장합니다.
`/docs`에서 API 확인. 개발 토큰은 로컬 테스트용이며 Google 로그인 대신 테스트할 때만 사용합니다.

## Google 로그인 설정
Google Cloud Console에서 OAuth 동의 화면을 설정하고 테스트 사용자(팀원 계정)를 등록합니다.
OAuth 클라이언트 유형은 **웹 애플리케이션**입니다. 서버 콜백 방식이므로 Android 네이티브 로그인 패키지를 Snack에 설치하지 않습니다.
승인된 리디렉션 URI를 `https://실제-서버주소/api/v1/auth/google/callback`으로 등록합니다.
서버 .env:
```dotenv
GOOGLE_CLIENT_ID=발급한_클라이언트_ID
GOOGLE_CLIENT_SECRET=발급한_비밀키
GOOGLE_REDIRECT_URI=https://실제-서버주소/api/v1/auth/google/callback
DEV_TOKENS_JSON={}
ENABLE_DEMO_ENDPOINTS=false
```
공개 서버에서는 예제 개발 토큰을 그대로 활성화하지 않습니다. `CORS_ORIGINS`에는 실제 Snack 웹 프리뷰 Origin 또는 로컬 앱 웹 Origin을 등록합니다. 주소가 바뀌는 출처는 `CORS_ORIGIN_REGEX`(정규식)로 허용할 수 있습니다. 휴대폰 네이티브 요청에는 브라우저 CORS가 적용되지 않습니다.
`.env`/비밀키는 Git과 Snack에 올리지 않습니다.

로그인 동작: 서버가 5분 유효 state/nonce/일회용 polling secret 생성 → Google에서 code 수신 → Google tokeninfo로 ID 토큰 확인(audience/issuer/만료/nonce/email 확인) → 앱이 polling secret으로 세션 1회 수령 → 서버에는 세션 토큰 해시 저장. 세션 24시간 유효, 로그아웃 시 폐기.
로그인 세션은 iOS·Android에서 expo-secure-store(기기 안전 저장소)에 저장해 재실행 후에도 유지하고 시작 시 서버에서 다시 확인합니다(AC-02). 웹 미리보기는 안전 저장소가 없어 브라우저 저장소를 쓰므로 시연용으로만 씁니다. 세션 자동 갱신은 없으며 24시간 만료 후 다시 로그인합니다. 대규모 운영 전 요청 제한/배포 HTTPS/접근 로그 정책을 운영 환경에 맞춰 구성합니다.

## OCR 서버 설정
Tesseract와 한국어(`kor`)·영어(`eng`) 언어팩을 서버에 설치합니다.
Windows는 설치한 tesseract.exe 경로를 .env의 `TESSERACT_CMD`로 지정합니다.
Linux 예:
```sh
sudo apt-get install tesseract-ocr tesseract-ocr-kor
```
`tesseract --list-langs`에서 kor/eng를 확인합니다. `.env`: `OCR_LANGUAGES=kor+eng`.
카메라/앨범에서 사진을 선택하면 서버가 분석합니다. Expo Go에 전용 네이티브 OCR 모듈을 요구하지 않습니다. 상호/날짜/총액 추출 후 품목은 직접 검토·추가합니다.

## 확인 순서
1. 시연 시작 → 온보딩 예산 500,000 입력 → 홈/소비 예산 확인.
2. 더보기 → 생활 데이터 수정 → 예산 변경 → 홈 반영 확인.
3. 개발 로그인 → 온보딩 → 소비 수동 등록 → 재로그인 후 복원 확인.
4. 서버 `/api/v1/me/dashboard`, `/api/v1/me/inventory`에서 같은 데이터 확인.
5. Google 설정 후 계정 선택 → 신규/기존 사용자 화면 분기 확인.
6. 휴대폰 소비 + → 촬영 → OCR 결과 수정 → 저장 → 소비/냉장고 확인.
7. 다른 계정 로그인 시 기존 계정 데이터가 나타나지 않는지 확인.

## 출처 및 확인 기준
Git origin/main acb30d6, 기존 로컬 통합 fbfb209 기준 (2026-11-06 fetch).
UIUX 디자인/화면을 그대로 기반으로 사용. 최신 main에 이미 포함된 영수증 사진 서버 분석을 연결.
참고: https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/ , https://developers.google.com/identity/protocols/oauth2/web-server
