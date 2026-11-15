const { spawnSync } = require('node:child_process');

const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--web', '--lan', '--go', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_PUBLIC_SHARED_RECEIPTS: 'true',
    EXPO_PUBLIC_FIREBASE_TARGET: 'cloud',
    EXPO_PUBLIC_CLOUD_API_BASE_URL: 'https://asia-northeast3-solo-living-ai.cloudfunctions.net/api',
    EXPO_PUBLIC_RECEIPT_OCR_BASE_URL: '',
  },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
