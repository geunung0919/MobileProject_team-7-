
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../../firebase/firebaseConfig';

import { useAppData } from '../store/AppDataContext';

import {
  shoppingItem,
  mergeShopping,
  editShoppingItem,
} from '../features/fridgeV2/domain/shopping.mjs';

import { colors, fonts, spacing } from '../theme';


function Input({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
  busy,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        editable={!busy}
        style={styles.input}
      />
    </View>
  );
}

const makeId = () =>
  `shopping-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const storageKeyFor = (uid) =>
  `solo-living-ai:shopping:v1:${uid}`;

const formatWon = (value) =>
  `${Number(value || 0).toLocaleString('ko-KR')}원`;

export default function FridgeShoppingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const { sharedUid } = useAppData();

  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('개');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);

  const lock = useRef(false);
  const latestUid = useRef(sharedUid);
  latestUid.current = sharedUid;

  // 로그인 사용자별 장보기 데이터 불러오기
  useEffect(() => {
    let active = true;

    setItems([]);
    setReady(false);
    setLoadFailed(false);
    setError('');
    setEditingId(null);

    if (!sharedUid) {
      setReady(true);
      return () => {
        active = false;
      };
    }

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(
          storageKeyFor(sharedUid)
        );

        const parsed = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(parsed)) {
          throw new Error('장보기 저장 형식이 올바르지 않아요.');
        }

        if (active && latestUid.current === sharedUid) {
          setItems(parsed);
        }
      } catch (err) {
        if (active) {
          setLoadFailed(true);
          setError(
            `장보기 목록을 불러오지 못했어요. ${err.message}`
          );
        }
      } finally {
        if (active && latestUid.current === sharedUid) {
          setReady(true);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [sharedUid]);

  const resetForm = () => {
    setName('');
    setQuantity('1');
    setUnit('개');
    setPrice('');
    setEditingId(null);
  };

  // 저장 성공 시에만 화면의 데이터도 변경
  const saveItems = useCallback(
    async (change) => {
      if (lock.current || !ready || !sharedUid || loadFailed) {
        return;
      }

      if (auth.currentUser?.uid !== sharedUid) {
        setError('로그인 계정을 확인해 주세요.');
        return;
      }

      lock.current = true;
      setBusy(true);
      setError('');

      try {
        const nextItems = change(items);

        if (!Array.isArray(nextItems)) {
          throw new Error('장보기 데이터 형식 오류');
        }

        await AsyncStorage.setItem(
          storageKeyFor(sharedUid),
          JSON.stringify(nextItems)
        );

        if (latestUid.current === sharedUid) {
          setItems(nextItems);
        }

        return true;
      } catch (err) {
        setError(
          err?.message || '장보기 목록을 저장하지 못했어요.'
        );
        return false;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [items, ready, sharedUid, loadFailed]
  );

  const handleSave = async () => {
    if (busy || !ready) return;

    let input;

    try {
      input = shoppingItem({
        name: name.trim(),
        quantity,
        unit: unit.trim(),
        estimatedUnitPrice: price.trim(),
      });
    } catch (err) {
      Alert.alert('입력 확인', err.message);
      return;
    }

    const success = await saveItems((previous) => {
      if (editingId) {
        const original = previous.find(
          (item) => item.id === editingId
        );

        if (!original) {
          throw new Error('수정할 품목이 없어요.');
        }

        if (
          previous.some(
            (item) =>
              item.id !== editingId &&
              !item.done &&
              item.name === input.name &&
              item.unit === input.unit
          )
        ) {
          throw new Error(
            '같은 이름과 단위의 미구매 품목이 있어요.'
          );
        }

        const updated = editShoppingItem(original, input);

        return previous.map((item) =>
          item.id === editingId ? updated : item
        );
      }

      return mergeShopping(
        previous,
        [input],
        makeId
      );
    });

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setPrice(
      item.estimatedUnitPrice == null
        ? ''
        : String(item.estimatedUnitPrice)
    );
    setError('');
  };

  const togglePurchase = (id) =>
    saveItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, done: !item.done }
          : item
      )
    );

  const deleteItem = (id) => {
    Alert.alert(
      '장보기 품목 삭제',
      '장보기 목록에서 이 품목을 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const success = await saveItems((previous) =>
              previous.filter((item) => item.id !== id)
            );

            if (success && editingId === id) {
              resetForm();
            }
          },
        },
      ]
    );
  };

  const sortedItems = [...items].sort(
    (a, b) => Number(a.done) - Number(b.done)
  );

  const pendingItems = items.filter(
    (item) => !item.done
  );

  const estimatedTotal = pendingItems.reduce(
    (sum, item) =>
      sum +
      (item.estimatedUnitPrice == null
        ? 0
        : Math.round(
            item.estimatedUnitPrice * item.quantity
          )),
    0
  );

  const unpricedCount = pendingItems.filter(
    (item) => item.estimatedUnitPrice == null
  ).length;


  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text>장보기 목록을 불러오는 중...</Text>
      </View>
    );
  }

  if (!sharedUid) {
    return (
      <View style={styles.center}>
        <Text>로그인 후 장보기 목록을 사용할 수 있어요.</Text>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('SharedLogin')}
        >
          <Text style={styles.buttonText}>로그인</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: spacing.screenX,
          paddingBottom: insets.bottom + 80,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Text style={styles.backText}>
            ← 냉장고로 돌아가기
          </Text>
        </Pressable>

        <Text style={styles.title}>장보기 목록</Text>

        <Text style={styles.subtitle}>
          필요한 식재료를 기록하고 구매 여부를 관리해요.
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            구매 예정 {pendingItems.length}개
          </Text>
          <Text style={styles.total}>
            예상 비용 {formatWon(estimatedTotal)}
          </Text>
          <Text style={styles.muted}>
            가격 미입력 {unpricedCount}개 · 실제 소비 금액에
            포함되지 않아요.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {editingId ? '장보기 품목 수정' : '장보기 품목 추가'}
          </Text>

          <Input
            label="식재료 이름"
            value={name}
            onChangeText={setName}
            placeholder="예: 두부"
          />

          <Input
            label="수량"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholder="예: 2"
          />

          <Input
            label="단위"
            value={unit}
            onChangeText={setUnit}
            placeholder="개, 모, 봉, 팩, g 등"
          />

          <Input
            label="1단위 예상 가격 (원, 선택)"
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
            placeholder="예: 2500"
          />

          <Pressable
            disabled={busy || loadFailed}
            onPress={handleSave}
            style={[
              styles.button,
              busy && styles.disabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {busy
                ? '저장 중...'
                : editingId
                  ? '수정 저장'
                  : '장보기 목록에 추가'}
            </Text>
          </Pressable>

          {editingId && (
            <Pressable
              disabled={busy}
              onPress={resetForm}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>
                수정 취소
              </Text>
            </Pressable>
          )}
        </View>

        {!!error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}

        <Text style={styles.sectionTitle}>
          장보기 품목 ({items.length})
        </Text>

        {sortedItems.length === 0 && (
          <Text style={styles.empty}>
            장보기 목록이 비어 있어요.
            위에서 필요한 식재료를 추가해 보세요.
          </Text>
        )}

        {sortedItems.map((item) => {
          const estimated =
            item.estimatedUnitPrice == null
              ? '가격 미입력'
              : formatWon(
                  Math.round(
                    item.estimatedUnitPrice * item.quantity
                  )
                );

          return (
            <View key={item.id} style={styles.card}>
              <Text
                style={[
                  styles.itemName,
                  item.done && styles.completed,
                ]}
              >
                {item.name} {item.quantity}{item.unit}
              </Text>

              <Text style={styles.muted}>
                예상 비용: {estimated}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  disabled={busy}
                  style={styles.actionButton}
                  onPress={() => togglePurchase(item.id)}
                >
                  <Text style={styles.actionText}>
                    {item.done
                      ? '구매 체크 해제'
                      : '구매 완료'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={busy}
                  style={styles.actionButton}
                  onPress={() => handleEdit(item)}
                >
                  <Text style={styles.actionText}>
                    수정
                  </Text>
                </Pressable>

                <Pressable
                  disabled={busy}
                  style={styles.actionButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Text style={styles.deleteText}>
                    삭제
                  </Text>
                </Pressable>
              </View>

              {item.done && !item.inventoryId && (
                <Pressable
                  disabled={busy}
                  style={styles.button}
                  onPress={() =>
                    navigation.navigate('FridgeAdd', {
                      shoppingUid: sharedUid,
                      shoppingItem: {
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                      },
                    })
                  }
                >
                  <Text style={styles.buttonText}>
                    냉장고에 등록
                  </Text>
                </Pressable>
              )}

              {item.inventoryId && (
                <Text style={styles.muted}>
                  Firebase 냉장고 재고 등록 완료
                </Text>
            )}
            </View>
          );
        })}

        <Text style={styles.notice}>
          이 장보기 목록은 현재 기기에 로그인 UID별로 저장됩니다.
          Firebase 재고 목록과는 별도이며, 구매 체크만으로 재고가
          자동 추가되지 않습니다.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  back: {
    marginBottom: 22,
  },
  backText: {
    color: colors.green,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 27,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: colors.textSecondary,
    fontSize: 14,
  },
  summary: {
    backgroundColor: colors.heroBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 8,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  total: {
    fontFamily: fonts.bold,
    color: colors.green,
    fontSize: 23,
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  secondaryButton: {
    padding: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.green,
    fontFamily: fonts.medium,
  },
  itemName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  completed: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  actionText: {
    color: colors.green,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  deleteText: {
    color: '#C34242',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  empty: {
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  error: {
    color: '#C34242',
    marginBottom: 16,
    lineHeight: 21,
  },
  notice: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 18,
  },
});
