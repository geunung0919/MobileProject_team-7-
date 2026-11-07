export function normalizeUrl(value) {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['','/'].includes(url.pathname)) throw new Error('서버 주소는 http(s)://주소:포트 형식으로 입력하세요.');
  return url.origin;
}
export function createApi(baseUrl, token) {
  const origin = normalizeUrl(baseUrl);
  if (!token.trim()) throw new Error('개발 토큰을 입력하세요.');
  return async (path, method = 'GET', body, options = {}) => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timer = setTimeout(abort, options.timeoutMs ?? 15000);
    try {
      const response = await fetch(origin + '/api/v1/' + path, {
        method, signal: controller.signal,
        headers: { Authorization: 'Bearer ' + token.trim(), 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      let data;
      try { data = await response.json(); }
      catch (cause) {
        if (controller.signal.aborted || cause.name === 'AbortError') throw cause;
        const error = new Error(response.ok
          ? '서버 응답 형식이 올바르지 않아요. 서버 주소와 실행 상태를 확인해 주세요.'
          : '서버 요청 실패 (' + response.status + '). 서버 실행 상태를 확인해 주세요.');
        error.status = response.status;
        error.details = [];
        throw error;
      }
      if (!response.ok) {
        const payload = data?.error;
        const details = Array.isArray(payload?.details)
          ? payload.details.filter(item => item && typeof item.field === 'string' && typeof item.message === 'string') : [];
        const error = new Error(typeof payload?.message === 'string' ? payload.message : '요청 실패 (' + response.status + ')');
        error.status = response.status;
        error.details = details;
        error.message += details.map(item => '\n' + item.field + ': ' + item.message).join('');
        throw error;
      }
      return data;
    } catch (error) {
      if (options.signal?.aborted) throw new Error('분석을 취소했어요.');
      if (error.name === 'AbortError') throw new Error('서버 응답 시간이 초과됐어요. 서버와 Wi-Fi 연결을 확인하세요.');
      throw error;
    } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
  };
}
export const formatBudgetInput = value => String(value ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const budgetInputDigits = text => text.replace(/,/g, '').replace(/^0+(?=\d)/, '');
export const won = value => value == null ? '미설정' : value.toLocaleString('ko-KR') + '원';
export const koreaToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
export function parseMoney(text, allowZero = true) {
  if (!/^\d+$/.test(text) || Number(text) > 1000000000 || (!allowZero && Number(text) === 0)) throw new Error('금액은 ' + (allowZero ? '0' : '1') + '~1,000,000,000원 정수로 입력하세요.');
  return Number(text);
}
