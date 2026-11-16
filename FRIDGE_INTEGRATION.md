# 냉장고 통합 검토본

기준 커밋: e57cf4bd8ec986d5f9d6f8d4139f2d1ba5653426
대상 브랜치: integration/fridge-e57cf4b
소스: 기존 통합 앱 + fridge-common-db-snack의 냉장고 도메인/화면.
main 병합 및 서버 배포는 하지 않습니다.

## 변경 내용
- mobile/src/features/fridge: 수량·단위, 구매일·보관방법·날짜유형, 재고 사용/폐기/되돌리기, 식사 기록, 예시 레시피 검색, 장보기, 재고 알림.
- mobile/src/app/fridge: 기존 Expo Router 경로에 화면 연결. 로그인과 사용자별 기기 저장을 유지합니다.
- 구버전 날짜 미확정 재고를 보존하고, 복구 기준이 없는 오래된 undo는 제거합니다.
- 루틴/소비/인증/서버 구현과 package.json은 변경하지 않습니다.

## 실행
mobile 디렉터리에서 npm ci 후 npm run web 또는 npm start.
Expo SDK 57 프로젝트이며 Snack에 App.js 하나만 붙여 넣는 구성은 아닙니다.
기존 로그인과 서버 설정이 필요합니다. 서버 실행 방법은 기존 jachwi-core 문서를 참고하세요.

## 서버 연결 범위
기존 FastAPI 재고 동기화는 유지합니다. Firebase 공통 서버/Firestore 연결은 이번 변경에 포함되지 않습니다.
기존 서버 단위 g/ml/piece/pack과 공기·모 등 새 단위는 호환되지 않을 수 있습니다. 동기화 오류 시 기기 데이터는 보존됩니다.
구매 금액·구매일·영수증 출처 등 새 필드는 기존 서버에서 모두 동기화되지 않습니다.
AI API 호출은 추가하지 않았습니다. 레시피는 앱의 예시 데이터와 규칙 기반 검색입니다.

## 검증 결과
- npm test: 149개 통과
- npm run lint: 통과
- npx expo export --platform web: 통과
- tsc --noEmit --allowJs --checkJs false --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --skipLibCheck src/features/fridge/state/AppProvider.js: 통과
  (JS 구문/모듈 검사이며 완전한 타입 검증은 아닙니다.)
- 실제 기기 화면·알림 및 실제 서버 CRUD/Firestore 저장은 이번 작업에서 검증하지 않았습니다.
- 재고 알림은 기존 Snack의 앱 단위 예약을 이식했습니다. 다중 계정 전환/로그아웃 시 예약 분리·취소는 추가 작업이 필요합니다. 배포 전 확인하세요.

## 병합 담당자 확인
현재 main 최신 버전이 아닌 위 기준 커밋에서 분기했습니다. 이후 팀원 변경사항을 비교한 뒤 병합하세요.
로그인 → 냉장고 → 등록 → 재고 목록 → 레시피 검색 → 실제 사용량 입력 → 차감 → 되돌리기를 확인하세요.
영수증 가져오기, 일부 폐기 금액, 재시작 후 저장, 알림 예약도 실제 기기에서 확인해야 합니다.
