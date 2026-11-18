
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
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

export default function FridgeUseScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const {
    sharedUid,
    visibleShared,
    refreshShared,
  } = useAppData();

  const id = route.params?.id;

  const item = visibleShared?.inventory?.find(
    (row) => row.id === id
  );

  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lock = useRef(false);

  const currentQuantity = Number(item?.quantity);
  const usedQuantity = Number(amount);
  const remaining = roundQuantity(
    currentQuantity - usedQuantity
  );

  const valid =
    !!item &&
    Number.isFinite(currentQuantity) &&
    currentQuantity > 0 &&
    Number.isFinite(usedQuantity) &&
    usedQuantity > 0 &&
    usedQuantity < currentQuantity &&
    /^[0-9]+(?:\.[0-9]+)?$/.test(amount.trim()) &&
    remaining > 0;

  const applyUse = async () => {
    if (lock.current || !valid) return;

    lock.current = true;
    setBusy(true);
    setError('');

    try {
      if (
        !sharedUid ||
        auth.currentUser?.uid !== sharedUid
      ) {
        throw new Error(
          '로그인 계정이 변경됐습니다.'
        );
      }

      if (visibleShared?.inventoryTruncated) {
        throw new Error(
          '서버 목록이 일부만 조회됐습니다. 전체 재고를 확인해 주세요.'
        );
      }

      // 저장 직전 최신 서버 데이터를 다시 조회
      const result = await listFridgeItems(sharedUid);

      if (result.possiblyTruncated) {
        throw new Error(
          '서버 재고를 완전히 조회하지 못했습니다.'
        );
      }

      const latest = result.items?.find(
        (row) => row.id === id
      );

      if (!latest) {
        throw new Error(
          '해당 식재료를 찾을 수 없습니다.'
        );
      }

      if (
        !Number.isSafeInteger(latest.version) ||
        latest.version !== item.version
      ) {
        throw new Error(
          '재고가 변경됐습니다. 냉장고를 새로고침한 후 다시 시도해 주세요.'
        );
      }

      const latestQuantity = Number(latest.quantity);
      const nextQuantity = roundQuantity(
        latestQuantity - usedQuantity
      );

      if (!(nextQuantity > 0)) {
        throw new Error(
          '남은 수량은 0보다 커야 합니다. 전량 사용은 별도 기능으로 처리해 주세요.'
        );
      }

      // 기존 Firebase 재고 변경 API 재사용
      await changeFridgeItem(
        {
          id: latest.id,
          version: latest.version,
          action: 'update',

          name: latest.name,
          quantity: nextQuantity,
          unit: latest.unit,

          purchasedAt: latest.purchasedAt || null,
          expiresAt: latest.expiresAt || null,

          storageMethod:
            latest.storageMethod || 'refrigerated',

          dateType:
            latest.dateType || 'unknown',
        },
        sharedUid
      );

      // 서버에서 변경된 실제 재고 다시 조회
      await refreshShared(sharedUid);

      if (auth.currentUser?.uid === sharedUid) {
        navigation.goBack();
      }
    } catch (err) {
      console.error(
        '[Fridge] 사용량 차감 실패:',
        err?.message
      );

      setError(
        err?.message ||
        '사용량을 저장하지 못했습니다.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const handleConfirm = () => {
    if (!valid || busy) return;

    Alert.alert(
      '식재료 사용 확인',
      `${item.name} ${usedQuantity}${item.unit}을(를) 사용하고 ${remaining}${item.unit}을(를) 남길까요?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '사용량 저장',
          onPress: applyUse,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: spacing.screenX,
          paddingBottom: 40,
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
          식재료 사용
        </Text>

        {!item ? (
          <Text style={styles.error}>
            식재료를 찾을 수 없습니다.
          </Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>
                식재료
              </Text>

              <Text style={styles.itemName}>
                {item.name}
              </Text>

              <Text style={styles.quantity}>
                현재 수량: {item.quantity}{item.unit}
              </Text>
            </View>

            <Text style={styles.label}>
              사용한 수량 ({item.unit})
            </Text>

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="예: 2"
              editable={!busy}
            />

            {valid && (
              <View style={styles.preview}>
                <Text style={styles.label}>
                  사용 후 남은 수량
                </Text>

                <Text style={styles.remaining}>
                  {remaining}{item.unit}
                </Text>
              </View>
            )}

            <Text style={styles.hint}>
              현재는 일부 수량 차감만 지원합니다.
              전량 사용과 폐기는 별도 기능으로 추가할 예정입니다.
            </Text>

            {!!error && (
              <Text
                style={styles.error}
                accessibilityRole="alert"
              >
                {error}
              </Text>
            )}

            <Pressable
              onPress={handleConfirm}
              disabled={!valid || busy}
              style={[
                styles.button,
                (!valid || busy) && styles.disabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {busy ? '저장 중...' : '사용량 저장'}
              </Text>
            </Pressable>
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
    color: colors.green,
    fontSize: 15,
    marginBottom: 28,
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
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },

  itemName: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 22,
    marginBottom: 12,
  },

  quantity: {
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    fontSize: 17,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 20,
  },

  preview: {
    backgroundColor: colors.heroBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  remaining: {
    fontFamily: fonts.bold,
    color: colors.green,
    fontSize: 24,
  },

  hint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 20,
  },

  error: {
    color: colors.warnText,
    marginBottom: 18,
    fontSize: 14,
  },

  button: {
    backgroundColor: colors.green,
    borderRadius: 28,
    padding: 18,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.45,
  },

  buttonText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 17,
  },
});
