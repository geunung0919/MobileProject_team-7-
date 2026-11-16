import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import TextInput from './AppTextInput';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 라벨 + [수량 입력][단위 선택 버튼] 한 줄 + 안내 문구. onPressUnit: 단위 선택 시트를 여는 용도
export default function QuantityField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  unitPlaceholder = '단위 선택',
  onPressUnit,
  hint,
  editable = true, // false 면 읽기 전용 (수량 입력과 단위 선택이 막힘)
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            editable={editable}
            keyboardType="decimal-pad"
            maxLength={6}
            accessibilityLabel={label}
          />
        </View>

        <Pressable
          onPress={onPressUnit}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel="단위 선택"
          style={({ pressed }) => [styles.unitButton, pressed && styles.pressed]}
        >
          <Text style={styles.unitText} numberOfLines={1}>
            {unit || unitPlaceholder}
          </Text>
          {editable ? <Ionicons name="chevron-down" size={22} color={colors.green} /> : null}
        </Pressable>
      </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputBox: {
    flex: 1,
    height: 58,
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textPrimary,
  },
  unitButton: {
    width: 128,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tabActiveBg,
    borderRadius: 20,
    paddingHorizontal: 18,
  },
  pressed: {
    opacity: 0.85,
  },
  unitText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.green,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
