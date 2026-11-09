// 닉네임 규칙 (AC-06). 서버 jachwi-core/app/account.py 의 normalize_nickname 과 같은 규칙입니다. 바꿀 때 두 곳을 함께 바꾸세요.
// 앞뒤 공백 제거, 한글 완성형·영문·숫자 2~10자, 공백·특수문자 불가.
const PATTERN = /^[가-힣A-Za-z0-9]{2,10}$/;

export function normalizeNickname(raw) {
  if (typeof raw !== 'string') return { nickname: null, message: '닉네임을 입력해 주세요.' };
  const nickname = raw.trim().normalize('NFC');
  const length = Array.from(nickname).length; // 서버(Python)처럼 글자 단위로 셉니다
  if (length < 2 || length > 10) return { nickname: null, message: '닉네임은 2~10자로 입력해 주세요.' };
  if (!PATTERN.test(nickname)) return { nickname: null, message: '한글(완성형), 영문, 숫자만 쓸 수 있어요. 공백과 특수문자는 안 돼요.' };
  return { nickname, message: '' };
}

// 중복 판단용 (영문 대소문자 구분 안 함). 시연 모드에서만 씁니다. 서버 모드는 서버가 판단합니다.
export const nicknameKey = (nickname) => nickname.toLowerCase();
