import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoutineAlerts } from '../features/routine/RoutineAlerts';
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
  const { settings, updateSetting, sharedReceipts, sharedUid } = useAppData();
  const d = settingsData;
  const alerts = useRoutineAlerts();

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
        {sharedReceipts ? (
          alerts?.supported && sharedUid ? <>
            <SettingSwitchRow title="이 기기의 루틴 알림" description="생활 루틴에서 선택한 시간에 알려줘요."
              value={alerts.enabled === true} onValueChange={() => alerts.toggle()} />
            {alerts.status ? <Text>{alerts.status}</Text> : null}
          </> : <Text>{sharedUid ? '루틴 알림은 모바일 앱에서 설정할 수 있어요.' : '로그인 후 모바일 앱에서 루틴 알림을 설정할 수 있어요.'}</Text>
        ) : d.toggles.map((t, index) => (
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
