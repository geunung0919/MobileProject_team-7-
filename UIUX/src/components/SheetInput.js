import React from 'react';
import { StyleSheet } from 'react-native';
import TextInput from './AppTextInput';
import { colors, fonts } from '../theme';

// 시트 안에서 쓰는 테두리 있는 글자 입력 칸. TextInput 의 props 를 그대로 사용할 수 있습니다.
export default function SheetInput({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={colors.placeholder}
      returnKeyType="done"
      {...props}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cardBg,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textPrimary,
  },
});
