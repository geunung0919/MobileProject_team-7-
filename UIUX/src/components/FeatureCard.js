import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IconBox from './IconBox';
import { colors, fonts, radius } from '../theme';

// 생활정보 화면의 큰 기능 카드.
// - variant "mint": 연한 초록 카드 + 가로 전체 버튼 (AI 자취 매니저)
// - variant "gray": 회색 카드 + 텍스트 링크 (자취생존맵)
export default function FeatureCard({
  variant = 'mint',
  title,
  description,
  icon,
  actionLabel,
  onPress,
}) {
  const isMint = variant === 'mint';

  return (
    <View style={[styles.card, isMint ? styles.cardMint : styles.cardGray]}>
      <View style={styles.top}>
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.iconWrap}>
          <IconBox
            name={icon}
            size={57}
            borderRadius={20}
            iconColor={colors.green}
            backgroundColor={isMint ? colors.badgeBg : colors.white}
          />
        </View>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          isMint ? styles.button : styles.link,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.green} style={styles.arrow} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
  },
  cardMint: {
    backgroundColor: colors.heroBg,
  },
  cardGray: {
    backgroundColor: colors.cardBg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  texts: {
    flex: 1,
  },
  iconWrap: {
    marginTop: 8,
    marginLeft: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  button: {
    marginTop: 18,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.green,
  },
  arrow: {
    marginLeft: 8,
  },
});
