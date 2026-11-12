# 자취메이트 · AI 자취 매니저 서버 (MODULE 5)

> **상태: 작업 중 (main 병합 전)**
> 지금 코드는 Firebase(Functions·Firestore) 기준으로 만든 첫 버전입니다.
> 프롬프트·검증·AI 호출 로직은 그대로 쓰고, 데이터를 받는 곳과 실행 방식만 바뀝니다. core 코드는 수정하지 않습니다.

Firebase Cloud Functions(Node.js, TypeScript) 서버입니다. 앱이 부르는 AI 함수 6개를 제공합니다.

| 함수 | 설계 문서 | 하는 일 |
| --- | --- | --- |
| `generateDailyReport` | POST /ai/report | 오늘의 AI 리포트 (홈 '오늘의 한마디'), 하루 1회 생성 후 저장본 재사용 |
| `listReports` | 지난 리포트 | 저장된 일별 리포트 목록 |
| `generateWeeklyReport` | 주간 리포트 | 지난주(월~일) 수치는 코드 계산, 문장만 AI |
| `askAiManager` | POST /ai/chat | AI 자취 매니저 채팅 + 바로가기 버튼 |
| `askEmergencyManual` | 비상매뉴얼 AI | 검증된 FAQ 안에서만 답변, 위급하면 119 우선 |
| `recommendRecipes` | AI 레시피 | 냉장고 재료로 레시피 추천 (재고 차감·저장 안 함) |

원칙: **숫자는 코드가 계산하고 AI는 문장만 쓴다. AI 답변은 코드가 검증한 뒤에만 보여준다.**
(데이터에 없는 금액·연락처, 없는 재료·도구, 소비기한 지난 재료 등은 차단 → 재시도 → 실패 시 템플릿)

## 실행 (API 키 없이)
```
cd functions
npm install            # PowerShell 에서 막히면 npm.cmd install
npm run sample         # 계산·검증 확인
npm run e2e:local      # 전체 흐름 테스트 (메모리 DB, Mock AI)
npm run e2e            # 진짜 Firebase Emulator 로 전체 흐름 테스트 (Java 11+, firebase-tools 필요)
npm run serve          # Emulator 켜 두기 (앱 연결용, Mock AI)
```
실제 AI 출력 확인은 `functions/.env.eval.example` 을 `.env.eval` 로 복사해 키를 넣고 `npm run eval` (Groq 무료 키 또는 Claude 키).
자세한 내용: `functions/E2E_TEST.md`, 레시피 API: `functions/RECIPE_API.md`

## 파일 구조 (functions/src)
| 구분 | 파일 | 역할 |
| --- | --- | --- |
| 입구 | `index.ts` | 앱이 부르는 함수 6개 (로그인 확인 → 데이터 → 기능 → 저장 → 응답) |
| 데이터 | `data.ts` | Firestore 경로(`PATHS`)·읽기·하루 사용 횟수 제한 |
| | `adapters.ts` | 앱(UI) 데이터 형식 → 서버 형식 변환, 아직 앱이 저장 안 하는 기록 설정(`DATA_SOURCE`) |
| | `profile.ts` | 30초 자취 진단 결과 정리 |
| 리포트 | `analyze.ts` · `prompt.ts` · `generate.ts` | 숫자 계산·인사이트 / 프롬프트 / AI 호출·템플릿 |
| 주간 | `weekly.ts` | 지난주 계산·프롬프트·검증·템플릿 |
| 채팅 | `chatRules.ts` · `chat.ts` | 프롬프트·바로가기 버튼·연락처 검증 / AI 호출·금액 검증 |
| 비상매뉴얼 | `emergencyRules.ts` · `emergency.ts` | FAQ 검색·프롬프트·검증 / AI 호출 |
| 레시피 | `recipeRules.ts` · `recipe.ts` | 조건 정리·프롬프트·검증 / AI 호출 |
| 공통 | `llm.ts` | AI 호출 단일 창구 (Claude / Groq / Mock) |
| | `validate.ts` · `common.ts` · `types.ts` | 숫자 검증 / 위급 키워드 / 데이터 형식 |
| 테스트 | `fixtures.ts` · `samples.ts` · `eval.ts`, `scripts/` | 테스트 데이터 / 오프라인 검증 / 실제 AI 확인 / 전체 흐름 |

## 고칠 곳 빠른 안내
| 상황 | 파일 |
| --- | --- |
| 앱 데이터 필드 이름이 바뀜 | `adapters.ts` |
| Firestore 컬렉션 이름 확정 | `data.ts` 의 `PATHS` |
| 진단 화면 선택지 변경 | `profile.ts` |
| 앱이 요리·루틴 기록을 저장하기 시작 | `adapters.ts` 의 `DATA_SOURCE` |
| 프롬프트 수정 | `prompt.ts`, `chatRules.ts`, `weekly.ts`, `recipeRules.ts`, `emergencyRules.ts` |
| AI 모델·제공자 | `llm.ts` (`LLM_PROVIDER`, `LLM_MODEL`) |

## 키 관리
API 키는 절대 커밋하지 않습니다. `.env.eval`, `.secret.local`, `.env.local` 은 `.gitignore` 에 있습니다.
배포 시에는 `firebase functions:secrets:set ANTHROPIC_API_KEY` 로 등록합니다.
