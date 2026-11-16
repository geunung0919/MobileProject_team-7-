// 첫 화면(로그인/회원가입) 문구. 실제 인증은 아직 없어서 형식만 맞으면 통과합니다.
// TODO: 로그인/회원가입 버튼의 실제 처리(Firebase 등)는 LoginScreen, SignUpScreen 의 handleSubmit 안에서 연결하세요.

export const authData = {
  appName: '자취메이트',
  loginLabel: '로그인',
  signUpLabel: '회원가입',
  login: {
    title: '로그인',
    subtitle: '이메일과 비밀번호를 입력해 주세요.',
    emailLabel: '이메일',
    emailPlaceholder: 'example@email.com',
    passwordLabel: '비밀번호',
    passwordPlaceholder: '비밀번호 입력',
    submitLabel: '로그인',
    switchText: '아직 계정이 없나요?',
    switchAction: '회원가입',
  },
  signUp: {
    title: '회원가입',
    subtitle: '이메일로 계정을 만들어요.',
    emailLabel: '이메일',
    emailPlaceholder: 'example@email.com',
    passwordLabel: '비밀번호',
    passwordPlaceholder: '8자 이상 입력',
    passwordHint: '영문과 숫자를 함께 쓰면 더 안전해요.',
    confirmLabel: '비밀번호 확인',
    confirmPlaceholder: '비밀번호를 한 번 더 입력',
    submitLabel: '가입하기',
    switchText: '이미 계정이 있나요?',
    switchAction: '로그인',
  },
  minPasswordLength: 8,
  invalidEmailNotice: '이메일 형식을 확인해 주세요.',
  emptyPasswordNotice: '비밀번호를 입력해 주세요.',
  shortPasswordNotice: '비밀번호는 8자 이상이어야 해요.',
  mismatchNotice: '비밀번호가 서로 달라요.',
};
