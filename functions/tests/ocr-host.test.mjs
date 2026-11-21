import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ocrBaseFromDevServer, OCR_PROXY_PATH} from '../../api/ocrHost.mjs';

// 휴대폰은 Expo 개발 서버 주소의 /__ocr 로 보내고, 개발 서버(metro.config.js)가 같은 PC 의 jachwi-core 로 넘깁니다.
test('OCR 은 개발 서버 주소(같은 Wi-Fi·터널)의 /__ocr 로 보낸다', () => {
  assert.equal(OCR_PROXY_PATH, '/__ocr');
  assert.equal(ocrBaseFromDevServer('http://192.168.0.15:8081/'), 'http://192.168.0.15:8081/__ocr');
  assert.equal(ocrBaseFromDevServer('https://mwwt9cy-anonymous-8081.exp.direct/'), 'https://mwwt9cy-anonymous-8081.exp.direct/__ocr');
  assert.equal(ocrBaseFromDevServer('http://localhost:8081/index.bundle?platform=web'), 'http://localhost:8081/__ocr');
  for (const bad of ['', undefined, 'exp://192.168.0.15:8081', 'not a url']) assert.equal(ocrBaseFromDevServer(bad), '', String(bad));
});
