import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 라벨 + [수량 입력 상자][단위 선택 버튼] 한 줄 + 안내 문구.
// - unit: 선택된 단위 (없으면 unitPlaceholder 를 보여줍니다)
// - onPressUnit: 단위 선택 버튼을 눌렀을 때 호출 (단위 선택 시트를 여는 용도)
export default function QuantityField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  unitPlaceholder = '단위 선택',
  onPressUnit,
  hint,
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
            keyboardType="decimal-pad"
            maxLength={6}
            accessibilityLabel={label}
          />
        </View>

        <Pressable
          onPress={onPressUnit}
          accessibilityRole="button"
          accessibilityLabel="단위 선택"
          style={({ pressed }) => [styles.unitButton, pressed && styles.pressed]}
        >
          <Text style={styles.unitText} numberOfLines={1}>
            {unit || unitPlaceholder}
          </Text>
          <Ionicons name="chevron-down" size={22} color={colors.green} />
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
    height: '100%',
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
