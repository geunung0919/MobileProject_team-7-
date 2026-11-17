import { auth } from '../firebase/firebaseConfig';
import { environment } from '../config/environment';

const configuredBase = process.env.EXPO_PUBLIC_RECEIPT_OCR_BASE_URL?.trim() ?? '';
const mode = process.env.EXPO_PUBLIC_RECEIPT_AUTH_MODE?.trim() || 'development';
function analysisBase(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return '';
    if (mode === 'firebase' && environment.firebaseTarget === 'cloud' && url.protocol === 'https:') return url.href.replace(/\/$/, '');
    if (mode === 'development' && __DEV__ && ['http:', 'https:'].includes(url.protocol)) return url.href.replace(/\/$/, '');
  } catch { /* malformed or absent URL */ }
  return '';
}
export const receiptOcrBase = analysisBase(configuredBase);
export const receiptUsesDevelopmentToken = mode === 'development';

async function analysisToken(developmentToken, uid) {
  if (!receiptOcrBase) throw new Error('분석 서버가 연결되지 않았어요.');
  if (receiptUsesDevelopmentToken) {
    if (!developmentToken.trim()) throw new Error('분석 서버 개발용 토큰을 입력해 주세요.');
    return developmentToken.trim();
  }
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error('로그인 계정을 다시 확인해 주세요.');
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== uid) throw new Error('로그인 계정이 바뀌었어요.');
  return token;
}

async function readAnalysisResponse(response, label) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? data?.detail;
    throw new Error(typeof message === 'string' ? message : `${label} 실패 (${response.status})`);
  }
  if (!data?.candidate) throw new Error(`${label} 결과를 읽지 못했어요.`);
  return data;
}

export async function recognizeReceipt(asset, developmentToken, uid) {
  const image = asset?.base64;
  if (!image || asset.fileSize > 8 * 1024 * 1024 || image.length > 11184812) throw new Error('8MB 이하의 영수증 사진을 선택해 주세요.');
  const mime = image.startsWith('/9j/') ? 'image/jpeg' : image.startsWith('iVBORw0KGgo') ? 'image/png' : image.startsWith('UklGR') ? 'image/webp' : null;
  if (!mime) throw new Error('JPG, PNG, WebP 영수증 사진을 선택해 주세요.');
  const token = await analysisToken(developmentToken, uid);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 85000);
  try {
    const response = await fetch(`${receiptOcrBase}/api/v1/me/spending/receipts/analyze`, {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image_base64: image, mime_type: mime, use_ai_fallback: false }),
    });
    return await readAnalysisResponse(response, '영수증 분석');
  } finally { clearTimeout(timer); }
}

export async function previewPayment(rawText, source, developmentToken, uid) {
  if (!rawText.trim() || rawText.length > 5000) throw new Error('결제 원문은 5,000자 이하로 입력해 주세요.');
  const token = await analysisToken(developmentToken, uid);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${receiptOcrBase}/api/v1/me/spending/imports/preview`, {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ raw_text: rawText, source, use_ai_fallback: false }),
    });
    return await readAnalysisResponse(response, '결제 분석');
  } finally { clearTimeout(timer); }
}
