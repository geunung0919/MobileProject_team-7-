# 알림 클릭 시 냉장고 이동 수정
- 알림 도착이 아닌 알림 클릭에 반응합니다.
- 앱 시작 시 화면 이동 준비가 끝나지 않았으면 이동 요청을 보관하고 NavigationContainer onReady에서 처리합니다.
- 중첩 탭 상태에 Fridge를 직접 지정해 홈 초기 선택과 충돌할 여지를 줄였습니다.
- 요리 완료·식사 기록의 냉장고 복귀도 같은 함수를 사용합니다.
- 변경: integration/router.js, integration/InventoryNotificationObserver.js, IntegrationApp.js 및 생성된 App.js.
- 이전 알림 버전에서 snack/App.js만 교체하세요. 의존성은 동일합니다.
- 실제 폰에서 새 테스트 알림을 예약하고 알림 클릭→냉장고 탭이 선택되는지 확인해야 합니다. 이전 알림을 누르는 대신 새 알림으로 확인하세요.
- 홈 카드 글자 넘침 문제는 이번 수정에 포함하지 않았습니다.
- Git 및 원격 Snack에 올리지 않았습니다.
