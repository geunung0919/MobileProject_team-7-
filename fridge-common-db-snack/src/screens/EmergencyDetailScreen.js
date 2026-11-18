import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import { emergencyGuides, guideFooterNote } from '../data/lifeInfo/emergencyGuides';
import { colors, fonts, emergencyColors as c } from '../theme';

// 비상매뉴얼 > 상황별 대처. params: { id, title, tone } (id 를 모르면 "일반 대처"(general) 안내를 보여 줍니다)
const SCREEN_X = 20;

export default function EmergencyDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id, title, tone } = route.params ?? {};
  const guide = emergencyGuides[id] ?? emergencyGuides.general;
  const isAccent = tone === 'accent';

  const handleCall = ({ number, label }) => {
    Alert.alert(`${number}에 전화할까요?`, label, [
      { text: '취소', style: 'cancel' },
      { text: '전화 걸기', onPress: () => Linking.openURL(`tel:${number}`) },
    ]);
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
        <BackHeader
          title={title ?? '상황별 대처'}
          color={c.text}
          onBack={() => navigation.goBack()}
        />

        <Text style={styles.summary}>{guide.summary}</Text>

        {guide.call ? (
          <Pressable
            onPress={() => handleCall(guide.call)}
            accessibilityRole="button"
            accessibilityLabel={`${guide.call.number} ${guide.call.label} 전화 걸기`}
            style={({ pressed }) => [styles.callCard, pressed && styles.pressed]}
          >
            <View style={styles.callTexts}>
              <Text style={styles.callLabel}>{guide.call.label}</Text>
              <Text style={styles.callNumber}>{guide.call.number}</Text>
            </View>
            <View style={styles.callIcon}>
              <MaterialCommunityIcons name="phone" size={24} color={colors.white} />
            </View>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>이렇게 해 보세요</Text>
        {guide.steps.map((step, index) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={[styles.stepBadge, isAccent && styles.stepBadgeAccent]}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
            <View style={styles.stepTexts}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}

        {guide.donts?.length ? (
          <View style={styles.dontCard}>
            <Text style={styles.dontTitle}>이건 피해 주세요</Text>
            {guide.donts.map((text) => (
              <View key={text} style={styles.dontRow}>
                <Ionicons name="close-circle" size={18} color={c.danger} />
                <Text style={styles.dontText}>{text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>{guideFooterNote}</Text>
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
    opacity: 0.85,
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
  footer: {
    marginTop: 22,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: c.textSecondary,
  },
});
