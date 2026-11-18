const { spawnSync } = require('node:child_process');
const os = require('node:os');

const args = process.argv.slice(2);
const native = args[0] === '--native';
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

const ip = lanAddress();
const ocrPort = process.env.EXPO_PUBLIC_RECEIPT_OCR_PORT || '8000';
console.log('');
console.log('==================== 영수증 테스트 ====================');
if (ip) {
  if (!native) console.log(`아이폰/안드로이드 브라우저 주소 : http://${ip}:8081  (PC와 같은 Wi-Fi)`);
  console.log(`영수증 OCR 서버              : http://${ip}:${ocrPort}`);
} else {
  console.log('Wi-Fi IPv4 주소를 찾지 못했어요. ipconfig 로 PC 주소를 확인해 주세요.');
}
console.log('OCR 서버는 다른 창에서 먼저 켜 두세요:');
console.log('  cd jachwi-core');
console.log(`  ./.venv/Scripts/python.exe -m uvicorn app.main:create_app --factory --host 0.0.0.0 --port ${ocrPort}`);
console.log('Windows 방화벽 창이 뜨면 "개인 네트워크" 허용을 눌러 주세요.');
console.log('=======================================================');
console.log('');

const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--lan', ...target, ...(native ? args.slice(1) : args)], {
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
