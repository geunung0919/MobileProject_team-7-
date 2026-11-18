# 냉장고 공통 DB 준비 수정본

## 현재 상태
이 파일은 fridge-catalog-snack을 바탕으로 만든 별도 수정본입니다. 실제 Firebase 연결·배포·인증·서버 API는 포함하지 않습니다. 현재 실행은 기존 AsyncStorage 로컬 모드입니다. 이 버전은 feature/module3 브랜치에 공유합니다. 온라인 Snack 자동 반영과 서버 연결은 별도 작업입니다.

## 수정 파일
- module3/domain/inventoryCommands.mjs: 등록, 직접 사용, 폐기, 조리 완료, 되돌리기, 영수증 등록의 공통 명령 처리. React/저장 SDK 없이 사용할 수 있습니다.
- module3/domain/receiptInventory.mjs: 확인된 영수증 품목을 냉장고 형식으로 변환. 영수증/품목/소비 출처를 기록하고 소진 후 재시도도 중복 등록하지 않습니다.
- module3/domain/inventoryFields.mjs: 잘못된 이름·단위 입력 거부.
- module3/domain/inventory.mjs: 식재료 ID와 정확한 별칭으로 재료 충분량 판단.
- module3/domain/transactions.mjs: 같은 식재료 ID로 차감, 수정 시각/버전 갱신. 되돌리기는 관련 재고의 후속 변경을 확인하고 해당 재고만 복구합니다. 관련 없는 재고는 유지합니다.
- module3/domain/nonAi.mjs: 직접 사용 및 수정의 버전 기록.
- module3/state/AppProvider.js: 화면에서 공통 명령을 호출. 직접 등록과 장보기 구매 등록도 공통 검증. 저장 오류 안내 표시.
- tests/commonDb.test.mjs: 영수증 검증/중복 방지/버전 충돌/되돌리기 충돌/별칭 차감 테스트.
- tests/transactions.test.mjs: 복구 후 버전·수정 시각이 증가하는 규격에 맞춘 검증.

## 영수증 담당자가 호출할 함수
useApp()의 registerReceiptItem(input, requestId)를 await 합니다. requestId는 같은 요청 재시도 시 동일하게 유지합니다.

```js
await registerReceiptItem({
 reviewStatus: 'confirmed', inventorySelected: true,
 receiptId: 'receipt-001', receiptItemId: 'line-001', expenseId: 'expense-001',
 rawName: '우유900ML', name: '우유', itemType: 'ingredient',
 quantity: 1800, unit: 'ml', linePaidAmount: 5000,
 purchasedAt: '2026-11-12', expiresAt: '2026-11-18',
 storageMethod: 'refrigerated', dateType: 'package'
}, 'receipt-001-line-001-register');
```
위 값은 예시이며 실제 사용자가 확인한 값으로 전달합니다. 포장 2개를 1800ml로 추측하지 않습니다. 금액 불명은 null입니다. 반환값은 현재 로컬 상태 전체이며 HTTP 응답 규격이 아닙니다.
itemType: ingredient/prepared_food → category food, household → household. unknown/other는 재고 등록하지 않습니다.

## 추가 저장 정보
재고: sourceReceiptId, sourceReceiptItemId, sourceExpenseId, rawName, version, updatedAt.
로컬 상태: receiptInventoryLinks (영수증 ID+품목 ID → 재고 ID), processedIds.
receiptInventoryLinks는 재고 삭제/소진 뒤에도 유지합니다. 반환·재구매는 새로운 영수증 품목 ID로 별도 처리해야 합니다.
이 구조를 서버 사용자 문서 하나에 그대로 저장하는 방식은 권장하지 않습니다. 서버에서는 품목 링크와 작업 ID를 사용자별 별도 문서로 관리해야 합니다.

## 서버 연결 시 남은 작업
1. 인증된 UID로 상태를 조회하고 접근 권한을 검사하는 서버 계층.
2. 명령 처리에 필요한 재고와 관련 기록을 읽고, 변경 결과를 원자적으로 저장하는 Firestore 어댑터.
3. 서버에서 requestId와 요청 내용을 함께 저장하고, 같은 ID로 다른 내용을 보낸 요청을 거부하는 정책.
4. 서버가 제공하는 현재 날짜/시간대와 필드 허용 목록, 사용자별 조회 범위 확정.
5. 앱의 AsyncStorage 대신 서버 요청/응답을 연결하는 저장 계층.
6. 사용자별 로컬 캐시 분리와 기존 로컬 데이터 이전.
7. 영수증 UI의 실제 연동. 기존 소비 데모 화면은 보관 방법/정확한 단위를 받지 않으므로 새로운 registerReceiptItem 경로로 교체해야 합니다. 필수 정보 없는 재고는 등록 실패 안내가 표시됩니다. 소비 저장과 재고 저장의 통합 완료를 의미하지 않습니다.

현재 명령 함수는 서버용 계산 로직을 공유할 출발점이며, 단독으로 운영 서버의 인증·동시성·DB 트랜잭션을 제공하지 않습니다. 변경 전후 배열을 로컬 undo에 보관하지만 복구는 영향받은 항목만 적용합니다. 예전 버전 undo에는 충돌 검증 정보가 없어 되돌리기를 거부하며, 재고 자체는 유지됩니다.

## Snack 실행
1. 별도 New Snack에서 SDK 54를 선택합니다.
2. 루트 App.js 전체와 snack-package.json 내용을 각각 Snack의 App.js, package.json에 넣습니다.
3. App.js는 모듈을 합친 실행용 생성 파일입니다. 팀 통합/수정은 module3와 integration 및 src 원본을 사용하세요.
4. 원본 수정 후 npm install, node build.cjs로 App.js를 다시 만듭니다.
5. node --test tests/*.test.mjs로 도메인 검증을 실행합니다.

확인할 흐름: 재고 추가 → 조리 실제 사용량 변경 → 완료 → 재고 확인 → 되돌리기. 직접 사용·폐기도 확인합니다.
휴대폰 알림과 화면 전체는 이 수정본에서 새로 실기기 검증하지 않았습니다.
