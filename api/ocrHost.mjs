// 개발 실행에서 영수증 OCR 서버(jachwi-core) 주소를 자동으로 정하는 규칙. 테스트: functions/tests/receipt-draft.test.mjs
//
// 앱(또는 웹 페이지)을 띄운 주소가 같은 Wi-Fi 의 PC 주소일 때만 그 PC 의 OCR 포트를 씁니다.
//   http://192.168.0.15:8081 로 열었으면 -> http://192.168.0.15:8000
// 터널(--tunnel, *.exp.direct 등)이나 인터넷 주소는 그 주소의 8000번에 OCR 서버가 없으므로 자동으로 정하지 않습니다.
// 그때는 루트 .env.local 의 EXPO_PUBLIC_RECEIPT_OCR_BASE_URL 로 PC 주소를 직접 넣어야 합니다.

const PRIVATE_HOST = /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

export const isLanHost = (hostname) => PRIVATE_HOST.test(String(hostname || ''));

// 터널 주소인지 (안내 문구용)
export const isTunnelHost = (hostname) => /(\.exp\.direct|\.ngrok(-free)?\.(app|io|dev)|\.trycloudflare\.com|\.loca\.lt)$/i.test(String(hostname || ''));

// hostname: 앱/페이지를 띄운 주소의 호스트, port: OCR 서버 포트. 자동으로 정할 수 없으면 ''
export function ocrBaseForHost(hostname, port = '8000') {
  return isLanHost(hostname) ? `http://${hostname}:${port}` : '';
}
