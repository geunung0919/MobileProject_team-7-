# 자취메이트 — 팀 UI 통합 앱 (Expo SDK 54)

처음 실행하면 로그인 → 최초 사용자 온보딩 → 팀원이 제작한 홈/소비/냉장고/생활정보/더보기 UI로 이동합니다.

## 팀원 안내: 다른 모듈 파일을 고친 부분 (각자 최신 작업으로 덮어써도 됩니다)
1번 모듈(이현동)을 연결하면서 아래 파일을 함께 고쳤습니다. 담당자가 더 최신으로 작업한 버전이 있으면 **그대로 덮어써 주세요.**

| 담당 | 파일 (`src/` 기준) | 통합 때 바꾼 내용 |
|---|---|---|
| 김선웅 (소비·OCR) | `screens/SpendingScreen.js`, `screens/SpendingAnalysisScreen.js`, `components/BudgetCard.js`, `components/AnalysisSummaryCard.js` | 예산을 온보딩 월 예산(`monthly_budget_krw`)으로 바꾸고 미입력은 '미설정' 표시 |
| 김선웅 (소비·OCR) | `screens/ReceiptCaptureScreen.js`(새 파일), `screens/ReceiptResultScreen.js`, `utils/purchaseItems.js` | 촬영 → 서버 OCR 연결, 샘플 영수증 대신 빈 영수증. **필요 없으면 지워도 됩니다** |
| 최연규 (홈) | `screens/HomeScreen.js`, `utils/homeSummary.js` | 예산 '미설정' 표시 |
| 양민혁 (냉장고) | `screens/FridgeAddScreen.js`, `utils/recipes.js` | 소비기한이 없을 때 '날짜 미입력' |
| 정진혁 (AI) | `data/lifeInfo/aiManager.js` | 안내 문구 1줄 |
| 공통 | `utils/format.js` | 빈 날짜를 '미입력'으로 표시 |

주의
- `ReceiptCaptureScreen.js`를 지우면 `navigation/RootNavigator.js`에서 그 화면의 `import` 줄과 `<Stack.Screen name="ReceiptCapture" …/>` 줄도 함께 지워 주세요. 소비 탭 버튼은 원래처럼 `ReceiptResult`로 연결하면 됩니다.
- 예산을 소비 모듈 값으로 되돌리면 `utils/homeSummary.js`와 예산 카드가 `null`(미설정)을 받지 않게 되니 함께 맞춰 주세요.
- **`App.js`, `navigation/RootNavigator.js`, `store/AppDataContext.js`, `store/AuthContext.js`는 통째로 덮어쓰지 마세요.** 로그인 → 프로필 → 진단 → 홈 분기와 계정별 저장이 들어 있습니다. 필요한 부분만 고쳐 주세요.
- 서버 `jachwi-core/app/ui_state.py`는 앱의 소비·냉장고 데이터를 기존 가계부(Ledger)·재고(Inventory) 테이블에도 저장합니다. 소비·냉장고 담당이 저장 방식을 바꾸려면 이현동에게 알려 주세요.

## Snack에 넣기
1. 새 Snack을 만들고 SDK 54를 선택합니다. 휴대폰 Expo Go도 SDK 54 호환 버전이어야 합니다.
2. **이 UIUX 폴더 안의** `App.js`, `package.json`, `src` 전체를 같은 경로로 넣습니다. 기존 파일 위에 일부만 덮어쓰지 마세요.
3. `package.json`의 dependencies를 그대로 사용합니다. 폴더 전체 ZIP 가져오기를 이용한다면 UIUX만 압축한 `snack-ui-complete.zip`을 사용합니다.
4. `jachwi-core`, `mobile`, `.env`, `node_modules`는 Snack에 넣지 않습니다.
5. 휴대폰 Expo Go에서 실행하고 `서버 없이 UI·온보딩 시연`을 누르면 서버 없이 화면을 확인할 수 있습니다. 이 모드에서도 사진 선택은 가능하나 OCR 분석은 서버 연결이 필요합니다.
6. 실제 데이터는 서버 주소와 개발 토큰으로 연결하거나 Google 로그인합니다. 개발 토큰으로 로그인하더라도 신규 계정이면 온보딩이 나옵니다.

## 로컬 실행
```sh
npm ci
npx expo start
```
웹: `npx expo start --web`. 앱 등록/카메라 권한 문구는 app.json에서 설정합니다.

