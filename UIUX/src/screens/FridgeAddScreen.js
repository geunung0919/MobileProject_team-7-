import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import Text from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormField from '../components/FormField';
import QuantityField from '../components/QuantityField';
import UnitPickerSheet from '../components/UnitPickerSheet';
import DatePickerSheet from '../components/DatePickerSheet';
import PrimaryButton from '../components/PrimaryButton';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { formatDotDate, toDateString, fromDateString, addDays } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// "1개 · 1L" 같은 예전 형식의 글자에서 수량 숫자와 단위를 뽑아냅니다. (amount / unit 이 없는 항목용)
function parseQuantity(text = '') {
  const m = String(text).match(/^\s*(\d+(?:\.\d+)?)\s*([^\s·]+)?/);
  return { amount: m ? m[1] : '', unit: m?.[2] ?? null };
}

// 식재료 추가 / 수정 화면. navigate('FridgeAdd') 는 추가, navigate('FridgeAdd', { id }) 는 그 식재료를 불러와 수정합니다 (삭제 버튼도 보임).
export default function FridgeAddScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { unitOptions } = fridgeData;
  const { fridgeItems, addFridgeItem, updateFridgeItem, removeFridgeItem } = useAppData();

  const editId = route.params?.id;
  const isEdit = !!editId;
  const existing = isEdit ? fridgeItems.find((i) => i.id === editId) : undefined;
  const parsed = existing ? parseQuantity(existing.quantity) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [quantity, setQuantity] = useState(
    existing ? String(existing.amount ?? parsed.amount) : '', // 숫자와 소수점만 저장합니다.
  );
  const [unit, setUnit] = useState(existing ? (existing.unit ?? parsed.unit) : null);
  const [purchaseDate, setPurchaseDate] = useState(
    existing?.purchaseDate ? fromDateString(existing.purchaseDate) : null, // 선택 전에는 null (칸에 YYYY.MM.DD 표시)
  );
  // 더미 데이터는 expiry 대신 "오늘로부터 며칠 뒤(daysFromToday)"만 있어서 날짜로 바꿔 줍니다.
  const [expiryDate, setExpiryDate] = useState(
    existing
      ? fromDateString(existing.expiry ?? addDays(toDateString(new Date()), existing.daysFromToday ?? 0))
      : null,
  );

  const [unitSheetVisible, setUnitSheetVisible] = useState(false);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [activeTarget, setActiveTarget] = useState('purchase'); // 날짜 시트가 다루는 칸: 'purchase' | 'expiry'

  const handleQuantityChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const [integer, ...rest] = cleaned.split('.');
    setQuantity(rest.length ? `${integer}.${rest.join('')}` : integer);
  };

  // 칸마다 값/저장 함수/선택 범위가 다릅니다 (구매일은 오늘까지, 유통기한은 구매일 이후만).
  const getDateConfig = (target) =>
    target === 'purchase'
      ? { value: purchaseDate, setValue: setPurchaseDate, minimumDate: undefined, maximumDate: new Date() }
      : { value: expiryDate, setValue: setExpiryDate, minimumDate: purchaseDate ?? undefined, maximumDate: undefined };

  const openDatePicker = (target) => {
    Keyboard.dismiss();
    const { value, setValue } = getDateConfig(target);
    // 아직 고른 날짜가 없으면 시트에 보이는 날짜(오늘)를 먼저 채워 둡니다.
    if (!value) setValue(new Date());
    setActiveTarget(target);
    setDateSheetVisible(true);
  };

  const openUnitSheet = () => {
    Keyboard.dismiss();
    setUnitSheetVisible(true);
  };

  const handleSelectUnit = (selected) => {
    setUnit(selected);
    setUnitSheetVisible(false);
  };

  const handleSave = () => {
    if (!name.trim() || !(Number(quantity) > 0) || !unit || !expiryDate) {
      Alert.alert('입력을 확인해 주세요', '식재료 이름, 수량, 단위, 유통기한을 입력해 주세요.');
      return;
    }
    if (purchaseDate && toDateString(expiryDate) < toDateString(purchaseDate)) {
      Alert.alert('날짜를 확인해 주세요', '유통기한은 구매일보다 빠를 수 없어요.');
      return;
    }
    // 저장할 값: { name, quantity(숫자), unit, purchaseDate(선택 안 했으면 null), expiry }
    // 지금은 AppDataContext(메모리)에 저장됩니다. Firebase 연결은 그 파일에서 바꾸세요.
    const values = {
      name: name.trim(),
      quantity: Number(quantity),
      unit,
      purchaseDate: purchaseDate ? toDateString(purchaseDate) : null,
      expiry: toDateString(expiryDate),
    };
    if (isEdit) updateFridgeItem(editId, values);
    else addFridgeItem(values);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('식재료를 삭제할까요?', `'${name.trim() || '이 식재료'}'이(가) 냉장고에서 삭제돼요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          removeFridgeItem(editId);
          navigation.goBack();
        },
      },
    ]);
  };

  const sheet = getDateConfig(activeTarget);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
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
          <Text style={styles.title}>{isEdit ? '식재료 수정' : '식재료 추가'}</Text>
          {isEdit ? (
            <Pressable
              onPress={handleDelete}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="식재료 삭제"
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {isEdit ? '식재료 정보를 수정해 주세요.' : '냉장고에 보관할 식재료 정보를 입력해 주세요.'}
        </Text>

        <FormField
          label="식재료 이름"
          value={name}
          onChangeText={setName}
          placeholder="예: 우유, 달걀, 두부"
          maxLength={30}
        />
        <QuantityField
          label="수량"
          value={quantity}
          onChangeText={handleQuantityChange}
          placeholder="수량 입력"
          unit={unit}
          onPressUnit={openUnitSheet}
          hint="예: 달걀 6개 · 시금치 1봉 · 두부 1모"
        />
        <FormField
          label="구매일"
          value={purchaseDate ? formatDotDate(toDateString(purchaseDate)) : ''}
          placeholder="YYYY.MM.DD"
          rightIcon="calendar-month-outline"
          onPress={() => openDatePicker('purchase')}
          hint="구매한 날짜를 입력해 주세요. 예: 2026.11.02"
        />
        <FormField
          label="유통기한"
          value={expiryDate ? formatDotDate(toDateString(expiryDate)) : ''}
          placeholder="YYYY.MM.DD"
          rightIcon="calendar-month-outline"
          onPress={() => openDatePicker('expiry')}
          hint="포장에 적힌 유통기한을 입력해 주세요."
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <PrimaryButton label={isEdit ? '수정 완료' : '추가하기'} onPress={handleSave} />
      </View>

      <UnitPickerSheet
        visible={unitSheetVisible}
        options={unitOptions}
        value={unit}
        onSelect={handleSelectUnit}
        onClose={() => setUnitSheetVisible(false)}
      />
      <DatePickerSheet
        visible={dateSheetVisible}
        value={sheet.value ?? new Date()}
        minimumDate={sheet.minimumDate}
        maximumDate={sheet.maximumDate}
        onChange={sheet.setValue}
        onClose={() => setDateSheetVisible(false)}
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
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  deleteButton: {
    padding: 4,
  },
  subtitle: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
});
