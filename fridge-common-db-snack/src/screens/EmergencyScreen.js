import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SituationCard from '../components/SituationCard';
import SearchBar from '../components/SearchBar';
import AiAskCard from '../components/AiAskCard';
import BackButton from '../components/BackButton';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { emergencyData } from '../data/lifeInfo/emergency';
import { colors, fonts, emergencyColors as c } from '../theme';

// 이 화면은 PNG 기준 좌우 여백이 20 입니다. (theme.spacing.screenX 는 24)
const SCREEN_X = 20;
const GRID_GAP = 9;

// 제목 또는 검색용 단어에 검색어가 들어 있으면 통과
const matches = (item, query) =>
  item.title.includes(query) || (item.keywords ?? []).some((k) => k.includes(query));

// [a, b, c, d] -> [[a, b], [c, d]]
const toRows = (items) => {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
};

// 생활정보 > 비상 매뉴얼 확인
export default function EmergencyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { eyebrow, title, searchPlaceholder, question, groups, aiAsk, prepare } = emergencyData;

  const trimmed = query.trim();
  // 생활 문제(위)와 긴급·안전(아래 "미리 대비하기")을 나눠서, 검색어에 맞는 항목만 남깁니다.
  const { lifeGroup, safetyGroup } = useMemo(() => {
    const filter = (id) => {
      const group = groups.find((g) => g.id === id);
      return { ...group, items: trimmed ? group.items.filter((item) => matches(item, trimmed)) : group.items };
    };
    return { lifeGroup: filter('life'), safetyGroup: filter('safety') };
  }, [groups, trimmed]);

  // 뒤로 가기 (이전 기록이 없으면 생활정보 탭으로 이동)
  const handleBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LifeInfo'));

  // 상황별 대처 화면으로 이동. id 는 data/lifeInfo/emergencyGuides.js 의 키와 같아야 합니다.
  const openDetail = ({ id, title: detailTitle, tone }) =>
    navigation.navigate('EmergencyDetail', { id, title: detailTitle, tone });

  const renderRows = (group) =>
    toRows(group.items).map((row, rowIndex) => (
      <View key={rowIndex} style={[styles.gridRow, rowIndex > 0 && styles.gridRowNext]}>
        {row.map((item) => (
          <SituationCard
            key={item.id}
            title={item.title}
            icon={item.icon}
            family={item.family}
            tone={group.tone}
            onPress={() => openDetail({ id: item.id, title: item.title, tone: group.tone })}
          />
        ))}
        {row.length === 1 ? <View style={styles.spacer} /> : null}
      </View>
    ));

  const renderGroup = (group) => (
    <View>
      <Text style={[styles.groupTitle, group.tone === 'accent' && styles.groupTitleAccent]}>
        {group.title}
      </Text>
      {renderRows(group)}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40,
          paddingHorizontal: SCREEN_X,
        }}
      >
        <View style={styles.headerRow}>
          <BackButton onPress={handleBack} color={c.text} style={styles.backButton} />
          <View style={styles.headerTexts}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />
        </View>

        <Text style={styles.question}>{question}</Text>

        {lifeGroup.items.length > 0 ? renderGroup(lifeGroup) : null}

        {lifeGroup.items.length === 0 && safetyGroup.items.length === 0 ? (
          <Text style={styles.empty}>'{trimmed}'에 맞는 상황이 없어요.</Text>
        ) : null}

        <AiAskCard
          style={styles.aiCard}
          label={aiAsk.label}
          onPress={() => navigation.navigate('EmergencyAi')}
        />

        {safetyGroup.items.length > 0 ? (
          <View style={styles.prepareBox}>
            <Text style={styles.prepareTitle}>{prepare.title}</Text>
            {renderRows(safetyGroup)}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
  },
  // 제목 줄(eyebrow 16 + 제목 34 의 가운데)에 화살표 높이를 맞춥니다.
  backButton: {
    marginTop: 19,
    marginRight: 6,
  },
  headerTexts: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: c.textSecondary,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: c.text,
  },
  searchWrap: {
    marginTop: 16,
  },
  question: {
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: c.text,
  },
  groupTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: c.text,
  },
  groupTitleAccent: {
    color: c.accent,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  gridRowNext: {
    marginTop: GRID_GAP,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    marginTop: 28,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: c.textSecondary,
  },
  aiCard: {
    marginTop: 18,
  },
  // 긴급·안전 항목을 "미리 대비하기" 상자로 묶어 하단에 둡니다.
  prepareBox: {
    marginTop: 28,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#F1F4F4',
  },
  prepareTitle: {
    marginBottom: 14,
    paddingHorizontal: 4,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 26,
    color: c.text,
  },
});
