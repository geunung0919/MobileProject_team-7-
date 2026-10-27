# 팀 코드 로컬 통합 점검 — 2026-10-16

GitHub 업로드·PR 수정·원격 병합은 수행하지 않았다.

## 검사 소스

- 중앙 코어/온보딩: feature/core-notification-settings @ 0e16c7e
- 소비·냉장고 통합: feature/fintech-inventory-integration @ 2a54507
- 최신 냉장고 입력 필드: feature/module3 @ 46aaf40
- main @ 8260275: 초기 문서·Node 샘플이며 위 기능은 모두 미병합
- AI, 지도, 실제 소셜 인증 구현은 현재 저장소 브랜치에서 확인되지 않았다.

## 로컬 통합 조정

충돌 5파일: app/main.py, docs/team-contract.md, mobile/README.md,
mobile/src/app/_layout.js, mobile/src/app/spending.js.
identity와 notification-settings API, 냉장고/마이페이지/대시보드 경로를 모두 보존했다.
최신 module3의 구매일·보관 방법·날짜 출처 입력을 가져왔다.
통합 저장소는 비동기 저장이므로 원본 최신 폼의 저장·삭제를 await하도록 조정했다.
실패 시 이동하지 않고 오류를 표시한다. 이는 로컬 통합본에만 반영되어 있다.

## 실행 결과

- 서버 pytest: 44 passed
- 앱 Node 테스트: 28 passed
- Expo lint / JS 구문 검사: 통과 (checkJs=false이므로 전체 타입 검증 아님)
- Expo iOS / Android / Web 번들 export: 성공
- 임시 DB 시나리오 4종: normal / missing / stale / empty 통과
- 실제 uvicorn 서버와 앱 createApi 함수로 HTTP 요청 성공:
  사용자 식별, 진단 미리보기, 프로필 저장·조회, 알림 설정 사용자 격리,
  월 예산 저장, 식재료 지출 생성, 해당 지출의 로컬 재고 등록.
- 실제 HTTP 검사에서 로컬 계란 3개가 있어도 중앙 inventory는 missing이고 AI에 전달되지 않음을 재현.

## 남은 연결 문제

1. 냉장고는 AsyncStorage, 중앙 대시보드/AI는 서버 스냅샷을 사용한다. 양쪽 자동 동기화가 없다.
2. 단위: 로컬 개/모/공기 등 자유 입력, 중앙 g/ml/piece/pack. 변환 규칙 없이 직접 전송하면 422 가능.
3. 최신 냉장고 입력은 storageMethod=refrigerated/frozen/room, dateType=package/reference.
   중앙 storage=fridge/freezer/room, date_source=label/estimate/unknown. 명시적 매핑 필요.
4. 소비→재고 등록 화면의 입력과 최신 직접등록 폼은 아직 필드 범위가 다르다.
5. 앱의 레시피는 예시 데이터 기반이며 실제 LLM 및 프로필 조리 도구 연결은 미완료.
6. 로컬 중복등록 방지는 같은 기기 저장 범위이다. 다른 기기 공유·지출 수정/삭제 동기화는 미완료.
7. 재고/루틴 후속 버튼과 중앙 카드 경로는 현재 준비 중 표시다. 실제 냉장고 경로 /fridge와 매핑 필요.
8. 개발 토큰 사용, 실제 로그인·지도·루틴 서비스·LLM·푸시까지 전체 서비스 검증은 불가.

## 검증 한계

실제 아이폰·Android 기기 미검증. 브라우저 실행기는 설치된 Chromium이 없고 다운로드도
실패하여 화면 클릭·레이아웃 검증은 수행하지 못했다. 웹 번들 생성 성공과 UI 동작 확인은 별개다.
MySQL 실서버와 실제 외부 API 검증은 수행하지 않았다.

점검용 DB는 /tmp의 별도 SQLite를 사용했고 기존 사용자 DB를 변경하지 않았다.
