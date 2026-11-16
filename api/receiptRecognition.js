// The OCR service is separate from the Firebase write API. Never forward a Firebase token here.
export const receiptOcrBase = process.env.EXPO_PUBLIC_RECEIPT_OCR_BASE_URL?.trim().replace(/\/$/, '') || '';

async function readAnalysisResponse(response, label) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? data?.detail;
    throw new Error(typeof message === 'string' ? message : `${label} 실패 (${response.status})`);
  }
  if (!data?.candidate) throw new Error(`${label} 결과를 읽지 못했어요.`);
  return data;
}

export async function recognizeReceipt(asset, token) {
  if (!receiptOcrBase || !token.trim()) throw new Error('OCR 서버와 개발용 토큰을 설정해 주세요.');
  if (!/^https?:$/.test(new URL(receiptOcrBase).protocol)) throw new Error('OCR 서버 주소를 확인해 주세요.');
  const image = asset?.base64;
  if (!image || asset.fileSize > 8 * 1024 * 1024 || image.length > 11184812) throw new Error('8MB 이하의 영수증 사진을 선택해 주세요.');
  const mime = image.startsWith('/9j/') ? 'image/jpeg' : image.startsWith('iVBORw0KGgo') ? 'image/png' : image.startsWith('UklGR') ? 'image/webp' : null;
  if (!mime) throw new Error('JPG, PNG, WebP 영수증 사진을 선택해 주세요.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 85000);
  try {
    const response = await fetch(`${receiptOcrBase}/api/v1/me/spending/receipts/analyze`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.trim()}` },
      body: JSON.stringify({ image_base64: image, mime_type: mime, use_ai_fallback: false }),
    });
    return await readAnalysisResponse(response, '영수증 분석');
  } finally { clearTimeout(timer); }
}

export async function previewPayment(rawText, source, token) {
  if (!receiptOcrBase || !token.trim()) throw new Error('분석 서버와 개발용 토큰을 설정해 주세요.');
  if (!/^https?:$/.test(new URL(receiptOcrBase).protocol)) throw new Error('분석 서버 주소를 확인해 주세요.');
  if (!rawText.trim() || rawText.length > 5000) throw new Error('결제 원문은 5,000자 이하로 입력해 주세요.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${receiptOcrBase}/api/v1/me/spending/imports/preview`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.trim()}` },
      body: JSON.stringify({ raw_text: rawText, source, use_ai_fallback: false }),
    });
    return await readAnalysisResponse(response, '결제 분석');
  } finally { clearTimeout(timer); }
}
