import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import Text from '../components/AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import FormField from '../components/FormField';
import DatePickerSheet from '../components/DatePickerSheet';
import PurchaseItemCard from '../components/PurchaseItemCard';
import AddItemButton from '../components/AddItemButton';
import CategorySelector from '../components/CategorySelector';
import { sampleReceipt, receiptTexts } from '../data/spending/receipt';
import { useAppData } from '../store/AppDataContext';
import { resolveCategory } from '../utils/category';
import {
  formatNumber,
  formatDotDate,
  toDateString,
  fromDateString,
  addDays,
  parseAmount,
  isValidDateString,
} from '../utils/format';
import {
  DEFAULT_EXPIRY_DAYS,
  createEmptyItem,
  applyItemPatch,
  sumItems,
  countItems,
  countFridgeItems,
  validateItems,
  toSavedItems,
  addCheckedItemsToFridge,
  scrollToEndSoon,
} from '../utils/purchaseItems';
import { colors, fonts, spacing, radius } from '../theme';

// 인식 결과(receipt)를 화면에서 고칠 수 있는 형태(draft)로 바꿉니다.
// OCR 결과는 비거나 틀릴 수 있어 기본값으로 채웁니다 (날짜가 없거나 이상하면 오늘, 수량은 1 이상, 가격/총액이 이상하면 빈칸).
// 가격/총액은 숫자만 담은 글자("2800"), 식품 품목의 유통기한은 구매일 + 14일로 채웁니다.
function toDraft(receipt) {
  const date = isValidDateString(receipt.date) ? receipt.date : toDateString(new Date());
  return {
    store: receipt.store ?? '',
    category: null, // 선택 안 하면 저장할 때 자동으로 정해집니다
    date,
    time: receipt.time ?? '',
    total: String(parseAmount(receipt.total) || ''),
    items: (receipt.items ?? []).map((it, index) => ({
      key: it.id ?? `r${index + 1}`,
      name: it.name ?? '',
      quantity: Math.max(1, Math.floor(Number(it.quantity)) || 1),
      price: String(parseAmount(it.unitPrice) || ''),
      inFridge: !!it.inFridge,
      expiry: it.inFridge ? addDays(date, DEFAULT_EXPIRY_DAYS) : null,
    })),
  };
}

