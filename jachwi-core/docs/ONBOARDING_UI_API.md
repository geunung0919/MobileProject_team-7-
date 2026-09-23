# 온보딩 화면 연결 가이드

스토리보드는 화면 예시이며 실제 UI 구현은 4번 담당과 협업합니다.
모든 아래 요청은 기존 Bearer 인증이 필요합니다. 현재 인증은 로컬 개발용입니다.

## 화면과 API

| 화면/기능 번호 | 프론트엔드 동작 | 서버 연결 |
| --- | --- | --- |
| 시작 1 | 저장된 설정 유무 확인 | GET /api/v1/me/onboarding: 200이면 홈, 404이면 초기 설정. 401/네트워크 오류를 신규 사용자로 처리하지 않음 |
| 질문 2~8 | 다음/뒤로 이동 시 앱 메모리에서 입력 유지 | 단계마다 PUT하지 않음 |
| 확인 9 | 수정 화면으로 이동 후 확인 화면 복귀 | 저장 전 필요하면 POST /api/v1/me/onboarding/preview |
| 저장 10 | 중복 클릭 방지, 성공 후 결과 화면 이동 | PUT /api/v1/me/onboarding에 전체 입력 전송 |
| 추천 행동 11 | 버튼 표시 및 화면 경로 매핑 | 저장 성공 응답의 profile로 preview 요청하여 actions 표시 |
| 홈 12 | 통합 데이터 표시 | GET /api/v1/me/dashboard |
| 설정 변경 13 | 기존 profile 복사본을 편집 | GET 후 수정본 전체 PUT. 성공 시 홈/AI 데이터 다시 조회 |

미리보기는 DB를 읽거나 쓰지 않으며 saved=false를 반환합니다. preview의 성공은 저장 성공이 아닙니다.
저장 후 버튼 정보를 가져오는 preview가 실패하면 이미 성공한 저장을 실패로 표시하지 말고 버튼 조회만 재시도합니다.
취소 시 API를 호출하지 않고 편집 복사본을 버립니다. 422에서는 입력을 유지하고 error.details의 field로 오류를 연결합니다.
네트워크 오류에서는 같은 전체 입력으로 저장을 재시도할 수 있습니다.
PUT은 전체 교체입니다. 누락한 선택 항목은 null/default로 초기화되므로 일부 필드만 보내지 않습니다.
현재 다중 기기 편집은 마지막 성공 저장이 반영됩니다. 버전 기반 충돌 감지는 후속 범위입니다.

## 입력값 매핑

| 화면 항목 | JSON 필드 | 값 |
| --- | --- | --- |
| 자취 기간 | living_months | 0~1200 정수 개월 또는 null |
| 생활 목표 | priority | save_money / reduce_waste / build_routine / null |
| 조리 도구 | cooking_tools | microwave, stove, rice_cooker, air_fryer의 중복 없는 목록 |
| 조리 도구 없음 / 건너뛰기 | cooking_tools | 없음은 [], 건너뛰기는 null. 'none' 문자열을 전송하지 않음 |
| 요리 횟수 | cooking_days_per_week | 0~7 정수 또는 null |
| 월 목표 예산 | monthly_budget_krw | 0~1000000000 정수 또는 null. 쉼표/원 기호는 UI에서 제거 |
| 지역 | region_code | ASCII 숫자 10자리 법정동 코드 또는 null |
| 재고 상태 | initial_inventory_state | 없음=empty / 등록 필요=needs_registration / 나중에=not_entered |

지역 검색 API는 아직 구현되지 않았습니다. 5번과 검색 제공자를 합의한 뒤 화면에 연결합니다.
지역명 문자열이나 GPS 좌표를 region_code에 넣지 않습니다. 지역 검색을 건너뛰어도 진행할 수 있습니다.
없음 버튼은 다른 조리 도구 선택과 동시에 활성화하지 않습니다.

## 진단 규칙 1.1

- 자취 기간: null=unknown, 0~5개월=new, 6개월 이상=experienced.
- 조리 도구: null=unknown, []=no_tools, 전자레인지만=microwave_only, 나머지=equipped.
- 주간 요리: null=unknown, 0~2일=rare, 3~7일=regular.
- missing_fields는 미입력 항목이며 필수 오류 목록이 아닙니다. 재고 not_entered도 포함합니다.
- 기존 suggested_actions는 부족한 설정에 대한 코드입니다. 화면의 버튼 목록은 preview.actions를 사용합니다.
- actions는 목표 예산 미입력 시 예산 설정, 입력 시 예산 확인을 제공합니다. 재료 등록은 needs_registration에서만 제공합니다. 생활 루틴 버튼을 함께 제공하고 선택 목표에 해당하는 버튼을 우선 배치합니다.
- target은 앱 내부 논리 경로이며 서버 URL이 아닙니다. /spending(2번), /inventory(3번), /routines(5번)을 4번 화면에 매핑합니다. 실제 화면 미완성 시 준비 중 안내를 표시합니다.
- rule_version은 1.0에서 1.1로 변경됩니다. 응답 구조가 같은 기존 GET/PUT과 스냅샷 schema_version=1.0은 유지합니다.
- 온보딩 목표 예산을 바꿔도 2번의 실제 월 예산이나 3번 재고를 덮어쓰지 않습니다.

## Swagger에서 확인하기

1. /docs에서 기존 개발 토큰으로 Authorize합니다.
2. POST /api/v1/me/onboarding/preview에서 아래 입력을 실행합니다.
3. saved=false와 actions를 확인합니다. 기존 설정은 변경되지 않습니다.
4. 같은 입력을 PUT /api/v1/me/onboarding에 보내 저장합니다.
5. living_months=6, cooking_days_per_week=3, cooking_tools=[]로 바꾼 전체 입력을 PUT합니다.
6. GET 온보딩과 dashboard에서 experienced / regular / no_tools로 바뀌는지 확인합니다.

```json
{
  "living_months": 2,
  "cooking_days_per_week": 2,
  "cooking_tools": ["microwave"],
  "monthly_budget_krw": 300000,
  "region_code": null,
  "priority": "reduce_waste",
  "initial_inventory_state": "needs_registration"
}
```

확인 범위: Python 3.12 / SQLite. MySQL 실서버, 실제 로그인, Flutter 화면 연결은 후속 검증이 필요합니다.
