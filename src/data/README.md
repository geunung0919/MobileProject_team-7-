# src/data — 탭별 데이터 폴더

화면에 보이는 문구와 더미 데이터는 모두 이 폴더에 있어요. 탭마다 폴더가 나뉘어 있어서, 바꾸고 싶은 화면의 폴더만 열면 됩니다.
(실제 서버/Firebase 를 연결하면 이 파일들의 더미 값을 서버에서 받은 값으로 바꾸게 됩니다.)

| 폴더 | 탭 | 파일 | 들어 있는 것 |
| --- | --- | --- | --- |
| `home/` | 홈 | `home.js` | 홈 화면의 AI 한마디, 카드 제목 |
| `spending/` | 소비 | `spending.js` | 소비 내역(더미), 예산, 카테고리 |
| | | `spendingDetail.js` | 지출 상세 화면 문구 |
| | | `spendingAnalysis.js` | 소비 분석 화면 문구, 카테고리 색상, 월별 비교 개월 수 |
| | | `spendingAll.js` | 소비 전체보기 화면 문구 |
| | | `receipt.js` | 영수증 인식 결과 형식과 샘플 |
| `fridge/` | 냉장고 | `fridge.js` | 식재료 목록(더미), 단위 목록, 임박 기준일 |
| | | `recipes.js` | AI 레시피 추천 데이터와 문구 |
| `lifeInfo/` | 생활정보 | `lifeInfo.js` | 생활정보 탭의 카드와 메뉴 |
| | | `todos.js` | 할 일 (더미) |
| | | `routines.js` | 생활 루틴 (더미) |
| | | `emergency.js`, `emergencyGuides.js` | 비상매뉴얼 상황 목록, 상황별 대처 |
| | | `survivalMap.js` | 자취생존맵 장소 데이터 |
| | | `aiManager.js` | AI 자취 매니저 문구와 답변 |
| `more/` | 더보기 | `more.js` | 더보기 탭 메뉴 문구 |
| | | `account.js` | 프로필, 설정, 도움말 데이터 |

## 새 데이터 파일을 만들 때
1. 어느 탭 화면에서 쓰는지 정해서 그 탭 폴더 안에 파일을 만드세요. (예: 냉장고 화면 → `fridge/`)
2. 화면에서는 `import { 이름 } from '../data/폴더/파일';` 로 불러옵니다.
3. 두 탭 이상이 같이 쓰는 데이터라면 처음 만든 탭 폴더에 두고 필요한 곳에서 불러오면 돼요.

---

# 서버(Firebase 등) 연동 가이드

## 한눈에 보기
데이터는 두 곳에 있어요.

| 위치 | 역할 |
| --- | --- |
| `src/data/` (이 폴더) | 더미 데이터와 화면 문구, 선택지(단위 목록, 임박 기준일 등) |
| `src/store/AppDataContext.js` | **앱 전체가 함께 쓰는 저장소.** 화면은 모두 `useAppData()` 로 여기서 읽고 씁니다. |

**서버를 연결할 때는 `AppDataContext.js` 만 고치면 됩니다.** `screens/`, `components/` 는 건드리지 않아도 돼요.
홈 화면의 숫자(남은 예산, 기한 임박 개수, 남은 할 일 등)는 저장소 값으로 `utils/homeSummary.js` 가 계산하기 때문에 따로 고칠 필요가 없습니다.

## 어디를 고치나요
| 하는 일 | 고칠 곳 |
| --- | --- |
| 서버에서 불러오기 | `AppDataContext.js` 위쪽의 `useState(...)` 초기값. 지금은 더미 데이터를 넣고 있어요. |
| 저장 / 수정 / 삭제 | `AppDataContext.js` 의 함수 안 (아래 표). 서버에 쓰는 코드를 추가하면 됩니다. |
| 로그인한 사용자 정보 | `profile`, `settings` 의 초기값 (더미는 `more/account.js` 의 `initial`) |

저장소가 가진 데이터와 함수:

