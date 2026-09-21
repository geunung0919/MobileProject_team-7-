# 중앙 코어 사용설명서

이 문서는 1번 담당의 온보딩·데이터 통합 서버를 팀원이 실행하고 연결하는 방법입니다.
앱 UI는 아직 포함하지 않습니다. `/docs`는 서버 API 테스트 화면(Swagger UI)입니다.

## 1. 현재 구현 범위

- 생활 정보 저장·조회와 규칙 기반 초기 분류
- 2번 소비, 3번 재고, 5번 루틴 데이터의 입력 형식 검증 및 조회용 스냅샷 저장
- 4번 홈 화면용 통합 조회와 6번 AI용 입력 제공
- 미입력, 확인된 0건, 오래된 데이터 구분

OCR, 실제 재고 차감, 지도, LLM 호출, 구글 로그인은 이 서버의 현재 구현에 포함하지 않습니다.
샘플 데이터 연결이 실제 팀원 기능 연결을 의미하지 않습니다.

## 2. 시작할 폴더

GitHub에서 이 작업 브랜치를 내려받거나 복제한 뒤 `jachwi-core` 폴더를 VS Code로 여세요.
터미널에서 아래 파일들이 보여야 합니다.

```powershell
Get-ChildItem -Force
```

`requirements.txt`, `.env.example`, `app`이 보이면 올바른 위치입니다.
저장소 최상위의 `npm start`는 기존 JavaScript 예제를 실행합니다. 이 Python 서버 실행 명령이 아닙니다.

## 3. Windows 첫 실행

Python 3.12를 권장합니다. 설치 확인:

```powershell
py --version
```

아래 명령은 한 줄씩 실행하고 오류가 생기면 다음 단계로 넘어가지 마세요.

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

`.env`가 아직 없을 때만 복사합니다.

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

서버 실행:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

`Application startup complete.`가 나오면 브라우저에서 아래 주소를 여세요.
주소 뒤에 설명 문구나 별표를 붙이지 마세요.

```text
http://127.0.0.1:8000/docs
```

서버 터미널을 켜 두세요. 종료는 Ctrl+C입니다.
다음 실행부터는 설치·설정 복사를 반복할 필요 없이 서버 실행 명령만 사용합니다.
가상환경을 별도로 활성화하지 않아도 되므로 PowerShell 실행 정책을 바꿀 필요가 없습니다.

기존에 상위 폴더에 가상환경을 만들고 활성화한 사용자는 그 환경을 계속 써도 됩니다.
반드시 `requirements.txt`가 있는 폴더로 이동한 뒤 다음처럼 실행하세요.

```powershell
python -m uvicorn app.main:create_app --factory --reload
```

## 4. 첫 기능 테스트

### 인증

Swagger 오른쪽 위 Authorize를 누르고 아래 토큰만 입력합니다. `Bearer`를 앞에 붙이지 마세요.

```text
local-demo-token-user-a
```

Authorize → Close를 누릅니다. 이 값은 공개된 로컬 시연용 토큰이며 실제 로그인 수단이 아닙니다.

### 온보딩 저장

`PUT /api/v1/me/onboarding` → Try it out → 입력 칸 전체를 아래 JSON으로 교체 → Execute.

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

Server response의 Code 200과 아래 diagnosis 값을 확인합니다.

- experience: new — 자취 6개월 미만
- cooking_environment: microwave_only — 전자레인지만 보유
- cooking_frequency: rare — 주당 요리 0~2일

이는 제품 설정용 임시 규칙이며 건강이나 생활 능력에 대한 전문 진단이 아닙니다.

### 조회

`GET /api/v1/me/onboarding` → Try it out → Execute.
방금 저장한 profile과 diagnosis가 반환되면 저장·조회 성공입니다.
PUT은 전체 교체이므로 일부 필드만 보내면 생략한 항목이 기본값/null로 바뀝니다.

### 홈 확인

`GET /api/v1/me/dashboard`를 실행합니다.
다른 모듈 자료가 아직 없으면 module_status가 missing으로 나오는 것이 정상입니다.

## 5. 다른 파트 예시 데이터 연결

서버를 켜 둔 상태에서 새 터미널을 열고 같은 `jachwi-core` 폴더에서 실행합니다.

```powershell
.\.venv\Scripts\python.exe examples/demo.py
```

이 스크립트는 사용자 A의 온보딩과 예산·계란·분리배출 **샘플 데이터를 덮어씁니다**.
실제 구매 내역이 아닙니다. `.env`의 ENABLE_DEMO_ENDPOINTS=true가 필요합니다.
개발 토큰을 변경했다면 스크립트도 해당 로컬 설정에 맞춰 수정해야 합니다.

다시 dashboard를 조회하면 예산 초과, 계란 추정 소진일 D-1, 분리배출 카드가 표시됩니다.
`GET /api/v1/me/ai-context`에서는 6번에 전달할 데이터를 확인합니다. LLM을 실제 호출하지는 않습니다.

## 6. 팀원별 연결 안내

