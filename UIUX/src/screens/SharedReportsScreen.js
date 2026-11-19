import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import BackHeader from '../components/BackHeader';
import SoftButton from '../components/SoftButton';
import { readDailyReports, generateDailyReport } from '../../../api/aiApi';
import { fetchWeeklyReport } from '../api/aiManager';
import { useAppData } from '../store/AppDataContext';
import { formatNumber } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// 더보기 > 내 생활 리포트 (Firebase 모드)
// - 오늘: 서버 AI(generateDailyReport)가 소비·냉장고·루틴을 보고 쓴 하루 리포트 + 저장된 지난 리포트
// - 주간: 지난주(월~일) 숫자 요약 + AI 한 줄 평 (generateWeeklyReport)
export default function SharedReportsScreen({ navigation }) {
  const { top, bottom } = useSafeAreaInsets();
  const { sharedUid } = useAppData();
  const [tab, setTab] = useState('daily');
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: top + 14, paddingBottom: bottom + 32, paddingHorizontal: spacing.screenX }}
    >
      <BackHeader title="생활 리포트" subtitle="AI 가 내 소비·냉장고·루틴 기록을 정리해 줘요." onBack={() => navigation.goBack()} />
      {sharedUid ? (
        <>
          <View style={styles.tabs} accessibilityRole="tablist">
            {[['daily', '오늘 리포트'], ['weekly', '주간 리포트']].map(([id, label]) => (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === id }}
                onPress={() => setTab(id)}
                style={[styles.tab, tab === id && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {tab === 'daily' ? <DailyReports key={sharedUid} uid={sharedUid} /> : <WeeklyReport key={sharedUid} />}
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.body}>로그인하면 내 기록으로 만든 리포트를 볼 수 있어요.</Text>
          <SoftButton label="로그인" onPress={() => navigation.navigate('SharedLogin')} />
        </View>
      )}
    </ScrollView>
  );
}

function Section({ icon, label, text }) {
  if (!text) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.green} />
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

