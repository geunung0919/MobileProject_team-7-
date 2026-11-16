import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import IconBox from './IconBox';
import { colors, fonts, radius } from '../theme';

// "AI 한마디" 카드 (연한 초록 배경 + 반짝이 아이콘 + 라벨 + 글). AI 자취 매니저 상단과 리포트 상세에서 같이 씁니다.
export default function AiSayCard({ label, text, style }) {
  return (
    <View style={[styles.card, style]}>
      <IconBox
        name="creation"
        size={30}
        borderRadius={10}
        iconColor={colors.green}
        backgroundColor={colors.badgeBg}
      />
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.card,
    backgroundColor: colors.heroBg,
    padding: 16,
  },
  texts: {
    flex: 1,
    marginLeft: 10,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.green,
  },
  text: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
});
