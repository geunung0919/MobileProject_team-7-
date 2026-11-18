// UIUX 폴더에 예전에 설치한 node_modules 가 남아 있으면 react-native 가 2벌 로드되어
// 앱이 시작되자마자 "property is not writable" 오류가 납니다.
// UIUX/node_modules 는 무시하고 항상 루트의 node_modules 를 쓰게 막아 둡니다.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const nested = /[\\/]UIUX[\\/]node_modules[\\/].*/;
const current = config.resolver.blockList;
config.resolver.blockList = [].concat(current || [], nested);

module.exports = config;
