import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../../firebase/firebaseConfig';
import { environment } from '../../../config/environment';
import Chip from '../components/Chip';
import { createFridgeItem, changeFridgeItem } from '../../../api/receiptApi';
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
  const { fridgeItems, addFridgeItem, updateFridgeItem, removeFridgeItem, sharedReceipts, sharedUid, refreshShared, visibleShared } = useAppData();

  const editId = route.params?.id;
  const isEdit = !!editId;
  const shoppingItem = !isEdit ? route.params?.shoppingItem : null;
  const shoppingUid = route.params?.shoppingUid;

  const shoppingRequestId = shoppingItem?.id
    ? `shop_${shoppingItem.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 70)}`
    : null;
  const cloud = sharedReceipts;
  const originalUid = useRef(sharedUid).current;
  const cloudRow = isEdit && cloud && originalUid === sharedUid ? visibleShared?.inventory?.find((item) => item.id === editId) : null;
  const originalVersion = useRef(cloudRow?.version).current;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [storageMethod, setStorageMethod] = useState(cloudRow?.storageMethod || 'refrigerated');
  const [dateType, setDateType] = useState(cloudRow?.dateType || 'unknown');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);
  const cloudPending = pending?.uid === sharedUid ? pending : null;
  const saveLock = useRef(false);
  const pendingKey = cloud && !isEdit && sharedUid ? `fridge-pending:v1:${environment.firebaseTarget}:${sharedUid}` : null;
  const [loadedKey, setLoadedKey] = useState(null);
  useEffect(() => {
    if (!pendingKey) return;
    let active = true;
    AsyncStorage.getItem(pendingKey).then((raw) => {
      if (!active) return;
      const payload = raw ? JSON.parse(raw) : null;
      setPending(payload ? { uid: sharedUid, payload } : null);
      setLoadedKey(pendingKey);
    }).catch(() => {
      if (active) setMessage('이전에 저장하던 식재료를 읽지 못했어요. 화면을 다시 열어 주세요.');
    });
    return () => { active = false; };
  }, [pendingKey, sharedUid]);
  const existing = cloudRow ? { ...cloudRow, amount: cloudRow.quantity, purchaseDate: cloudRow.purchasedAt, expiry: cloudRow.expiresAt } :
    isEdit && !cloud ? fridgeItems.find((i) => i.id === editId) : undefined;
  const parsed = existing ? parseQuantity(existing.quantity) : null;

  const [name, setName] = useState(existing?.name ?? shoppingItem?.name ?? '');
  const [quantity, setQuantity] = useState(
    existing ? String(existing.amount ?? parsed.amount) : shoppingItem ? String(shoppingItem.quantity) : '', // 숫자와 소수점만 저장합니다.
  );
  const [unit, setUnit] = useState(existing ? (existing.unit ?? parsed.unit) : (shoppingItem?.unit ?? null));
  const [purchaseDate, setPurchaseDate] = useState(
    existing?.purchaseDate ? fromDateString(existing.purchaseDate) : null, // 선택 전에는 null (칸에 YYYY.MM.DD 표시)
  );
  // 더미 데이터는 expiry 대신 "오늘로부터 며칠 뒤(daysFromToday)"만 있어서 날짜로 바꿔 줍니다.
  const [expiryDate, setExpiryDate] = useState(
    existing && (existing.expiry || !cloud)
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

  const handleSave = async () => {
    if (saveLock.current) return;
    setMessage('');
    if (cloud && !sharedUid) {
      navigation.navigate('SharedLogin');
      return;
    }

    if (shoppingItem && (
      !cloud ||
      !shoppingRequestId ||
      shoppingUid !== sharedUid ||
      auth.currentUser?.uid !== sharedUid
    )) {
      setMessage('??? ??? ??? ??? ??? ???.');
      return;
    }

    if (shoppingItem && cloudPending &&
        cloudPending.payload.requestId !== shoppingRequestId) {
      setMessage('??? ?? ?? ?? ???? ???.');
      return;
    }
    if (cloud && (isEdit ? !cloudRow || !originalVersion : loadedKey !== pendingKey)) return;
    const needsDate = !cloud || dateType !== 'unknown';
    if (!cloudPending && (!name.trim() || !(Number(quantity) > 0) || !unit || (needsDate && !expiryDate))) {
      setMessage('식재료 이름, 수량, 단위와 선택한 기한을 확인해 주세요.');
      return;
    }
    if (!cloudPending && purchaseDate && expiryDate && needsDate && toDateString(expiryDate) < toDateString(purchaseDate)) {
      setMessage('기한은 구매일보다 빠를 수 없어요.');
      return;
    }
    const values = {
      name: name.trim(),
      quantity: Number(quantity),
      unit,
      purchaseDate: purchaseDate ? toDateString(purchaseDate) : null,
      expiry: needsDate && expiryDate ? toDateString(expiryDate) : null,
    };
    if (cloud && isEdit) {
      await modifyCloud({ action: 'update', name: values.name, quantity: values.quantity, unit,
        purchasedAt: values.purchaseDate, expiresAt: values.expiry, storageMethod, dateType });
      return;
    }
    if (cloud) {
      const payload = cloudPending?.payload ?? {
        requestId: shoppingRequestId || `fridge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: values.name,
        quantity: values.quantity,
        unit: values.unit,
        purchasedAt: values.purchaseDate,
        expiresAt: values.expiry,
        dateType,
        storageMethod,
      };
      saveLock.current = true;
      setSaving(true);
      try {
        await AsyncStorage.setItem(pendingKey, JSON.stringify(payload));
        setPending({ uid: sharedUid, payload });
        const created = await createFridgeItem(payload, sharedUid);

        if (shoppingItem) {
          if (!created?.id) {
            throw new Error(
              '?? ?? ID? ???? ????. ?? ???? ?? ??? ???.'
            );
          }

          if (auth.currentUser?.uid !== shoppingUid) {
            throw new Error('??? ??? ?????.');
          }

          const shoppingKey =
            `solo-living-ai:shopping:v1:${shoppingUid}`;

          const raw = await AsyncStorage.getItem(shoppingKey);
          const rows = raw ? JSON.parse(raw) : [];

          if (!Array.isArray(rows)) {
            throw new Error('??? ?? ?? ??? ?????.');
          }

          const index = rows.findIndex(
            row => row.id === shoppingItem.id
          );

          if (index < 0 || !rows[index].done) {
            throw new Error(
              '?? ??? ??? ??? ?? ? ???.'
            );
          }

          if (rows[index].inventoryId &&
              rows[index].inventoryId !== created.id) {
            throw new Error(
              '?? ?? ??? ??? ??? ?????.'
            );
          }

          rows[index] = {
            ...rows[index],
            inventoryId: created.id,
          };

          await AsyncStorage.setItem(
            shoppingKey,
            JSON.stringify(rows)
          );
        }

        void refreshShared(sharedUid);
        try {
          await AsyncStorage.removeItem(pendingKey);
        } catch {
          setMessage('서버에 저장했어요. 기기에 남은 대기 기록을 같은 요청으로 정리해 주세요.');
          return;
        }
        setPending(null);
        if (auth.currentUser?.uid === sharedUid && navigation.isFocused()) navigation.goBack();
      } catch (error) {
        if (error.status === 422 || error.status === 409 || error.status === 405) {
          try {
            await AsyncStorage.removeItem(pendingKey);
            setPending(null);
          } catch {
            setMessage('기기의 대기 기록을 지우지 못했어요. 화면을 다시 열어 주세요.');
            return;
          }
        }
        setMessage(error.status === 405 ? '팀 서버에 냉장고 저장 기능을 먼저 배포해 주세요.' : (error.message || '저장을 확인하지 못했어요.'));
      } finally {
        saveLock.current = false;
        setSaving(false);
      }
      return;
    }
    if (isEdit) updateFridgeItem(editId, values);
    else addFridgeItem(values);
    navigation.goBack();
  };

  async function modifyCloud(values) {
    if (saveLock.current || !sharedUid || !cloudRow || !originalVersion) return;
    saveLock.current = true;
    setSaving(true);
    setMessage('');
    try {
      await changeFridgeItem({ ...values, id: editId, version: originalVersion }, sharedUid);
      void refreshShared(sharedUid);
      if (auth.currentUser?.uid === sharedUid && navigation.isFocused()) navigation.goBack();
    } catch (error) {
      setMessage(error.message || '식재료 변경을 저장하지 못했어요.');
      if (error.status === 409 || error.status === 404) void refreshShared(sharedUid);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }
  const handleDelete = () => {
    if (cloud) {
      setDeleteConfirm(true);
      return;
    }
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

        {cloud && isEdit && !cloudRow ? <Text>식재료가 없거나 로그인 계정이 바뀌었어요.</Text> : null}
        {deleteConfirm ? <View style={styles.choices}>
          <Text>이 식재료를 삭제할까요?</Text>
          <Chip label="삭제 확인" onPress={() => modifyCloud({ action: 'delete' })} />
          <Chip label="취소" onPress={() => setDeleteConfirm(false)} />
        </View> : null}
        {message ? <Text accessibilityRole="alert" style={{ color: colors.warnText }}>{message}</Text> : null}
        {cloudPending ? <Text>{cloudPending.payload.name} · 서버 저장 확인 대기 중</Text> : <>
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
        {cloud ? <>
          <Text>보관 방법</Text>
          <View style={styles.choices}>
            {[['refrigerated', '냉장'], ['frozen', '냉동'], ['room', '실온']].map(([key, label]) => (
              <Chip key={key} label={label} selected={storageMethod === key} onPress={() => setStorageMethod(key)} />
            ))}
          </View>
          <Text>기한 유형</Text>
          <View style={styles.choices}>
            {[['unknown', '기한 모름'], ['package', '포장지 소비기한'], ['reference', '보관 참고일']].map(([key, label]) => (
              <Chip key={key} label={label} selected={dateType === key} onPress={() => { setDateType(key); setExpiryDate(null); }} />
            ))}
          </View>
        </> : null}
        {!cloud || dateType !== 'unknown' ? <FormField
          label={cloud && dateType === 'reference' ? '보관 참고일' : '유통기한'}
          value={expiryDate ? formatDotDate(toDateString(expiryDate)) : ''}
          placeholder="YYYY.MM.DD"
          rightIcon="calendar-month-outline"
          onPress={() => openDatePicker('expiry')}
          hint={cloud && dateType === 'reference' ? undefined : "포장에 적힌 유통기한을 입력해 주세요."}
        /> : null}
        </>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {saving ? <Text>서버에 저장 중…</Text> : cloud && (isEdit ? !cloudRow || !originalVersion : !!pendingKey && loadedKey !== pendingKey) ? null : <PrimaryButton label={cloudPending ? '같은 요청으로 다시 확인' : isEdit ? '수정 완료' : cloud ? '서버에 저장' : '추가하기'} onPress={handleSave} />}
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
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
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
