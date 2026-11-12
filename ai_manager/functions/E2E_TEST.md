# 전체 흐름 테스트 (Firebase 연결·API 키 없이)

로그인 → 앱(UI) 형식 데이터 입력 → 함수 6개 호출 → 결과 확인을 자동으로 돌립니다.
AI는 Mock이라 API 한도를 쓰지 않고, **AI 정상 응답 / AI 실패** 두 경우를 모두 확인합니다.

## 폴더 구조
```
jachi-ai/
├─ firebase.json      ← Emulator 설정 (functions 폴더의 바깥)
├─ .firebaserc        ← 프로젝트 이름 demo-jachi (실제 프로젝트 아님)
└─ functions/
   ├─ .env.local      ← LLM_MOCK=1 (Emulator에서만 적용)
   ├─ .secret.local   ← 가짜 API 키 (Emulator 전용, 실제 키 넣지 말 것)
   ├─ scripts/e2e.ts  ← 테스트 시나리오
   └─ src/...
```

## 1. 빠른 확인 — Emulator 없이 (설치할 것 없음)
```
cd functions
npm install
npm run e2e:local
```
메모리 안의 가짜 DB로 같은 시나리오를 돌립니다. 마지막 줄에 `결과: ✅ 66개 통과 · ❌ 0개 실패`가 나오면 정상.

## 2. 진짜 Emulator로 확인
처음 한 번만:
- Java 11 이상 설치 (`java -version`으로 확인)
- `npm install -g firebase-tools`

실행:
```
cd functions
npm run e2e
```
Emulator(Auth · Firestore · Functions)를 AI 정상 / AI 실패 두 번 띄워 테스트합니다.
첫 실행 때 Firestore Emulator 파일을 자동으로 내려받아요. 로그인(`firebase login`)은 필요 없습니다.

## 앱과 연결해서 직접 눌러 보기
```
cd functions
npm run serve
```
Emulator가 켜진 채로 유지됩니다. 앱에서 Emulator에 연결하면(connectFunctionsEmulator 등) Mock AI로 화면을 확인할 수 있어요.
실제 AI로 바꾸려면 `.env.local`의 `LLM_MOCK=1` 줄을 지우고 `.secret.local`에 실제 키를 넣으면 됩니다 (키는 GitHub에 올리지 마세요).

## 확인하는 것
| 기능 | 확인 내용 |
| --- | --- |
| 공통 | 로그인 안 하면 거절 |
| 오늘 리포트 | 생성·저장, 두 번째는 저장본 재사용, 재생성, AI 실패 시 템플릿(실제 수치) + 저장 안 함 |
| 지난 리포트 | 저장된 리포트 목록 |
| 주간 리포트 | 지난주 지출 합계·전주 대비 %(코드 계산), 기록 안 하는 항목은 null, AI 실패 시 템플릿 |
| AI 채팅 | 답변, 위급 키워드 → 119 안내, 빈 질문·501자 거절, 하루 횟수 초과 |
| 비상매뉴얼 | FAQ 근거 답변 + 119 + 출처, 비로그인 → FAQ 원문, 맞는 FAQ 없음, draft FAQ 미사용 |
| 레시피 | 소비기한 지난 재료 제외, 임박 재료 사용, 차감용 inventory_id, 없는 재료 지정 |
| 새 사용자 | 진단·기록 없어도 에러 없이 동작 |
