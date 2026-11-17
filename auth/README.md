# 회원·온보딩 기능 (1번 모듈: 중앙 코어·회원)

화면(UI)은 담지 않습니다. UI 담당이 만든 화면에서 아래 함수와 상태를 불러 쓰면 됩니다.
저장소: Firebase Authentication(**이메일·비밀번호**, UI 화면 기준) + Firestore.

## 연결 방법

`App.js` 는 이미 `<AuthGate>` 로 감싸져 있습니다. 화면이 준비되면 `screens` 만 넘기면 됩니다.

```js
<AuthGate screens={{ Login: 로그인·회원가입화면, Onboarding: 온보딩화면, Loading: 로딩화면, Error: 오류화면 }}>
  <DevApp />
</AuthGate>
```

- `screens.Login` 이 없으면 지금처럼 로그인 없이 앱 화면이 바로 나옵니다.
- 단계는 `useAuth().stage` 로도 알 수 있습니다: `'loading' | 'login' | 'onboarding' | 'app' | 'error'`

## 화면에서 쓰는 함수 (`import { useAuth } from '../auth/AuthContext'`)

| 함수 / 값 | 설명 |
|---|---|
| `signIn({ email, password })` | 로그인. 성공하면 stage 가 바뀝니다 |
| `signUp({ email, password, confirm, birthDate? })` | 회원가입. 성공하면 stage='onboarding'. birthDate('YYYY-MM-DD')는 화면에서 받을 때만 넘기면 만 14세 확인 |
| `completeOnboarding({ nickname, profile })` | 온보딩 저장. `{ nickname, profile, diagnosis }` 반환. stage 는 결과 화면을 위해 'onboarding' 유지 |
| `finishOnboarding()` | 결과 화면의 [시작하기] → stage='app' |
| `updateProfile(changes)` | 생활 데이터 수정. 바꾼 항목만 넘기면 기존 값과 합쳐 저장하고 새 profile 반환 (예: `{ monthly_budget_krw: 700000 }`) |
| `updateNickname(nickname)` | 닉네임만 변경 (중복이면 field='nickname') |
| `checkNickname(nickname)` | 입력 중 중복 확인 → `{ status: 'available' \| 'taken' \| 'invalid' \| 'error', message }`. 화면에서는 아래 `useNicknameCheck` 훅이 편함 |
| `setRegion(code)` | 지역 검색에서 고른 법정동 코드 저장 (이름은 '시도 시군구 동'으로 함께 저장). `null` 이면 지역 지우기 |
| `logout()` / `withdraw(password)` / `reloadAccount()` | 로그아웃 / 회원 탈퇴 / 오류 시 다시 불러오기. 로그아웃·탈퇴 직전에 `'logout'` 이벤트가 나갑니다 |
| `user.uid`, `email`, `member.nickname`, `profile` | 로그인 사용자, 이메일, 닉네임, 생활 정보 |

실패하면 `throw` 하며, 오류에 **`field`(표시할 칸)** 와 **`message`(보여 줄 문구)** 가 들어 있습니다.
`field`: `email`, `password`, `confirm`, `birthDate`, `nickname`, `form`(칸이 아닌 전체 오류).
로그인 실패는 이메일·비밀번호 중 무엇이 틀렸는지 알려 주지 않습니다(`form`).
칸 아래 표시든 알림 팝업이든 `e.message` 를 그대로 보여 주면 됩니다.

```js
try { await signUp(form); } catch (e) { setErrors({ [e.field]: e.message }); }
```

### UI-Edit 브랜치(gyudev03) 화면에 연결하는 예

`src/screens/LoginScreen.js` 의 `handleSubmit` (현재 TODO 자리):

```js
const { signIn } = useAuth();
const handleSubmit = async () => {
  try {
    await signIn({ email, password });   // 형식 검사도 여기서 함 (field·message 로 돌려줌)
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  } catch (e) {
    showNotice('입력을 확인해 주세요', e.message);
  }
};
```

`SignUpScreen` 은 `await signUp({ email, password, confirm })` 후 온보딩 화면으로 이동하면 됩니다.
앱 최상위(`App.js`)를 `<AuthProvider>`(또는 `<AuthGate>`)로 감싸야 `useAuth()` 를 쓸 수 있습니다.
`<AuthGate>` 를 쓰면 로그인 여부에 따라 화면 전환을 자동으로 해 주고, 쓰지 않으면 위처럼 직접 이동해도 됩니다.

