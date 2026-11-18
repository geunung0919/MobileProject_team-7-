import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import SectionTitle from '../components/SectionTitle';
import SettingSwitchRow from '../components/SettingSwitchRow';
import { useAppData } from '../store/AppDataContext';
import { settingsData } from '../data/more/account';
import { colors, fonts, spacing } from '../theme';

// 더보기 > 앱 설정
// TODO: 알림 스위치는 값만 저장합니다. 실제 푸시 알림은 expo-notifications 를 붙일 때 연결하세요.
export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { settings, updateSetting } = useAppData();
  const d = settingsData;

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

        <SectionTitle style={styles.sectionTitle}>{d.notifySection}</SectionTitle>
        {d.toggles.map((t, index) => (
          <SettingSwitchRow
            key={t.key}
            title={t.title}
            description={t.description}
            value={!!settings[t.key]}
            onValueChange={(v) => updateSetting(t.key, v)}
            showDivider={index < d.toggles.length - 1}
          />
        ))}

        <SectionTitle style={[styles.sectionTitle, styles.sectionNext]}>{d.infoSection}</SectionTitle>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{d.versionLabel}</Text>
          <Text style={styles.infoValue}>{d.version}</Text>
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
  sectionTitle: {
    marginBottom: 4,
  },
  sectionNext: {
    marginTop: 32,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  infoValue: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
