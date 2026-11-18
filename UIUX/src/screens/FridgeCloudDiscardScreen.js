
import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  listFridgeItems,
  changeFridgeItem,
} from '../../../api/receiptApi';

import { auth } from '../../../firebase/firebaseConfig';
import { useAppData } from '../store/AppDataContext';
import { colors, fonts, spacing } from '../theme';

const roundQuantity = (value) =>
  Math.round(value * 1000000) / 1000000;

const validAmountText = (text) =>
  /^\d+(?:\.\d{1,6})?$/.test(text.trim());

export default function FridgeCloudDiscardScreen({
  navigation,
  route,
}) {
  const insets = useSafeAreaInsets();

  const {
    sharedUid,
    visibleShared,
    refreshShared,
  } = useAppData();

  const itemId = route.params?.id;

  const item = visibleShared?.inventory?.find(
    (row) => row.id === itemId
  );

  const [amount, setAmount] = useState('');
  const [discardAll, setDiscardAll] = useState(false);
  const [reason, setReason] = useState('expired');

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lock = useRef(false);

  const quantity = Number(item?.quantity);
  const inputQuantity = Number(amount);

  const discardQuantity = discardAll
    ? quantity
    : inputQuantity;

  const remaining = roundQuantity(
    quantity - discardQuantity
  );

  const valid =
    !!item &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    (discardAll ||
      (
        validAmountText(amount) &&
        Number.isFinite(inputQuantity) &&
        inputQuantity > 0 &&
        inputQuantity <= quantity
      ));

  const fullDiscard =
    valid && remaining === 0;

  const reasons = [
    { id: 'expired', label: '기한 경과' },
    { id: 'spoiled', label: '식재료 변질' },
    { id: 'other', label: '기타' },
  ];

  const startConfirm = () => {
    if (!valid || busy) return;

    setError('');
    setConfirming(true);
  };

  const handleDiscard = async () => {
    if (lock.current || !valid || !confirming) return;

    lock.current = true;
    setBusy(true);
    setError('');

    const uid = sharedUid;

    try {
      if (!uid || auth.currentUser?.uid !== uid) {
        throw new Error(
          '로그인 계정이 변경됐어요.'
        );
      }

      if (visibleShared?.inventoryTruncated) {
        throw new Error(
          '서버 목록이 일부만 조회됐어요. 새로고침 후 다시 시도해 주세요.'
        );
      }

      // 변경 직전 서버의 실제 재고를 다시 확인
      const result = await listFridgeItems(uid);

      if (
        result.success === false ||
        result.possiblyTruncated ||
        !Array.isArray(result.items)
      ) {
        throw new Error(
          '서버 재고를 완전히 확인하지 못했어요.'
        );
      }

      const latest = result.items.find(
        (row) => row.id === itemId
      );

      if (!latest) {
        throw new Error(
          '폐기할 식재료를 찾을 수 없어요.'
        );
      }

      // 다른 기기나 화면에서 수정했는지 확인
      if (
        !Number.isSafeInteger(latest.version) ||
        latest.version !== item.version
      ) {
        throw new Error(
          '재고 정보가 변경됐어요. 냉장고 목록을 새로고침한 뒤 다시 시도해 주세요.'
        );
      }

      const latestQuantity = Number(
        latest.quantity
      );

      if (
        !Number.isFinite(latestQuantity) ||
        latestQuantity <= 0
      ) {
        throw new Error(
          '현재 재고 수량이 올바르지 않아요.'
        );
      }

      const actualDiscard = discardAll
        ? latestQuantity
        : Number(amount);

      if (
        !Number.isFinite(actualDiscard) ||
        actualDiscard <= 0 ||
        actualDiscard > latestQuantity
      ) {
        throw new Error(
          '폐기 수량을 다시 확인해 주세요.'
        );
      }

      const nextQuantity = roundQuantity(
        latestQuantity - actualDiscard
      );

      // 전체 폐기: 서버 재고 삭제
      if (nextQuantity === 0) {
        await changeFridgeItem(
          {
            id: latest.id,
            version: latest.version,
            action: 'delete',
          },
          uid
        );
      } else {
        // 일부 폐기: 수량 변경
        await changeFridgeItem(
          {
            id: latest.id,
            version: latest.version,
            action: 'update',

            name: latest.name,
            quantity: nextQuantity,
            unit: latest.unit,

            purchasedAt:
              latest.purchasedAt || null,

            expiresAt:
              latest.expiresAt || null,

            storageMethod:
              latest.storageMethod || 'refrigerated',

            dateType:
              latest.dateType || 'unknown',
          },
          uid
        );
      }

      console.log(
        '[Fridge] 폐기 반영 성공:',
        nextQuantity === 0 ? '전체 삭제' : '수량 변경'
      );

      // 서버에서 변경된 재고를 다시 불러오기
      await refreshShared(uid);

      if (auth.currentUser?.uid === uid) {
        navigation.goBack();
      }
    } catch (err) {
      console.error(
        '[Fridge] 폐기 실패:',
        err?.message
      );

      setError(
        err?.message ||
        '폐기 내용을 저장하지 못했어요.'
      );

      setConfirming(false);

      // 변경 실패 시 목록을 다시 불러오기
      if (uid && auth.currentUser?.uid === uid) {
        try {
          await refreshShared(uid);
        } catch {
          // 원래 오류 메시지를 유지
        }
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: spacing.screenX,
          paddingBottom: insets.bottom + 48,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={busy}
        >
          <Text style={styles.back}>
            ← 냉장고로 돌아가기
          </Text>
        </Pressable>

        <Text style={styles.title}>
          식재료 폐기
        </Text>

        {!item ? (
          <Text style={styles.error}>
            식재료 정보를 찾을 수 없어요.
            냉장고 목록을 새로고침해 주세요.
          </Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>
                폐기할 식재료
              </Text>

              <Text style={styles.itemName}>
                {item.name}
              </Text>

              <Text style={styles.quantity}>
                현재 재고: {item.quantity}{item.unit}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              폐기 범위
            </Text>

            <View style={styles.optionRow}>
              <Pressable
                disabled={busy}
                onPress={() => {
                  setDiscardAll(false);
                  setConfirming(false);
                }}
                style={[
                  styles.option,
                  !discardAll && styles.selectedOption,
                ]}
              >
                <Text style={styles.optionText}>
                  일부 폐기
                </Text>
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={() => {
                  setDiscardAll(true);
                  setConfirming(false);
                }}
                style={[
                  styles.option,
                  discardAll && styles.selectedOption,
                ]}
              >
                <Text style={styles.optionText}>
                  전체 폐기
                </Text>
              </Pressable>
            </View>

            {!discardAll && (
              <>
                <Text style={styles.label}>
                  폐기할 수량 ({item.unit})
                </Text>

                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={(value) => {
                    setAmount(value);
                    setConfirming(false);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="예: 2"
                  editable={!busy}
                />
              </>
            )}

            <Text style={styles.sectionTitle}>
              폐기 사유
            </Text>

            <View style={styles.reasonRow}>
              {reasons.map((entry) => (
                <Pressable
                  key={entry.id}
                  disabled={busy}
                  onPress={() => {
                    setReason(entry.id);
                    setConfirming(false);
                  }}
                  style={[
                    styles.reasonOption,
                    reason === entry.id &&
                      styles.selectedOption,
                  ]}
                >
                  <Text style={styles.reasonText}>
                    {entry.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.hint}>
              폐기 사유는 현재 화면에서만 사용해요.
              서버에는 폐기 이력을 별도로 저장하지 않습니다.
            </Text>

            {valid && (
              <View style={styles.preview}>
                <Text style={styles.label}>
                  폐기 후 남은 수량
                </Text>

                <Text style={styles.remaining}>
                  {remaining}{item.unit}
                </Text>

                {fullDiscard && (
                  <Text style={styles.warning}>
                    전체 폐기하면 해당 식재료가
                    서버 재고 목록에서 삭제됩니다.
                  </Text>
                )}
              </View>
            )}

            {error ? (
              <Text
                style={styles.error}
                accessibilityRole="alert"
              >
                {error}
              </Text>
            ) : null}

            {confirming ? (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmTitle}>
                  정말 폐기할까요?
                </Text>

                <Text style={styles.confirmText}>
                  {item.name} {discardQuantity}
                  {item.unit}을(를) 폐기합니다.
                </Text>

                <Text style={styles.confirmText}>
                  {fullDiscard
                    ? '식재료가 재고 목록에서 삭제됩니다.'
                    : `남은 재고: ${remaining}${item.unit}`}
                </Text>

                <Pressable
                  disabled={busy}
                  onPress={handleDiscard}
                  style={styles.dangerButton}
                >
                  <Text style={styles.buttonText}>
                    {busy ? '처리 중...' : '폐기 확정'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={busy}
                  onPress={() => setConfirming(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>
                    취소
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                disabled={!valid || busy}
                onPress={startConfirm}
                style={[
                  styles.dangerButton,
                  (!valid || busy) && styles.disabled,
                ]}
              >
                <Text style={styles.buttonText}>
                  폐기 내용 확인
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  back: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.green,
    marginBottom: 24,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 24,
  },

  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },

  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  itemName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 12,
  },

  quantity: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 14,
  },

  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },

  option: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
  },

  selectedOption: {
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.green,
  },

  optionText: {
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    fontSize: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 24,
  },

  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  reasonOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
  },

  reasonText: {
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },

  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 20,
  },

  preview: {
    backgroundColor: colors.heroBg,
    padding: 20,
    borderRadius: 18,
    marginBottom: 24,
  },

  remaining: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.green,
  },

  warning: {
    marginTop: 12,
    fontFamily: fonts.medium,
    color: colors.warnText,
    fontSize: 13,
    lineHeight: 20,
  },

  error: {
    fontFamily: fonts.medium,
    color: colors.warnText,
    marginBottom: 20,
  },

  confirmBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 18,
    gap: 12,
  },

  confirmTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },

  confirmText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },

  dangerButton: {
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: '#C34242',
    alignItems: 'center',
    marginTop: 12,
  },

  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },

  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },

  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },

  disabled: {
    opacity: 0.45,
  },
});
