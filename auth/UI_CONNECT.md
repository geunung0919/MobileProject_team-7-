# UIUX-Edit 화면에 회원·온보딩 기능 연결하기

대상: `UIUX-Edit` 브랜치(gyudev03, 커밋 6e7f254 기준) 화면.
이 문서는 **어느 파일의 어느 자리에 무엇을 넣으면 되는지**만 정리합니다. 화면 디자인은 바꾸지 않습니다.
기능 설명은 같은 폴더의 `README.md` 를 보세요.

## 0. 먼저 한 번만: 파일 복사와 패키지 설치

`UIUX-Edit` 은 Firebase 가 없는 별도 앱이라, 기능 파일을 옮겨 와야 합니다.

1. 이 브랜치(`feature/firebase-auth-signup`)에서 아래를 `UIUX-Edit` 의 `src/` 아래로 복사
   - `auth/` 폴더 전체 → `src/auth/` (`*.test.mjs`, `README.md`, 이 문서는 빼도 됨)
   - `firebase/firebaseConfig.js` → `src/firebase/firebaseConfig.js`
   - `config/environment.js` → `src/config/environment.js`

   폴더 관계(`auth`·`firebase`·`config` 가 같은 높이)가 같으면 import 경로를 고칠 필요가 없습니다.
2. 패키지 설치 (`UIUX-Edit` 루트에서, Expo 가 SDK 에 맞는 버전을 골라 줍니다)
   ```
   npx expo install firebase @react-native-async-storage/async-storage expo-secure-store
   ```
   Windows PowerShell 에서 막히면 `npx.cmd` 로 실행하세요.
3. 실제 Firebase 로 연결하려면 루트에 `.env.local`
   ```
   EXPO_PUBLIC_FIREBASE_TARGET=cloud
   ```
   (없으면 에뮬레이터로 붙습니다. 에뮬레이터는 `EXPO_PUBLIC_DEV_HOST` 도 필요)

## 1. `App.js` — 앱 전체를 감싸고, 첫 화면을 로그인 상태로 정하기

```js
import { AuthProvider, useAuth } from './src/auth/AuthContext';

export default function App() {
  // ...useFonts 그대로
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppDataProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <StartByAuth />
          </NavigationContainer>
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// 앱을 켤 때 한 번만 로그인 상태를 확인해 첫 화면을 고릅니다. (다시 열면 로그인이 유지되어 바로 Tabs)
// 그 뒤의 이동(로그인·로그아웃 후)은 각 화면이 navigation 으로 합니다. 첫 화면을 정한 뒤에는 다시 가리지 않습니다.
function StartByAuth() {
  const { stage } = useAuth();
  const first = React.useRef(null);
  if (!first.current) {
    if (stage === 'loading') return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    first.current = stage === 'app' ? 'Tabs' : stage === 'onboarding' ? 'ProfileSetup' : 'Welcome';
  }
  return <RootNavigator initialRouteName={first.current} />;
}
```

`src/navigation/RootNavigator.js` 는 `initialRouteName` 을 받도록 한 줄만 바꿉니다.

```js
export default function RootNavigator({ initialRouteName = 'Welcome' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
```

`stage === 'error'`(인터넷 문제 등으로 회원 정보를 못 불러옴)이면 위 코드에서는 `Welcome` 으로 갑니다. 다시 로그인하면 됩니다.

## 2. `src/screens/LoginScreen.js` — `handleSubmit`

형식 검사도 기능 쪽에서 하므로 기존 검사는 지워도 됩니다.

```js
import { useAuth } from '../auth/AuthContext';
// ...
const { signIn } = useAuth();

const handleSubmit = async () => {
  try {
    const { onboarded } = await signIn({ email, password });
    // 가입만 하고 프로필 설정을 안 끝낸 계정은 프로필 설정으로
    const next = onboarded === false ? 'ProfileSetup' : 'Tabs';
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: next }] }));
  } catch (e) {
    showNotice('입력을 확인해 주세요', e.message);   // 이메일·비밀번호 중 무엇이 틀렸는지는 알려 주지 않음
  }
};
```

