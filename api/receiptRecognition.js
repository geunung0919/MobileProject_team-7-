// The OCR service is separate from the Firebase write API. Never forward a Firebase token here.
export const receiptOcrBase = process.env.EXPO_PUBLIC_RECEIPT_OCR_BASE_URL?.trim().replace(/\/$/, '') || '';

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
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `OCR 분석 실패 (${response.status})`);
    return data;
  } finally { clearTimeout(timer); }
}
