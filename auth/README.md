# 회원·온보딩 기능 (1번 모듈: 중앙 코어·회원)

화면(UI)은 담지 않습니다. UI 담당이 만든 화면에서 아래 함수와 상태를 불러 쓰면 됩니다.
저장소: Firebase Authentication(아이디·비밀번호) + Firestore.

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
| `signIn({ loginId, password })` | 로그인. 성공하면 stage 가 바뀝니다 |
| `signUp({ loginId, password, confirm, birthDate })` | 회원가입(birthDate 는 'YYYY-MM-DD'). 성공하면 stage='onboarding' |
| `completeOnboarding({ nickname, profile })` | 온보딩 저장. `{ nickname, profile, diagnosis }` 반환. stage 는 결과 화면을 위해 'onboarding' 유지 |
| `finishOnboarding()` | 결과 화면의 [시작하기] → stage='app' |
| `updateProfile(changes)` | 생활 데이터 수정. 바꾼 항목만 넘기면 기존 값과 합쳐 저장하고 새 profile 반환 (예: `{ monthly_budget_krw: 700000 }`) |
| `updateNickname(nickname)` | 닉네임만 변경 (중복이면 field='nickname') |
| `logout()` / `withdraw(password)` / `reloadAccount()` | 로그아웃 / 회원 탈퇴 / 오류 시 다시 불러오기 |
| `user.uid`, `loginId`, `member.nickname`, `profile` | 로그인 사용자, 아이디, 닉네임, 생활 정보 |

실패하면 `throw` 하며, 오류에 **`field`(표시할 칸)** 와 **`message`(보여 줄 문구)** 가 들어 있습니다.
`field`: `loginId`, `password`, `confirm`, `birthDate`, `nickname`, `form`(칸이 아닌 전체 오류).
로그인 실패는 아이디·비밀번호 중 무엇이 틀렸는지 알려 주지 않습니다(`form`).

```js
try { await signUp(form); } catch (e) { setErrors({ [e.field]: e.message }); }
```

## 입력 규칙·표시용 함수

- `authRules.js`: `passwordStrength(pw, loginId)` → `{ level, label, score }` (강도 표시), `validatePassword`, `validateBirthDate`, `MIN_AGE`(14), `PASSWORD_MIN`(8)
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
| `users/{uid}.account` | login_id, birth_date, created_at | 회원가입 |
| `users/{uid}.member` | nickname, nickname_key, updated_at | 온보딩 |
| `users/{uid}.profile` | 위 저장 형식 | 온보딩 |
| `users/{uid}.onboarding` | completed_at, rule_version | 온보딩 |
| `nicknames/{닉네임 소문자}` | { uid } — 닉네임 중복 방지 | 온보딩·탈퇴 |

다른 모듈은 `users/{uid}` 의 다른 필드나 하위 컬렉션을 쓰면 됩니다. 월 예산은 `profile.monthly_budget_krw` 를 읽으면 됩니다.

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

테스트: `node --test auth/authRules.test.mjs auth/onboardingRules.test.mjs`
