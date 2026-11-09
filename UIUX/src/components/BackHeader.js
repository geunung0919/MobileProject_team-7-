import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 스택 화면 상단의 "뒤로 가기 + 제목" 줄. 선택 props: subtitle(제목 아래 설명), color(글자/아이콘 색), right(오른쪽 끝 요소)
export default function BackHeader({
  title,
  subtitle,
  onBack,
  color = colors.textPrimary,
  right,
  icon = 'chevron-back', // Ionicons 이름
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name={icon} size={28} color={color} />
        </Pressable>
        <Text style={[styles.title, { color }]} numberOfLines={1}>
          {title}
        </Text>
        {right ?? null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  subtitle: {
    marginTop: 6,
    marginLeft: 36,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
