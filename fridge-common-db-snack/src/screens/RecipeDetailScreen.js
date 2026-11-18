import {useApp} from '../../module3/state/AppProvider';
import {recipes} from '../../module3/data/seed';
import {presentRecipe} from '../../integration/recipes.mjs';
import {router} from '../../integration/router';
import {Button} from '../../module3/components/UI';
import {useDayClock} from '../../module3/hooks/useDayClock';
import React, { useMemo, useState } from 'react';
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

// 냉장고 > AI 레시피 추천 > 레시피 상세. params: { id }
export default function RecipeDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const t = recipeData.texts;
  const { fridgeItems } = useAppData();
  const {state,addMissing}=useApp();const [message,setMessage]=useState('');useDayClock();
  const baseDate = toDateString(new Date());

  const canonical = recipes.find((r)=>r.id===route.params?.id);
  const recipe=canonical?presentRecipe(canonical,state.inventory).recipe:null;
  const entries = useMemo(
    () => getFridgeEntries(fridgeItems, baseDate, fridgeData.urgentWithinDays),
    [fridgeItems, baseDate]
  );
  const analysis = recipe ? presentRecipe(canonical,state.inventory) : null;

  const missingTools=(canonical?.tools||[]).filter(t=>!(state.conditions?.tools||[]).includes(t));
  const toolNames={pot:'냄비',pan:'프라이팬',microwave:'전자레인지'};
  const handleCookDone=()=>{if(analysis.missing.length||missingTools.length)return;router.push({pathname:`/recipe/${recipe.id}`,params:{startCooking:true,searchMode:route.params?.searchMode}});};

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

        <Text style={[styles.sectionTitle,{marginTop:22}]}>필요한 도구</Text>
        <Text style={[styles.metaText,{marginTop:10}]}>{recipe.tools.map(t=>toolNames[t]||t).join(' · ')}</Text>
        {!!missingTools.length&&<Text style={{color:colors.warnText,marginTop:8}}>보유 도구 설정에 없음: {missingTools.map(t=>toolNames[t]||t).join(', ')}</Text>}
        <Text style={{color:colors.textSecondary,marginTop:8}}>재고는 동일한 재료명·단위와 날짜를 기준으로 비교해요. 보관 참고일은 안전을 보장하지 않아요.</Text>
        {/* 재료 */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.ingredientsTitle}</Text>
          <Text style={styles.haveCount}>{t.haveCount(ingredients.length, owned.length)}</Text>
        </View>
        {ingredients.map((ing) => {
          const has = Boolean(ing.fridgeItem);
          return (
            <View key={ing.name} style={[styles.ingredientRow,{height:'auto',minHeight:72,flexWrap:'wrap',paddingVertical:10}]}>
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
              <Text style={{width:'100%',paddingTop:8,fontSize:13,color:has?colors.green:colors.warnText}}>필요 {ing.quantity}{ing.unit} / 사용 가능 {ing.held}{ing.unit}{ing.shortage>0?` / 부족 ${ing.shortage}${ing.unit}`:' · 충분해요'}{ing.unitMismatch?' · 다른 단위 재고는 환산하지 않았어요.':''}</Text>
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
        {!!analysis.missing.length&&<Button secondary title="부족 재료 장보기 추가" onPress={()=>addMissing(canonical).then(()=>setMessage('장보기 목록에 추가했어요.')).catch(e=>setMessage(e.message))}/>}
        {!!message&&<Text accessibilityLiveRegion="polite">{message}</Text>}
        {analysis.missing.length>0?<Text accessibilityLiveRegion="polite" style={{color:colors.warnText,paddingVertical:12}}>재료가 부족해요. 부족한 재료를 재고에 등록한 뒤 요리를 시작하세요.</Text>:missingTools.length>0?<Button secondary title="필요한 도구 확인 · 설정" onPress={()=>router.push('/recipe/conditions')}/>:<PrimaryButton label="요리 시작 · 실제 사용량 확인" onPress={handleCookDone}/>}
        {analysis.missing.length===0&&missingTools.length===0&&<Text style={{color:colors.green,paddingTop:8}}>재료가 충분해요. 조리 완료 후 확인을 눌러야 차감돼요.</Text>}
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
    fontFamily: fonts.bold, fontWeight: '700',
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
    fontFamily: fonts.bold, fontWeight: '700',
    fontSize: 22,
    color: colors.textPrimary,
  },
  haveCount: {
    fontFamily: fonts.bold, fontWeight: '700',
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
    fontFamily: fonts.medium, fontWeight: '500',
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
    fontFamily: fonts.bold, fontWeight: '700',
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
