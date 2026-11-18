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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import FormField from '../components/FormField';
import DatePickerSheet from '../components/DatePickerSheet';
import PrimaryButton from '../components/PrimaryButton';
import PurchaseItemCard from '../components/PurchaseItemCard';
import AddItemButton from '../components/AddItemButton';
import PurchasedItemRow from '../components/PurchasedItemRow';
import { spendingDetailTexts as t } from '../data/spending/spendingDetail';
import { useAppData } from '../store/AppDataContext';
import { formatNumber, formatKoreanDateShort, formatDotDate, toDateString, fromDateString } from '../utils/format';
import {
  sumItems,
  countFridgeItems,
  validateItemFields,
  toSavedItems,
  scrollToEndSoon,
} from '../utils/purchaseItems';
import { colors, fonts, spacing, radius } from '../theme';

// 저장된 지출을 화면에서 고칠 수 있는 형태(draft)로 바꿉니다. (가격 / 총액은 숫자만 담은 글자)
// linked: 총액이 품목 합계와 같아서 "품목을 고치면 총액도 같이 바뀌는" 상태
function toDraft(tx) {
  const items = (tx.items ?? []).map((it) => ({
    key: it.id,
    name: it.name,
    quantity: it.quantity,
    price: String(it.unitPrice),
    inFridge: !!it.inFridge,
  }));
  return {
    title: tx.title,
    date: tx.date,
    amount: String(tx.amount),
    linked: items.length > 0 && tx.amount === sumItems(items),
    items,
  };
}

