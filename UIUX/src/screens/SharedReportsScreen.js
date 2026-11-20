import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import SoftButton from '../components/SoftButton';
import RefreshButton from '../components/RefreshButton';
import { readDailyReports, generateDailyReport } from '../../../api/aiApi';
import { useAppData } from '../store/AppDataContext';
import { colors, spacing } from '../theme';

export default function SharedReportsScreen({ navigation }) {
  const { top, bottom } = useSafeAreaInsets();
  const { sharedUid } = useAppData();
  return <ScrollView contentContainerStyle={{ paddingTop: top + 12, paddingBottom: bottom + 24, paddingHorizontal: spacing.screenX, gap: 12 }}>
    <BackHeader title="생활 리포트" onBack={() => navigation.goBack()} />
    {sharedUid ? <Reports key={sharedUid} uid={sharedUid} /> :
      <SoftButton label="로그인" onPress={() => navigation.navigate('SharedLogin')} />}
  </ScrollView>;
}

function Reports({ uid }) {
  const [reports, setReports] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    run(false);
    return () => { alive.current = false; };
  }, [uid]);

  async function run(generate) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      if (generate) {
        const report = await generateDailyReport(uid);
        if (!alive.current) return;
        setPreview(report);
      }
      const data = await readDailyReports(uid);
      if (alive.current) setReports(data.reports);
    } catch (error) {
      if (alive.current) setMessage(error.message || '리포트를 불러오지 못했어요.');
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const items = preview && !(reports ?? []).some((row) => row.report_date === preview.report_date) ?
    [preview, ...(reports ?? [])] : reports ?? [];
  return <>
    <SoftButton label={busy ? '서버 확인 중…' : '오늘 리포트 불러오기'} onPress={() => run(true)} />
    <RefreshButton label="리포트 새로고침" onPress={() => run(false)} />
    {message ? <Text accessibilityRole="alert">{message}</Text> : null}
    {reports && items.length === 0 ? <Text>아직 저장된 리포트가 없어요.</Text> : null}
    {items.map((row) => <View key={row.report_date} style={{ backgroundColor: colors.cardBg, borderRadius: 12, padding: 14, gap: 6 }}>
      <Text>{row.report_date}{row.stale ? ' · 최신 생성 결과를 확인하지 못했어요.' : ''}</Text>
      <Text>{row.today_message}</Text>
      <Text>{row.expense_summary}</Text>
      <Text>{row.inventory_summary}</Text>
      <Text>{row.routine_summary}</Text>
      {(Array.isArray(row.actions) ? row.actions : []).map((action, index) => <Text key={index}>• {action}</Text>)}
    </View>)}
  </>;
}
