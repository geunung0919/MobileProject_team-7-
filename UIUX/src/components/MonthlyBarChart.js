import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

const PLOT_HEIGHT = 140; // 0 ~ 최댓값 눈금까지의 높이
const TOP_SPACE = 26; // 막대 위 숫자가 들어갈 여백
const AXIS_WIDTH = 56; // 왼쪽 눈금 숫자 영역 (디자인 기준)

// 월별 막대 차트 (단위: 만원, 마지막 항목 강조). data: [{ month: 7, amount: 720000 }], tickStep: 눈금 간격 (기본 40)
export default function MonthlyBarChart({ data, tickStep = 40 }) {
  const values = data.map((d) => d.amount / 10000);
  const axisMax = Math.max(tickStep, Math.ceil(Math.max(...values) / tickStep) * tickStep);
  const ticks = [];
  for (let v = 0; v <= axisMax; v += tickStep) ticks.push(v);
  const lastIndex = data.length - 1;

  return (
    <View style={styles.wrapper}>
      {/* 눈금 + 가로선 */}
      {ticks.map((v) => (
        <View
          key={v}
          style={[styles.gridRow, { bottom: 30 + (v / axisMax) * PLOT_HEIGHT - 8 }]}
        >
          <Text style={styles.tick}>{v}</Text>
          <View style={styles.gridLine} />
        </View>
      ))}

      {/* 막대 */}
      <View style={styles.plot}>
        {data.map((d, i) => {
          const value = values[i];
          const active = i === lastIndex;
          const height = (value / axisMax) * PLOT_HEIGHT;
          return (
            <View key={d.month} style={styles.column}>
              <View style={styles.barArea}>
                <Text style={[styles.valueText, active && styles.activeValue, { bottom: height + 4 }]}>
                  {Number(value.toFixed(2))}
                </Text>
                <View style={[styles.bar, active && styles.activeBar, { height }]} />
              </View>
              <Text style={[styles.monthText, active && styles.activeMonth]}>{d.month}월</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: TOP_SPACE + PLOT_HEIGHT + 30,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tick: {
    width: AXIS_WIDTH,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.placeholder,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  plot: {
    position: 'absolute',
    left: AXIS_WIDTH,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  barArea: {
    width: '100%',
    height: TOP_SPACE + PLOT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 32,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: colors.progressTrack,
  },
  activeBar: {
    backgroundColor: colors.greenLight,
  },
  valueText: {
    position: 'absolute',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeValue: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
  monthText: {
    height: 30,
    paddingTop: 9,
    fontFamily: fonts.regular,
    fontSize: 15.5,
    color: colors.textSecondary,
  },
  activeMonth: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
});
