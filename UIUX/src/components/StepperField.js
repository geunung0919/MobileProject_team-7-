import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// [−] 값 [+] 한 줄. 값은 min~max 사이에서 1씩 바뀌고, 끝에 닿으면 해당 버튼이 흐려집니다.
// format(value): 가운데에 보여줄 글자 (예: v => `${v}개월`)
export default function StepperField({ value, onChange, min = 0, max = 99, format, label }) {
  const canDown = value > min;
  const canUp = value < max;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => canDown && onChange(value - 1)}
        disabled={!canDown}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? ''} 줄이기`}
        style={({ pressed }) => [styles.button, !canDown && styles.disabled, pressed && styles.pressed]}
      >
        <Ionicons name="remove" size={24} color={colors.green} />
      </Pressable>
      <View style={styles.valueBox} accessible accessibilityLabel={`${label ?? ''} ${format ? format(value) : value}`}>
        <Text style={styles.value}>{format ? format(value) : String(value)}</Text>
      </View>
      <Pressable
        onPress={() => canUp && onChange(value + 1)}
        disabled={!canUp}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? ''} 늘리기`}
        style={({ pressed }) => [styles.button, !canUp && styles.disabled, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={24} color={colors.green} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
  valueBox: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
});
