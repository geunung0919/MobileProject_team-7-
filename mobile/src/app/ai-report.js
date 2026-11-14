
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';

import {
  fetchTodayReport,
  fetchReports,
  fetchWeeklyReport,
} from '../../../UIUX/src/api/aiManager';

export default function AiReportScreen() {
  const [mode, setMode] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [history, setHistory] = useState(null);

  const load = async (type) => {
    if (loading) return;

    setMode(type);
    setLoading(true);
    setError('');

    try {
      if (type === 'daily') {
        const result = await fetchTodayReport();
        setDaily(result);
      }

      if (type === 'weekly') {
        const result = await fetchWeeklyReport();
        setWeekly(result);
      }

      if (type === 'history') {
        const result = await fetchReports();
        setHistory(result.reports ?? []);
      }
    } catch (err) {
      console.error(
        '[AI 리포트] 요청 실패:',
        err?.code || err?.message
      );

      setError(
        '리포트를 불러오지 못했어요. ' +
        'Firebase 연결을 확인해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        AI 생활 리포트
      </Text>

      <Text style={styles.subtitle}>
        자취 생활의 소비, 냉장고, 루틴을
        한눈에 확인해 보세요.
      </Text>

      <View style={styles.buttonGroup}>
        <ReportButton
          title="오늘의 리포트"
          onPress={() => load('daily')}
          selected={mode === 'daily'}
          disabled={loading}
        />

        <ReportButton
          title="지난주 리포트"
          onPress={() => load('weekly')}
          selected={mode === 'weekly'}
          disabled={loading}
        />

        <ReportButton
          title="지난 리포트"
          onPress={() => load('history')}
          selected={mode === 'history'}
          disabled={loading}
        />
      </View>

      {loading && (
        <View style={styles.card}>
          <ActivityIndicator color="#166b55" />
          <Text style={styles.muted}>
            리포트를 불러오는 중...
          </Text>
        </View>
      )}

      {!!error && (
        <View style={styles.card}>
          <Text style={styles.error}>
            {error}
          </Text>
        </View>
      )}

      {!loading && mode === 'daily' && (
        daily ? (
          <>
            <ReportCard
              title="오늘의 한마디"
              body={daily.today_message}
            />

            <ReportCard
              title="소비 요약"
              body={daily.expense_summary}
            />

            <ReportCard
              title="냉장고 요약"
              body={daily.inventory_summary}
            />

            <ReportCard
              title="생활 루틴"
              body={daily.routine_summary}
            />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                추천 행동
              </Text>

              {(daily.actions ?? []).map(
                (action, index) => (
                  <Text
                    key={index}
                    style={styles.text}
                  >
                    • {action}
                  </Text>
                )
              )}
            </View>

            {daily.stale && (
              <Text style={styles.muted}>
                AI 생성 결과가 아닌 이전 기록이나
                기본 안내가 표시되고 있어요.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.muted}>
            오늘의 리포트 버튼을 눌러 주세요.
          </Text>
        )
      )}

      {!loading && mode === 'weekly' && (
        weekly ? (
          <>
            <ReportCard
              title="주간 요약"
              body={weekly.text?.weekly_summary}
            />

            <ReportCard
              title="잘한 점"
              body={weekly.text?.good_point}
            />

            <ReportCard
              title="개선할 점"
              body={weekly.text?.improve_point}
            />

            <ReportCard
              title="다음 주 목표"
              body={weekly.text?.next_week_goal}
            />

            <Text style={styles.muted}>
              {weekly.ai
                ? 'AI 주간 리포트'
                : '기본 분석 리포트'}
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>
            지난주 리포트 버튼을 눌러 주세요.
          </Text>
        )
      )}

      {!loading && mode === 'history' && (
        history ? (
          history.length > 0 ? (
            history.map((report, index) => (
              <View
                key={`${report.report_date}-${index}`}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>
                  {report.report_date}
                </Text>

                <Text style={styles.text}>
                  {report.today_message}
                </Text>

                <Text style={styles.muted}>
                  {report.expense_summary}
                </Text>

                <Text style={styles.muted}>
                  {report.inventory_summary}
                </Text>

                <Text style={styles.muted}>
                  {report.routine_summary}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>
              아직 저장된 리포트가 없어요.
            </Text>
          )
        ) : (
          <Text style={styles.muted}>
            지난 리포트 버튼을 눌러 주세요.
          </Text>
        )
      )}

      <ReportButton
        title="통합 홈으로 돌아가기"
        onPress={() => router.replace('/home')}
        selected={false}
        disabled={loading}
      />
    </ScrollView>
  );
}

function ReportCard({ title, body }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.text}>
        {body || '표시할 데이터가 없어요.'}
      </Text>
    </View>
  );
}

function ReportButton({
  title,
  onPress,
  selected,
  disabled,
}) {
  return (
    <Text
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={[
        styles.button,
        selected && styles.selectedButton,
        disabled && styles.disabledButton,
      ]}
    >
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f7f5',
  },

  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#163d35',
  },

  subtitle: {
    fontSize: 15,
    color: '#567167',
  },

  buttonGroup: {
    gap: 8,
  },

  button: {
    backgroundColor: '#166b55',
    color: '#ffffff',
    padding: 14,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    overflow: 'hidden',
  },

  selectedButton: {
    backgroundColor: '#104c3d',
  },

  disabledButton: {
    opacity: 0.5,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166b55',
  },

  text: {
    fontSize: 15,
    lineHeight: 23,
    color: '#244a40',
  },

  muted: {
    fontSize: 14,
    lineHeight: 21,
    color: '#567167',
  },

  error: {
    fontSize: 15,
    color: '#ad3425',
  },
});
