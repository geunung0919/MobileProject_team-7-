import React, { useMemo } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import PrimaryButton from '../components/PrimaryButton';
import { recipeData } from '../data/fridge/recipes';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { analyzeRecipe, getFridgeEntries } from '../utils/recipes';
import { toDateString } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// 냉장고 > AI 레시피 추천 > 레시피 상세
// 사용 예: navigation.navigate('RecipeDetail', { id: 'rcp1' })
export default function RecipeDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const t = recipeData.texts;
  const { fridgeItems, removeFridgeItem } = useAppData();
  const baseDate = toDateString(new Date());

  const recipe = recipeData.recipes.find((r) => r.id === route.params?.id);
  const entries = useMemo(
    () => getFridgeEntries(fridgeItems, baseDate, fridgeData.urgentWithinDays),
    [fridgeItems, baseDate]
  );
  const analysis = useMemo(() => (recipe ? analyzeRecipe(recipe, entries) : null), [recipe, entries]);

  // 요리를 마치면 냉장고에 있던 재료를 뺍니다.
  // TODO: 지금은 재료를 통째로 빼요. 레시피에 쓴 분량만큼만 수량을 줄이려면 updateFridgeItem 으로 바꾸세요.
  const handleCookDone = () => {
    const targets = [...new Map(analysis.owned.map((i) => [i.fridgeItem.id, i.fridgeItem])).values()];
    if (targets.length === 0) {
      Alert.alert(t.nothingToRemove);
      return;
    }
    Alert.alert(t.confirmTitle, t.confirmMessage(targets.map((it) => it.name).join(', ')), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirmAction,
        onPress: () => {
          targets.forEach((it) => removeFridgeItem(it.id));
          navigation.goBack();
        },
      },
    ]);
  };

  if (!recipe) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 14, paddingHorizontal: spacing.screenX }]}>
        <BackHeader title={t.detailTitle} icon="arrow-back" onBack={() => navigation.goBack()} />
        <Text style={styles.notFound}>{t.notFound}</Text>
      </View>
    );
  }

  const { ingredients, owned } = analysis;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: 24,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <BackHeader title={t.detailTitle} icon="arrow-back" onBack={() => navigation.goBack()} />

        {/* 요리 이름 / 시간 · 난이도 · 인분 */}
        <View style={styles.banner}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, styles.metaFirst]}>{recipe.minutes}분</Text>
            <Text style={styles.metaText}>난이도 {recipe.difficulty}</Text>
            <Text style={styles.metaText}>{recipe.servings}인분</Text>
          </View>
        </View>

        {/* 재료 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.ingredientsTitle}</Text>
          <Text style={styles.haveCount}>{t.haveCount(ingredients.length, owned.length)}</Text>
        </View>
        {ingredients.map((ing) => {
          const has = Boolean(ing.fridgeItem);
          return (
            <View key={ing.name} style={styles.ingredientRow}>
              <View style={[styles.circle, has ? styles.circleHave : styles.circleMissing]}>
                {has ? <Ionicons name="checkmark" size={14} color={colors.green} /> : null}
              </View>
              <Text style={[styles.ingredientName, !has && styles.ingredientMissing]}>{ing.name}</Text>
              {!has ? (
                <View style={styles.missingBadge}>
                  <Text style={styles.missingBadgeText}>{t.missingBadge}</Text>
                </View>
              ) : null}
              <Text style={styles.amount}>{ing.amount}</Text>
            </View>
          );
        })}

        {/* 조리 순서 */}
        <Text style={[styles.sectionTitle, styles.stepsTitle]}>{t.stepsTitle}</Text>
        {recipe.steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <PrimaryButton label={t.cookDone} onPress={handleCookDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    paddingVertical: 48,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  banner: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: colors.heroBg,
  },
  recipeTitle: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginRight: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  metaFirst: {
    marginLeft: 3,
  },
  sectionRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  haveCount: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.green,
  },
  ingredientRow: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleHave: {
    backgroundColor: colors.tabActiveBg,
  },
  circleMissing: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: colors.checkboxBorder,
  },
  ingredientName: {
    marginLeft: 12,
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  ingredientMissing: {
    color: colors.textSecondary,
  },
  missingBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.warnBg,
  },
  missingBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.warnText,
  },
  amount: {
    marginLeft: 'auto',
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.textSecondary,
  },
  stepsTitle: {
    marginTop: 24,
    marginBottom: 14,
  },
  stepRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.green,
  },
  stepText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },
});
