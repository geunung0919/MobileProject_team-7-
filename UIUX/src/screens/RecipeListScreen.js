
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import Text from '../components/AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackHeader from '../components/BackHeader';
import IconBox from '../components/IconBox';

import { recipeData } from '../data/fridge/recipes';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { fetchRecipes } from '../api/aiManager';
import { recipeErrorText } from '../api/aiFormat';

import {
  analyzeRecipe,
  badgeDueLabel,
  getFridgeEntries,
  shortDueLabel,
} from '../utils/recipes';

import { toDateString } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// 냉장고 > AI 레시피 추천 목록
export default function RecipeListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const t = recipeData.texts;

  const {
    fridgeItems,
    sharedReceipts,
    sharedUid,
  } = useAppData();

  // Firebase 모드: 서버 AI(recommendRecipes)가 실제 냉장고 재고로 레시피를 추천합니다.
  // 실패하거나 추천이 없으면 아래 기본 레시피를 보여 주고 이유를 안내합니다.
  const useAi = sharedReceipts && Boolean(sharedUid);
  const [ai, setAi] = useState({ status: 'loading', recipes: [], note: '' });
  const aiRequest = useRef(0);

  // 요청을 보내고, 가장 마지막 요청의 결과만 화면에 반영합니다.
  const requestAi = useCallback((force) => {
    const id = ++aiRequest.current;
    fetchRecipes(force ? { force: true } : {})
      .then((res) => {
        if (id !== aiRequest.current) return;
        setAi(res.recipes.length > 0
          ? { status: 'ok', recipes: res.recipes, note: res.message || '' }
          : { status: 'fallback', recipes: [], note: recipeErrorText(res) });
      })
      .catch((error) => {
        if (id !== aiRequest.current) return;
        setAi({ status: 'fallback', recipes: [], note: error?.message || recipeErrorText(null) });
      });
  }, []);

  // "AI 로 다시 추천받기"
  const loadAi = (force) => {
    setAi((prev) => ({ ...prev, status: 'loading' }));
    requestAi(force);
  };

  useEffect(() => {
    if (!useAi) return undefined;
    requestAi(false);
    return () => {
      aiRequest.current += 1; // 화면을 떠나면 늦게 온 응답은 무시
    };
  }, [useAi, requestAi]);
  const aiRecipes = useAi && ai.status === 'ok' ? ai.recipes : null;

  const baseDate = toDateString(new Date());

  // 기존 로컬 냉장고 재료 분석
  const entries = useMemo(
    () =>
      getFridgeEntries(
        fridgeItems,
        baseDate,
        fridgeData.urgentWithinDays
      ),
    [fridgeItems, baseDate]
  );

  const urgentChips = sharedReceipts
    ? []
    : entries.filter((entry) => entry.urgent).slice(0, 3);

  // Firebase 모드는 실제 재고를 다음 화면에서 조회하므로
  // 로컬 재고가 없어도 레시피 목록을 보여줍니다.
  const cards = useMemo(
    () =>
      (aiRecipes ?? recipeData.recipes)
        .map((recipe) => ({
          recipe,
          ...analyzeRecipe(recipe, entries),
        }))
        .filter(
          (card) =>
            sharedReceipts || card.owned.length > 0
        ),
    [entries, sharedReceipts, aiRecipes]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: spacing.screenX,
        }}
      >
        {/* 화면 상단 */}
        <View style={styles.headerWrap}>
          <BackHeader
            title={t.listTitle}
            icon="arrow-back"
            onBack={() => navigation.goBack()}
          />
        </View>

        <Text style={styles.subtitle}>
          {sharedReceipts
            ? aiRecipes
              ? t.listSubtitle
              : '레시피를 선택하고 내 냉장고에 있는 재료를 확인해 보세요.'
            : t.listSubtitle}
        </Text>

        {/* 레시피 안내 */}
        <View style={styles.banner}>
          <View style={styles.bannerHead}>
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={22}
              color={colors.green}
            />

            <Text style={styles.bannerText}>
              {sharedReceipts
                ? aiRecipes
                  ? '내 냉장고 재료로 AI 가 고른 요리예요. 기한이 가까운 재료를 먼저 썼어요.'
                  : '레시피를 선택하면 필요한 재료를 확인할 수 있어요.'
                : urgentChips.length > 0
                  ? t.bannerUrgent
                  : t.bannerNormal}
            </Text>
          </View>

          {!sharedReceipts && urgentChips.length > 0 ? (
            <View style={styles.chipRow}>
              {urgentChips.map((entry) => (
                <View
                  key={entry.id}
                  style={styles.urgentChip}
                >
                  <Text style={styles.urgentChipText}>
                    {entry.name} · {shortDueLabel(entry.daysLeft)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {useAi && ai.status === 'loading' ? (
            <View style={styles.aiRow}>
              <ActivityIndicator size="small" color={colors.green} />
              <Text style={styles.aiNote}>AI 가 냉장고 재료로 레시피를 고르는 중…</Text>
            </View>
          ) : null}

          {useAi && ai.status === 'fallback' ? (
            <Text style={styles.aiNote}>
              {ai.note} 기본 레시피를 보여 드려요.
            </Text>
          ) : null}

          {useAi && ai.status !== 'loading' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => loadAi(true)}
              style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="refresh" size={16} color={colors.green} />
              <Text style={styles.aiButtonText}>AI 로 다시 추천받기</Text>
            </Pressable>
          ) : null}
        </View>

        {/* 추천 레시피 목록 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {t.sectionTitle}
          </Text>

          <Text style={styles.countText}>
            {t.count(cards.length)}
          </Text>
        </View>

        {cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {t.empty}
            </Text>

            <Text style={styles.emptyHint}>
              {t.emptyHint}
            </Text>
          </View>
        ) : (
          cards.map(({ recipe, owned, missing, urgent }) => (
            <Pressable
              key={recipe.id}
              onPress={() =>
                navigation.navigate('RecipeDetail', {
                  id: recipe.id,
                  ...(aiRecipes ? { recipe } : {}),
                })
              }
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.card,
                pressed && styles.pressed,
              ]}
            >
              {/* 레시피 기본 정보 */}
              <View style={styles.cardTop}>
                <IconBox
                  name={recipe.icon}
                  size={52}
                  borderRadius={16}
                  iconColor={colors.green}
                  backgroundColor={colors.heroBg}
                />

                <View style={styles.cardTitleBox}>
                  <Text
                    style={styles.cardTitle}
                    numberOfLines={1}
                  >
                    {recipe.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.metaText}>
                      {recipe.minutes}분 · {recipe.difficulty}
                    </Text>
                  </View>
                </View>

                {!sharedReceipts && urgent.length > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {urgent.length >= 2
                        ? t.urgentBadge(urgent.length)
                        : badgeDueLabel(
                            urgent[0].fridgeItem.daysLeft
                          )}
                    </Text>
                  </View>
                ) : null}
              </View>

              {sharedReceipts ? (
                // Firebase 모드에서는 로컬 재고 보유 표시 대신
                // 레시피의 전체 필요 재료만 보여줍니다.
                <View style={styles.ingredientRow}>
                  <Text style={styles.rowLabel}>
                    필요 재료
                  </Text>

                  {recipe.ingredients.map((ingredient) => (
                    <View
                      key={ingredient.name}
                      style={ingredient.kind === 'fridge' ? styles.haveChip : styles.missingChip}
                    >
                      <Text style={ingredient.kind === 'fridge' ? styles.haveChipText : styles.missingChipText}>
                        {ingredient.kind === 'fridge' ? '✓ ' : ''}{ingredient.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  {/* 기존 로컬 모드의 보유 재료 */}
                  <View
                    style={[
                      styles.ingredientRow,
                      styles.firstRow,
                    ]}
                  >
                    <Text style={styles.rowLabel}>
                      {t.haveLabel}
                    </Text>

                    {owned.map((ingredient) => (
                      <View
                        key={ingredient.name}
                        style={styles.haveChip}
                      >
                        <Text style={styles.haveChipText}>
                          {ingredient.name}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* 기존 로컬 모드의 부족 재료 */}
                  <View style={styles.ingredientRow}>
                    <Text style={styles.rowLabel}>
                      {t.needLabel}
                    </Text>

                    {missing.length === 0 ? (
                      <Text style={styles.allHave}>
                        {t.allHave}
                      </Text>
                    ) : (
                      missing.map((ingredient) => (
                        <View
                          key={ingredient.name}
                          style={styles.missingChip}
                        >
                          <Text style={styles.missingChipText}>
                            {ingredient.name}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  aiNote: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  aiButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.green,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  headerWrap: {
    marginBottom: -12,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },

  banner: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: colors.heroBg,
  },

  bannerHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bannerText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.green,
  },

  chipRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  urgentChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  urgentChipText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.green,
  },

  sectionRow: {
    marginTop: 21,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },

  countText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },

  card: {
    marginBottom: 13,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },

  pressed: {
    opacity: 0.85,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardTitleBox: {
    flex: 1,
    marginLeft: 16,
  },

  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },

  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    marginLeft: 6,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },

  badge: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.warnBg,
  },

  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.warnText,
  },

  ingredientRow: {
    marginTop: 7,
    minHeight: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  firstRow: {
    marginTop: 12,
  },

  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },

  haveChip: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: colors.tabActiveBg,
  },

  haveChipText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 19,
    color: colors.green,
  },

  missingChip: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
  },

  missingChipText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  allHave: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.green,
  },

  empty: {
    paddingVertical: 56,
    alignItems: 'center',
  },

  emptyTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },

  emptyHint: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
