// 루트 앱(npm run receipt:web / receipt:native)의 번들러 설정
// https://docs.expo.dev/guides/customizing-metro/
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

module.exports = config;
