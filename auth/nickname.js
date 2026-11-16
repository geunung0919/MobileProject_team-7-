// 닉네임 규칙 (온보딩 시안 기준): 앞뒤 공백 제거, 한글 완성형·영문·숫자 2~12자, 공백·특수문자 불가.
// 주의: 예전 서버(jachwi-core/app/account.py)는 2~10자입니다. Firebase 회원만 이 규칙을 씁니다.
export const NICKNAME_MAX = 12;
const PATTERN = /^[가-힣A-Za-z0-9]{2,12}$/;

export function normalizeNickname(raw) {
  if (typeof raw !== 'string') return { nickname: null, message: '닉네임을 입력해 주세요.' };
  const nickname = raw.trim().normalize('NFC');
  const length = Array.from(nickname).length; // 서버(Python)처럼 글자 단위로 셉니다
  if (length < 2 || length > NICKNAME_MAX) return { nickname: null, message: `닉네임은 2~${NICKNAME_MAX}자로 입력해 주세요.` };
  if (!PATTERN.test(nickname)) return { nickname: null, message: '한글(완성형), 영문, 숫자만 쓸 수 있어요. 공백과 특수문자는 안 돼요.' };
  return { nickname, message: '' };
}

// 중복 판단용 키 (영문 대소문자 구분 안 함). Firestore nicknames/{키} 문서 id 로 씁니다.
export const nicknameKey = (nickname) => nickname.toLowerCase();
