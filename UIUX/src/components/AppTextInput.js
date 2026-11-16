import React from 'react';
import { TextInput as RNTextInput } from 'react-native';
import { fontScale } from '../theme';

// react-native 의 TextInput 과 똑같이 쓰되, 시스템 글자 크기를 키워도 fontScale.body 배율까지만 커집니다.
const AppTextInput = React.forwardRef(function AppTextInput(
  { maxFontSizeMultiplier = fontScale.body, ...props },
  ref
) {
  return <RNTextInput ref={ref} maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
});

export default AppTextInput;
