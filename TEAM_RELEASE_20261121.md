# 자취생존 AI — 팀 공용 최종 테스트본 (2026.11.21)

## 실행 기준
- 브랜치: release/final-app-20261121
- 앱: React Native / Expo
- Firebase: solo-living-ai (Cloud)
- 지도 및 공용 데이터: Firebase Cloud Functions
- AI 소비 코멘트: generateSpendingInsight
- 영수증 OCR: Google Cloud Run

## 1. 프로젝트 내려받기

git clone --branch release/final-app-20261121 https://github.com/geunung0919/MobileProject_team-7-.git
cd MobileProject_team-7-
npm ci

## 2. 프로젝트 루트에 .env.local 생성

EXPO_PUBLIC_FIREBASE_TARGET=cloud
EXPO_PUBLIC_PLACE_API_MODE=firebase
EXPO_PUBLIC_CLOUD_API_BASE_URL=https://asia-northeast3-solo-living-ai.cloudfunctions.net/api
EXPO_PUBLIC_RECEIPT_AUTH_MODE=firebase
EXPO_PUBLIC_RECEIPT_OCR_BASE_URL=https://jachwi-receipt-ocr-634501862696.asia-northeast3.run.app

기존 .env.local이 있다면 백업한 뒤 위 항목을 반영하세요.
기타 필요한 설정은 프로젝트의 기존 환경 예시를 참고하세요.
.env.local과 서비스 계정 키, API 비밀키는 GitHub에 올리지 마세요.

## 3. Expo 실행

npm.cmd ci
npx.cmd expo start --clear --lan

웹 테스트가 필요한 경우:
npm.cmd run receipt:web -- --lan --clear

## 4. 팀원 테스트 항목

- Firebase 로그인
- 홈 화면
- 지도 및 생활정보
- 냉장고 재고 관리
- 소비 기록 및 분석
- AI 소비 코멘트
- 영수증 사진 OCR
- 비상 매뉴얼 / AI 채팅

## 5. 서버 안내

Firebase 및 Cloud Run 서버는 공용 클라우드 서비스를 사용합니다.
팀원 PC에서 Python, Tesseract, Firebase 에뮬레이터를
별도로 실행하지 않아도 되는 구성을 목표로 합니다.

OCR은 Firebase 로그인 방식으로 연결합니다.
OCR 개발용 토큰은 사용하지 않습니다.

앱 소스 코드를 GitHub에 올리는 것과 Firebase/Cloud Run 서버를
배포하는 것은 별개의 작업입니다.

## 6. 주의

현재 작성자의 PC에서 AI 소비 코멘트 및 클라우드 OCR 동작을 확인했습니다.
팀원별 기기 및 전체 기능의 최종 검증은 별도로 진행해야 합니다.
