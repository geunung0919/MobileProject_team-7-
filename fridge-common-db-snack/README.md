# 냉장고 최신 원본 및 Snack 실행본

이 폴더는 2026-11-12 공통 DB 준비 수정본입니다. 기존 module3-expo-router는 이전 버전으로 보존합니다.

## 실행
- Snack SDK 54: 이 폴더의 App.js를 Snack App.js에, snack-package.json을 Snack package.json에 복사합니다.
- 원본 개발: 이 폴더에서 npm install 후 npm run web.
- 원본 수정 후 node build.cjs로 Snack용 App.js를 재생성합니다.
- 검증: node --test tests/*.test.mjs (69개 통과).

## 원본 위치
- module3/: 냉장고 화면, 상태, 도메인 계산, 알림 서비스
- integration/: 공통 UI와 냉장고 연결 및 화면 이동
- src/: 시연에 필요한 UI 담당 원본 기반 화면 및 공통 UI
- tests/: 도메인/연결/알림 모의 테스트
- App.js: 생성된 Snack 실행본. 팀 앱에 통째로 복사하지 않습니다.

## 포함 기능
재고 등록/수정/직접 사용/폐기, 구매일/보관 방법/날짜 유형, 단위 정규화와 식재료 자동완성,
로컬 레시피 검색/재료·도구 확인/사용량 수정 후 차감/되돌리기,
장보기와 레시피 출처, 냉장고 복귀, 기기 날짜 알림, 영수증 등록 공통 명령과 중복 방지.

## 현재 한계
AsyncStorage 로컬 모드입니다. 실제 Firebase/서버 저장 및 AI 호출은 연결하지 않았습니다.
영수증 공통 등록 함수는 있지만 기존 소비 데모 UI는 새 입력 계약으로 교체해야 합니다.
이 갱신에서 실기기 알림과 전체 화면 테스트를 새로 수행하지 않았습니다.

팀 통합 방법은 ../docs/MODULE3_INTEGRATION.md, 공통 명령은 COMMON_DB_CHANGES.md를 확인하세요.
