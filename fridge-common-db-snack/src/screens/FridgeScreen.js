import ActionMenu from '../components/ActionMenu';
import {router} from '../../integration/router';
import {useDayClock} from '../../module3/hooks/useDayClock';
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import SoftButton from '../components/SoftButton';
import Chip from '../components/Chip';
import FridgeItemRow from '../components/FridgeItemRow';
import Fab from '../components/Fab';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import {
  daysBetween,
  formatDotDate,
  toDateString,
  addDays,
  formatKoreanDate,
} from '../utils/format';
import { colors, fonts, spacing } from '../theme';

export default function FridgeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { urgentWithinDays } = fridgeData;
  const { fridgeItems: items } = useAppData();
  useDayClock();
  const now = new Date();
  const baseDate = toDateString(now); // 기준일 = 오늘
  const [filter, setFilter] = useState('all'); // 'all' | 'urgent'

  // 유통기한 빠른 순으로 정렬하고, 남은 일수/임박 여부를 계산합니다.
  const enriched = useMemo(
    () =>
      items
        .map((item) => {
          const expiry = item.expiry || null;
          const daysLeft = expiry ? daysBetween(baseDate, expiry) : Infinity;
          return { ...item, expiry, daysLeft, urgent: daysLeft <= urgentWithinDays };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [items, baseDate, urgentWithinDays]
  );

  const urgentCount = enriched.filter((i) => i.urgent).length;
  const visible = filter === 'urgent' ? enriched.filter((i) => i.urgent) : enriched;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 120,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <ScreenHeader
          title="냉장고"
          rightText={formatKoreanDate(now)}
          subtitle="우리 집 식재료, 기한 전에 챙겨요."
        />

        <SoftButton
          label="레시피 검색 · 추천"
          icon="fridge-outline"
          onPress={() => navigation.navigate('RecipeList',{searchMode:true})}
        />

        <View style={{marginTop:32,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={[styles.sectionTitle,{marginTop:0}]}>보관 중인 식재료</Text>        <ActionMenu label="냉장고 관리" items={[
          ['음식 검색',()=>navigation.navigate('RecipeList',{searchMode:true})],
          ['재고 관리 · 사용/폐기',()=>router.push('/inventory/manage')],
          ['장보기 목록',()=>router.push('/(tabs)/shopping')],
          ['식사 · 폐기 기록',()=>router.push('/(tabs)/meal')],
          ['날짜 알림',()=>router.push('/inventory/alerts')]
        ]}/>
</View>

        <View style={styles.chipRow}>
          <Chip
            label="전체"
            count={enriched.length}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label="유통기한 임박"
            count={urgentCount}
            selected={filter === 'urgent'}
            onPress={() => setFilter('urgent')}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>임박은 {urgentWithinDays}일 이내 · 유통기한 빠른 순</Text>
          <Text style={styles.metaText}>{formatDotDate(baseDate)} 기준</Text>
        </View>

        <View>
          {visible.map((item, i) => (
            <FridgeItemRow
              key={item.id}
              {...item}
              isLast={i === visible.length - 1}
              onPress={() => navigation.navigate('FridgeAdd', { id: item.id })}
            />
          ))}
        </View>
      </ScrollView>

      <Fab accessibilityLabel="식재료 추가" onPress={() => navigation.navigate('FridgeAdd')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    marginTop: 32,
    fontFamily: fonts.bold, fontWeight:'700',
    fontSize: 20,
    color: colors.textPrimary,
  },
  chipRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  metaRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
});
