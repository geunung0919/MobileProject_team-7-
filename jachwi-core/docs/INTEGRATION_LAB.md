# 혼자 확인하는 중앙 코어 연동

팀원 코드 없이 정상·미수신·오래된 자료·빈 자료를 입력해 통합 현황과 AI 전달 필터를 검사합니다.
매번 임시 SQLite DB를 만들고 종료 시 지웁니다. 기존 core.db나 .env는 수정하지 않습니다.

jachwi-core 폴더에서 실행:

```powershell
.\.venv\Scripts\python.exe examples\integration_lab.py
```

normal / missing / stale / empty 4줄이 모두 PASS이면 검사 통과입니다. 오류는 비정상 종료로 표시합니다.
normal은 예산 초과·임박 재료·미완료 루틴 카드를 표시합니다.
missing은 미수신, stale은 2일 지난 정보이며 둘 다 AI에 모듈 내용을 전달하지 않습니다.
empty는 실제로 전달된 빈 목록이며 미수신과 구분합니다.

## Swagger 시연

```powershell
.\.venv\Scripts\python.exe examples\integration_lab.py --serve
```

http://127.0.0.1:8001/docs 에서 Authorize에 아래 토큰 중 하나를 입력합니다.

- local-lab-token-normal
- local-lab-token-missing
- local-lab-token-stale
- local-lab-token-empty

GET /api/v1/me/dashboard와 GET /api/v1/me/ai-context를 비교합니다.
다시 시작하면 새로운 DB로 초기화됩니다. 기존 스냅샷 수정 시 source_updated_at을 갱신하세요.

## 아이폰 연결

같은 Wi-Fi에서 --serve --host 0.0.0.0 옵션으로 실행하고 앱 서버 주소에 PC의 IPv4와 8001 포트를 입력합니다.
공개 개발 토큰이므로 신뢰하는 사설 네트워크에서만 사용합니다.
현재 앱 연결은 소비 API를 먼저 호출합니다. 소비 원장이 생성되면 소비 스냅샷보다 실제 원장이 우선하므로
소비 사례의 정확한 비교는 Swagger로 진행하세요. 앱에서는 재고·생활 상태를 비교할 수 있습니다.

이 도구는 중앙 코어의 연결 계약을 검사합니다. 팀원 실제 기능, MySQL, 실제 로그인, LLM 호출,
아이폰 터치 동작을 검증한 것은 아닙니다.
