# 2번 소비 관리 실행 안내

친구의 `feature/core-onboarding` 브랜치 위에서 개발했습니다.
`main`에 온보딩이 아직 없으므로 이번 PR의 기준 브랜치는 `feature/core-onboarding`입니다.

## Windows PowerShell 실행

저장소 폴더에서:

```powershell
git fetch origin
git switch feature/fintech-basic
cd jachwi-core
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
# .env가 없는 경우에만 복사. 기존 설정은 유지하세요.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python -m uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

브라우저에서 http://127.0.0.1:8000/spending 접속.
.env.example을 그대로 복사한 로컬 환경에서는 `local-demo-token-user-a`를 입력하고 연결합니다.
기존 서버를 쓰는 경우 해당 서버에 설정한 개발 토큰을 사용합니다.

## 온보딩부터 확인

1. http://127.0.0.1:8000/docs 접속 → Authorize에 같은 토큰 입력.
2. `PUT /api/v1/me/onboarding`에서 예: `{"monthly_budget_krw":300000}` 저장.
   전체 교체 API이므로 기존 프로필을 유지하려면 GET 결과의 profile을 가져와 예산만 수정해 PUT하세요.
3. `/spending`에서 연결 → 온보딩 예산 불러오기 → 예산 저장.
4. 지출 등록 후 잔액 변화 확인, 수정·삭제 확인.
5. 예산을 초과하도록 지출을 등록하고 ‘팀 대시보드 연결’ 확인.

이 페이지는 모바일 반응형 **개발 확인용 웹 화면**입니다. Flutter 앱 화면은 별도 연결이 필요합니다.
자동 결제 수집·OCR·기기 푸시·재고 연동은 아직 구현하지 않았습니다.

## 앱 연결 API

모든 API에 `Authorization: Bearer <서버 개발 토큰>` 필요.
사용자 ID는 클라이언트가 보내지 않고 기존 인증 의존성에서 결정합니다.

| 메서드 | 경로 | 입력/역할 |
|---|---|---|
| GET | /api/v1/me/spending?period=2026-09 | 월 요약, 소비 목록, 경고, 온보딩 제안 예산 |
| PUT | /api/v1/me/spending/budgets/{YYYY-MM} | `{"budget_krw":300000}`; null이면 해제 |
| POST | /api/v1/me/spending/expenses | title, amount_krw, spent_on(YYYY-MM-DD), category |
| PUT | /api/v1/me/spending/expenses/{id} | 위 지출 필드 전체 교체 |
| DELETE | /api/v1/me/spending/expenses/{id} | 본인 지출 삭제 |

category: food / groceries / living / transport / other.
금액은 원 단위 정수. 지출은 양수. 월 예산·누적 지출 상한은 공통 규격의 10억원.
warning: unset / normal / near_limit(80% 이상) / reached / exceeded.
월 기준은 한국 시간. 다른 월 내역은 현재 월 합계에서 제외.

## 팀 연결과 저장 규칙

- 온보딩 예산은 제안값이며 확인 후 월별 예산에 적용. 온보딩 원본을 변경하지 않음.
- 새 `fintech_ledgers` 테이블에 사용자별 원장을 저장. 시작할 때 생성됩니다.
- 대시보드 및 AI context 조회 시 2번 모듈 함수가 현재 월 SpendingSnapshot을 생성해 전달.
- 소비 원장이 있는 사용자에 대해서는 원장이 개발용 spending 스냅샷보다 우선합니다.
- source_updated_at은 마지막 원장 변경 시각이며 조회만으로 갱신하지 않음.
  기존 코어의 24시간 stale 정책은 유지하므로 오래된 데이터는 AI context에서 제외됩니다.
- 업데이트는 SQLAlchemy 버전 검사로 동시 수정 유실 방지. 충돌은 409, 재조회 후 재시도.
- 아직 실제 사용자 인증이 아닌 기존 개발용 토큰 방식. localhost 개발용으로 실행하세요.
- 초기 소규모 MVP의 JSON 원장입니다. 대량 데이터·페이지네이션·결제 자동 수집 중복 방지는 후속 범위.

## 검증

`python -m pytest -q`: 온보딩 회귀 및 소비 등록/수정/삭제, 예산 확인 적용,
사용자 격리, 월 구분, 입력 검증, 상한 초과 롤백, 재시작 영속성, 타임스탬프 검증.
웹 화면 스크립트는 Node 구문 검사. 실제 모바일/Flutter 기기 검증은 미실시.
