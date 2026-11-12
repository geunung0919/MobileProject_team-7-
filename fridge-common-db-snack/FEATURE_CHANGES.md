# 변경 파일
- module3/domain/ingredientCatalog.mjs: 신규 로컬 표준 식재료 24종, 정확한 별칭 매칭, 후보 검색.
- module3/domain/foodUnits.mjs: 카탈로그와 기존 단위 제안 연결, ingredientId 저장.
- module3/components/IngredientSuggestions.js: 재사용 가능한 민트색 후보 선택 버튼.
- src/screens/FridgeAddScreen.js: UI 담당의 기존 식재료 입력 화면에 후보 연결.
- module3/components/InventoryForm.js: 상세 관리/구매 재고 등록 화면에 후보 연결, 수동 단위 보호.
- module3/domain/shopping.mjs: 출처별 수량, 레시피 재추가 갱신, 출처 제거, 연결 품목 편집 검증.
- module3/state/AppProvider.js: 저장 큐 내부의 최신 재고 기준 부족량 계산과 출처 저장.
- module3/app/(tabs)/shopping.js: 출처명·수량·제외 버튼 및 동작 안내.
- tests/catalogSources.test.mjs: 새 기능 회귀 테스트 4개.
- tests/foodUnits.test.mjs: 저장 레코드에 추가된 ingredientId 기대값 반영.
- package.json / snack-package.json: 알림 패키지와 peer dependency 보완.
- build.cjs / App.js / bundle-manifest.json: 번들 설명 갱신 및 결과 생성.

## 참고 출처 및 구현 방식
참고 프로젝트: https://github.com/SKNETWORKS-FAMILY-AICAMP/SKN27-FINAL-1Team
2026-11-11 GitHub repository license=null, 루트에 LICENSE 없음 확인.
식재료 이름 정규화 및 장보기 출처 관리라는 기능 아이디어를 참고했습니다.
상대 소스·DB·식재료 데이터 파일을 복사하지 않고 기존 우리 JS 모듈 위에 새로 구현했습니다.
기존 UI 및 이전 코드의 출처는 UPSTREAM.json과 기존 변경 문서를 참조하세요.