- `updateProfile({ email })` 은 필요 없습니다. 이메일은 `useAuth().email` 로 읽습니다.

### (선택) 최근 로그인 계정 표시 — AC-04

```js
const { recentAccount, setRememberAccount, clearRecentAccount } = useAuth();
// recentAccount.maskedEmail → 'hy******@ex*****.com' (기억 켰을 때만 값이 있음)
// "이 기기에서 최근 계정 기억" 스위치: setRememberAccount(true/false)  (끄면 기록도 삭제)
// "기록 지우기": clearRecentAccount()
```
표시된 계정은 안내용입니다. 눌러도 로그인되지 않고 비밀번호를 입력해야 합니다.

## 3. `src/screens/SignUpScreen.js` — `handleSubmit`

```js
const { signUp } = useAuth();

const handleSubmit = async () => {
  try {
    await signUp({ email, password, confirm });
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] }));
  } catch (e) {
    showNotice('입력을 확인해 주세요', e.message);   // 예: '이미 가입된 이메일이에요. 로그인해 주세요.'
  }
};
```

비밀번호는 8자 이상 + 영문·숫자 등 두 종류 이상이어야 합니다(화면 안내 문구와 같음).
`e.field` 에 `email` / `password` / `confirm` 이 들어 있어, 나중에 칸 아래 표시로 바꿀 때 씁니다.

## 4. `src/screens/ProfileSetupScreen.js` — 진단 결과 전 저장

`next()` 의 `step === REVIEW` 부분을 바꿉니다. 화면 값 변환은 `uiMapping.js` 가 합니다.

```js
import { useAuth } from '../auth/AuthContext';
import { toProfile } from '../auth/uiMapping';
// ...
const { completeOnboarding, finishOnboarding } = useAuth();

// next() 안
} else if (step === REVIEW) {
  try {
    await completeOnboarding({
      nickname: nickname.trim(),
      profile: toProfile({ period, goal, tools, cookDays, budget, region }),
    });
  } catch (e) {
    if (e.field === 'nickname') setStep(1);        // 닉네임 중복이면 1단계로
    showNotice('입력을 확인해 주세요', e.message);
    return;
  }
  // 기존 앱 안 저장도 유지 (다른 화면이 아직 useAppData 값을 읽음)
  updateProfile({ nickname: nickname.trim(), region: region.trim() });
  updateLifeData({ period, goal, tools, cookDays });
  setBudget(budget);
  setStep(RESULT);
}
```
(`next` 를 `async` 로 바꿔야 합니다.)

`finish(to)` 맨 앞에 `finishOnboarding();` 을 한 줄 추가합니다.

### 닉네임 입력 중 중복 확인 — AC-07 (1단계)

```js
import useNicknameCheck from '../auth/useNicknameCheck';
const check = useNicknameCheck(nickname);   // 입력이 멈추고 0.4초 뒤 한 번 조회
// check.status: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'
// FormField 의 hint 자리에 check.message 를 보여 주면 됩니다.
```

### 거주 지역 검색 — AC-08 (4단계, 지역 검색을 붙일 때)

```js
import { searchRegions } from '../auth/regions';
const results = searchRegions(regionText);   // [{ code, label: '서울특별시 마포구 서교동' }]
// 목록에서 고르면: setRegionText(item.label); setRegionCode(item.code);
// 저장 때: profile 에 { region_name: item.label, region_code: item.code } 를 함께 넘기거나,
//          온보딩 뒤에는 useAuth().setRegion(item.code)
```
같은 동 이름이 여러 지역에 있으니 `label`(전체 이름)을 보여 주세요.

## 5. `src/screens/LifeDataScreen.js`·`ProfileScreen.js` — 수정 저장

