
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth } from '../../../firebase/firebaseConfig';
import { listFridgeItems } from '../../../api/receiptApi';
import { recipeData } from '../data/fridge/recipes';
import { useAppData } from '../store/AppDataContext';

import { exactIngredient } from '../features/fridgeV2/domain/ingredientCatalog.mjs';
import { replaceRecipeShopping } from '../features/fridgeV2/domain/shopping.mjs';
import { colors, fonts, spacing } from '../theme';

const makeId = () =>
  `shopping-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

const round = (n) => Math.round(n * 1000000) / 1000000;

const ingredientKey = (name) => {
  const catalog = exactIngredient(name);
  if (catalog) return `catalog:${catalog.id}`;

  return String(name || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/계란/g, '달걀');
};

// 예: 1/2모, 2개, 200ml, 1줌, 1큰술
function parseAmount(amount) {
  const value = String(amount || '').replace(/\s+/g, '');

  const match = value.match(
    /^(\d+\/\d+|\d+(?:\.\d+)?)(.+)$/
  );

  if (!match) return null;

  let quantity;

  if (match[1].includes('/')) {
    const [a, b] = match[1].split('/').map(Number);
    quantity = b > 0 ? a / b : NaN;
  } else {
    quantity = Number(match[1]);
  }

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !match[2]
  ) {
    return null;
  }

  return {
    quantity: round(quantity),
    unit: match[2],
  };
}

function calculateMissing(recipe, inventory) {
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const missing = [];
  const uncertain = [];

  for (const ingredient of recipe.ingredients) {
    const required = parseAmount(ingredient.amount);

    if (!required) {
      uncertain.push(
        `${ingredient.name} (${ingredient.amount})`
      );
      continue;
    }

    const matching = inventory.filter((row) =>
      ingredientKey(row.name) === ingredientKey(ingredient.name) &&
      Number(row.quantity) > 0 &&
      (!row.expiresAt || row.expiresAt >= todayKey)
    );

    // 단위가 같은 재고만 합산
    const held = matching
      .filter((row) => row.unit === required.unit)
      .reduce(
        (total, row) => total + Number(row.quantity),
        0
      );

    const shortage = round(
      Math.max(0, required.quantity - held)
    );

    if (shortage > 0) {
      missing.push({
        name: ingredient.name,
        quantity: shortage,
        unit: required.unit,
        estimatedUnitPrice: null,
      });
    }

    if (
      matching.length > 0 &&
      matching.some((row) => row.unit !== required.unit)
    ) {
      uncertain.push(
        `${ingredient.name}: 재고 단위와 레시피 단위가 달라요`
      );
    }
  }

  return { missing, uncertain };
}

export default function RecipeShoppingBridgeScreen({
  navigation,
  route,
}) {
  const insets = useSafeAreaInsets();
  const { sharedReceipts, sharedUid } = useAppData();

  // AI 추천 레시피는 화면 이동 시 레시피를 통째로 넘겨받고, 기본 레시피는 id 로 찾습니다.
  const recipe =
    route.params?.recipe ??
    recipeData.recipes.find((r) => r.id === route.params?.id);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!recipe || !sharedReceipts || !sharedUid) {
      setLoading(false);
      setError('로그인 상태를 확인해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (auth.currentUser?.uid !== sharedUid) {
        throw new Error('로그인 계정이 변경됐어요.');
      }

      const response = await listFridgeItems(sharedUid);

      if (
        response?.success === false ||
        response?.possiblyTruncated ||
        !Array.isArray(response?.items)
      ) {
        throw new Error(
          '서버 재고 전체를 확인하지 못했어요.'
        );
      }

      setResult(
        calculateMissing(recipe, response.items)
      );
    } catch (err) {
      setError(err?.message || '재고를 조회하지 못했어요.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [recipe, sharedReceipts, sharedUid]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (saving || loading || !result?.missing.length) return;

    setSaving(true);
    setError('');

    try {
      const uid = sharedUid;

      if (!uid || auth.currentUser?.uid !== uid) {
        throw new Error('로그인 계정을 다시 확인해 주세요.');
      }

      // 장보기 저장 직전 최신 재고로 다시 계산
      const response = await listFridgeItems(uid);

      if (
        response?.success === false ||
        response?.possiblyTruncated ||
        !Array.isArray(response?.items)
      ) {
        throw new Error('서버 재고를 다시 확인해 주세요.');
      }

      const latest = calculateMissing(
        recipe,
        response.items
      );

      if (
        JSON.stringify(latest.missing) !==
        JSON.stringify(result.missing)
      ) {
        setResult(latest);
        throw new Error(
          '냉장고 재고가 변경됐어요. 부족한 재료를 다시 확인해 주세요.'
        );
      }

      const key = `solo-living-ai:shopping:v1:${uid}`;
      const raw = await AsyncStorage.getItem(key);
      const current = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(current)) {
        throw new Error('장보기 저장 형식을 확인해 주세요.');
      }

      const next = replaceRecipeShopping(
        current,
        latest.missing,
        { id: recipe.id, name: recipe.title },
        makeId
      );

      if (auth.currentUser?.uid !== uid) {
        throw new Error('로그인 계정이 변경됐어요.');
      }

      await AsyncStorage.setItem(
        key,
        JSON.stringify(next)
      );

      navigation.push('FridgeShopping');
    } catch (err) {
      setError(
        err?.message || '장보기 목록에 저장하지 못했어요.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text>레시피를 찾지 못했어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: spacing.screenX,
          paddingBottom: insets.bottom + 50,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Text style={styles.backText}>
            ← 레시피로 돌아가기
          </Text>
        </Pressable>

        <Text style={styles.title}>
          부족한 재료 확인
        </Text>

        <Text style={styles.subtitle}>
          {recipe.title}
        </Text>

        <Text style={styles.description}>
          내 냉장고에 등록된 재고와
          레시피의 필요 수량을 비교했어요.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.green}
          />
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

            {result && (
              <>
                <Text style={styles.sectionTitle}>
                  부족한 재료 ({result.missing.length})
                </Text>

                {result.missing.length === 0 ? (
                  <Text style={styles.description}>
                    현재 확인 가능한 재고 기준으로는
                    부족한 재료가 없어요.
                  </Text>
                ) : (
                  result.missing.map((item) => (
                    <View
                      key={`${item.name}-${item.unit}`}
                      style={styles.item}
                    >
                      <Text style={styles.itemName}>
                        {item.name}
                      </Text>

                      <Text style={styles.amount}>
                        {item.quantity}{item.unit}
                      </Text>
                    </View>
                  ))
                )}

                {result.uncertain.length > 0 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>
                      수량 확인이 필요한 재료
                    </Text>

                    {result.uncertain.map((text, i) => (
                      <Text
                        key={i}
                        style={styles.warningText}
                      >
                        · {text}
                      </Text>
                    ))}
                  </View>
                )}

                <Text style={styles.description}>
                  기한이 지난 재료는 제외했어요.
                  기한 미입력 재고는 보유 재고로 계산합니다.
                  단위가 다르면 자동 환산하지 않아요.
                </Text>

                <Pressable
                  disabled={
                    saving || result.missing.length === 0
                  }
                  onPress={handleAdd}
                  style={[
                    styles.button,
                    (saving ||
                      result.missing.length === 0) &&
                      styles.disabled,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {saving
                      ? '장보기 저장 중...'
                      : '부족한 재료 장보기 목록에 추가'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={saving}
                  onPress={load}
                  style={styles.refresh}
                >
                  <Text style={styles.refreshText}>
                    냉장고 재고 다시 확인
                  </Text>
                </Pressable>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    marginBottom: 24,
  },
  backText: {
    color: colors.green,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.green,
  },
  description: {
    marginTop: 14,
    marginBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.textPrimary,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    padding: 18,
    borderRadius: 14,
    marginBottom: 10,
  },
  itemName: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.green,
  },
  warningBox: {
    backgroundColor: colors.warnBg,
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  warningTitle: {
    fontFamily: fonts.bold,
    color: colors.warnText,
    marginBottom: 8,
  },
  warningText: {
    fontFamily: fonts.regular,
    color: colors.warnText,
    marginBottom: 4,
  },
  button: {
    backgroundColor: colors.green,
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  refresh: {
    alignItems: 'center',
    padding: 16,
  },
  refreshText: {
    color: colors.green,
    fontFamily: fonts.medium,
  },
  error: {
    color: colors.warnText,
    marginTop: 12,
    lineHeight: 22,
  },
});
