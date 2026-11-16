import React from 'react';
import { View, StyleSheet } from 'react-native';

// 도넛 차트 (12시 방향에서 시계 방향). react-native-svg 없이 작은 조각 View 를 원 둘레에 놓아 그립니다.
// segments: [{ value, color }] (value 는 금액이어도 됨), size: 지름, thickness: 고리 두께, children: 가운데 내용
const STEPS = 240; // 원을 나누는 조각 수 (많을수록 매끄럽지만 View 가 늘어남)

export default function DonutChart({ segments, size = 190, thickness = 27, children }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const center = size / 2;
  const midRadius = (size - thickness) / 2; // 고리 두께의 한가운데까지의 반지름
  const outerRadius = size / 2;
  const tickWidth = (2 * Math.PI * outerRadius) / STEPS + 0.8; // 바깥쪽 틈이 안 생기게 살짝 겹침

  // 각 조각이 어느 구간(segment)에 속하는지 정해서 색을 입힙니다.
  const ticks = [];
  for (let i = 0; i < STEPS; i++) {
    const fraction = (i + 0.5) / STEPS; // 0 ~ 1 (12시 방향이 0, 시계 방향)
    let acc = 0;
    let color = segments.length ? segments[segments.length - 1].color : 'transparent';
    for (const s of segments) {
      acc += total > 0 ? s.value / total : 0;
      if (fraction <= acc) {
        color = s.color;
        break;
      }
    }
    const angle = fraction * 2 * Math.PI;
    const x = center + midRadius * Math.sin(angle);
    const y = center - midRadius * Math.cos(angle);
    ticks.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: x - tickWidth / 2,
          top: y - thickness / 2,
          width: tickWidth,
          height: thickness,
          backgroundColor: color,
          transform: [{ rotate: `${angle}rad` }],
        }}
      />
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      {ticks}
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
