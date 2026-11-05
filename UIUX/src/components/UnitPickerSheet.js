import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet from './BottomSheet';
import { colors, fonts } from '../theme';

// 단위(개, 봉, g ...)를 고르는 하단 시트.
// - options: 단위 문자열 배열
// - value: 현재 선택된 단위
// - onSelect(unit): 단위를 눌렀을 때 호출 (시트를 닫는 것은 부모가 합니다)
export default function UnitPickerSheet({ visible, options, value, onSelect, onClose }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="단위 선택">
      <View style={styles.grid}>
        {options.map((unit) => {
          const selected = unit === value;
          return (
            <Pressable
              key={unit}
              onPress={() => onSelect(unit)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.pill,
                selected && styles.pillSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{unit}</Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    minWidth: 72,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: colors.cardBg,
  },
  pillSelected: {
    backgroundColor: colors.green,
  },
  pressed: {
    opacity: 0.85,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.white,
  },
});
