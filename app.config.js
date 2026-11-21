module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    'expo-notifications',
    // 개발 빌드(아이폰·안드로이드 앱)에서 영수증 촬영·사진 선택 권한 안내 문구. 없으면 iOS 에서 카메라를 열 때 앱이 종료될 수 있어요.
    ['expo-image-picker', {
      cameraPermission: '영수증을 촬영해 소비를 기록하는 데 카메라를 사용해요.',
      photosPermission: '앨범의 영수증 사진으로 소비를 기록하는 데 사진을 사용해요.',
      microphonePermission: false,
    }],
  ],
});
