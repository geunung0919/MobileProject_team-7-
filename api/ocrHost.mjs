// 개발 실행에서 영수증 OCR 서버 주소를 정하는 규칙. 테스트: functions/tests/receipt-draft.test.mjs
//
// 앱은 OCR 요청을 자기가 연결된 Expo 개발 서버의 /__ocr 로 보내고, 개발 서버(metro.config.js)가
// 같은 PC 의 jachwi-core(127.0.0.1:8000)로 전달합니다. 그래서 앱이 열리는 곳이면 어디서든 동작해요.
//   http://192.168.0.15:8081  (같은 Wi-Fi)      -> http://192.168.0.15:8081/__ocr
//   https://abcd-8081.exp.direct (--tunnel)   -> https://abcd-8081.exp.direct/__ocr
//   http://localhost:8081      (PC 브라우저)    -> http://localhost:8081/__ocr

export const OCR_PROXY_PATH = '/__ocr';

// devServerUrl: 앱/페이지를 띄운 개발 서버 주소. 정할 수 없으면 ''
export function ocrBaseFromDevServer(devServerUrl) {
  try {
    const url = new URL(devServerUrl);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return '';
    return `${url.origin}${OCR_PROXY_PATH}`;
  } catch {
    return '';
  }
}