### 닉네임 입력 중 중복 확인 (AC-07)

```js
import useNicknameCheck from '../auth/useNicknameCheck';
const check = useNicknameCheck(nickname);   // 입력이 멈추고 0.4초 뒤 한 번 조회
// check.status: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error', check.message: 보여 줄 문구
```
로그인한 뒤(온보딩·마이페이지)에만 조회됩니다. 최종 판단은 저장할 때 서버가 한 번 더 합니다.

### 거주 지역 검색 (AC-08·09)

```js
import { searchRegions } from '../auth/regions';
const results = searchRegions('마포구 서교동');  // [{ code, label: '서울특별시 마포구 서교동', sido, sigungu, dong }]
await setRegion(results[0].code);
```
GPS·서버 없이 앱 안 데이터(`auth/data/legalDong.json`, 법정동 2026-09-29 기준)로 찾습니다. 같은 동 이름은 `label`(전체 이름)로 구분해 보여 주세요.
데이터는 공식 사이트에서 직접 받지 못해 공개 저장소 사본으로 만든 파일입니다. 발표 전 code.go.kr 원본으로 다시 만드는 것을 권장합니다(`jachwi-core/scripts/build_legal_dong.py`).

### 다른 파트가 연결할 것: 로그아웃 정리·지역 변경 (AC-09·10)

```js
import { onAccountEvent } from '../auth/accountEvents';
useEffect(() => onAccountEvent('logout', async ({ uid, reason }) => {
  // 내 파트가 기기에 남긴 사용자 캐시·개인 알림 예약을 지우기 (reason: 'logout' | 'withdraw')
}), []);
useEffect(() => onAccountEvent('regionChanged', ({ from, to }) => {
  // 지역에 따라 달라지는 정보(날씨·지도·분리배출 등)를 새 지역으로 갱신, 이전 지역 안내 중단
}), []);
```
한 파트의 정리가 실패해도 나머지 정리와 로그아웃은 계속됩니다. **기기 캐시·알림을 가진 파트(루틴 알림, 재고 알림, 소비 캐시 등)는 'logout' 에 정리 함수를 등록해야 AC-10 이 완성됩니다.**

## 입력 규칙·표시용 함수

- `authRules.js`: `normalizeEmail`, `passwordStrength(pw, email)` → `{ level, label, score }` (강도 표시), `validatePassword`(8자 이상, 영문·숫자 등 두 종류 이상), `validateBirthDate`, `MIN_AGE`(14), `PASSWORD_MIN`(8)
- `nickname.js`: `normalizeNickname(text)` → `{ nickname, message }`, `NICKNAME_MAX`(12)
- `onboardingRules.js`: 선택지와 표시 문구
  - `LIVING_OPTIONS` (1개월 미만/1개월 이상/6개월 이상/1년 이상 → 0/1/6/12), `PRIORITY_OPTIONS`, `TOOL_OPTIONS`, `BUDGET_PRESETS`
  - `livingLabel`, `toolsLabel`, `budgetLabel`, `formatWon`, `manwon`, `digitsOnly`(예산 입력 → 숫자)
  - `diagnose(profile)`, `EXPERIENCE_LABELS`, `diagnosisSummary(profile)`, `recommendations(profile)`(목표에 맞는 기능이 맨 위)

## 저장 형식 (`profile`)

| 필드 | 값 |
|---|---|
| living_months | 0 / 1 / 6 / 12 또는 null |
| priority | save_money / reduce_waste / build_routine 또는 null |
| cooking_tools | microwave, stove, rice_cooker, air_fryer 목록. 없음=`[]`, 선택 안 함=`null` |
| cooking_days_per_week | 0~7 또는 null |
| monthly_budget_krw | 원 단위 정수 또는 null |
| region_name / region_code | 지역 이름(직접 입력) / 법정동 10자리(지역 검색 연결 후) |
| initial_inventory_state | 시안에 질문이 없어 기본 'not_entered' |

빠진 항목은 기본값(null 등)으로 채워 저장합니다.

## Firestore 구조

