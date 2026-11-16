import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import TextInput from './AppTextInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 라벨 + 입력 상자. onPress 를 주면 눌러서 값을 고르는 칸(예: 날짜)이 되고, 이때 value 는 보여줄 글자입니다.
// suffix(오른쪽 글자), rightIcon(MaterialCommunityIcons 이름), hint(아래 안내), editable(false 면 읽기 전용), marginTop(기본 28)
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  suffix,
  rightIcon,
  onPress,
  hint,
  editable = true,
  marginTop = 28,
}) {
  const box = (
    <View style={styles.box}>
      {onPress ? (
        <Text style={[styles.text, !value && styles.placeholderText]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          style={[styles.input, !editable && styles.inputDisabled]}
          editable={editable}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          maxLength={maxLength}
          accessibilityLabel={label}
        />
      )}
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      {rightIcon ? (
        <MaterialCommunityIcons name={rightIcon} size={26} color={colors.tabInactive} />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.wrapper, { marginTop }]}>
      <Text style={styles.label}>{label}</Text>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
          {box}
        </Pressable>
      ) : (
        box
      )}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 28,
  },
  label: {
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  box: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textPrimary,
  },
  inputDisabled: {
    color: colors.textSecondary,
  },
  text: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.placeholder,
  },
  suffix: {
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textPrimary,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
