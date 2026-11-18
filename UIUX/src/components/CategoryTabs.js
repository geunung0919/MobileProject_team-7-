import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 자취생존맵 상단의 카테고리 선택 (선택된 항목은 연한 초록 배경 + 초록 아이콘/글씨).
export default function CategoryTabs({ categories, selectedId, onSelect }) {
  return (
    <View style={styles.row}>
      {categories.map((cat) => {
        const active = cat.id === selectedId;
        const color = active ? colors.accent : colors.textSecondary;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={cat.label}
            style={[styles.item, active && styles.itemActive]}
          >
            <MaterialCommunityIcons name={cat.icon} size={24} color={color} />
            <Text style={[styles.label, { color }, active && styles.labelActive]}>{cat.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  item: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    paddingTop: 10,
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: colors.accentBg,
  },
  label: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  labelActive: {
    fontFamily: fonts.bold,
  },
});
