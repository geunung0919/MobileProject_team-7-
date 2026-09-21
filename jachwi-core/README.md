# 자취 가이드 — 1번 중앙 코어 v0.1

처음 실행하는 팀원은 [사용설명서](docs/USER_GUIDE.md)를 먼저 읽어 주세요.

친구의 6모듈 분담 기준으로 만든 **로컬 개발용 첫 구현**입니다.
1번은 온보딩 분류와 데이터 규격·통합을 담당합니다. OCR, 실제 재고 차감,
지도 검색, LLM 생성, Flutter UI는 다른 모듈의 영역이며 이 소스에 구현하지 않았습니다.

## Windows에서 실행하기

Python 3.12를 권장합니다. Python을 설치하고 압축을 푼 `jachwi-core` 폴더를 VS Code에서 엽니다.
터미널에서 아래 순서로 실행하세요. 가상환경 활성화 없이 직접 실행하므로
PowerShell 실행 정책을 바꿀 필요가 없습니다.

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

기존 `.env`가 있다면 복사로 덮어쓰지 마세요.
브라우저에서 http://127.0.0.1:8000/docs 에 접속합니다.
`Authorize`에 `local-demo-token-user-a`만 입력합니다(`Bearer`는 자동 처리).
`PUT /api/v1/me/onboarding` → Try it out → 아래 JSON → Execute:

```json
{
  "living_months": 2,
  "cooking_days_per_week": 2,
  "cooking_tools": ["microwave"],
  "monthly_budget_krw": 300000,
  "priority": "reduce_waste",
  "initial_inventory_state": "needs_registration"
}
```

`experience: new`, `cooking_environment: microwave_only`를 확인하세요.
`GET /api/v1/me/dashboard`에서는 실제 저장한 온보딩을 조회할 수 있습니다.
2·3·5번 데이터는 처음에 `missing`입니다. 실패나 0원으로 처리하지 않습니다.

새 터미널에서 샘플 연결 시연:

```powershell
.\.venv\Scripts\python.exe examples/demo.py
```

이 명령은 demo-a의 온보딩과 **가짜 예산·계란·루틴 스냅샷을 저장**합니다.
예산 초과, 추정 소진일 D-1, 분리배출 카드가 반환됩니다.
샘플 저장은 실제 다른 팀원의 기능이 연결되었다는 뜻이 아닙니다.

테스트:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

## 구현된 API

| 메서드 | 경로 | 사용 담당 |
|---|---|---|
| GET | /health | 서버 생존 확인 (DB 상태 점검 아님) |
| PUT / GET | /api/v1/me/onboarding | 1번 로직·4번 화면 |
| GET | /api/v1/me/dashboard | 4번 홈 |
| GET | /api/v1/me/ai-context | 6번 AI 입력 |
| PUT | /api/v1/dev/me/modules/spending | 2번 예시 데이터 연결 |
| PUT | /api/v1/dev/me/modules/inventory | 3번 예시 데이터 연결 |
| PUT | /api/v1/dev/me/modules/life | 5번 예시 데이터 연결 |

개발 API는 ENABLE_DEMO_ENDPOINTS=true에서만 존재합니다.
모든 PUT은 부분 수정이 아니라 **전체 교체**입니다. 온보딩 PUT에서 생략한 값은 null/기본값으로 초기화됩니다.
개발 토큰 A/B는 각기 demo-a/demo-b에 묶입니다. 클라이언트가 user_id를 지정하지 않습니다.

## 코드 읽는 순서

1. `app/schemas.py`: 팀 공통 입력·출력 규격
2. `app/services.py`: 온보딩 규칙과 홈 데이터 조합
3. `app/database.py`: 저장 테이블과 DB 연결
4. `app/main.py`: API·사용자 구분·오류 처리
5. `examples/demo.py`: 팀 연결 예시
6. `docs/team-contract.md`: 다른 파트에 공유할 계약

## MySQL로 전환

첫 실행은 별도 설치 없는 SQLite 파일(core.db)을 사용합니다.
팀 DB는 MySQL로 유지합니다. 주요 패키지는 requirements.txt에 고정했고, 전체 검증 환경은 requirements-lock.txt에 기록했습니다. MySQL 서버에서 DB와 전용 계정을 준비하세요.

```sql
CREATE DATABASE jachwi CHARACTER SET utf8mb4;
```

`.env`의 DATABASE_URL을 수정하고 재시작합니다.

```dotenv
DATABASE_URL=mysql+pymysql://USER:PASSWORD@127.0.0.1:3306/jachwi?charset=utf8mb4
```

계정명·비밀번호를 실제 값으로 바꾸세요. URL 특수문자는 인코딩해야 합니다.
SQLite 데이터는 자동 이전되지 않습니다. 변경한 DB에서 샘플을 다시 입력하세요.
최초 테이블 생성은 자동입니다. **기존 테이블 변경용 마이그레이션은 아직 미구현**입니다.
실제 MySQL 실행 검증은 이 전달본에서 하지 못했습니다. 팀 DB 연결 후 수행해야 합니다.

## 현재 한계와 다음 단계

- 공개 예시 토큰은 로컬 개발용 사용자 구분입니다. 구글 로그인·실서비스 인증이 아닙니다.
  인터넷 배포 전에 검증된 인증으로 current_user를 교체하고 개발 데이터 쓰기 API를 끄세요.
- 바인딩은 127.0.0.1입니다. 현재 iPhone에서 직접 접속할 수 있는 배포본이 아닙니다.
- DB에는 1번 프로필과 **각 모듈의 조회용 사본**만 저장합니다. 원본 구매/재고 DB를 대신하지 않습니다.
- 모듈별 최신화는 수동 개발 API로 시연합니다. 실제 함수 연결·이벤트 갱신은 팀 구현 후 추가합니다.
- 시각 포함 ISO8601, 한국 날짜 기준 카드, 24시간 초과 자료는 stale 표시.
  stale 값은 홈 카드와 AI 입력에서 제외합니다. 갱신 주기는 팀 합의 후 변경하세요.
- 초기 재고는 등록 여부만 받습니다. 품목 등록·소진일 계산·재고 차감은 3번 담당입니다.
- 비용이 드는 외부 AI·OCR API는 호출하지 않습니다.
- 30초 온보딩은 사용성 목표이며 측정 결과가 아닙니다. 분류는 설명 가능한 규칙 기반입니다.
- 이 코드는 개발 첫 버전입니다. 운영용 인증, 마이그레이션, 레이트 제한, 배포 모니터링은 후속입니다.

공식 참고: https://fastapi.tiangolo.com/tutorial/testing/
및 https://docs.pydantic.dev/latest/concepts/models/
