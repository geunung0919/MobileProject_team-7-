// 루트 앱(npm run receipt:web / receipt:native)의 번들러 설정
// https://docs.expo.dev/guides/customizing-metro/
const http = require('http');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// UIUX/, mobile/ 등은 예전에 따로 실행하던 앱이라 각자 node_modules 가 남아 있을 수 있어요.
// 루트 앱이 그 안의 react(예: UIUX 의 19.1)까지 불러오면 React 가 두 개가 되어
// "Invalid hook call" 오류로 화면이 뜨지 않습니다. 하위 폴더의 node_modules 와 파이썬 가상환경은
// 번들러가 보지 않게 막아서, 패키지는 항상 루트 node_modules 하나만 쓰게 합니다.
const root = path.resolve(__dirname).replace(/[\\/]+$/, '');
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sep = '[\\\\/]';
const inside = (...parts) => new RegExp(`^${escape(root)}${sep}${parts.join(sep)}${sep}.*$`);

config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  inside('UIUX', 'node_modules'),
  inside('mobile', 'node_modules'),
  inside('functions', 'node_modules'),
  inside('ai_manager', '.*', 'node_modules'),
  inside('server', 'node_modules'),
  inside('jachwi-core', '\\.venv'),
  inside('jachwi-core', 'data'),
];

// 영수증 OCR 중계: 앱이 개발 서버의 /__ocr/... 로 보내면 이 PC 의 jachwi-core(127.0.0.1:8000)로 전달합니다.
// 앱이 열리는 곳이면(같은 Wi-Fi, 핫스팟, --tunnel) 어디서든 OCR 이 되고, 휴대폰이 8000번에 직접 붙을 필요가 없어요.
const OCR_PREFIX = '/__ocr';
const ocrPort = Number(process.env.RECEIPT_OCR_PORT || process.env.EXPO_PUBLIC_RECEIPT_OCR_PORT || 8000);

function proxyToOcr(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${ocrPort}` };
  delete headers.origin; // 같은 출처 요청이라 CORS 확인이 필요 없어요.
  delete headers.referer;
  const upstream = http.request(
    { host: '127.0.0.1', port: ocrPort, method: req.method, path: req.url.slice(OCR_PREFIX.length) || '/', headers },
    (response) => {
      res.writeHead(response.statusCode || 502, response.headers);
      response.pipe(res);
    }
  );
  upstream.setTimeout(120000, () => upstream.destroy(new Error('timeout')));
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: { message:
      `PC 의 영수증 OCR 서버(jachwi-core, ${ocrPort}번)가 꺼져 있거나 응답하지 않아요. jachwi-core 폴더에서 서버를 먼저 켜 주세요.` } }));
  });
  req.pipe(upstream);
}

const previousEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const next = previousEnhance ? previousEnhance(middleware, server) : middleware;
    return (req, res, fallthrough) => {
      if (req.url === OCR_PREFIX || req.url.startsWith(`${OCR_PREFIX}/`)) return proxyToOcr(req, res);
      return next(req, res, fallthrough);
    };
  },
};

module.exports = config;
