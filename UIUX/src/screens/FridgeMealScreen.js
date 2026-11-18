
import React, {
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth } from '../../../firebase/firebaseConfig';
import { recipeData } from '../data/fridge/recipes';
import { useAppData } from '../store/AppDataContext';
import { colors, fonts, spacing } from '../theme';

const storageKey = (uid) =>
  `solo-living-ai:meals:v1:${uid}`;

const mealTypes = [
  { id: 'breakfast', label: '아침' },
  { id: 'lunch', label: '점심' },
  { id: 'dinner', label: '저녁' },
  { id: 'snack', label: '간식' },
];

function todayString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');
  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split('-')
    .map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

function makeId() {
  return (
    `meal-${Date.now()}-` +
    Math.random().toString(36).slice(2, 12)
  );
}

function mealTypeName(id) {
  return (
    mealTypes.find((type) => type.id === id)?.label ||
    '식사'
  );
}

function readRecords(raw) {
  const value = raw ? JSON.parse(raw) : [];

  if (!Array.isArray(value)) {
    throw new Error('식사 기록 데이터 형식이 잘못됐어요.');
  }

  return value;
}

export default function FridgeMealScreen({
  navigation,
  route,
}) {
  const insets = useSafeAreaInsets();

  const { sharedUid } = useAppData();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [recipeId, setRecipeId] = useState(
    route.params?.recipeId || null
  );

  const [mealType, setMealType] = useState('dinner');
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState('');

  const lock = useRef(false);
  const currentUid = useRef(sharedUid);

  currentUid.current = sharedUid;

  const recipes = recipeData.recipes;

  const selectedRecipe = recipes.find(
    (recipe) => recipe.id === recipeId
  );

  // 화면이 열릴 때 현재 계정의 기록을 다시 불러옵니다.
  const loadRecords = useCallback(async () => {
    if (!sharedUid) {
      setRecords([]);
      setLoading(false);
      setLoadError(false);
      return;
    }

    setLoading(true);
    setError('');
    setLoadError(false);

    try {
      if (auth.currentUser?.uid !== sharedUid) {
        throw new Error(
          '현재 로그인 계정을 확인해 주세요.'
        );
      }

      const raw = await AsyncStorage.getItem(
        storageKey(sharedUid)
      );

      const parsed = readRecords(raw);

      if (currentUid.current === sharedUid) {
        setRecords(parsed);
      }
    } catch (err) {
      if (currentUid.current === sharedUid) {
        setLoadError(true);
        setError(
          err?.message ||
          '식사 기록을 불러오지 못했어요.'
        );
      }
    } finally {
      if (currentUid.current === sharedUid) {
        setLoading(false);
      }
    }
  }, [sharedUid]);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const saveRecord = async () => {
    if (lock.current || loading || loadError) return;

    const uid = sharedUid;

    if (!uid || auth.currentUser?.uid !== uid) {
      setError('로그인 계정을 확인해 주세요.');
      return;
    }

    if (!selectedRecipe) {
      setError('기록할 레시피를 선택해 주세요.');
      return;
    }

    if (!validDate(date)) {
      setError('날짜를 YYYY-MM-DD 형식으로 입력해 주세요.');
      return;
    }

    if (date > todayString()) {
      setError('미래 날짜는 기록할 수 없어요.');
      return;
    }

    if (note.length > 300) {
      setError('메모는 300자 이내로 입력해 주세요.');
      return;
    }

    lock.current = true;
    setBusy(true);
    setError('');

    try {
      // 최신 저장 기록을 읽고 새 기록을 추가합니다.
      const key = storageKey(uid);

      const raw = await AsyncStorage.getItem(key);
      const latest = readRecords(raw);

      const newRecord = {
        id: makeId(),
        recipeId: selectedRecipe.id,
        name: selectedRecipe.title,
        mealType,
        date,
        note: note.trim(),
        createdAt: new Date().toISOString(),
        inventoryDeducted: false,
      };

      const next = [newRecord, ...latest];

      if (auth.currentUser?.uid !== uid) {
        throw new Error('로그인 계정이 변경됐어요.');
      }

      await AsyncStorage.setItem(
        key,
        JSON.stringify(next)
      );

      if (currentUid.current === uid) {
        setRecords(next);
        setNote('');
        Alert.alert(
          '식사 기록 완료',
          `${selectedRecipe.title} 식사를 기록했어요.`
        );
      }
    } catch (err) {
      setError(
        err?.message || '식사 기록을 저장하지 못했어요.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const deleteRecord = (record) => {
    Alert.alert(
      '식사 기록 삭제',
      `${record.name} 기록을 삭제할까요?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (lock.current || loadError) return;

            const uid = sharedUid;

            if (
              !uid ||
              auth.currentUser?.uid !== uid
            ) {
              setError('로그인 계정을 확인해 주세요.');
              return;
            }

            lock.current = true;
            setBusy(true);
            setError('');

            try {
              const key = storageKey(uid);

              const raw = await AsyncStorage.getItem(key);
              const latest = readRecords(raw);

              const next = latest.filter(
                (item) => item.id !== record.id
              );

              if (auth.currentUser?.uid !== uid) {
                throw new Error(
                  '로그인 계정이 변경됐어요.'
                );
              }

              await AsyncStorage.setItem(
                key,
                JSON.stringify(next)
              );

              if (currentUid.current === uid) {
                setRecords(next);
              }
            } catch (err) {
              setError(
                err?.message ||
                '식사 기록을 삭제하지 못했어요.'
              );
            } finally {
              lock.current = false;
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const sortedRecords = [...records].sort(
    (a, b) =>
      String(b.date).localeCompare(String(a.date)) ||
      String(b.createdAt).localeCompare(
        String(a.createdAt)
      )
  );

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: spacing.screenX,
          paddingBottom: insets.bottom + 70,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Text style={styles.backText}>
            ← 돌아가기
          </Text>
        </Pressable>

        <Text style={styles.title}>식사 기록</Text>

        <Text style={styles.subtitle}>
          오늘 먹은 음식을 기록하고 식사 내역을 관리해요.
        </Text>

        {!sharedUid ? (
          <View style={styles.card}>
            <Text style={styles.description}>
              식사 기록을 사용하려면 로그인해 주세요.
            </Text>

            <Pressable
              style={styles.button}
              onPress={() =>
                navigation.navigate('SharedLogin')
              }
            >
              <Text style={styles.buttonText}>
                로그인
              </Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color={colors.green}
            />

            <Text style={styles.description}>
              식사 기록을 불러오는 중...
            </Text>
          </View>
        ) : (
          <>
            {!!error && (
              <Text
                style={styles.error}
                accessibilityRole="alert"
              >
                {error}
              </Text>
            )}

            {loadError ? (
              <Pressable
                style={styles.button}
                onPress={loadRecords}
              >
                <Text style={styles.buttonText}>
                  다시 불러오기
                </Text>
              </Pressable>
            ) : (
              <>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>
                    식사 추가
                  </Text>

                  <Text style={styles.label}>
                    레시피 선택
                  </Text>

                  {recipes.map((recipe) => {
                    const selected =
                      recipeId === recipe.id;

                    return (
                      <Pressable
                        key={recipe.id}
                        disabled={busy}
                        onPress={() =>
                          setRecipeId(recipe.id)
                        }
                        style={[
                          styles.choice,
                          selected && styles.choiceActive,
                        ]}
                      >
                        <Text style={styles.choiceText}>
                          {selected ? '✓ ' : ''}
                          {recipe.title}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Text style={styles.label}>
                    식사 구분
                  </Text>

                  <View style={styles.typeRow}>
                    {mealTypes.map((type) => (
                      <Pressable
                        key={type.id}
                        disabled={busy}
                        onPress={() =>
                          setMealType(type.id)
                        }
                        style={[
                          styles.typeButton,
                          mealType === type.id &&
                            styles.choiceActive,
                        ]}
                      >
                        <Text style={styles.typeText}>
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.label}>
                    식사 날짜
                  </Text>

                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    editable={!busy}
                    style={styles.input}
                    maxLength={10}
                  />

                  <Text style={styles.label}>
                    식사 메모 (선택)
                  </Text>

                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="예: 저녁으로 직접 만들어 먹었어요."
                    editable={!busy}
                    multiline
                    maxLength={300}
                    style={[
                      styles.input,
                      styles.noteInput,
                    ]}
                  />

                  <Pressable
                    disabled={busy || !selectedRecipe}
                    onPress={saveRecord}
                    style={[
                      styles.button,
                      (busy || !selectedRecipe) &&
                        styles.disabled,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {busy
                        ? '저장 중...'
                        : '식사 기록 저장'}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.sectionTitle}>
                  식사 기록 ({records.length})
                </Text>

                {sortedRecords.length === 0 ? (
                  <Text style={styles.description}>
                    아직 저장한 식사 기록이 없어요.
                  </Text>
                ) : (
                  sortedRecords.map((record) => (
                    <View
                      key={record.id}
                      style={styles.card}
                    >
                        <Pressable
                        style={styles.button}
                        onPress={() =>
                                navigation.navigate('FridgeMealInventory', {
                                mealId: record.id,
                                mealName: record.name,
                                })
                            }
                        >
                    <Text style={styles.buttonText}>
                    이 식사에 사용한 재료 차감하기
                    </Text>
                    </Pressable>
                      <Text style={styles.itemTitle}>
                        {record.name}
                      </Text>

                      <Text style={styles.description}>
                        {record.date} ·{' '}
                        {mealTypeName(record.mealType)}
                      </Text>

                      {!!record.note && (
                        <Text style={styles.description}>
                          {record.note}
                        </Text>
                      )}

                      <Text style={styles.notice}>
                        재고 수량 자동 차감 안 됨
                      </Text>

                      <Pressable
                        disabled={busy}
                        onPress={() =>
                          deleteRecord(record)
                        }
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteText}>
                          기록 삭제
                        </Text>
                      </Pressable>
                    </View>
                  ))
                )}

                <Text style={styles.notice}>
                  식사 기록은 현재 기기에 로그인 UID별로
                  저장됩니다. Firebase 냉장고 재고는 변경되지
                  않으며 다른 기기와 자동 동기화되지 않습니다.
                </Text>
              </>
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
    marginBottom: 22,
  },
  backText: {
    fontFamily: fonts.medium,
    color: colors.green,
    fontSize: 15,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 27,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 9,
    marginBottom: 24,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  center: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  choice: {
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  choiceActive: {
    borderColor: colors.green,
    backgroundColor: colors.heroBg,
  },
  choiceText: {
    fontFamily: fonts.medium,
    color: colors.textPrimary,
    fontSize: 15,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  typeText: {
    fontFamily: fonts.medium,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  notice: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 14,
  },
  deleteButton: {
    alignItems: 'flex-end',
    paddingVertical: 12,
  },
  deleteText: {
    fontFamily: fonts.medium,
    color: '#C34242',
  },
  error: {
    color: '#C34242',
    marginBottom: 16,
    lineHeight: 22,
  },
});
