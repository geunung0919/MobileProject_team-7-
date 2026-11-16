import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';

// 하나만 고르는 2열 선택 버튼 (예: 자취 기간). options: [{ id, label }], value: 선택된 id, onChange(id)
export default function ChoiceGrid({ options, value, onChange }) {
  const rows = [];
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2));
  return (
    <View style={styles.grid}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((option) => {
            const selected = option.id === value;
            return (
              <Pressable
                key={option.id}
                onPress={() => onChange(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.cell, selected && styles.cellSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
          {row.length < 2 ? <View style={styles.cellSpacer} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: colors.tabActiveBg,
    borderColor: colors.green,
  },
  cellSpacer: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  labelSelected: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
});