| 데이터 | 함수 |
| --- | --- |
| `transactions` (소비) | `addTransaction`, `updateTransaction`, `removeTransaction` |
| `fridgeItems` (식재료) | `addFridgeItem`, `updateFridgeItem`, `removeFridgeItem` |
| `todos` (할 일) | `addTodo`, `toggleTodo` |
| `routines` (생활 루틴) | `addRoutine`, `toggleRoutine` |
| `profile`, `settings` | `updateProfile`, `updateSetting` |

> 할 일 / 루틴의 수정·삭제 함수는 아직 없어요. 필요해지면 같은 방식으로 추가하세요.

## 서버 데이터 형식
- 날짜는 `"YYYY-MM-DD"` 문자열, 루틴 시간은 `"HH:mm"` (24시간제) 문자열입니다.
- 더미 파일의 `daysAgo`, `daysFromToday` 는 "오늘 기준 며칠 전/후"를 뜻하는 **더미 전용 값**이에요. 앱을 언제 열어도 같은 화면이 나오게 하려고 쓴 것이고, `AppDataContext.js` 가 시작할 때 실제 날짜로 바꿔 줍니다. **실제 데이터에는 `date`, `expiry`, `due` 를 직접 넣으세요.**
- 항목마다 필요한 필드는 `AppDataContext.js` 의 각 `add...` 함수 위 주석에 적혀 있습니다.

| 데이터 | 필드 |
| --- | --- |
| 소비 | `id`, `title`, `amount`(숫자), `date`, `category`, `icon`, `source`('receipt' 이면 영수증 지출), `items`(구매 품목) |
| 구매 품목 (`items`) | `id`, `name`, `unitPrice`, `quantity`, `inFridge` |
| 식재료 | `id`, `name`, `quantity`(화면에 보이는 글자), `amount`(숫자), `unit`, `purchaseDate`, `expiry`, `icon` |
| 할 일 | `id`, `title`, `due`(없으면 `null`), `done` |
| 루틴 | `id`, `title`, `time`, `doneToday` |

## 루틴 "오늘 완료" 초기화
루틴은 매일 반복되므로 날짜가 바뀌면 `doneToday` 를 모두 `false` 로 되돌립니다 (`AppDataContext.js` 의 `resetRoutinesIfNewDay`).
서버에 완료 기록을 날짜별로 저장한다면, 이 초기화는 서버 기준으로 바꾸세요.

## 저장소와 아직 연결되지 않은 부분
아래는 저장소를 거치지 않고 `data/` 의 파일 값을 그대로 보여줘요. 서버/AI 를 붙일 때 따로 교체해야 합니다.

| 화면 | 파일 | 설명 |
| --- | --- | --- |
| 월 예산 | `spending/spending.js` 의 `budget` | 소비 탭과 홈이 같이 씁니다. 사용자마다 예산이 다르다면 저장소로 옮기세요. |
| 영수증 인식 | `spending/receipt.js` | 카메라 화면이 아직 없어서 샘플 결과를 보여줍니다. 카메라가 인식한 결과를 `navigate('ReceiptResult', { receipt })` 로 넘기면 됩니다. |
| AI 레시피 추천 | `fridge/recipes.js` | 정적 레시피 데이터입니다. |
| AI 자취 매니저 | `lifeInfo/aiManager.js` | 정적 문구와 답변입니다. 실제 AI 응답으로 교체하세요. |
| 자취생존맵 | `lifeInfo/survivalMap.js` | 정적 장소 데이터입니다. 지도 API 로 교체하세요. |
| 비상 매뉴얼 | `lifeInfo/emergency.js`, `emergencyGuides.js` | 정적 내용입니다. |

## 연동할 때 지켜 주세요
- 화면 코드에서 `data/` 의 더미 값을 직접 읽지 마세요. 서버 값이 바뀌어도 화면에 반영되지 않아요. 문구와 선택지(단위 목록 등)는 `data/` 에서 읽어도 괜찮습니다.
- 데이터를 추가하거나 바꾸는 코드는 화면이 아니라 `AppDataContext.js` 의 함수 안에 두세요. 그래야 홈 화면 숫자와 다른 탭이 함께 갱신됩니다.
