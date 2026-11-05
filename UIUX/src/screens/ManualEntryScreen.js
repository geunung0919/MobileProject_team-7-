import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import DatePickerSheet from '../components/DatePickerSheet';
import PurchaseItemCard from '../components/PurchaseItemCard';
import AddItemButton from '../components/AddItemButton';
import { useAppData } from '../store/AppDataContext';
import { formatNumber, formatDotDate, toDateString, fromDateString } from '../utils/format';
import {
  createEmptyItem,
  applyItemPatch,
  sumItems,
  countFridgeItems,
  validateItems,
  toSavedItems,
  addCheckedItemsToFridge,
  scrollToEndSoon,
} from '../utils/purchaseItems';
import { colors, fonts, spacing } from '../theme';

export default function ManualEntryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { addTransaction, addFridgeItem } = useAppData();
  const scrollRef = useRef(null);
  const nextKey = useRef(2); // 품목 카드를 구분하는 번호 (첫 카드는 1)

  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(new Date());
  const [items, setItems] = useState([createEmptyItem(1)]);
  // 열려 있는 날짜 시트가 다루는 칸: null(닫힘) | 'purchase'(구매일) | 품목 key(그 품목의 유통기한)
  const [dateTarget, setDateTarget] = useState(null);

  const dateStr = toDateString(date);
  const total = sumItems(items);
  const fridgeCount = countFridgeItems(items);

  const updateItem = (key, patch) => {
    // 식품을 처음 체크하면 유통기한을 구매일 + 14일로 미리 채워 줍니다.
    setItems((prev) => prev.map((it) => (it.key === key ? applyItemPatch(it, patch, dateStr) : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem(nextKey.current++)]);
    scrollToEndSoon(scrollRef);
  };

  const removeItem = (key) => setItems((prev) => prev.filter((it) => it.key !== key));

  const openDateSheet = (target) => {
    Keyboard.dismiss();
    setDateTarget(target);
  };

  // 날짜 시트가 지금 다루는 값
  const sheet =
    dateTarget === 'purchase' || dateTarget === null
      ? { value: date, onChange: setDate, minimumDate: undefined, maximumDate: new Date() }
      : {
          value: fromDateString(items.find((it) => it.key === dateTarget)?.expiry ?? dateStr),
          onChange: (picked) => updateItem(dateTarget, { expiry: toDateString(picked) }),
          minimumDate: date,
          maximumDate: undefined,
        };

  const handleSave = () => {
    if (!storeName.trim()) {
      Alert.alert('입력을 확인해 주세요', '산 곳의 이름을 입력해 주세요.');
      return;
    }
    const itemsError = validateItems(items, dateStr);
    if (itemsError) {
      Alert.alert('입력을 확인해 주세요', itemsError);
      return;
    }

    // 소비 내역 한 줄 + 구매 품목들을 저장합니다. 형식: data/spending/spending.js 의 items 설명 참고.
    // 지금은 앱 메모리(AppDataContext)에 저장됩니다. Firebase 연결은 그 파일에서 바꾸면 돼요.
    addTransaction({
      title: storeName.trim(),
      amount: total,
      date: dateStr,
      source: 'manual',
      items: toSavedItems(items, (it, index) => `m${index + 1}`),
    });

    // 식품으로 체크한 품목은 냉장고에도 담습니다.
    addCheckedItemsToFridge(items, dateStr, addFridgeItem);

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 24,
        }}
      >
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>직접 입력</Text>
        </View>
        <Text style={styles.subtitle}>산 곳과 구매 품목을 입력해 주세요.</Text>

        <FormField
          label="이름"
          value={storeName}
          onChangeText={setStoreName}
          placeholder="예: 이마트, 스타벅스, 온라인 주문"
          maxLength={30}
          marginTop={18}
        />
        <FormField
          label="구매일"
          value={formatDotDate(dateStr)}
          placeholder="날짜 선택"
          rightIcon="calendar-month-outline"
          onPress={() => openDateSheet('purchase')}
          marginTop={18}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>구매 품목</Text>
          <Text style={styles.sectionHint}>식품은 체크하면 냉장고에 담겨요</Text>
        </View>

        {items.map((item) => (
          <View key={item.key} style={styles.cardGap}>
            <PurchaseItemCard
              item={item}
              canRemove={items.length > 1}
              onChange={(patch) => updateItem(item.key, patch)}
              onRemove={() => removeItem(item.key)}
              onPressExpiry={() => openDateSheet(item.key)}
            />
          </View>
        ))}

        <AddItemButton label="품목 추가" onPress={addItem} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>총 지출</Text>
          <Text style={styles.totalAmount}>{formatNumber(total)}원</Text>
        </View>
        <PrimaryButton
          label={fridgeCount > 0 ? `추가하고 냉장고에 ${fridgeCount}개 담기` : '추가하기'}
          onPress={handleSave}
        />
      </View>

      <DatePickerSheet
        visible={dateTarget !== null}
        value={sheet.value}
        minimumDate={sheet.minimumDate}
        maximumDate={sheet.maximumDate}
        onChange={sheet.onChange}
        onClose={() => setDateTarget(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardGap: {
    marginBottom: 12,
  },
  footer: {
    paddingTop: 14,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.divider,
  },
  totalRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
});