| 담당 | 확인할 자료 | 연결 지점 |
|---|---|---|
| 1번 | app/schemas.py, app/services.py | 온보딩·규격·조회 통합 |
| 2번 | schemas/SpendingSnapshot.json | 개발용 PUT /api/v1/dev/me/modules/spending |
| 3번 | schemas/InventorySnapshot.json | 개발용 PUT /api/v1/dev/me/modules/inventory |
| 4번 | docs/openapi.json | 온보딩 PUT/GET, dashboard GET |
| 5번 | schemas/LifeSnapshot.json | 개발용 PUT /api/v1/dev/me/modules/life |
| 6번 | docs/team-contract.md | GET /api/v1/me/ai-context |

브라우저 외 API 요청에는 다음 헤더를 사용합니다.

```text
Authorization: Bearer local-demo-token-user-a
Content-Type: application/json
```

4번 Flutter Web은 `http://localhost:5173` 또는 `http://127.0.0.1:5173`에서 실행하도록
포트를 맞추거나 `.env`의 CORS_ORIGINS를 실제 개발 주소에 맞춰 변경하고 서버를 재시작하세요.
CORS 설정은 인증이나 외부 배포를 대신하지 않습니다.

현재 127.0.0.1은 실행 중인 PC 자신입니다. 친구 PC나 iPhone에서 같은 주소를 입력해도
이 서버로 연결되지 않습니다. 기기 테스트는 팀 테스트 서버·HTTPS·인증을 준비한 후 진행합니다.

## 7. 데이터 규칙

- 금액은 원 단위 정수입니다. 문자열 "300000" 대신 숫자 300000을 보냅니다.
- null=미입력, []=확인된 빈 목록, 0=실제 0입니다.
- source_updated_at은 시간대 포함 ISO8601입니다. 예: 2026-09-21T10:00:00+09:00.
- 스냅샷 PUT은 목록 전체를 교체합니다. 일부 페이지만 보내지 마세요.
- 동일 데이터 재전송은 허용하고, 과거 시각 또는 같은 시각의 다른 내용은 409로 거부합니다.
- 현재보다 5분 넘게 미래인 시각은 거부합니다.
- 24시간 초과 자료와 이전 월 소비 자료는 stale입니다. 홈 우선 카드와 AI 입력에서 제외합니다.
- 제품 표시 날짜와 추정 소진일을 구분합니다. 추정 날짜가 섭취 안전을 보장하지 않습니다.

예시 데이터는 현재 시각으로 만들어 보내세요. 고정된 과거 JSON은 stale로 표시될 수 있습니다.

## 8. 저장과 MySQL

기본 모드는 SQLite이며 실행 폴더에 core.db가 생성됩니다. 서버 재시작 후에도 데이터가 유지됩니다.
팀용 MySQL 연결 설정은 README.md를 참고하세요. MySQL 서버·DB·계정은 따로 준비해야 합니다.
SQLite 자료는 MySQL로 자동 이전되지 않습니다.
테이블 최초 생성은 지원하지만 기존 테이블 변경용 마이그레이션은 아직 없습니다.

기존 팀 기획 문서에는 Firebase DB 구상도 있으므로 최종 DB는 팀에서 합의해야 합니다.
이 PR은 FastAPI + SQLAlchemy와 SQLite/MySQL 연결을 기준으로 만든 개발 초안입니다.

## 9. 오류 해결

| 증상 | 확인할 것 |
|---|---|
| requirements.txt가 없다고 나옴 | Get-ChildItem으로 현재 폴더 확인, 안쪽 jachwi-core로 이동 |
| No module named uvicorn | 해당 가상환경에서 pip install -r requirements.txt 성공 여부 |
| /docs가 Not Found | 주소 끝의 별표·한글을 제거하고 정확한 /docs로 접속 |
| 401 | Authorize의 개발 토큰 확인 |
| 온보딩 GET 404 | 같은 사용자로 온보딩을 먼저 저장 |
| 개발용 PUT 404 | ENABLE_DEMO_ENDPOINTS=true 확인 후 서버 재시작 |
| 422 | 응답 error.details의 필드·금액·시간대·날짜 출처 확인 |
| 409 | 최신 스냅샷을 조회하고 출처 시각·내용 충돌 확인 |
| module_status가 missing | 아직 해당 모듈 자료가 저장되지 않음 |
| module_status가 stale | 출처 시각 또는 소비 집계 월 확인 |
| 브라우저 CORS 오류 | Flutter 주소·포트와 CORS_ORIGINS 일치 여부 |
| 포트 8000 사용 중 | 기존 실행 터미널 확인, 불필요한 중복 서버 종료 |

pip의 업데이트 notice나 VS Code의 .env 터미널 주입 안내는 그 자체로 서버 오류가 아닙니다.

## 10. 테스트와 주간 머지

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

제작 당시 Linux/Python 3.12/SQLite에서 16개 테스트와 실제 HTTP 시연을 통과했습니다.
Windows 및 MySQL 테스트는 각 팀 환경에서 별도 확인해야 합니다.

각자 작업 브랜치에서 개발 → PR에 변경 필드·실행법·테스트 결과 작성 → 주간 통합 점검 → main 머지.
규격·DB 변경은 통합일까지 기다리지 말고 팀에 먼저 공유하세요.
.env, core.db, .venv, __pycache__는 Git에 올리지 않습니다. .env.example은 예시 설정으로 공유합니다.

현재 개발 인증과 개발 데이터 쓰기 API는 인터넷 운영용이 아닙니다.
실제 배포 전에 사용자 인증을 연결하고 개발 쓰기 API를 비활성화해야 합니다.
