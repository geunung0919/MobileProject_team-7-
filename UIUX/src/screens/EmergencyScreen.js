import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmergencyContactCard from '../components/EmergencyContactCard';
import SituationCard from '../components/SituationCard';
import SearchBar from '../components/SearchBar';
import InfoBanner from '../components/InfoBanner';
import BackButton from '../components/BackButton';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { emergencyData } from '../data/lifeInfo/emergency';
import { colors, fonts, emergencyColors as c } from '../theme';

// 이 화면은 PNG 기준 좌우 여백이 20 입니다. (theme.spacing.screenX 는 24)
const SCREEN_X = 20;
const CONTACT_GAP = 10;
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
  const { eyebrow, title, contactsLabel, contacts, searchPlaceholder, question, groups, footer } =
    emergencyData;

  const trimmed = query.trim();
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: trimmed ? group.items.filter((item) => matches(item, trimmed)) : group.items,
        }))
        .filter((group) => group.items.length > 0),
    [groups, trimmed],
  );

  // 뒤로 가기 (이전 기록이 없으면 생활정보 탭으로 이동)
  const handleBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LifeInfo'));

  // 실수로 눌러 119/112 에 걸리지 않도록 한 번 확인합니다.
  const handleCall = ({ number, label }) => {
    Alert.alert(`${number}에 전화할까요?`, label, [
      { text: '취소', style: 'cancel' },
      { text: '전화 걸기', onPress: () => Linking.openURL(`tel:${number}`) },
    ]);
  };

  // 상황별 대처 화면으로 이동. id 는 data/lifeInfo/emergencyGuides.js 의 키와 같아야 합니다.
  const openDetail = ({ id, title: detailTitle, tone }) =>
    navigation.navigate('EmergencyDetail', { id, title: detailTitle, tone });

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

        <Text style={styles.contactsLabel}>{contactsLabel}</Text>
        <View style={styles.contactsRow}>
          {contacts.map((contact) => (
            <EmergencyContactCard
              key={contact.id}
              {...contact}
              onPress={() => handleCall(contact)}
            />
          ))}
        </View>

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />
        </View>

        <Text style={styles.question}>{question}</Text>

        {visibleGroups.map((group, groupIndex) => (
          <View key={group.id}>
            <Text
              style={[
                styles.groupTitle,
                groupIndex > 0 && styles.groupTitleNext,
                group.tone === 'accent' && styles.groupTitleAccent,
              ]}
            >
              {group.title}
            </Text>
            {toRows(group.items).map((row, rowIndex) => (
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
            ))}
          </View>
        ))}

        {visibleGroups.length === 0 ? (
          <Text style={styles.empty}>'{trimmed}'에 맞는 상황이 없어요.</Text>
        ) : null}

        <InfoBanner
          style={styles.banner}
          title={footer.title}
          linkLabel={footer.link}
          onPress={() => openDetail({ id: 'general', title: '이럴 땐 이렇게' })}
        />
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
  contactsLabel: {
    marginTop: 18,
    marginBottom: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: c.textSecondary,
  },
  contactsRow: {
    flexDirection: 'row',
    gap: CONTACT_GAP,
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
  groupTitleNext: {
    marginTop: 18,
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
  banner: {
    marginTop: 18,
  },
});
