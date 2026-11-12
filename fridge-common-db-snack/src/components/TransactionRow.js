import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import IconBox from './IconBox';
import { colors, fonts } from '../theme';
import { formatNumber } from '../utils/format';

// 최근 지출 내역의 한 줄
export default function TransactionRow({ title, date, category, amount, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <IconBox name={icon} />
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          {date} · {category}
        </Text>
      </View>
      <Text style={styles.amount}>{formatNumber(amount)}원</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  texts: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
});
