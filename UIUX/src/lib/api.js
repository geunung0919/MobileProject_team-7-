// jachwi-core 서버 연결. 서버가 소비·냉장고 데이터를 Firestore 에 저장합니다.
// UIUX/.env.local 에 EXPO_PUBLIC_API_URL, EXPO_PUBLIC_API_TOKEN 을 넣으면 서버 모드로 동작하고,
// 비어 있으면 예전처럼 더미 데이터로 동작합니다 (.env.example 참고).
// 토큰은 개발용 공개 토큰입니다. 로그인 기능을 붙이면 Firebase 로그인 토큰으로 바꾸세요.

export const SERVER_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
const TOKEN = (process.env.EXPO_PUBLIC_API_TOKEN || '').trim();

export const isServerConfigured = Boolean(SERVER_URL && TOKEN);

// api(path, method, body, { timeoutMs }) -> JSON. 실패하면 message / status 가 있는 Error 를 던집니다.
async function request(path, method = 'GET', body, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/${path}`, {
      method,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      // 본문이 JSON 이 아니면 아래에서 상태 코드로 안내합니다.
    }
    if (!response.ok) {
      const message =
        typeof data?.error?.message === 'string'
          ? data.error.message
          : `서버 요청에 실패했어요 (${response.status}).`;
      const details = Array.isArray(data?.error?.details)
        ? data.error.details.map((d) => `\n${d.field}: ${d.message}`).join('')
        : '';
      const error = new Error(message + details);
      error.status = response.status;
      throw error;
    }
    if (data === null) throw new Error('서버 응답 형식이 올바르지 않아요. 서버 주소를 확인해 주세요.');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('서버 응답이 늦어요. PC 서버가 켜져 있는지, 휴대폰과 같은 Wi-Fi 인지 확인해 주세요.');
    }
    if (error instanceof TypeError) {
      throw new Error(`서버(${SERVER_URL})에 연결하지 못했어요. 서버 주소와 Wi-Fi 를 확인해 주세요.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const api = isServerConfigured ? request : null;