| 문서 | 내용 | 쓰는 곳 |
|---|---|---|
| `users/{uid}.account` | email, birth_date(받지 않으면 null), created_at | 회원가입 |
| `users/{uid}.member` | nickname, nickname_key, updated_at | 온보딩 |
| `users/{uid}.profile` | 위 저장 형식 | 온보딩 |
| `users/{uid}.onboarding` | completed_at, rule_version | 온보딩 |
| `nicknames/{닉네임 소문자}` | { uid } — 닉네임 중복 방지 | 온보딩·탈퇴 |

다른 모듈은 `users/{uid}` 의 다른 필드나 하위 컬렉션을 쓰면 됩니다. 월 예산은 `profile.monthly_budget_krw` 를 읽으면 됩니다.

## 선웅 브랜치(`feature/receipt-shared-firestore`)와 합칠 때 확인할 점

선웅 브랜치에도 온보딩 서버 API(`functions/modules/core/onboarding.js`, `GET·PUT /onboarding`)와
화면(`SharedOnboardingScreen`)이 있습니다. 저장 위치(`users/{uid}.profile`)와 필드 이름은 같지만 아래가 다릅니다.
**온보딩 저장 방식은 하나로 정해서 맞춰야 합니다.**

| 항목 | 이 브랜치 (`auth/`) | 선웅 브랜치 (`/onboarding`) | 맞추는 방법(제안) |
|---|---|---|---|
| 완료 표시 | `onboarding.completed_at` (+ `rule_version`) | `onboardingCompletedAt` | 한 이름으로 통일. 읽는 쪽은 둘 다 확인하도록 |
| 조리 도구 미선택 | `null` 허용 (`[]` 는 "없음") | 배열만 허용(`null` 이면 422) | 서버가 `null` 도 받도록 |
| 월 예산 | 0원 이상 또는 null | 1원 이상 또는 null | 하한 통일(0 허용 여부) |
| 지역 | `region_name`, `region_code` 저장 | 온보딩 API 는 지역을 받지 않음 (지역은 `PUT /profile` 의 `region` 으로 따로 저장) | 지역 저장 위치를 하나로 통일 |
| 닉네임 | `member.nickname` + `nicknames/{키}` 중복 방지 | 온보딩에 없음 | 닉네임은 이 브랜치 방식 사용 |
| `functions/modules/core/profile.js` | 닉네임 규칙(2~12자)·중복 검사로 다시 작성 | `region` 인자 추가 | **두 브랜치를 합치면 이 파일이 충돌합니다.** 이 브랜치 내용을 기준으로 `region` 저장만 옮기면 됩니다 |
| 예산 연결 | `profile.monthly_budget_krw` 를 읽으면 됨 | `finance/budgets.js` 가 예산 처리 | 소비 탭 예산의 기준을 profile 로 할지 budgets 로 할지 결정 |

그 밖에 `App.js` 도 같은 자리를 고쳐서 충돌합니다: 선웅의 팀 앱 분기 코드를 `<AuthGate>` 안에 넣으면 됩니다.

## 서버 (Cloud Functions, `functions/modules/core`)

- `GET /profile`: 내 회원 정보 (`nickname`, `profile`, `onboarded` 포함)
- `PUT /profile` `{ nickname }`: 닉네임 변경. 앱과 같은 규칙(2~12자)·중복 검사. 규칙 위반 400, 중복 409 (`field: "nickname"`)
- `cleanupDeletedUser`: 로그인 계정이 삭제되면 `users/{uid}` 전체(소비·영수증·냉장고 등 하위 데이터 포함)와 닉네임 선점 문서를 지웁니다.
  `users/{uid}` 밖에 사용자 데이터를 두는 모듈이 생기면 `accountCleanup.js` 에 추가해야 합니다.
- 테스트: `cd functions && node --test tests/core-account.test.js`

## 배포 전 확인
1. Firebase 콘솔 → Authentication → 로그인 방법 → 이메일/비밀번호 사용 설정
2. `firestore.rules` 배포 (`nicknames` 규칙 추가됨): `firebase deploy --only firestore:rules`
3. Cloud Functions 배포 (닉네임 규칙·탈퇴 정리): `firebase deploy --only functions`

테스트: `node --test auth/authRules.test.mjs auth/onboardingRules.test.mjs auth/regions.test.mjs`
