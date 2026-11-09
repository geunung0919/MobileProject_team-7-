export async function request(base, token, path, method = 'GET', body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(base.replace(/\/$/, '') + path, {
      method, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({})); // 오류 페이지가 JSON 이 아니어도 status 를 남김
    if (!response.ok) {
      const error = new Error(data.error?.message || data.detail || '서버 요청 실패');
      error.status = response.status; throw error;
    }
    return data;
  } finally { clearTimeout(timer); }
}
