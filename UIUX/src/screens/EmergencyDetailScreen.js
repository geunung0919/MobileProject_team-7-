
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackHeader from '../components/BackHeader';
import {
  emergencyGuides,
  guideFooterNote,
} from '../data/lifeInfo/emergencyGuides';
import { colors, fonts, emergencyColors as c } from '../theme';

const SCREEN_X = 20;

export default function EmergencyDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const { id, title, tone } = route.params ?? {};
  const guide = emergencyGuides[id] ?? emergencyGuides.general;
  const isAccent = tone === 'accent';

  // sources 배열과 기존 source 객체를 모두 지원
  const sources = Array.isArray(guide.sources)
    ? guide.sources
    : guide.source
      ? [guide.source]
      : [];

  // 긴급 연락처 연결
  const handleCall = ({ number, label }) => {
    Alert.alert(`${number}에 전화할까요?`, label, [
      { text: '취소', style: 'cancel' },
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

  // 선택한 공식 자료 원문 열기
  const handleOpenSource = async (source) => {
    const url = source?.url;

    if (!url) {
      Alert.alert('안내', '등록된 공식 자료 링크가 없습니다.');
      return;
    }

    if (!/^https:\/\//i.test(url)) {
      Alert.alert('안내', '유효한 공식 자료 주소가 아닙니다.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        '페이지를 열 수 없습니다',
        '인터넷 연결이나 공식 자료 주소를 확인해 주세요.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: SCREEN_X,
        }}
      >
        {/* 상단 헤더 */}
        <BackHeader
          title={title ?? '상황별 대처'}
          color={c.text}
          onBack={() => navigation.goBack()}
        />

        {/* 상황 요약 */}
        <Text style={styles.summary}>
          {guide.summary}
        </Text>

        {/* 긴급 신고 버튼 */}
        {guide.call ? (
          <Pressable
            onPress={() => handleCall(guide.call)}
            accessibilityRole="button"
            accessibilityLabel={`${guide.call.number} ${guide.call.label} 전화 걸기`}
            style={({ pressed }) => [
              styles.callCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.callTexts}>
              <Text style={styles.callLabel}>
                {guide.call.label}
              </Text>

              <Text style={styles.callNumber}>
                {guide.call.number}
              </Text>
            </View>

            <View style={styles.callIcon}>
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={colors.white}
              />
            </View>
          </Pressable>
        ) : null}

        {/* 단계별 행동요령 */}
        <Text style={styles.sectionTitle}>
          이렇게 해 보세요
        </Text>

        {guide.steps.map((step, index) => (
          <View
            key={`${index}-${step.title}`}
            style={styles.stepRow}
          >
            <View
              style={[
                styles.stepBadge,
                isAccent && styles.stepBadgeAccent,
              ]}
            >
              <Text style={styles.stepNumber}>
                {index + 1}
              </Text>
            </View>

            <View style={styles.stepTexts}>
              <Text style={styles.stepTitle}>
                {step.title}
              </Text>

              <Text style={styles.stepBody}>
                {step.body}
              </Text>
            </View>
          </View>
        ))}

        {/* 주의사항 */}
        {guide.donts?.length ? (
          <View style={styles.dontCard}>
            <Text style={styles.dontTitle}>
              이건 피해 주세요
            </Text>

            {guide.donts.map((text, index) => (
              <View
                key={`${index}-${text}`}
                style={styles.dontRow}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={c.danger}
                />

                <Text style={styles.dontText}>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* 공식 참고 자료: 여러 개 표시 가능 */}
        {sources.length > 0 ? (
          <View style={styles.sourcesSection}>
            <View style={styles.sourceHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={c.text}
              />

              <Text style={styles.sourceHeading}>
                공식 참고 자료
              </Text>
            </View>

            {sources.map((source, index) => (
              <View
                key={`${index}-${source.url ?? source.title}`}
                style={[
                  styles.sourceCard,
                  index > 0 && styles.sourceCardNext,
                ]}
              >
                <Text style={styles.sourceOrganization}>
                  {source.organization}
                </Text>

                <Text style={styles.sourceTitle}>
                  {source.title}
                </Text>

                {source.description ? (
                  <Text style={styles.sourceDescription}>
                    {source.description}
                  </Text>
                ) : null}

                <Text style={styles.sourceDate}>
                  {source.verifiedAt
                    ? `마지막 확인일: ${source.verifiedAt}`
                    : '매뉴얼 전체 원문 대조 확인 전'}
                </Text>

                {source.url ? (
                  <Pressable
                    onPress={() => handleOpenSource(source)}
                    accessibilityRole="link"
                    accessibilityLabel={`${source.title} 원문 보기`}
                    style={({ pressed }) => [
                      styles.sourceButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.sourceButtonText}>
                      공식 원문 보기
                    </Text>

                    <Ionicons
                      name="open-outline"
                      size={18}
                      color={colors.white}
                    />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* 공통 안내 */}
        <Text style={styles.footer}>
          {guideFooterNote}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  pressed: {
    opacity: 0.8,
  },

  summary: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: c.textSecondary,
  },

  callCard: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.dangerBorder,
    backgroundColor: c.dangerBg,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  callTexts: {
    flex: 1,
  },

  callLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: c.textSecondary,
  },

  callNumber: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: c.danger,
  },

  callIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: c.text,
  },

  stepRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  stepBadgeAccent: {
    backgroundColor: c.accent,
  },

  stepNumber: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },

  stepTexts: {
    flex: 1,
    marginLeft: 14,
  },

  stepTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    color: c.text,
  },

  stepBody: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: c.textSecondary,
  },

  dontCard: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },

  dontTitle: {
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: c.danger,
  },

  dontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  dontText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: c.text,
  },

  // 공식 참고 자료 영역
  sourcesSection: {
    marginTop: 24,
  },

  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  sourceHeading: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: c.text,
  },

  sourceCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },

  sourceCardNext: {
    marginTop: 12,
  },

  sourceOrganization: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: c.text,
    marginBottom: 4,
  },

  sourceTitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: c.textSecondary,
  },

  sourceDescription: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: c.textSecondary,
  },

  sourceDate: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: c.textSecondary,
  },

  sourceButton: {
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: c.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  sourceButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },

  footer: {
    marginTop: 22,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: c.textSecondary,
  },
});
