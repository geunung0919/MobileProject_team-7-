# 자취 생존 AI — 팀 통합 앱 (2026-11-01)

React Native + JavaScript + Expo SDK 57 / Expo Router 프로젝트입니다.
이 브랜치에서는 `mobile` 폴더 하나에서 중앙 코어 화면, 소비 관리, OCR,
Android 결제 수집함, 생활 루틴, 최신 냉장고·레시피·장보기를 함께 실행합니다.

## 시작

Node.js 22.13 이상과 Python 3.12를 권장합니다.
서버와 앱은 이 통합 브랜치의 코드를 함께 사용하세요.

서버: 저장소 루트에서 PowerShell 터미널을 열고 아래 명령을 실행합니다.

```powershell
cd jachwi-core
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# 처음에만 복사하세요. 기존 .env가 있다면 유지합니다.
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000
```

앱: 저장소 루트에서 다른 터미널을 엽니다.

```powershell
cd mobile
npm ci
npx expo start
```

휴대폰과 PC를 같은 Wi-Fi에 연결하고, 앱에서 PC의 IPv4 주소
`http://192.168.x.x:8000`과 `.env`에 설정된 개발 토큰을 입력합니다.
휴대폰의 localhost는 PC를 가리키지 않습니다. 실제 소셜 로그인은 아직 연결 전입니다.
서버 토큰은 앱 메모리에만 보관합니다. `.env`와 개인 결제 원문을 Git에 올리지 마세요.

OCR과 Android 알림 수집은 Expo Go에 네이티브 모듈이 없어 Development Build가 필요합니다.
Android Studio/SDK 환경에서:

```powershell
cd mobile
npx expo run:android
```

네이티브 의존성·설정이 바뀌면 기존 개발 빌드를 다시 생성해야 합니다.
iOS 네이티브 로컬 빌드에는 macOS/Xcode가 필요합니다.

## 메뉴와 연결

소비 관리에서 생활 설정, 통합 현황, 마이페이지, 냉장고·식사,
생활 루틴, 결제 자동입력, Android 자동수집함으로 이동합니다.

- 온보딩: 단계별 입력, 서버 기준 검증, 미리보기·진단·저장·오류 복구.
- 소비: 월별 예산·지출 CRUD, 잔여액·경고, 온보딩 예산 확인 후 적용.
- 자동입력: 텍스트/OCR 결과 → 파서 후보 → 검토·수정 → 지출 저장.
- OCR: 촬영/앨범 → ML Kit 한국어(Android) 또는 Apple Vision(iOS) → 검토.
- Android 수집함: 사용자가 시스템 알림 접근을 허용하면 결제 후보만 로컬에 보관.
  수집함에서 검토할 때 서버로 전달하며 저장 성공 시 수집함에서 제거합니다.
  최대 50건/30일입니다. 취소/환불의 기존 지출 반영은 아직 없습니다.
- 냉장고: 구매일·보관 방법·날짜 출처·잔여 금액 입력, 검색, 부분 폐기, 되돌리기.
- 레시피: 예시 3개 카탈로그의 이름/재료 검색·시간/재고 필터, 실제 사용량 확인 후 차감.
  AI 생성이나 외부 레시피 검색이 아닙니다.
- 장보기: 추가·수정·체크, 쿠팡 검색, 구매 품목 재고 등록. 검색 링크가 구매를 자동 처리하지 않습니다.
- 식재료 지출 → 냉장고 등록: 여러 재료 확인 후 한 번 등록. 소비 금액으로 재료를 추정하지 않습니다.
- 레시피 알림: 개별/매일 로컬 예약, 취소, 알림 탭 시 통합 경로로 이동.
  계정별 예약을 구분하고 명시적 연결 종료/계정 변경 때 다른 계정 예약 취소를 시도합니다.
  예약 취소 실패나 OS 권한/절전 상태는 실기기 확인이 필요합니다.
- 생활 루틴: 반복 요일·완료 체크·5분 이하 방전모드. **루틴 시간은 저장/표시만 하며 실제 OS 알림은 미구현**입니다.
- 마이페이지 알림 토글은 서버 선호 설정입니다. 레시피 예약 화면의 명시적 로컬 예약과
  별개이며, 소비/재고/루틴 자동 알림 발송 엔진은 아직 연결되지 않았습니다.

## 저장 범위와 이전 데이터

냉장고/식사/폐기/장보기는 기존 `jachwi.fridge.v1:<서버>:<사용자>` 저장 키를 유지합니다.
생활 루틴도 계정별 별도 로컬 키를 유지합니다. 새 계정에 예시 재고를 넣지 않습니다.
과거 냉장고에는 discards/processedIds/undo의 기본값만 추가하며 기존 값과 소비 연결 기록을 보존합니다.
이전 구매일·보관법·날짜 출처는 추측하지 않으며 재고 수정 시 확인합니다.
팀원의 독립 앱 `module3.state.v1` 키는 다른 계정의 데이터일 수 있어 자동으로 합치지 않습니다.

식사·폐기·가져오기·장보기 등록은 같은 계정 저장 큐에서 처리하며,
기기 저장 성공 후에만 화면에 반영합니다. 새 재고 변경은 이전 되돌리기를 종료합니다.
앱 삭제/데이터 초기화 시 로컬 데이터와 등록 기록은 사라질 수 있습니다.

Android 네이티브 알림 수집함은 현재 기기 공용입니다. 앱 계정별 수집함 격리는 후속 작업이며,
재고/루틴처럼 계정별 저장이라고 간주하면 안 됩니다.

## 중앙 재고 API와의 경계

서버에는 `GET/PUT /api/v1/me/inventory`와 revision 기반 충돌 방지가 포함되어 있습니다.
**기기 냉장고와 중앙 재고 간 자동 업로드/다운로드는 아직 연결하지 않았습니다.**
통합 현황과 AI context는 서버가 받은 데이터만 사용하며 기기 재고·루틴은 자동 반영되지 않습니다.
서버 g/ml/piece/pack과 앱의 개/모/공기 등 자유 단위는 임의로 환산하지 않습니다.
자세한 규격은 `../jachwi-core/docs/INVENTORY_API.md`에 있습니다.

## 출처

- 기반 소비/OCR/루틴/수집함 및 파서 수정: `test/payment-integration-validation` (`f80ffa8`).
- 중앙 코어/마이페이지/온보딩/재고 API: `feature/core-notification-settings` (`30f50c3`).
- 최신 재고/폐기/되돌리기/레시피/장보기/알림: `feature/module3` (`4007295`).
  원본을 `src/features/fridge`와 `/fridge` 경로로 적응하고 계정별 저장·가져오기를 유지했습니다.
- 팀원 원본 브랜치를 수정하거나 main에 병합하지 않았습니다.

## 검사

```bash
npm test
npx expo lint
npx tsc -p jsconfig.json --noEmit
npx expo export --platform android --platform ios
```

서버 검사: `jachwi-core`에서 `python -m pytest -q`.
`checkJs:false` 검사와 번들 export는 완전한 JS 타입 검증이나 APK/IPA 빌드가 아닙니다.
실제 영수증 OCR·카톡 알림 수신·로컬 알림 표시·화면 터치는 기기 검증이 남아 있습니다.