function DailyReports({ uid }) {
  const [reports, setReports] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true); // 처음엔 저장된 리포트를 읽는 중
  const lock = useRef(false);
  const alive = useRef(false);

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

  // 화면이 열리면 저장된 리포트만 읽습니다 (결과는 응답이 온 뒤에만 반영).
  useEffect(() => {
    alive.current = true;
    lock.current = true;
    readDailyReports(uid)
      .then((data) => { if (alive.current) setReports(data.reports); })
      .catch((error) => { if (alive.current) setMessage(error.message || '리포트를 불러오지 못했어요.'); })
      .finally(() => {
        lock.current = false;
        if (alive.current) setBusy(false);
      });
    return () => { alive.current = false; };
  }, [uid]);

  const items = preview && !(reports ?? []).some((row) => row.report_date === preview.report_date)
    ? [preview, ...(reports ?? [])] : reports ?? [];

  return (
    <>
      <SoftButton icon="star-four-points-outline" label={busy ? 'AI 가 정리하는 중…' : '오늘 리포트 만들기'} onPress={() => run(true)} />
      <Pressable accessibilityRole="button" onPress={() => run(false)} style={styles.linkButton}>
        <MaterialCommunityIcons name="refresh" size={16} color={colors.green} />
        <Text style={styles.linkText}>저장된 리포트 새로고침</Text>
      </Pressable>
      {busy && !reports ? <ActivityIndicator style={{ marginTop: 16 }} color={colors.green} /> : null}
      {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
      {reports && items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.body}>{'아직 저장된 리포트가 없어요. "오늘 리포트 만들기"를 눌러 보세요.'}</Text>
        </View>
      ) : null}
      {items.map((row) => (
        <View key={row.report_date} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.date}>{row.report_date}</Text>
            {row.stale ? <Text style={styles.stale}>최신 결과 확인 못 함</Text> : null}
          </View>
          {row.today_message ? <Text style={styles.headline}>{row.today_message}</Text> : null}
          <Section icon="wallet-outline" label="소비" text={row.expense_summary} />
          <Section icon="fridge-outline" label="냉장고" text={row.inventory_summary} />
          <Section icon="calendar-check-outline" label="루틴" text={row.routine_summary} />
          {(Array.isArray(row.actions) ? row.actions : []).length > 0 ? (
            <View style={styles.actions}>
              {row.actions.map((action, index) => (
                <View key={index} style={styles.actionChip}>
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </>
  );
}

function Stat({ label, value, sub }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function WeeklyReport() {
  const [state, setState] = useState({ status: 'loading', data: null, message: '' });
  const request = useRef(0);

  const load = (force) => {
    const id = ++request.current;
    fetchWeeklyReport({ force })
      .then((data) => { if (id === request.current) setState({ status: 'ok', data, message: '' }); })
      .catch((error) => {
        if (id === request.current) setState((prev) => ({ ...prev, status: 'error', message: error?.message || '주간 리포트를 불러오지 못했어요.' }));
      });
  };

  useEffect(() => {
    load(false);
    return () => { request.current += 1; };
  }, []);

  const { status, data, message } = state;
  const s = data?.stats;
  const text = data?.text;
  const change = s?.change_percent;
  return (
    <>
      {status === 'loading' ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.body}>지난주 기록을 정리하는 중…</Text>
        </View>
      ) : null}
      {status === 'error' ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
      {data ? (
        <View style={styles.card}>
          <Text style={styles.date}>{s?.week_start ?? data.week_start} ~ {s?.week_end ?? ''}</Text>
          {text?.weekly_summary ? <Text style={styles.headline}>{text.weekly_summary}</Text> : null}
          {s ? (
            <View style={styles.stats}>
              <Stat
                label="지출"
                value={`${formatNumber(s.spent_total ?? 0)}원`}
                sub={change == null ? null : change === 0 ? '지난주와 같음' : `지난주 대비 ${change > 0 ? '▲' : '▼'} ${Math.abs(change)}%`}
              />
              <Stat label="루틴" value={s.routine_percent == null ? '기록 없음' : `${s.routine_percent}%`}
                sub={s.routine_due ? `${s.routine_done ?? 0} / ${s.routine_due}회` : null} />
              <Stat label="요리" value={s.cooked_count == null ? '기록 없음' : `${s.cooked_count}번`} />
              <Stat label="폐기" value={s.wasted_count == null ? '기록 없음' : `${s.wasted_count}개`} />
            </View>
          ) : null}
          <Section icon="thumb-up-outline" label="잘한 점" text={text?.good_point} />
          <Section icon="lightbulb-on-outline" label="아쉬운 점" text={text?.improve_point} />
          <Section icon="flag-outline" label="다음 주 목표" text={text?.next_week_goal} />
          {data.ai === false ? <Text style={styles.stale}>AI 문장 대신 기본 문장으로 보여 드려요.</Text> : null}
        </View>
      ) : null}
      {status !== 'loading' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => { setState((prev) => ({ ...prev, status: 'loading' })); load(true); }}
          style={styles.linkButton}
        >
          <MaterialCommunityIcons name="refresh" size={16} color={colors.green} />
          <Text style={styles.linkText}>주간 리포트 새로 만들기</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', backgroundColor: colors.cardBg, borderRadius: 16, padding: 4, marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
  tabTextActive: { fontFamily: fonts.bold, color: colors.green },
  card: { marginTop: 14, padding: 18, borderRadius: 20, backgroundColor: colors.cardBg, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  stale: { fontFamily: fonts.regular, fontSize: 12, color: colors.warnText },
  headline: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 25, color: colors.textPrimary },
  section: { gap: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.textPrimary },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  actionChip: { backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  actionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.green },
  linkButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 4, paddingVertical: 12 },
  linkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.green },
  error: { marginTop: 10, fontFamily: fonts.medium, color: colors.warnText },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 14, padding: 12, gap: 2 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  statValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.textPrimary },
  statSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
});
