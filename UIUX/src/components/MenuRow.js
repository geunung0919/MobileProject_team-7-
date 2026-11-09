import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IconBox from './IconBox';
import { colors, fonts } from '../theme';

// 아이콘 + 제목 + 설명 + 화살표 메뉴 한 줄 (생활정보, 더보기 공통). vertical: 위아래 여백, showDivider: 아래 구분선
export default function MenuRow({
  icon,
  title,
  description,
  onPress,
  vertical = 20,
  showDivider = true,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { paddingVertical: vertical },
        showDivider && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <IconBox name={icon} iconColor={colors.green} />
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
  pressed: {
    opacity: 0.7,
  },
  texts: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
