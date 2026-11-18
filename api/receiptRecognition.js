import { Platform } from 'react-native';
import { auth } from '../firebase/firebaseConfig';
import { environment } from '../config/environment';

const configuredBase = process.env.EXPO_PUBLIC_RECEIPT_OCR_BASE_URL?.trim() ?? '';
const mode = process.env.EXPO_PUBLIC_RECEIPT_AUTH_MODE?.trim() || 'development';
const ocrPort = process.env.EXPO_PUBLIC_RECEIPT_OCR_PORT?.trim() || '8000';

function analysisBase(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return '';
    if (mode === 'firebase' && environment.firebaseTarget === 'cloud' && url.protocol === 'https:') return url.href.replace(/\/$/, '');
    if (mode === 'development' && __DEV__ && ['http:', 'https:'].includes(url.protocol)) return url.href.replace(/\/$/, '');
  } catch { /* malformed or absent URL */ }
  return '';
}

// 개발 실행에서 OCR 서버 주소를 따로 설정하지 않았으면, 앱을 띄운 개발 PC(같은 Wi-Fi)의 jachwi-core 를 씁니다.
// - 웹(아이폰 사파리 등): 지금 연 페이지의 주소. http://192.168.0.15:8081 로 열었으면 http://192.168.0.15:8000
// - 앱(Expo Go/개발 빌드): Metro 개발 서버 주소의 PC IP
function developmentPcBase() {
  if (mode !== 'development' || !__DEV__) return '';
  try {
    if (Platform.OS === 'web') {
      const { protocol, hostname } = window.location;
      return hostname ? `${protocol === 'https:' ? 'https' : 'http'}://${hostname}:${ocrPort}` : '';
    }
    if (environment.devHost) return `http://${environment.devHost}:${ocrPort}`;
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
    const { hostname } = new URL(getDevServer().url);
    return hostname ? `http://${hostname}:${ocrPort}` : '';
  } catch {
    return '';
  }
}

export const receiptOcrBase = analysisBase(configuredBase || developmentPcBase());
export const receiptUsesDevelopmentToken = mode === 'development';
// 개발 모드에서 미리 채워 두는 OCR 서버 토큰 (jachwi-core/.env 의 DEV_TOKENS_JSON 에 있는 공개 시연용 토큰)
export const receiptDefaultDevelopmentToken = receiptUsesDevelopmentToken
  ? process.env.EXPO_PUBLIC_RECEIPT_DEV_TOKEN?.trim() || 'local-demo-token-user-a'
  : '';

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

// 서버에 연결하지 못했을 때(주소·방화벽·서버 꺼짐) 원인을 알려 주는 메시지
function connectionError(error) {
  if (error?.name === 'AbortError') {
    return new Error('분석 서버 응답이 너무 늦어요. 사진을 다시 찍거나 잠시 후 다시 시도해 주세요.');
  }
  if (error instanceof TypeError) {
    return new Error(`분석 서버(${receiptOcrBase})에 연결하지 못했어요. PC에서 jachwi-core 서버가 --host 0.0.0.0 으로 켜져 있는지, 휴대폰과 같은 Wi-Fi 인지, Windows 방화벽에서 ${ocrPort}번 포트가 허용됐는지 확인해 주세요.`);
  }
  return error;
}

// 웹에서는 휴대폰 카메라 원본(최신 아이폰은 8MB 이상)을 그대로 보내지 않고, 글자가 충분히 보이는 크기의 JPEG 로 줄입니다.
// HEIC 같은 형식도 브라우저가 그릴 수 있으면 JPEG 로 바뀝니다. 실패하면 원본을 그대로 씁니다.
const WEB_MAX_SIDE = 2400;
async function webJpegFromAsset(asset) {
  if (Platform.OS !== 'web' || !asset?.uri || typeof document === 'undefined') return null;
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('image decode failed'));
      element.src = asset.uri;
    });
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return null;
    const scale = Math.min(1, WEB_MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    return base64?.startsWith('/9j/') ? base64 : null;
  } catch {
    return null;
  }
}

export async function recognizeReceipt(asset, developmentToken, uid) {
  const image = (await webJpegFromAsset(asset)) || asset?.base64;
  if (!image || image.length > 11184812 || (image === asset?.base64 && asset.fileSize > 8 * 1024 * 1024)) {
    throw new Error('8MB 이하의 영수증 사진을 선택해 주세요.');
  }
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
  } catch (error) {
    throw connectionError(error);
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
  } catch (error) {
    throw connectionError(error);
  } finally { clearTimeout(timer); }
}