## Google 로그인
서버는 `../jachwi-core`입니다. 루트 `INTEGRATED_SETUP.md`의 Google 설정을 완료해야 합니다.
앱에서 HTTPS 서버 주소 입력 → Google 계정으로 로그인 → 외부 브라우저에서 인증 → 앱으로 복귀.
인증 시크릿은 서버에만 있으며 Snack 소스에 넣지 않습니다. 로그인 세션은 iOS·Android에서 기기 안전 저장소(expo-secure-store: Keychain/Keystore)에 저장해 앱을 다시 열어도 유지하고(AC-02), 시작할 때 서버에서 유효한지 다시 확인합니다. 만료(24시간)·폐기된 세션은 지우고 다시 로그인하게 하며, 서버 연결 실패 시에는 세션을 지우지 않고 '다시 시도'를 보여 줍니다. 웹 미리보기에는 안전 저장소가 없어 브라우저 저장소를 쓰므로 웹은 시연용으로만 씁니다. 로그아웃하면 서버 세션 폐기·기기 세션 삭제·메모리 데이터 초기화를 합니다(AC-10).
웹 미리보기에서 서버를 부를 때 CORS 오류가 나면 서버의 `CORS_ORIGINS` 또는 `CORS_ORIGIN_REGEX`에 미리보기 Origin을 추가합니다. 휴대폰 Expo Go는 해당 없음.

## 아이디·비밀번호 로그인 (Firebase)
로그인 화면 맨 위의 아이디·비밀번호 로그인과 **회원가입**은 Firebase Authentication(이메일 방식)을 씁니다.
- 아이디: 영문 소문자로 시작, 영문·숫자·밑줄 4~20자. 로그인용이며 닉네임과 별개입니다(닉네임은 가입 후 프로필에서 정함). 내부적으로 `아이디@users.jachwimate.app` 형식으로 저장하고 메일은 보내지 않습니다 → **이메일로 비밀번호 찾기는 안 됩니다.**
- 비밀번호: 8~64자, 입력하는 동안 강도(약함·보통·강함·매우 강함)를 보여 주고 '보통' 이상만 가입됩니다.
- 생년월일: 연도·월·일을 고르는 시트(`components/BirthDatePicker.js`). 만 14세 미만은 가입을 받지 않습니다.
- 오류: 각 입력 칸 바로 아래에 표시합니다. 로그인 실패는 아이디와 비밀번호 중 무엇이 틀렸는지 알려 주지 않습니다.
- 저장: Firestore `users/{uid}`(account·member·profile), 닉네임 중복 방지용 `nicknames/{키}`. 규칙 초안은 `firebase/firestore.rules`.
- 설정: `.env.example`을 `.env`로 복사해 Firebase 웹 앱 설정값을 넣습니다. Snack은 `src/services/firebaseConfig.js`의 빈 값에 넣습니다. 값이 없으면 아이디 로그인은 "설정이 없어요" 안내만 보이고 Google·개발 서버·시연 로그인은 그대로 됩니다.
- 이 계정의 소비·냉장고·할 일 데이터는 아직 기기에만 저장합니다(각 모듈의 Firestore 저장은 담당자가 정함). 영수증 OCR 등 중앙 서버 기능은 쓸 수 없습니다.
- 규칙 테스트: `node --test UIUX/tests/authRules.test.mjs`

## OCR
소비 → + → 영수증 촬영하기 / 사진에서 선택하기 → 카메라 열기 / 사진 선택 → OCR 원문 확인 → 상호/금액/품목 수정 → 저장.
서버가 상호/날짜/총액을 추출합니다. **품목별 이름/수량/가격 자동 추출은 아직 없으며 사용자가 추가합니다.**
선택한 사진은 JPEG로 변환·축소한 뒤 서버에 보내며 서버 OCR은 사진을 영구 저장하지 않습니다.
식품 체크한 품목은 냉장고에 추가됩니다. 자동 보관 날짜는 추정값이므로 실제 포장 표시를 확인합니다.

