import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 둘 중 하나를 고르는 전환 버튼 (예: "오전 / 오후"). options: [{ value, label }], onChange(value)
// showCheck: 선택된 항목 앞에 체크 아이콘 (기본 true)
export default function SegmentedControl({ options, value, onChange, showCheck = true }) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.button, selected && styles.selected]}
          >
            {selected && showCheck ? (
              <Ionicons name="checkmark" size={20} color={colors.green} style={styles.check} />
            ) : null}
            <Text style={[styles.text, selected && styles.textSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    minHeight: 46,
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  selected: {
    backgroundColor: colors.tabActiveBg,
  },
  check: {
    marginRight: 6,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  textSelected: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
});