```js
import { useAuth } from '../auth/AuthContext';
import { toProfile, fromProfile } from '../auth/uiMapping';
const { profile: saved, member, updateProfile: saveProfile, updateNickname } = useAuth();

// 처음 값: Firebase 에 저장된 값 → 화면 값
const start = fromProfile(saved, { ...lifeData, budget, region: profile.region });

// LifeDataScreen 저장
await saveProfile(toProfile({ period, goal, tools, cookDays, budget: budgetInput, region }));

// ProfileScreen 저장 (닉네임이 바뀐 경우만)
if (nickname.trim() !== member?.nickname) await updateNickname(nickname.trim());
await saveProfile(toProfile({ region }));
```
실패하면 `catch (e) { showNotice('입력을 확인해 주세요', e.message); }`.
`useAppData` 의 `updateProfile` 과 이름이 겹치므로 위처럼 `saveProfile` 로 바꿔 받으세요.

## 6. `src/screens/MoreScreen.js` — 로그아웃 (AC-10)

```js
const { logout } = useAuth();
// confirmAction 의 onConfirm
onConfirm: async () => {
  await logout();
  (navigation.getParent() ?? navigation).dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] }));
},
```

로그아웃 직전에 `'logout'` 이벤트가 나갑니다. **기기에 남는 데이터가 있는 화면/모듈**은 정리 함수를 등록해 주세요
(예: `AppDataContext` 의 소비·냉장고·할 일 목록, 알림 예약).

```js
import { onAccountEvent } from '../auth/accountEvents';
useEffect(() => onAccountEvent('logout', async () => { /* 사용자 데이터 초기화, 알림 예약 취소 */ }), []);
```

## 7. 회원 탈퇴 (화면이 생기면)

```js
const { withdraw } = useAuth();
await withdraw(password);   // 비밀번호 재확인 후 계정 삭제. 서버가 users/{uid} 아래 데이터를 모두 지움
```

## 이 안내대로 실제로 해 본 결과

`UIUX-Edit`(6e7f254) 복사본에 0~4번과 6번을 그대로 넣고 웹에서 돌려 봤습니다(Auth 에뮬레이터, Firestore 는 테스트용 임시 저장소).
통과: 첫 실행 Welcome → 회원가입(약한 비밀번호 안내) → 프로필 설정 5단계 → 화면 값이 저장 형식으로 변환되어 저장
→ 진단 결과 → 시작하기 → 앱 다시 열면 바로 홈 → 로그아웃 → Welcome → 틀린 비밀번호 안내 → 로그인하면 바로 홈
→ 다른 계정이 같은 닉네임이면 안내 후 1단계로. 5번(생활 데이터·개인정보 수정)은 아직 실제로 넣어 보지 않았습니다.

해 보면서 발견한 `UIUX-Edit` 자체 문제 (연결과 별개, UI 담당 확인 필요):
- `package.json` 은 Expo SDK 54 인데 `package-lock.json` 은 SDK 58 버전(expo 58.0.24, react 19.3.0)이 들어 있어 **`npm ci` 가 실패**합니다.
  `package-lock.json` 을 지우고 `npm install` 로 다시 만들어야 합니다.
- SDK 54 로 설치하면 `app.json` 의 `plugins` 에 있는 `"expo-status-bar"` 때문에 실행이 멈춥니다(이 버전에는 플러그인이 없음). 그 줄을 빼면 됩니다.
- 같은 경우 `babel-preset-expo` 를 못 찾는 오류가 나면 `npx expo install babel-preset-expo -- --save-dev` 로 넣으면 됩니다.

## 확인 순서

1. 회원가입 → 프로필 설정 5단계 → 진단 결과 → 시작하기
2. 앱 종료 후 다시 열기 → 바로 홈(Tabs)
3. 더보기 → 로그아웃 → Welcome → 같은 이메일로 로그인 → 홈
4. 생활 데이터 수정에서 예산 변경 → 앱 재시작 후에도 유지
5. 다른 계정으로 같은 닉네임 → "이미 사용 중인 닉네임" 안내
