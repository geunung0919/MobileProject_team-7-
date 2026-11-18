// 닉네임 규칙 (앱 auth/nickname.js 와 같은 규칙). 바꿀 때 두 곳을 함께 바꾸세요.
// 앞뒤 공백 제거, 한글 완성형·영문·숫자 2~12자, 공백·특수문자 불가. 중복 판단은 영문 대소문자 무시.
const NICKNAME_MAX = 12;
const PATTERN = /^[가-힣A-Za-z0-9]{2,12}$/;

const normalizeNickname = (raw) => {
  if (typeof raw !== "string") {
    return {nickname: null, message: "닉네임을 입력해 주세요."};
  }
  const nickname = raw.trim().normalize("NFC");
  const length = Array.from(nickname).length;
  if (length < 2 || length > NICKNAME_MAX) {
    return {nickname: null, message: `닉네임은 2~${NICKNAME_MAX}자로 입력해 주세요.`};
  }
  if (!PATTERN.test(nickname)) {
    return {
      nickname: null,
      message: "한글(완성형), 영문, 숫자만 쓸 수 있어요. 공백과 특수문자는 안 돼요.",
    };
  }
  return {nickname, message: ""};
};

const nicknameKey = (nickname) => nickname.toLowerCase();

module.exports = {NICKNAME_MAX, normalizeNickname, nicknameKey};
