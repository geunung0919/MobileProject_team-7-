import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';

// "오늘 챙길 일" 목록의 한 줄 (루틴, 할 일 등)
export default function TaskRow({ title, status, summary, onPress, isLast }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="calendar-check-outline" size={26} color={colors.green} />
      </View>
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
        {/* 내용이 길어도 한 줄로 유지하고 넘치면 … 로 줄입니다 */}
        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
  pressed: {
    opacity: 0.7,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.icon,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    marginLeft: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  status: {
    marginLeft: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.green,
  },
  summary: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
