const { spawnSync } = require('node:child_process');
const os = require('node:os');

// npm run receipt:web                → 웹(같은 Wi-Fi·핫스팟에서 휴대폰 브라우저로 열기)
// npm run receipt:web -- --tunnel    → 어디서든(다른 네트워크·LTE) 열 수 있는 인터넷 주소로 실행
// npm run receipt:native             → 개발 빌드 앱 (뒤에 -- --tunnel 가능)
const args = process.argv.slice(2);
const native = args[0] === '--native';
const rest = native ? args.slice(1) : args;
const tunnel = rest.includes('--tunnel');
const host = tunnel || rest.includes('--localhost') || rest.includes('--lan') ? [] : ['--lan'];
const target = native ? ['--dev-client'] : ['--web', '--go'];

// 같은 Wi-Fi 의 휴대폰에서 열 수 있는 이 PC 의 사설 IPv4 주소
function lanAddress() {
  const candidates = Object.entries(os.networkInterfaces())
    .flatMap(([name, list]) => (list || []).map((info) => ({ name, ...info })))
    .filter((info) => info.family === 'IPv4' && !info.internal)
    .filter((info) => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(info.address))
    // 가상 어댑터(WSL, Hyper-V, VirtualBox, VPN)보다 Wi-Fi/이더넷을 먼저
    .sort((a, b) => Number(/vethernet|virtual|vmware|vbox|wsl|tailscale|zerotier/i.test(a.name))
      - Number(/vethernet|virtual|vmware|vbox|wsl|tailscale|zerotier/i.test(b.name)));
  return candidates[0]?.address;
}

const ocrPort = process.env.RECEIPT_OCR_PORT || process.env.EXPO_PUBLIC_RECEIPT_OCR_PORT || '8000';
const ip = lanAddress();
console.log('');
console.log('==================== 영수증 테스트 ====================');
console.log('1) 다른 창에서 영수증 OCR 서버를 먼저 켜 두세요 (이 PC 안에서만 열어도 돼요):');
console.log('     cd jachwi-core');
console.log(`     ./.venv/Scripts/python.exe -m uvicorn app.main:create_app --factory --port ${ocrPort}`);
console.log('   앱의 OCR 요청은 이 개발 서버(/__ocr)를 거쳐 OCR 서버로 전달돼요.');
if (tunnel) {
  console.log('2) 터널 모드: 아래 Expo 화면에 나오는 https://...exp.direct 주소(웹) 또는 QR(앱)로 어디서든 열 수 있어요.');
} else if (ip) {
  console.log(`2) 같은 Wi-Fi·핫스팟의 휴대폰에서 열 주소: ${native ? `QR 코드 (exp://${ip}:8081)` : `http://${ip}:8081`}`);
  console.log('   다른 네트워크(LTE 등)에서 열려면: npm run receipt:web -- --tunnel');
} else {
  console.log('2) Wi-Fi IPv4 주소를 찾지 못했어요. 어디서든 열려면: npm run receipt:web -- --tunnel');
}
console.log('=======================================================');
console.log('');

const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'start', ...host, ...target, ...rest], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_PUBLIC_SHARED_RECEIPTS: 'true',
    EXPO_PUBLIC_FIREBASE_TARGET: 'cloud',
    EXPO_PUBLIC_CLOUD_API_BASE_URL: 'https://asia-northeast3-solo-living-ai.cloudfunctions.net/api',
  },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
