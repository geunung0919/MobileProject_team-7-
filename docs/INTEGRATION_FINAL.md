# 최종 통합 브랜치 (integration/final) 정리

기준: `feature/receipt-shared-firestore` (Firebase Cloud Functions + UIUX + 지도 + AI) 위에 아래를 병합했습니다.

| 병합한 것 | 방법 | 비고 |
| --- | --- | --- |
| `feature/firebase-auth-signup` | git merge (충돌 6개 해결) | 닉네임 중복 검사·보안 세션 저장소. 화면 자유 입력 지역(region)은 계속 저장 |
| `feature/module3` | git merge (충돌 1개) | 별도 폴더로 추가됨. UIUX 냉장고 화면과의 연결은 아직 안 함 |
| `UIUX-Edit` | **파일 단위 3-way 병합** | 루트에 통째로 올라온 복사본이라 git merge 불가. 아래 참고 |
| `feature/ai_manager` | 병합 안 함 | 이미 이 기준 브랜치에 내용이 들어 있음 |

## UIUX-Edit 병합 방식
UIUX-Edit은 `UIUX/` 폴더를 지우고 앱을 저장소 루트에 올린 브랜치입니다. 그대로 병합하면 루트 `App.js`를 덮어쓰기 때문에,
기준 브랜치의 UIUX와 가장 비슷한 main 이력 시점(`388cdf7`, 11/6)을 공통 조상으로 잡고 `UIUX/` 안에서만 파일별로 3-way 병합했습니다.

- 새로 들어온 화면: Welcome, Login, SignUp, ProfileSetup, LifeData, FridgeDiscard, ReportList/Detail
- 새 컴포넌트·데이터: AppText, AiSayCard, ChoiceGrid 등, `data/auth`, `data/more/lifeData`, `utils/spendingAnalysis` 등
- 디자인만 바뀐 파일 55개는 UIUX-Edit 버전을 채택 (기준 브랜치에서 수정한 적 없는 파일)
- 두 쪽이 모두 고친 파일은 서버 연결 동작은 유지하고 UIUX-Edit의 디자인·문구를 반영
  - `HomeScreen`, `SpendingScreen`, `SpendingAnalysisScreen`, `MoreScreen`, `FridgeAddScreen`, `recipes.js`, `AnalysisSummaryCard`
- 지도·비상매뉴얼·AI 화면은 기준 브랜치(서버 연결 포함) 버전을 유지 → **UIUX-Edit에서 이 화면들에 한 디자인 수정은 반영되지 않았습니다**
  - `SurvivalMapScreen`, `EmergencyScreen`, `EmergencyDetailScreen`, `EmergencyAiScreen`, `SearchBar`, `AiManagerScreen`, `data/lifeInfo/emergency.js`, `aiEmergency.js`

## 확인한 것
- 병합 후 `auth` 19개, `mobile` 66개, `functions` 29개 테스트 통과, `functions` eslint 통과, AI `tsc` 통과
- `UIUX` 상대 경로 import 누락 없음, Android Expo 번들 빌드 성공 (`EXPO_PUBLIC_SHARED_RECEIPTS=true`)
- 실제 기기·에뮬레이터 실행, Firebase 연결, Claude 호출은 확인하지 못했습니다.

## 남은 작업
1. **로그인 화면 연결**: UIUX-Edit의 Login/SignUp/ProfileSetup 화면은 아직 가짜 로그인(화면 이동만)입니다.
   `auth/UI_CONNECT.md`와 `AuthContext`(`signIn`, `signUp`, `completeOnboarding`)로 연결하고, 서버 모드의 `SharedLogin`(AuthTestScreen)을 대체하세요.
2. **시작 화면**: 네비게이터에 Welcome이 들어왔으므로 서버 모드에서 로그인 상태에 따라 첫 화면을 정하세요.
3. ~~냉장고 폐기(FridgeDiscard)~~ 완료: 서버 모드에서 `POST /refrigerator/items/use`(action=discard|cook, 버전 검사, 수량·잔여금액 차감, `fridgeLogs/{requestId}` 기록, 멱등)로 처리. `amount` 를 주면 일부 차감도 가능(앱 화면은 아직 전량만 사용). 레시피 '요리 완료'의 재료 제거도 동일.
4. **module3**: 서버의 단위(개/봉/모/팩/병/캔/g/kg/ml/L)·보관(refrigerated/frozen/room)·기한유형(package/reference/unknown) 값이 module3와 같아 변환 어댑터는 필요 없음. 아직 서버 API가 없는 module3 기능(요리 부분 차감, 폐기 기록, 되돌리기, 장보기, 식사 기록)은 서버 API부터 만들어야 연결 가능.
5. UIUX-Edit의 지도·비상매뉴얼·AI 화면 디자인 수정 반영 (담당자 확인 후).
6. main 처리: `git merge -s ours origin/main` 후 main 교체 (main에만 있는 `jachwi-core`/`mobile` 작업이 더 필요한지 먼저 확인).
7. 실제 Firebase 프로젝트 설정, `ANTHROPIC_API_KEY` 시크릿, `emergency_faq` 시드, 에뮬레이터 E2E.
