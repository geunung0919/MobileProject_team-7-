import ActionMenu from '../components/ActionMenu';
import {useApp} from '../../module3/state/AppProvider';
import {recipes} from '../../module3/data/seed';
import {searchRecipes} from '../../module3/domain/recipeSearch.mjs';
import {presentRecipe} from '../../integration/recipes.mjs';
import {router} from '../../integration/router';
import {useDayClock} from '../../module3/hooks/useDayClock';
import SearchBar from '../components/SearchBar';
import SoftButton from '../components/SoftButton';
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import IconBox from '../components/IconBox';
import { recipeData } from '../data/fridge/recipes';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { analyzeRecipe, badgeDueLabel, getFridgeEntries, shortDueLabel } from '../utils/recipes';
import { toDateString } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// 냉장고 > AI 레시피 추천 (목록)
export default function RecipeListScreen({ navigation,route }) {
  const insets = useSafeAreaInsets();
  const t = recipeData.texts;
  const { fridgeItems } = useAppData();
  const {state}=useApp();const [query,setQuery]=useState('');const [searchVisible,setSearchVisible]=useState(true);
  const searchMode=route.params?.searchMode!==false;useDayClock();
  const baseDate = toDateString(new Date()); // 기준일 = 오늘

  const entries = useMemo(
    () => getFridgeEntries(fridgeItems, baseDate, fridgeData.urgentWithinDays),
    [fridgeItems, baseDate]
  );
  // 유통기한이 가장 급한 재료 3개 (배너 칩)
  const urgentChips = entries.filter((e) => e.urgent).slice(0, 3);
  // 추천 순서는 그대로 두고, 냉장고에 재료가 하나라도 있는 레시피만 보여줍니다.
  const cards=searchRecipes(recipes,state.inventory,{query,conditions:searchMode?null:state.conditions}).map(recipe=>presentRecipe(recipe,state.inventory));

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
        <View style={styles.headerWrap}>
          <BackHeader title={searchMode?'음식 검색':t.listTitle} icon="arrow-back" onBack={() => navigation.goBack()} />
        </View>
        <Text style={styles.subtitle}>등록된 요리를 검색하고 재료·도구를 확인하세요.</Text>

        <ActionMenu label="레시피 메뉴" items={[
          
          ['조리 조건 · 제외 재료',()=>router.push('/recipe/conditions')],
          ['레시피 알림 시연',()=>router.push('/recipe/reminders')]
        ]}/>
        {searchVisible&&<SearchBar value={query} onChangeText={setQuery} placeholder="요리 이름 또는 재료 검색"/>}
        {/* 임박한 재료를 먼저 활용했다는 안내 */}
        <View style={styles.banner}>
          <View style={styles.bannerHead}>
            <MaterialCommunityIcons name="star-four-points-outline" size={22} color={colors.green} />
            <Text style={styles.bannerText}>
              {urgentChips.length > 0 ? t.bannerUrgent : t.bannerNormal}
            </Text>
          </View>
          {urgentChips.length > 0 ? (
            <View style={styles.chipRow}>
              {urgentChips.map((e) => (
                <View key={e.id} style={styles.urgentChip}>
                  <Text style={styles.urgentChipText}>
                    {e.name} · {shortDueLabel(e.daysLeft)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.sectionTitle}</Text>
          <Text style={styles.countText}>{t.count(cards.length)}</Text>
        </View>

        {cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.empty}</Text>
            <Text style={styles.emptyHint}>{t.emptyHint}</Text>
          </View>
        ) : (
          cards.map(({ recipe, owned, missing, urgent }) => (
            <Pressable
              key={recipe.id}
              onPress={() => navigation.navigate('RecipeDetail', { id: recipe.id,searchMode })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardTop}>
                <IconBox
                  name={recipe.icon}
                  size={52}
                  borderRadius={16}
                  iconColor={colors.green}
                  backgroundColor={colors.heroBg}
                />
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {recipe.minutes}분 · {recipe.difficulty}
                    </Text>
                  </View>
                </View>
                {/* 임박 재료가 2개 이상이면 개수, 1개면 그 재료의 남은 기간 */}
                {urgent.length > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {urgent.length >= 2
                        ? t.urgentBadge(urgent.length)
                        : badgeDueLabel(urgent[0].fridgeItem.daysLeft)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.ingredientRow, styles.firstRow]}>
                <Text style={styles.rowLabel}>{t.haveLabel}</Text>
                {owned.map((ing) => (
                  <View key={ing.name} style={styles.haveChip}>
                    <Text style={styles.haveChipText}>{ing.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.ingredientRow}>
                <Text style={styles.rowLabel}>{t.needLabel}</Text>
                {missing.length === 0 ? (
                  <Text style={styles.allHave}>{t.allHave}</Text>
                ) : (
                  missing.map((ing) => (
                    <View key={ing.name} style={styles.missingChip}>
                      <Text style={styles.missingChipText}>{ing.name}</Text>
                    </View>
                  ))
                )}
              </View>
            </Pressable>
          ))
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
  headerWrap: {
    marginBottom: -12, // BackHeader 아래 기본 여백(24)을 줄여 부제목이 제목 가까이 붙도록
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
    fontFamily: fonts.bold, fontWeight: '700',
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
    fontFamily: fonts.bold, fontWeight: '700',
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
    fontFamily: fonts.bold, fontWeight: '700',
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
    fontFamily: fonts.bold, fontWeight: '700',
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
    fontFamily: fonts.bold, fontWeight: '700',
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
    fontFamily: fonts.medium, fontWeight: '500',
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
    fontFamily: fonts.medium, fontWeight: '500',
    fontSize: 15,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  allHave: {
    fontFamily: fonts.bold, fontWeight: '700',
    fontSize: 16,
    color: colors.green,
  },
  empty: {
    paddingVertical: 56,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.medium, fontWeight: '500',
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
