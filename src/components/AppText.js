import React from 'react';
import { Text as RNText } from 'react-native';
import { fontScale } from '../theme';

// react-native 의 Text 와 똑같이 쓰되, 시스템 글자 크기를 키워도 fontScale.body 배율까지만 커집니다.
// 탭 바처럼 공간이 정해진 곳은 maxFontSizeMultiplier={fontScale.chrome} 처럼 따로 넘깁니다.
// (React 19 에서는 Text.defaultProps 로 전체 설정을 할 수 없어서 이 래퍼를 씁니다.)
const AppText = React.forwardRef(function AppText(
  { maxFontSizeMultiplier = fontScale.body, ...props },
  ref
) {
  return <RNText ref={ref} maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
});

export default AppText;
