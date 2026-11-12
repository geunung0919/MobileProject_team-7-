// 아이디·비밀번호 회원가입 규칙 (화면과 테스트가 같이 씁니다). 서버 없이 계산만 하는 순수 함수입니다.
// - 아이디는 로그인용이고, 닉네임(프로필에서 따로 정함)과 별개입니다.
// - Firebase 이메일 로그인을 쓰므로 아이디를 내부 이메일 주소로 바꿔 저장합니다. 실제 메일은 보내지 않습니다.

export const LOGIN_ID_DOMAIN = 'users.jachwimate.app';
export const MIN_AGE = 14; // 만 14세 미만은 법정대리인 동의가 필요해 이 앱에서는 가입을 받지 않습니다.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

// 아이디: 영문 소문자로 시작, 영문 소문자·숫자·밑줄 4~20자. 대문자는 소문자로 바꿔 받습니다.
export function normalizeLoginId(raw) {
  const id = String(raw ?? '').trim().toLowerCase();
  if (!id) return { id: '', message: '아이디를 입력해 주세요.' };
  if (id.length < 4 || id.length > 20) return { id: '', message: '아이디는 4~20자로 입력해 주세요.' };
  if (!/^[a-z]/.test(id)) return { id: '', message: '아이디는 영문으로 시작해야 해요.' };
  if (!/^[a-z0-9_]+$/.test(id)) return { id: '', message: '아이디는 영문·숫자·밑줄(_)만 쓸 수 있어요.' };
  return { id, message: '' };
}

export const loginIdToEmail = (id) => `${id}@${LOGIN_ID_DOMAIN}`;
export const emailToLoginId = (email) =>
  typeof email === 'string' && email.endsWith(`@${LOGIN_ID_DOMAIN}`) ? email.slice(0, -LOGIN_ID_DOMAIN.length - 1) : null;

const COMMON = ['password', 'qwerty', 'abc123', 'iloveyou', 'admin', 'letmein', 'welcome', '123456', '111111', '000000', 'asdf'];

// 비밀번호 강도. score 0~4, level: empty | weak | fair | good | strong
export function passwordStrength(password, loginId = '') {
  const pw = String(password ?? '');
  if (!pw) return { score: 0, level: 'empty', label: '', tips: [] };
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score += 1;
  if (pw.length >= 12) score += 1;
  if (kinds >= 2) score += 1;
  if (kinds >= 3) score += 1;
  if (pw.length >= 16 && kinds >= 2) score += 1;

  const lower = pw.toLowerCase();
  const id = String(loginId ?? '').toLowerCase();
  const tips = [];
  let capped = false;
  if (pw.length < PASSWORD_MIN) tips.push(`${PASSWORD_MIN}자 이상으로 늘려 주세요.`);
  if (kinds < 2) tips.push('영문·숫자·특수문자 중 두 가지 이상을 섞어 주세요.');
  if (/(.)\1\1/.test(pw)) { tips.push('같은 글자를 3번 이상 반복하지 마세요.'); score -= 1; }
  if (COMMON.some((w) => lower.includes(w))) { tips.push('흔한 비밀번호 단어는 피해 주세요.'); capped = true; }
  if (id.length >= 4 && lower.includes(id)) { tips.push('아이디가 들어가지 않게 해 주세요.'); capped = true; }

  score = Math.max(0, Math.min(4, score));
  if (capped) score = Math.min(score, 1);
  if (pw.length < PASSWORD_MIN) score = Math.min(score, 1);
  const level = ['weak', 'weak', 'fair', 'good', 'strong'][score];
  const label = { weak: '약함', fair: '보통', good: '강함', strong: '매우 강함' }[level];
  return { score, level, label, tips };
}

// 가입 가능한 비밀번호인지. 강도가 '보통' 이상이어야 합니다.
export function validatePassword(password, loginId = '') {
  const pw = String(password ?? '');
  if (!pw) return '비밀번호를 입력해 주세요.';
  if (pw.length < PASSWORD_MIN) return `비밀번호는 ${PASSWORD_MIN}자 이상이어야 해요.`;
  if (pw.length > PASSWORD_MAX) return `비밀번호는 ${PASSWORD_MAX}자 이하로 입력해 주세요.`;
  if (/\s/.test(pw)) return '비밀번호에 공백은 쓸 수 없어요.';
  const { score, tips } = passwordStrength(pw, loginId);
  if (score < 2) return `비밀번호가 너무 약해요. ${tips[0] || '더 길고 다양한 글자로 만들어 주세요.'}`;
  return '';
}

export const dateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 만 나이 (생일이 지났는지까지 계산)
export function ageOn(birth, today = new Date()) {
  const [y, m, d] = birth.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

export function validateBirthDate(value, today = new Date()) {
  if (!value) return '생년월일을 선택해 주세요.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '생년월일 형식이 올바르지 않아요.';
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return '없는 날짜예요.';
  if (value > dateString(today)) return '미래 날짜는 선택할 수 없어요.';
  if (y < 1900) return '생년월일을 다시 확인해 주세요.';
  if (ageOn(value, today) < MIN_AGE) return `만 ${MIN_AGE}세 이상부터 가입할 수 있어요.`;
  return '';
}

// Firebase 인증 오류 코드 → 화면에 보여 줄 문구와 표시할 칸
// field: 'loginId' | 'password' | 'form'. 로그인 실패는 아이디·비밀번호 중 무엇이 틀렸는지 알려 주지 않습니다.
export function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return { field: 'form', message: '아이디 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.' };
    case 'auth/email-already-in-use':
      return { field: 'loginId', message: '이미 사용 중인 아이디예요. 다른 아이디를 입력해 주세요.' };
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return { field: 'password', message: '비밀번호가 보안 기준에 맞지 않아요. 더 길고 다양한 글자로 만들어 주세요.' };
    case 'auth/too-many-requests':
      return { field: 'form', message: '로그인 시도가 너무 많아요. 잠시 후 다시 시도해 주세요.' };
    case 'auth/network-request-failed':
      return { field: 'form', message: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.' };
    case 'auth/user-disabled':
      return { field: 'form', message: '사용이 중지된 계정이에요.' };
    case 'auth/requires-recent-login':
      return { field: 'password', message: '보안을 위해 비밀번호를 다시 입력해 주세요.' };
    case 'app/not-configured':
      return { field: 'form', message: 'Firebase 연결 설정이 아직 없어요. 팀 설정값(EXPO_PUBLIC_FIREBASE_*)을 넣어 주세요.' };
    default:
      return { field: 'form', message: '잠시 문제가 생겼어요. 다시 시도해 주세요.' };
  }
}
