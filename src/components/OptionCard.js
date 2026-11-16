import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import IconBox from './IconBox';
import { colors, fonts } from '../theme';

// 아이콘 + 제목 + 설명 + 오른쪽 체크 원이 있는 선택 카드 (목표 선택, 조리 도구 "없음").
// selected 면 연한 초록 바탕에 초록 테두리. 선택 방식(하나만/여러 개)은 쓰는 쪽에서 정합니다.
export default function OptionCard({ icon, title, description, selected, onPress, compact = false }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      <IconBox
        name={icon}
        size={compact ? 40 : 48}
        iconColor={selected ? colors.green : colors.textSecondary}
        backgroundColor={colors.white}
        borderRadius={compact ? 14 : 16}
      />
      <View style={styles.texts}>
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.check, selected && styles.checkOn]}>
        {selected ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: colors.tabActiveBg,
    borderColor: colors.green,
  },
  pressed: {
    opacity: 0.85,
  },
  texts: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  titleCompact: {
    fontSize: 15,
  },
  description: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.checkboxBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
});