## 저장 범위
Google/개발 로그인: UI 상태가 사용자별 서버 DB에 저장됩니다. 소비는 기존 가계부 원장, 식재료는 기존 중앙 재고 API와 연결됩니다. 온보딩 예산은 홈/소비에 즉시 반영합니다.
시연 로그인: 데이터는 기기 AsyncStorage에 보관됩니다. 샘플 지출이 실제 데이터에 섞이지 않도록 빈 목록에서 시작합니다.
시연 로그인의 온보딩 입력도 기기에 저장되고, 진단은 서버와 같은 규칙(`src/utils/diagnosis.js`)으로 계산합니다.
온보딩 저장 후 진단 결과(자취 경험·조리 환경·요리 빈도·예산·추천 할 일)를 보여 주고 홈으로 이동합니다.
월 예산을 비워 두면 홈·소비 탭·소비 분석에 '미설정'으로 표시합니다. 직접 입력한 0원과 구분합니다. (AI 매니저·리포트 화면의 예산은 AI 모듈 담당이며 아직 고정값입니다.)
조리 도구는 아무것도 고르지 않으면 '미입력', '조리 도구 없음'을 고르면 '없음'으로 저장합니다.
첫 가입 순서: 로그인 → 프로필 만들기(닉네임·거주 지역) → 30초 자취 진단 → 진단 결과 → 홈.
- 닉네임(AC-05~07): 앞뒤 공백 제거, 한글 완성형·영문·숫자 2~10자, 공백·특수문자 불가. 앱(`utils/nickname.js`)과 서버가 같은 규칙. 입력이 멈추면 서버에서 중복 확인하고, 저장할 때 서버 DB의 유일 제약으로 동시 가입도 막습니다. 영문 대소문자는 같은 닉네임으로 봅니다. 시연 모드는 중복 확인을 하지 않습니다.
- 거주 지역(AC-08·09): 위치 권한 없이 동·읍·면 이름으로 검색하고, 같은 동 이름은 시도·시군구까지 붙여 구분합니다. 법정동 코드(10자리)만 저장하고 상세 주소는 받지 않습니다. 지역을 바꾸면 온보딩의 `region_code`도 새 지역으로 맞춥니다. 데이터 출처·갱신은 `../jachwi-core/app/data/README.md`.
- 수정: 더보기 > 개인정보 관리. 회원 탈퇴도 이 화면 아래에 있습니다.
최근 로그인 계정(AC-04): 로그인 화면의 스위치를 켠 경우에만 이메일 일부(예: gu****@gmail.com)를 기기에 남기고, '기록 지우기'로 지울 수 있습니다. 표시만으로는 로그인되지 않고 계정 선택·인증은 Google 화면에서 합니다.
회원 탈퇴(AC-11): Google 계정만 가능. Google 로그인 화면에서 비밀번호를 다시 입력(max_age=0)해야 확정되고, 서버가 닉네임·지역·진단·가계부·냉장고·할 일·루틴·알림 설정과 모든 기기의 로그인 세션을 즉시 삭제합니다. 앱은 진행 상태와 결과를 보여 주고 기기 세션·최근 계정 기록을 지웁니다. (안심 공유 기능은 아직 없어 공유 권한 회수 대상이 없습니다.)
로그아웃은 더보기에서 합니다(웹에서도 확인 창이 뜨도록 `utils/confirm.js` 사용). 생활 데이터 수정은 온보딩으로 이동합니다.

## 현재 한계
- 서버 연결 상태에서 변경 후 저장 오류 문구가 없는지 확인하세요. 오프라인 저장 큐/자동 병합은 없습니다. 동시 변경 충돌은 재로그인하여 최신 상태를 읽어야 합니다.
- UI의 지도/시설 데이터 및 AI 답변은 팀원이 올린 시연 데이터입니다. 실제 지도 검색 API/LLM 연결 완료를 의미하지 않습니다.
- UI의 알림 스위치는 서버 선호도 저장입니다. OS 로컬 알림 예약 및 Android 결제알림 수집은 기존 `mobile` 네이티브 앱 기능이며 이 Snack UI에는 아직 이식되지 않았습니다.
- 기존 `mobile` Expo Router 프로젝트는 SDK 57이며 UIUX SDK 54와 섞어 업로드하지 않습니다.
- Google 인증은 서버 구현/모의 테스트 완료 상태이며 실제 팀 Google 계정 설정 후 실기기 검증이 남았습니다.

## Snack에 올릴 때
- 이 폴더의 `App.js`, `app.json`, `babel.config.js`, `package.json`, `src/`, `assets/`를 올립니다. `../jachwi-core`(서버)와 `../mobile`(네이티브 앱)은 올리지 않습니다.
- iOS 미리보기에서 "No default export of 'index.js' to render!"가 뜨면 **Snack의** `index.js`를 `export { default } from './App';` 한 줄로 바꿉니다. 이 저장소의 `index.js`(로컬 Expo 진입점)는 바꾸지 않습니다.
