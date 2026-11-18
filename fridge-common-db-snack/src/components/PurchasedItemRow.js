import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import IconBox from './IconBox';
import { colors, fonts } from '../theme';
import { formatNumber } from '../utils/format';

// 지출 상세의 구매 품목 한 줄 (inFridge 면 초록 냉장고 아이콘, 아니면 회색 가방)
export default function PurchasedItemRow({ name, unitPrice, quantity, inFridge }) {
  return (
    <View style={styles.row}>
      <IconBox
        name={inFridge ? 'fridge-outline' : 'bag-personal-outline'}
        iconColor={inFridge ? colors.green : colors.textSecondary}
        backgroundColor={inFridge ? colors.tabActiveBg : colors.cardBg}
      />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sub}>
          {formatNumber(unitPrice)}원 × {quantity}
        </Text>
      </View>
      <Text style={styles.sum}>{formatNumber(unitPrice * quantity)}원</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  texts: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  name: {
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
  sum: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
});
