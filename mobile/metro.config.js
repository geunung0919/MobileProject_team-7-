
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const mobileModules = path.join(projectRoot, 'node_modules');
const rootModules = path.join(workspaceRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// UIUX 등 외부 프로젝트 폴더 접근 허용
config.watchFolders = [
  ...new Set([
    ...(config.watchFolders || []),
    workspaceRoot,
  ]),
];

// 라이브러리 탐색 위치
config.resolver.nodeModulesPaths = [
  mobileModules,
  rootModules,
];

// React / React Native 중복 로딩 방지
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),

  react: path.join(mobileModules, 'react'),

  'react-native': path.join(
    mobileModules,
    'react-native'
  ),

  'react/jsx-runtime': path.join(
    mobileModules,
    'react',
    'jsx-runtime'
  ),
};

// 상위 폴더에서 별도 node_modules를 자동 탐색하지 않도록 설정
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
