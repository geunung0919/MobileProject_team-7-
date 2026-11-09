
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmergencyContactCard from '../components/EmergencyContactCard';
import SituationCard from '../components/SituationCard';
import SearchBar from '../components/SearchBar';
import BackButton from '../components/BackButton';
import { TAB_BAR_HEIGHT } from '../components/TabBar';

import { emergencyData } from '../data/lifeInfo/emergency';
import {
  colors,
  fonts,
  emergencyColors as c,
} from '../theme';

const SCREEN_X = 20;
const CONTACT_GAP = 10;
const GRID_GAP = 9;

// 제목 또는 검색 키워드에 검색어가 포함되는지 확인
const matches = (item, query) => {
  const keyword = query.toLowerCase();

  return (
    item.title.toLowerCase().includes(keyword) ||
    (item.keywords ?? []).some((k) =>
      k.toLowerCase().includes(keyword)
    )
  );
};

// 카드를 두 개씩 묶어 2열로 표시
const toRows = (items) => {
  const rows = [];

  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return rows;
};

export default function EmergencyScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [disasterExpanded, setDisasterExpanded] =
    useState(false);

  const {
    eyebrow,
    title,
    contactsLabel,
    contacts,
    searchPlaceholder,
    question,
    groups,
    disasterMenu,
  } = emergencyData;

  const trimmed = query.trim();

  // 생활안전 문제 검색
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: trimmed
            ? group.items.filter((item) =>
                matches(item, trimmed)
              )
            : group.items,
        }))
        .filter((group) => group.items.length > 0),
    [groups, trimmed]
  );

  // 재난 행동요령 검색
  const visibleDisasterItems = useMemo(() => {
    if (!disasterMenu) return [];

    if (!trimmed) {
      return disasterMenu.items;
    }

    return disasterMenu.items.filter((item) =>
      matches(item, trimmed)
    );
  }, [disasterMenu, trimmed]);

  // 검색어가 재난 항목에 해당하면 자동으로 펼치기
  const showDisasterItems =
    disasterExpanded || trimmed.length > 0;

  const hasSearchResults =
    visibleGroups.length > 0 ||
    visibleDisasterItems.length > 0;

  // 뒤로 가기
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('LifeInfo');
    }
  };

  // 긴급 연락처 연결
  const handleCall = ({ number, label }) => {
    Alert.alert(`${number}에 전화할까요?`, label, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '전화 걸기',
        onPress: async () => {
          try {
            await Linking.openURL(`tel:${number}`);
          } catch (error) {
            Alert.alert(
              '전화 연결 실패',
              '전화 기능을 사용할 수 있는 기기에서 다시 시도해 주세요.'
            );
          }
        },
      },
    ]);
  };

  // 상황별 상세 화면 이동
  const openDetail = ({
    id,
    title: detailTitle,
    tone,
  }) => {
    navigation.navigate('EmergencyDetail', {
      id,
      title: detailTitle,
      tone,
    });
  };

  // AI 상담 화면 이동
  // TODO: 진혁이의 AI 기능 통합 시
  // EmergencyAIChatScreen 내부에 실제 AI 로직 연결
  const openAIChat = () => {
    navigation.navigate('EmergencyAIChat');
  };

  // 2열 카드 렌더링
  const renderCards = (items, tone = 'default') =>
    toRows(items).map((row, rowIndex) => (
      <View
        key={rowIndex}
        style={[
          styles.gridRow,
          rowIndex > 0 && styles.gridRowNext,
        ]}
      >
        {row.map((item) => (
          <SituationCard
            key={item.id}
            title={item.title}
            icon={item.icon}
            family={item.family}
            tone={tone}
            onPress={() =>
              openDetail({
                id: item.id,
                title: item.title,
                tone,
              })
            }
          />
        ))}

        {row.length === 1 ? (
          <View style={styles.spacer} />
        ) : null}
      </View>
    ));

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom:
            TAB_BAR_HEIGHT + insets.bottom + 40,
          paddingHorizontal: SCREEN_X,
        }}
      >
        {/* 상단 헤더 */}
        <View style={styles.headerRow}>
          <BackButton
            onPress={handleBack}
            color={c.text}
            style={styles.backButton}
          />

          <View style={styles.headerTexts}>
            <Text style={styles.eyebrow}>
              {eyebrow}
            </Text>

            <Text style={styles.title}>
              {title}
            </Text>
          </View>
        </View>

        {/* 긴급 연락처 */}
        <Text style={styles.contactsLabel}>
          {contactsLabel}
        </Text>

        <View style={styles.contactsRow}>
          {contacts.map((contact) => (
            <EmergencyContactCard
              key={contact.id}
              {...contact}
              onPress={() => handleCall(contact)}
            />
          ))}
        </View>

        {/* 검색창 */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
          />
        </View>

        {/* 상황 선택 */}
        <Text style={styles.question}>
          {question}
        </Text>

        {/* 생활안전 문제 */}
        {visibleGroups.map((group, groupIndex) => (
          <View key={group.id}>
            <Text
              style={[
                styles.groupTitle,
                groupIndex > 0 &&
                  styles.groupTitleNext,
                group.tone === 'accent' &&
                  styles.groupTitleAccent,
              ]}
            >
              {group.title}
            </Text>

            {renderCards(group.items, group.tone)}
          </View>
        ))}

        {/* 재난 행동요령 별도 메뉴 */}
        {disasterMenu &&
          (!trimmed ||
            visibleDisasterItems.length > 0) && (
            <View style={styles.disasterSection}>
              <Pressable
                onPress={() =>
                  setDisasterExpanded(
                    (prev) => !prev
                  )
                }
                accessibilityRole="button"
                accessibilityState={{
                  expanded: showDisasterItems,
                }}
                style={({ pressed }) => [
                  styles.disasterHeader,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.disasterIcon}>
                  <Ionicons
                    name="book-outline"
                    size={22}
                    color={c.text}
                  />
                </View>

                <View style={styles.disasterTexts}>
                  <Text
                    style={styles.disasterTitle}
                  >
                    {disasterMenu.title}
                  </Text>

                  <Text
                    style={
                      styles.disasterDescription
                    }
                  >
                    {disasterMenu.description}
                  </Text>
                </View>

                <Ionicons
                  name={
                    showDisasterItems
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={22}
                  color={c.textSecondary}
                />
              </Pressable>

              {showDisasterItems && (
                <View
                  style={styles.disasterContent}
                >
                  {renderCards(
                    visibleDisasterItems,
                    'default'
                  )}
                </View>
              )}
            </View>
          )}

        {/* 검색 결과 없음 */}
        {trimmed && !hasSearchResults ? (
          <Text style={styles.empty}>
            '{trimmed}'에 맞는 상황이 없어요.
          </Text>
        ) : null}

        {/* AI 생활안전 상담 카드 */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}>
              <Ionicons
                name="sparkles-outline"
                size={24}
                color="#3B82F6"
              />
            </View>

            <View style={styles.aiHeaderText}>
              <Text style={styles.aiTitle}>
                원하는 상황을 찾지 못했나요?
              </Text>

              <Text
                style={styles.aiDescription}
              >
                AI 생활안전 도우미에게
                직접 질문해 보세요.
              </Text>
            </View>
          </View>

          <View style={styles.aiExample}>
            <Text style={styles.aiExampleLabel}>
              예를 들어 이런 질문을 할 수 있어요.
            </Text>

            <Text style={styles.aiExampleText}>
              "집에서 갑자기 물이 새면 어떻게
              해야 하나요?"
            </Text>
          </View>

          <Pressable
            onPress={openAIChat}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.aiButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.aiButtonText}>
              AI 생활안전 상담
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color="#FFFFFF"
            />
          </Pressable>

          <Text style={styles.aiStatus}>
            AI 상담 기능 연결 준비 중
          </Text>

          <Text style={styles.aiWarning}>
            긴급한 상황에서는 AI 답변을
            기다리지 말고 119 또는 112에
            신고하세요.
          </Text>
        </View>
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

  // 재난 행동요령 영역
  disasterSection: {
    marginTop: 24,
  },

  disasterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },

  disasterIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  disasterTexts: {
    flex: 1,
    marginRight: 8,
  },

  disasterTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 23,
    color: c.text,
  },

  disasterDescription: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: c.textSecondary,
  },

  disasterContent: {
    marginTop: 12,
  },

  pressed: {
    opacity: 0.75,
  },

  // AI 상담 카드
  aiSection: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  aiHeaderText: {
    flex: 1,
  },

  aiTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: c.text,
  },

  aiDescription: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: c.textSecondary,
  },

  aiExample: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },

  aiExampleLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
  },

  aiExampleText: {
    marginTop: 7,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: c.text,
  },

  aiButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 12,
  },

  aiButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },

  aiStatus: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
  },

  aiWarning: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 18,
    color: c.textSecondary,
  },
});
