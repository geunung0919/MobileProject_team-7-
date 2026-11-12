import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { formatNumber, formatDotDate } from '../utils/format';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

// 구매 품목 카드 한 장. 줄 1: 품목명(+삭제) / 줄 2: 수량 · 가격 · 식품 체크 / 줄 3(식품일 때만): 유통기한
// item: { name, quantity, price, inFridge, expiry }, canRemove: 품목이 2개 이상일 때만 삭제 버튼,
// onChange(patch): 바뀐 값만 전달, onPressExpiry: 유통기한 칸을 눌렀을 때 (날짜 시트용),
// showFridge: false 면 식품 체크와 유통기한 줄을 숨김 (이미 저장된 지출을 고칠 때)
export default function PurchaseItemCard({
  item,
  canRemove,
  onChange,
  onRemove,
  onPressExpiry,
  showFridge = true,
}) {
  const { name, quantity, price, inFridge, expiry } = item;

  const handlePrice = (text) =>
    onChange({ price: text.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 8) });

  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
        <View style={[styles.box, styles.nameBox]}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => onChange({ name: text })}
            placeholder="품목명 (예: 우유 1L)"
            placeholderTextColor={colors.placeholder}
            maxLength={30}
            accessibilityLabel="품목명"
          />
        </View>
        {canRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="품목 삭제"
            style={styles.removeButton}
          >
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.optionRow}>
        {/* 수량 */}
        <View style={[styles.box, styles.stepper]}>
          <Pressable
            onPress={() => onChange({ quantity: Math.max(MIN_QUANTITY, quantity - 1) })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="수량 줄이기"
          >
            <MaterialCommunityIcons name="minus" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable
            onPress={() => onChange({ quantity: Math.min(MAX_QUANTITY, quantity + 1) })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="수량 늘리기"
          >
            <MaterialCommunityIcons name="plus" size={22} color={colors.green} />
          </Pressable>
        </View>

        {/* 가격 (1개 가격) */}
        <View style={[styles.box, styles.priceBox]}>
          <TextInput
            style={[styles.input, styles.priceInput, !price && styles.priceEmpty]}
            value={price ? formatNumber(price) : ''}
            onChangeText={handlePrice}
            placeholder="가격"
            placeholderTextColor={colors.placeholder}
            keyboardType="number-pad"
            accessibilityLabel="1개 가격"
          />
          <Text style={styles.won}>원</Text>
        </View>

        {/* 식품 체크 */}
        {showFridge ? (
        <Pressable
          onPress={() => onChange({ inFridge: !inFridge })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: inFridge }}
          accessibilityLabel="식품 (체크하면 냉장고에 담겨요)"
          style={[styles.box, styles.foodChip, inFridge && styles.foodChipOn]}
        >
          {inFridge ? (
            <Ionicons name="checkmark" size={22} color={colors.green} />
          ) : (
            <MaterialCommunityIcons name="fridge-outline" size={22} color={colors.textSecondary} />
          )}
          <Text style={[styles.foodText, inFridge && styles.foodTextOn]}>식품</Text>
        </Pressable>
        ) : null}
      </View>

      {showFridge && inFridge ? (
        <View style={styles.expiryRow}>
          <Text style={styles.expiryLabel}>유통기한</Text>
          <Pressable
            onPress={onPressExpiry}
            accessibilityRole="button"
            accessibilityLabel="유통기한 선택"
            style={[styles.box, styles.expiryBox]}
          >
            <Text style={[styles.expiryText, !expiry && styles.expiryPlaceholder]}>
              {expiry ? formatDotDate(expiry) : '날짜 선택'}
            </Text>
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color={colors.green} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    padding: 14,
  },
  // 흰 바탕 + 연한 테두리의 둥근 입력 상자 (카드 안의 모든 칸에 공통)
  box: {
    height: 47,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameBox: {
    flex: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textPrimary,
  },
  removeButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  stepper: {
    width: 102,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  quantity: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  priceBox: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 8,
  },
  priceInput: {
    textAlign: 'right',
  },
  priceEmpty: {
    textAlign: 'left',
  },
  won: {
    marginLeft: 4,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  foodChip: {
    width: 76,
    justifyContent: 'center',
    gap: 3,
  },
  foodChipOn: {
    borderWidth: 1.5,
    borderColor: colors.green,
    backgroundColor: colors.tabActiveBg,
  },
  foodText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  foodTextOn: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
  expiryRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryLabel: {
    width: 80,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.green,
  },
  expiryBox: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  expiryText: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textPrimary,
  },
  expiryPlaceholder: {
    color: colors.placeholder,
  },
});
