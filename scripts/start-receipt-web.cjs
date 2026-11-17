const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
const native = args[0] === '--native';
const target = native ? ['--dev-client'] : ['--web', '--go'];
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
