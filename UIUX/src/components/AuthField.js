import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import TextInput from './AppTextInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 로그인·회원가입 입력 칸. error 가 있으면 칸 테두리를 빨갛게 하고 칸 바로 아래에 문구를 보여 줍니다(인라인 에러).
// secure: 비밀번호 칸(보기/숨기기 버튼 포함), onPress: 눌러서 고르는 칸(생년월일), children: 칸 아래 추가 내용(강도 표시 등)
export default function AuthField({
  label, value, onChangeText, onBlur, placeholder, error, hint, secure = false, onPress,
  autoComplete, textContentType, maxLength, children, testID,
}) {
  const [hidden, setHidden] = useState(true);
  const errorId = `${testID || label}-error`;
  const box = (
    <View style={[styles.box, error && styles.boxError]}>
      {onPress ? (
        <Text style={[styles.text, !value && styles.placeholder]}>{value || placeholder}</Text>
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          maxLength={maxLength}
          accessibilityLabel={label}
          accessibilityHint={error || hint}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          testID={testID}
        />
      )}
      {secure && (
        <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10} accessibilityRole="button"
          accessibilityLabel={hidden ? '비밀번호 보기' : '비밀번호 숨기기'}>
          <MaterialCommunityIcons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={24} color={colors.tabInactive} />
        </Pressable>
      )}
      {onPress && <MaterialCommunityIcons name="calendar-month-outline" size={24} color={colors.tabInactive} />}
    </View>
  );
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label} ${value || '선택 안 함'}`}
          accessibilityHint={error || hint} testID={testID}>{box}</Pressable>
      ) : box}
      {error ? (
        <Text nativeID={errorId} style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</Text>
      ) : hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 20 },
  label: { marginBottom: 8, fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary },
  box: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.cardBg, borderRadius: 20, paddingHorizontal: 18, borderWidth: 1.5, borderColor: 'transparent',
  },
  boxError: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  input: { flex: 1, minHeight: 52, paddingVertical: 0, fontFamily: fonts.regular, fontSize: 17, color: colors.textPrimary },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 17, color: colors.textPrimary },
  placeholder: { color: colors.placeholder },
  error: { marginTop: 6, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.danger },
  hint: { marginTop: 6, fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
});
