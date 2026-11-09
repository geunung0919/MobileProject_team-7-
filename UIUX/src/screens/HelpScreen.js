import React, { useState } from 'react';
import { View, ScrollView, Pressable, Linking, Alert, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import SectionTitle from '../components/SectionTitle';
import SummaryBanner from '../components/SummaryBanner';
import PrimaryButton from '../components/PrimaryButton';
import { helpData } from '../data/more/account';
import { colors, fonts, spacing } from '../theme';

// 더보기 > 도움말 (자주 묻는 질문 + 메일 문의)
export default function HelpScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const d = helpData;
  const [openId, setOpenId] = useState(null); // 한 번에 하나만 펼쳐집니다.

  const handleContact = () => {
    Linking.openURL(`mailto:${d.contactEmail}`).catch(() =>
      Alert.alert('메일 앱을 열 수 없어요', `${d.contactEmail} 로 문의해 주세요.`),
    );
  };

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
        <BackHeader title={d.title} subtitle={d.subtitle} onBack={() => navigation.goBack()} />

        <SectionTitle style={styles.sectionTitle}>{d.faqSection}</SectionTitle>
        {d.faqs.map((faq) => {
          const open = openId === faq.id;
          return (
            <View key={faq.id} style={styles.faq}>
              <Pressable
                onPress={() => setOpenId(open ? null : faq.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={({ pressed }) => [styles.question, pressed && styles.pressed]}
              >
                <Text style={styles.questionText}>{faq.q}</Text>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
              {open ? <Text style={styles.answer}>{faq.a}</Text> : null}
            </View>
          );
        })}

        <SectionTitle style={[styles.sectionTitle, styles.sectionNext]}>{d.contactSection}</SectionTitle>
        <SummaryBanner label="궁금한 점이 남았나요?" title={d.contactDescription} description={d.contactEmail} />
        <PrimaryButton label={d.contactLabel} onPress={handleContact} style={styles.contactButton} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionNext: {
    marginTop: 32,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  faq: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  questionText: {
    flex: 1,
    marginRight: 12,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  answer: {
    paddingBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  contactButton: {
    marginTop: 16,
  },
});
