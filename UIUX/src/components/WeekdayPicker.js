import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { DAY_LABELS } from '../utils/time';
import { colors, fonts } from '../theme';

// 요일 선택 (일~토). days: 선택된 요일 번호 배열(0=일요일 ... 6=토요일), onChange(새 배열)
// 최소 한 요일은 선택되어 있어야 해서, 마지막 하나는 해제되지 않습니다.
export default function WeekdayPicker({ days, onChange }) {
  const toggle = (day) => {
    if (days.includes(day)) {
      if (days.length === 1) return;
      onChange(days.filter((d) => d !== day));
    } else {
      onChange([...days, day].sort((a, b) => a - b));
    }
  };

  return (
    <View style={styles.row}>
      {DAY_LABELS.map((label, day) => {
        const selected = days.includes(day);
        return (
          <Pressable
            key={label}
            onPress={() => toggle(day)}
            accessibilityRole="button"
            accessibilityLabel={`${label}요일`}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.day, selected && styles.daySelected, pressed && styles.pressed]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
  },
  daySelected: {
    backgroundColor: colors.green,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  labelSelected: {
    fontFamily: fonts.bold,
    color: colors.white,
  },
});