// 소비 > 지출 상세 (구매한 품목). params: { id }. [수정] 으로 이름 / 구매일 / 총 지출 / 품목을 고치고, 휴지통으로 삭제합니다.
export default function SpendingDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { transactions, updateTransaction, removeTransaction } = useAppData();
  const scrollRef = useRef(null);
  const nextKey = useRef(1);

  // 삭제 직후 화면이 닫히는 동안에도 내용이 사라져 보이지 않도록 마지막 값을 기억해 둡니다.
  const found = transactions.find((x) => x.id === route.params?.id);
  const lastTransaction = useRef(found);
  if (found) lastTransaction.current = found;
  const transaction = found ?? lastTransaction.current;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: insets.top + 14, paddingHorizontal: spacing.screenX }}>
          <BackHeader title={t.title} icon="arrow-back" onBack={() => navigation.goBack()} />
          <Text style={styles.empty}>{t.notFound}</Text>
        </View>
      </View>
    );
  }

  const { id, title, category, amount, date, source, items = [] } = transaction;

  // ---------- 수정 ----------
  const startEdit = () => {
    setDraft(toDraft(transaction));
    setEditing(true);
  };
  const cancelEdit = () => {
    Keyboard.dismiss();
    setEditing(false);
  };

  // 수정 중 계산값: 품목 합계와 (연동 중이면 합계를 따르는) 총액
  const draftItems = draft?.items ?? [];
  const draftItemsTotal = sumItems(draftItems);
  const draftTotal = draft ? (draft.linked ? draftItemsTotal : Number(draft.amount) || 0) : 0;
  const showMismatch = editing && draftItems.length > 0 && !draft.linked && draftTotal !== draftItemsTotal;

  const patchDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  const updateItem = (key, patch) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    }));
  const addItem = () => {
    const key = `n${nextKey.current++}`;
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, { key, name: '', quantity: 1, price: '', inFridge: false }],
    }));
    scrollToEndSoon(scrollRef);
  };
  const removeItem = (key) =>
    setDraft((prev) => ({ ...prev, items: prev.items.filter((it) => it.key !== key) }));

  const saveEdit = () => {
    if (!draft.title.trim()) {
      Alert.alert('입력을 확인해 주세요', '이름을 입력해 주세요.');
      return;
    }
    if (!(draftTotal > 0)) {
      Alert.alert('입력을 확인해 주세요', '총 지출 금액을 입력해 주세요.');
      return;
    }
    const itemsError = validateItemFields(draftItems);
    if (itemsError) {
      Alert.alert('입력을 확인해 주세요', itemsError);
      return;
    }
    // 이름 / 날짜 / 총액 / 품목만 바꾸고, 카테고리·아이콘·출처는 그대로 둡니다.
    updateTransaction(id, {
      title: draft.title.trim(),
      amount: draftTotal,
      date: draft.date,
      items: toSavedItems(draftItems),
    });
    Keyboard.dismiss();
    setEditing(false);
  };

  // ---------- 삭제 ----------
  const handleDelete = () => {
    Alert.alert(t.deleteTitle, t.deleteMessage(title), [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          removeTransaction(id);
          navigation.goBack();
        },
      },
    ]);
  };

  // ---------- 화면 ----------
  const headerActions = (
    <View style={styles.actions}>
      <Pressable
        onPress={startEdit}
        accessibilityRole="button"
        accessibilityLabel="지출 수정"
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.green} />
        <Text style={styles.editButtonText}>{t.editLabel}</Text>
      </Pressable>
      <Pressable
        onPress={handleDelete}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="지출 삭제"
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={24} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  const header = (
    <BackHeader
      title={editing ? t.editTitle : t.title}
      icon="arrow-back"
      onBack={editing ? cancelEdit : () => navigation.goBack()}
      right={editing ? null : headerActions}
    />
  );

  const [y, m, d] = date.split('-').map(Number);
  const fridgeCount = countFridgeItems(items);
  // 영수증으로 기록한 지출은 "영수증 · 식료품" 처럼 보여줍니다. (카테고리가 "영수증"이면 한 번만)
  const label =
    source === 'receipt'
      ? category && category !== t.receiptLabel
        ? `${t.receiptLabel} · ${category}`
        : t.receiptLabel
      : category;

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
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: spacing.screenX,
        }}
      >
        {header}

        {editing ? (
          <View>
            <FormField
              label={t.nameLabel}
              value={draft.title}
              onChangeText={(text) => patchDraft({ title: text })}
              placeholder={t.namePlaceholder}
              maxLength={30}
              marginTop={0}
            />
            <FormField
              label={t.dateLabel}
              value={formatDotDate(draft.date)}
              placeholder="날짜 선택"
              rightIcon="calendar-month-outline"
              onPress={() => {
                Keyboard.dismiss();
                setDateSheetVisible(true);
              }}
              marginTop={18}
            />
            <FormField
              label={t.totalLabel}
              value={draftTotal ? formatNumber(draftTotal) : ''}
              onChangeText={(text) =>
                patchDraft({
                  amount: text.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 9),
                  linked: false,
                })
              }
              placeholder="금액 입력"
              keyboardType="number-pad"
              suffix="원"
              marginTop={18}
            />

            {showMismatch ? (
              <View style={styles.warnBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.warnText} />
                <View style={styles.warnTexts}>
                  <Text style={styles.warnText}>
                    {t.mismatch(formatNumber(draftTotal), formatNumber(draftItemsTotal))}
                  </Text>
                  <Pressable
                    onPress={() => patchDraft({ linked: true })}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={styles.warnAction}>{t.matchAction}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.itemsTitle}</Text>
            </View>
            {draftItems.map((item) => (
              <View key={item.key} style={styles.cardGap}>
                <PurchaseItemCard
                  item={item}
                  showFridge={false}
                  canRemove
                  onChange={(patch) => updateItem(item.key, patch)}
                  onRemove={() => removeItem(item.key)}
                />
              </View>
            ))}
            <AddItemButton label={t.addItemLabel} onPress={addItem} />
            <Text style={styles.fridgeNote}>{t.editFridgeNote}</Text>
          </View>
        ) : (
          <View>
            {/* 요약 카드 */}
            <View style={styles.summaryCard}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.store}>{title}</Text>
              <Text style={styles.date}>{formatKoreanDateShort(new Date(y, m - 1, d))}</Text>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.totalLabel}</Text>
                <Text style={styles.totalAmount}>
                  {formatNumber(amount)}
                  <Text style={styles.totalUnit}>원</Text>
                </Text>
              </View>
            </View>

            {/* 구매한 품목 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t.itemsTitle}
                {items.length > 0 ? <Text style={styles.sectionCount}>{`  ${items.length}`}</Text> : null}
              </Text>
              {fridgeCount > 0 ? (
                <View style={styles.fridgeBadge}>
                  <MaterialCommunityIcons name="fridge-outline" size={20} color={colors.green} />
                  <Text style={styles.fridgeBadgeText}>{t.fridgeBadge(fridgeCount)}</Text>
                </View>
              ) : null}
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>{t.emptyItems}</Text>
                <Text style={styles.emptyHint}>{t.emptyItemsHint}</Text>
              </View>
            ) : (
              items.map((item) => (
                <PurchasedItemRow
                  key={item.id}
                  name={item.name}
                  unitPrice={item.unitPrice}
                  quantity={item.quantity}
                  inFridge={item.inFridge}
                />
              ))
            )}

            {fridgeCount > 0 ? (
              <View style={styles.notice}>
                <MaterialCommunityIcons name="fridge-outline" size={20} color={colors.green} />
                <Text style={styles.noticeText}>{t.fridgeNotice}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {editing ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable
            onPress={cancelEdit}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>{t.cancelLabel}</Text>
          </Pressable>
          <View style={styles.doneWrap}>
            <PrimaryButton label={t.doneLabel} onPress={saveEdit} />
          </View>
        </View>
      ) : null}

      <DatePickerSheet
        visible={dateSheetVisible}
        value={fromDateString(draft?.date ?? date)}
        maximumDate={new Date()}
        onChange={(picked) => patchDraft({ date: toDateString(picked) })}
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
  pressed: {
    opacity: 0.75,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    marginLeft: 4,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.green,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4,
  },

  summaryCard: {
    borderRadius: 32,
    backgroundColor: colors.heroBg,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.green,
  },
  store: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  date: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: colors.progressTrack,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  totalLabel: {
    marginBottom: 4,
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 44,
    color: colors.textPrimary,
  },
  totalUnit: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.green,
  },
  fridgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fridgeBadgeText: {
    marginLeft: 6,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.green,
  },
  notice: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  noticeText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyBox: {
    marginTop: 8,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptyHint: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },

  // 수정 모드
  warnBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    backgroundColor: colors.warnBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  warnTexts: {
    flex: 1,
    marginLeft: 10,
  },
  warnText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.warnText,
  },
  warnAction: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.warnText,
    textDecorationLine: 'underline',
  },
  cardGap: {
    marginBottom: 12,
  },
  fridgeNote: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.divider,
  },
  cancelButton: {
    width: 96,
    height: 56,
    marginRight: 10,
    borderRadius: 28,
    backgroundColor: colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.green,
  },
  doneWrap: {
    flex: 1,
  },
});