// 영수증 촬영(OCR) 이후의 "인식 결과" 화면. 카메라 화면이 아직 없어서 route.params.receipt 가 없으면 sampleReceipt 를 보여줍니다.
// 인식이 틀릴 수 있어서 [수정] 으로 상호명 / 구매일 / 총액 / 품목을 직접 고칠 수 있습니다.
export default function ReceiptResultScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { addTransaction, addFridgeItem, customCategories, addCategory } = useAppData();
  const t = receiptTexts;
  const scrollRef = useRef(null);
  const nextKey = useRef(1);

  const [draft, setDraft] = useState(() => toDraft(route.params?.receipt ?? sampleReceipt));
  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState(null); // 수정을 시작할 때의 값 (취소하면 되돌립니다)
  // 열려 있는 날짜 시트가 다루는 칸: null(닫힘) | 'purchase'(구매일) | 품목 key(그 품목의 유통기한)
  const [dateTarget, setDateTarget] = useState(null);

  const { store, date, time, items } = draft;
  const total = Number(draft.total) || 0;
  // 합계는 품목에서 직접 계산해 서로 어긋나지 않게 합니다.
  const itemCount = countItems(items);
  const itemsTotal = sumItems(items);
  const fridgeCount = countFridgeItems(items);
  const mismatch = total !== itemsTotal;

  const patchDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const updateItem = (key, patch) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.key === key ? applyItemPatch(it, patch, prev.date) : it)),
    }));

  const addItem = () => {
    const key = `n${nextKey.current++}`;
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem(key)],
    }));
    scrollToEndSoon(scrollRef);
  };

  const removeItem = (key) =>
    setDraft((prev) => ({ ...prev, items: prev.items.filter((it) => it.key !== key) }));

  const openDateSheet = (target) => {
    Keyboard.dismiss();
    setDateTarget(target);
  };

  const startEdit = () => {
    setSnapshot(draft);
    setEditing(true);
  };

  const cancelEdit = () => {
    if (snapshot) setDraft(snapshot);
    setEditing(false);
  };

  // 입력값 확인 (문제가 있으면 안내 글, 없으면 null)
  const validate = () => {
    if (!store.trim()) return '상호명을 입력해 주세요.';
    if (!(total > 0)) return '영수증 총액을 입력해 주세요.';
    if (items.length === 0) return '품목을 한 개 이상 입력해 주세요.';
    return validateItems(items, date);
  };

  const finishEdit = () => {
    const error = validate();
    if (error) {
      Alert.alert('입력을 확인해 주세요', error);
      return;
    }
    Keyboard.dismiss();
    setEditing(false);
  };

  const handleSave = () => {
    const error = validate();
    if (error) {
      Alert.alert('입력을 확인해 주세요', error);
      return;
    }
    // 영수증 한 장을 소비 내역 한 줄로 저장합니다. 세부 품목(items)도 함께 저장되어 지출 상세에 보입니다.
    addTransaction({
      title: store.trim(),
      amount: total,
      date,
      category: resolveCategory(draft.category, fridgeCount),
      icon: 'receipt-text-outline',
      source: 'receipt',
      items: toSavedItems(items),
    });
    // 식품으로 체크한 품목은 냉장고에도 담습니다.
    addCheckedItemsToFridge(items, date, addFridgeItem);
    navigation.goBack();
  };

  // 날짜 시트가 지금 다루는 값
  const sheet =
    dateTarget === 'purchase' || dateTarget === null
      ? { value: fromDateString(date), onChange: (d) => patchDraft({ date: toDateString(d) }), minimumDate: undefined, maximumDate: new Date() }
      : {
          value: fromDateString(items.find((it) => it.key === dateTarget)?.expiry ?? date),
          onChange: (d) => updateItem(dateTarget, { expiry: toDateString(d) }),
          minimumDate: fromDateString(date),
          maximumDate: undefined,
        };

  // 총액과 품목 합계가 다를 때 보여주는 안내 (인식이 틀렸을 가능성)
  const mismatchBanner = mismatch ? (
    <View style={styles.warnBox}>
      <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.warnText} />
      <View style={styles.warnTexts}>
        <Text style={styles.warnText}>{t.mismatch(formatNumber(total), formatNumber(itemsTotal))}</Text>
        {editing ? (
          <Pressable
            onPress={() => patchDraft({ total: String(itemsTotal) })}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.warnAction}>{t.matchAction}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  ) : null;

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
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{editing ? t.editSubtitle : t.subtitle}</Text>

        {editing ? (
          /* 수정 모드: 상호명 / 구매일 / 총액 */
          <View>
            <FormField
              label={t.storeLabel}
              value={store}
              onChangeText={(text) => patchDraft({ store: text })}
              placeholder={t.storePlaceholder}
              maxLength={30}
              marginTop={24}
            />
            <FormField
              label={t.dateLabel}
              value={formatDotDate(date)}
              placeholder="날짜 선택"
              rightIcon="calendar-month-outline"
              onPress={() => openDateSheet('purchase')}
              marginTop={18}
            />
            <FormField
              label={t.totalFieldLabel}
              value={draft.total ? formatNumber(draft.total) : ''}
              onChangeText={(text) =>
                patchDraft({ total: text.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 9) })
              }
              placeholder="금액 입력"
              keyboardType="number-pad"
              suffix="원"
              marginTop={18}
            />
          </View>
        ) : (
          /* 보기 모드: 총액 카드 */
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.totalLabel}>{t.totalLabel}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.badge}</Text>
              </View>
            </View>
            <Text style={styles.totalAmount}>
              {formatNumber(total)}
              <Text style={styles.totalUnit}>원</Text>
            </Text>
            <View style={styles.summaryDivider} />
            <Text style={styles.store}>{store}</Text>
            <Text style={styles.dateTime}>
              {formatDotDate(date)}{time ? ` · ${time}` : ''}
            </Text>
          </View>
        )}

        <CategorySelector
          style={{ marginTop: 24 }}
          customCategories={customCategories}
          value={draft.category}
          onChange={(next) => patchDraft({ category: next })}
          onAddCategory={addCategory}
        />

        {mismatchBanner}

        {/* 세부 품목 */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>{t.itemsTitle}</Text>
            {!editing ? (
              <Text style={styles.sectionCount}>
                {items.length}종 · 총 {itemCount}개
              </Text>
            ) : null}
          </View>
          {editing ? (
            <Text style={styles.editHint}>{t.editHint}</Text>
          ) : (
            <Pressable
              onPress={startEdit}
              accessibilityRole="button"
              accessibilityLabel="인식 결과 수정"
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.green} />
              <Text style={styles.editButtonText}>{t.editLabel}</Text>
            </Pressable>
          )}
        </View>

        {editing ? (
          <View style={styles.cards}>
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
            <AddItemButton label={t.addItemLabel} onPress={addItem} />
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colName]}>{t.headerName}</Text>
              <Text style={[styles.headerText, styles.colQty]}>{t.headerQty}</Text>
              <Text style={[styles.headerText, styles.colSum]}>{t.headerSum}</Text>
            </View>

            {items.map((item) => (
              <View key={item.key} style={styles.row}>
                <View style={styles.colName}>
                  <View style={styles.nameLine}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.inFridge ? (
                      <MaterialCommunityIcons
                        name="fridge-outline"
                        size={17}
                        color={colors.green}
                        style={styles.fridgeIcon}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.unitPrice}>단가 {formatNumber(item.price)}원</Text>
                </View>
                <Text style={[styles.qty, styles.colQty]}>{item.quantity}개</Text>
                <Text style={[styles.itemSum, styles.colSum]}>
                  {formatNumber(Number(item.price) * item.quantity)}원
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>총 {itemCount}개 합계</Text>
          <Text style={styles.footerAmount}>{formatNumber(itemsTotal)}원</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {editing ? (
          <View style={styles.footerButtons}>
            <Pressable
              onPress={cancelEdit}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{t.cancelLabel}</Text>
            </Pressable>
            <View style={styles.doneWrap}>
              <PrimaryButton label={t.doneLabel} onPress={finishEdit} />
            </View>
          </View>
        ) : (
          <PrimaryButton
            label={fridgeCount > 0 ? t.fridgeSaveLabel(fridgeCount) : t.saveLabel}
            onPress={handleSave}
          />
        )}
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
  pressed: {
    opacity: 0.75,
  },
  title: {
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },

  summaryCard: {
    marginTop: 30,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    borderRadius: radius.card,
    backgroundColor: colors.heroBg,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.green,
  },
  badge: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.green,
  },
  totalAmount: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 38,
    color: colors.textPrimary,
  },
  totalUnit: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  summaryDivider: {
    marginTop: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  store: {
    marginTop: 18,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  dateTime: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.textSecondary,
  },

  // 총액 ≠ 품목 합계 안내
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

  sectionHeader: {
    marginTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  sectionCount: {
    marginLeft: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.green,
  },
  editHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
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

  // 표: 품목(남은 폭) / 수량(고정) / 합계(고정)
  colName: { flex: 1 },
  colQty: { width: 64, textAlign: 'center' },
  colSum: { width: 100, textAlign: 'right' },
  tableHeader: {
    marginTop: 22,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  row: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  fridgeIcon: {
    marginLeft: 6,
  },
  unitPrice: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  qty: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  itemSum: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },

  // 수정 모드: 품목 카드
  cards: {
    marginTop: 16,
  },
  cardGap: {
    marginBottom: 12,
  },

  footerRow: {
    paddingTop: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  footerAmount: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
