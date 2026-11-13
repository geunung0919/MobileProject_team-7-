# AI 자취 매니저 연결 (MODULE 5)

UIUX 앱에서 AI 서버(`ai_manager/functions`)를 부르는 코드입니다.
**Firebase 설정(.env)이 없으면 모든 화면이 지금처럼 더미 데이터로 동작**하므로, 이 코드를 넣어도 UI 작업에는 영향이 없습니다.

## 새로 추가한 파일

| 파일 | 역할 |
|---|---|
| `src/api/firebase.js` | Firebase 연결, `callAi(함수이름, 데이터)`. Emulator 사용 시 익명 로그인 |
| `src/api/aiManager.js` | 서버 함수 6개를 부르는 함수 (오늘 리포트는 한 번만 요청해서 여러 화면이 공유) |
| `src/api/aiFormat.js` | 서버 응답 → 화면 형식 변환 (채팅 기록, 레시피, 비상 안내) |
| `src/hooks/useAi.js` | `useTodayReport()`, `useServerRecipes()` |
| `.env.example` | 설정 예시 (복사해서 `.env`로 사용) |

## 수정한 화면 (최소 수정)

| 화면 | 바뀐 점 | 서버 없을 때 |
|---|---|---|
| HomeScreen | 상단 문구 = AI 오늘 한마디 | 기존 문구 |
| AiManagerScreen | AI 한마디 카드, 채팅 답변 = 서버 | 기존 getReply |
| ReportDetailScreen | **이번 달**만 코멘트·팁 = AI (숫자는 기존 계산 그대로) | 기존 더미 |
| EmergencyAiScreen | 답변 = 서버, 전화·상세 버튼은 기존 상황 데이터 사용 | 기존 키워드 응답 |
| RecipeListScreen / RecipeDetailScreen | 레시피 목록 = 서버 추천 | 기존 recipeData |
| package.json | `firebase` 추가 | - |

**연결하지 않은 화면: ReportListScreen** — 화면은 월별 리포트인데 서버에는 일간·주간 리포트만 있습니다. 월간 리포트 저장(`ai_monthly_reports/{YYYY-MM}`)을 서버에 추가한 뒤 연결할 예정입니다.

## 실행 방법

```bash
# 1. UIUX 폴더에서
npx expo install firebase
cp .env.example .env        # Windows: copy .env.example .env

# 2. 다른 터미널에서 AI 서버 Emulator 실행
cd ai_manager/functions
npm install
npm run serve

# 3. 앱 실행
npx expo start
```

- 실제 기기에서 테스트하면 `.env`의 `EXPO_PUBLIC_EMULATOR_HOST`를 PC의 IP로 바꿉니다.
- 팀 Firebase 프로젝트가 생기면 `.env`의 프로젝트 정보를 바꾸고 `EXPO_PUBLIC_USE_EMULATOR=false`로 둡니다.
- **API 키는 앱 `.env`에 넣지 않습니다.** (`EXPO_PUBLIC_` 값은 앱에 그대로 포함됨) AI 키는 서버의 Firebase Secret에만 둡니다.

## 팀 확인 요청

- **UI 담당**: 위 화면 수정이 이후 UI 변경과 겹치지 않는지 확인 부탁드립니다.
- **비상 매뉴얼 데이터(emergency_faq)**: 문서 id를 UI 상황 id와 같게 해 주시면 전화·상세 버튼이 자동으로 연결됩니다.
  `fire, crime, disaster, patient, leak, power, pest, lost`
