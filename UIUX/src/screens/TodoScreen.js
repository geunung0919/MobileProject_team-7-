import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import SummaryBanner from '../components/SummaryBanner';
import TodoRow from '../components/TodoRow';
import AddTodoSheet from '../components/AddTodoSheet';
import Fab from '../components/Fab';
import { todoData } from '../data/lifeInfo/todos';
import { useAppData } from '../store/AppDataContext';
import {
  daysBetween,
  toDateString,
  formatKoreanDateWithYear,
  formatKoreanMonthDay,
} from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// 마감 안내 글자와 색상 톤을 정합니다.
function getDueInfo(item) {
  if (item.due === null) {
    return { text: item.done ? '기한 없음 · 완료' : '기한 없음', tone: 'normal' };
  }
  const monthDay = formatKoreanMonthDay(item.due);
  if (item.done) return { text: `${monthDay}까지 · 완료`, tone: 'normal' };
  if (item.daysLeft < 0) return { text: `${monthDay}까지 · ${-item.daysLeft}일 지남`, tone: 'overdue' };
  if (item.daysLeft === 0) return { text: '오늘까지', tone: 'today' };
  if (item.daysLeft === 1) return { text: '내일까지', tone: 'normal' };
  return { text: `${monthDay}까지`, tone: 'normal' };
}

export default function TodoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const baseDate = toDateString(now); // 기준일 = 오늘

  // 할 일 목록은 공용 저장소(AppDataContext)에 있어 화면을 나갔다 와도 유지되고 홈에도 반영됩니다.
  // TODO: 서버 연결은 store/AppDataContext.js 의 addTodo / toggleTodo 안에서 하세요.
  const { todos: items, addTodo, toggleTodo: toggleDone } = useAppData();
  const [addVisible, setAddVisible] = useState(false);

  const { remaining, completed } = useMemo(() => {
    const enriched = items.map((item) => {
      const due = item.due ?? null; // 마감일이 없으면 null
      const daysLeft = due ? daysBetween(baseDate, due) : null;
      return { ...item, due, daysLeft };
    });
    return {
      // 마감일 가까운 순. 기한 없는 할 일은 맨 아래.
      remaining: enriched
        .filter((i) => !i.done)
        .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity)),
      completed: enriched.filter((i) => i.done),
    };
  }, [items, baseDate]);

  const todayCount = remaining.filter((i) => i.daysLeft === 0).length;

  const renderRow = (item) => {
    const { text, tone } = getDueInfo(item);
    return (
      <TodoRow
        key={item.id}
        title={item.title}
        subText={text}
        tone={tone}
        overdue={tone === 'overdue'}
        done={item.done}
        onToggle={() => toggleDone(item.id)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <BackHeader title="할 일" onBack={() => navigation.goBack()} />

        {/* 오늘 요약 */}
        <SummaryBanner
          label={formatKoreanDateWithYear(now)}
          title={
            todayCount > 0 ? `오늘까지 할 일이 ${todayCount}개 있어요` : '오늘까지 할 일이 없어요'
          }
          description="작은 일도 하나씩, 끝내면 체크해 주세요."
        />

        {/* 남은 할 일 */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>남은 할 일</Text>
            <Text style={[styles.sectionCount, styles.countGreen]}>{remaining.length}</Text>
          </View>
          <Text style={styles.sortText}>{todoData.sortLabel}</Text>
        </View>
        {remaining.length > 0 ? (
          remaining.map(renderRow)
        ) : (
          <Text style={styles.emptyText}>남은 할 일이 없어요.</Text>
        )}

        {/* 완료한 할 일 */}
        {completed.length > 0 ? (
          <>
            <View style={[styles.sectionRow, styles.completedHeader]}>
              <View style={styles.sectionLeft}>
                <Text style={styles.sectionTitle}>완료한 할 일</Text>
                <Text style={[styles.sectionCount, styles.countGray]}>{completed.length}</Text>
              </View>
            </View>
            {completed.map(renderRow)}
          </>
        ) : null}
      </ScrollView>

      <Fab hasTabBar={false} accessibilityLabel="할 일 추가" onPress={() => setAddVisible(true)} />

      <AddTodoSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onSubmit={addTodo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedHeader: {
    marginTop: 16,
    marginBottom: 0,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  sectionCount: {
    marginLeft: 8,
    fontSize: 18,
  },
  countGreen: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
  countGray: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  sortText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    paddingVertical: 28,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
