# 냉장고 기능 병합용 코드

기준: Expo SDK 54, 기존 통합 앱의 UI 및 로그인 유지. **전체 App.js를 덮어쓰지 마세요.**

## 코드
- `fridgeApi.mjs`: Firebase ID 토큰을 받아 기존 서버 API 호출, 재고 응답 변환 및 등록·수정·차감·삭제 요청 생성
- `FridgeServerProvider.js`: 인증된 사용자별 냉장고 상태 관리, 조회·변경 후 새로고침

```jsx
<FridgeServerProvider key={user.uid} user={user} isCurrentUser={isCurrentUser}>
  {/* 기존 앱 Provider와 Navigator */}
</FridgeServerProvider>
```

`useFridgeServer()` 반환: `inventory, result, loading, error, refresh, mutate`.
`mutate('save', item)`: 신규 항목의 id를 유효한 고유 requestId로 사용, 기존 항목 수정에는 version 필요.
`mutate('use', {id,version,amount})`: 일부 수량은 update, 전량은 delete. 전량 삭제 전 사용자 확인 필수.
`mutate('delete',{id,version})`: 삭제. 서버 되돌리기 기능은 없음.

## 병합 주의
- 원래 UI, 로그인, 회원가입, 영수증, 홈, 레시피 화면과 라우팅을 유지하고 냉장고 재고 공급 부분만 교체.
- 기존 로컬 예시 재고를 서버로 자동 전송하지 않음.
- 영수증·직접 등록 식재료는 서버의 `users/{uid}/fridgeItems`에서 함께 조회.
- `reference/`의 원본 UI/도메인 참고 파일은 별도 ZIP `fridge_merge_only.zip`에 포함되어 있음. 이 브랜치에 아직 올라가지 않았으며 원본 번들에서 추출한 참고용 코드로 단독 실행 불가.
- 기존 서버는 지원 단위·날짜 유형 제약이 있으며 금액 직접 수정, 일괄 차감, 폐기, 되돌리기, 기록 동기화 미지원.

## 서버 상태
- GET /refrigerator/items: Snack에서 200 확인.
- POST /refrigerator/items: Snack에서 405 확인. GitHub `feature/receipt-shared-firestore`에는 구현되어 있지만 현재 배포 서버에는 미반영 가능성.
- POST /refrigerator/items/change: 구현 코드 확인, 배포/실데이터 테스트 미확인.
- **서버 담당자와 배포 확인 후 쓰기 테스트**. GitHub 업로드 자체는 서버 배포가 아님.

## 범위
이 폴더는 병합 어댑터와 가이드이며, 원본 냉장고 화면 전체를 포함한 완성된 실행 앱이 아님. 다른 팀원 코드/서버/Firestore는 수정하지 않음.
