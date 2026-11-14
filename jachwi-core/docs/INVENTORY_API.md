# 중앙 재고 연결 API

현재 개발 토큰 인증을 사용한다. 실제 로그인 구현 완료를 의미하지 않는다.
3번 재고 모듈이 관리하는 재고를 중앙 대시보드·AI에 전달하기 위한 연결 API이다.

- GET `/api/v1/me/inventory`: `{revision, snapshot}` 반환. 미등록은 404.
- PUT `/api/v1/me/inventory`: 전체 재고 교체. `{expected_revision, data: {items: [...]}}`.
- 최초 저장은 expected_revision=0. 이후 GET에서 받은 revision을 전송한다.
- 성공할 때마다 revision 증가. 서버가 source_updated_at을 생성한다.
- 다른 기기가 먼저 저장했거나 같은 요청을 재전송하면 409. 자동 덮어쓰기하지 말고
  다시 조회하여 사용자에게 차이를 확인시킨다. 응답 유실 시에도 먼저 GET으로 확인한다.
- 빈 items는 확인된 빈 냉장고이다. 404(아직 등록하지 않음)와 다르다.
- 사용자 ID는 인증에서 결정하며 본문에 넣지 않는다.
- 중앙 재고가 있으면 기존 개발용 inventory snapshot보다 우선한다.
- 24시간 이상 갱신되지 않은 재고는 기존 계약대로 stale 처리되어 AI 입력에서 제외된다.

## 품목 예시

```json
{
  "expected_revision": 0,
  "data": {"items": [{
    "item_id": "egg-1", "name": "계란", "quantity": 3,
    "unit": "piece", "storage": "fridge",
    "target_date": "2026-10-28", "date_source": "label"
  }]}
}
```

단위는 g/ml/piece/pack만 지원한다. 개→piece 같은 명시적인 매핑은 앱 어댑터에서
처리할 수 있으나 모/공기 등을 임의로 무게로 환산하면 안 된다.
보관 refrigerated→fridge, frozen→freezer, room→room;
날짜 package→label, reference→estimate로 연결한다.
날짜가 없으면 target_date=null, date_source=unknown을 함께 보낸다.

## 이번 구현 범위

서버 저장·조회, 사용자 격리, revision 충돌 방지, 대시보드·AI context 반영.
기존 AsyncStorage 냉장고에서 이 API를 호출하는 앱 동기화는 후속 작업이다.
새 core_inventory 테이블은 개발용 create_all로 생성된다. 운영 DB는 별도
마이그레이션 절차가 필요하다. 데이터 변경은 기존 재고·프로필 테이블을 수정하지 않는다.
