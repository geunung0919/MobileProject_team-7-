import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts, mapColors as m } from '../theme';

// 예시 지도 (그림). 실제 지도 SDK 를 붙이기 전까지 디자인을 그대로 보여 주는 용도입니다.
// 모든 좌표는 디자인 프레임(가로 400 x 세로 552) 기준이고, 화면 크기가 달라도
// 프레임이 지도 영역의 가운데에 오도록 놓습니다. children(핀 등)도 같은 좌표계를 씁니다.
const FRAME_W = 400;
const FRAME_H = 552;

const BLOCK_W = 66.5;
const BLOCK_H = 69;
const COL_PITCH = 82.5;
const ROW_PITCH = 76;
const BLOCK_X0 = 4.5;
const BLOCK_Y0 = 47;
const STREET_Y0 = 40;
const STREET_H = 7;

const ROAD_CENTER = { x: 200, y: 277 };
const ROAD_ANGLE = 55;
const ROAD_LENGTH = 1400;
const ROAD_WIDTH = 28;

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const COLS = range(-2, 6);
const ROWS = range(-2, 9);

// 한 번만 계산해 두는 블록/가로 도로 목록
const BLOCKS = ROWS.flatMap((r) =>
  COLS.map((c) => ({
    key: `${r}:${c}`,
    left: BLOCK_X0 + COL_PITCH * c,
    top: BLOCK_Y0 + ROW_PITCH * r,
  })),
);
const STREETS = ROWS.map((r) => ({ key: String(r), top: STREET_Y0 + ROW_PITCH * r }));

function RotatedLabel({ cx, cy, angle, children }) {
  return (
    <View
      style={[
        styles.rotatedWrap,
        { left: cx - 50, top: cy - 9, transform: [{ rotate: `${angle}deg` }] },
      ]}
    >
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

export default function MapCanvas({ children, style }) {
  const [size, setSize] = useState(null);

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const origin = size
    ? { left: (size.width - FRAME_W) / 2, top: (size.height - FRAME_H) / 2 }
    : null;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {origin ? (
        <View style={[styles.frame, origin]} pointerEvents="box-none">
          {/* 가로 도로 */}
          {STREETS.map((s) => (
            <View key={s.key} style={[styles.crossStreet, { top: s.top }]} />
          ))}

          {/* 건물 블록 */}
          {BLOCKS.map((b) => (
            <View key={b.key} style={[styles.block, { left: b.left, top: b.top }]} />
          ))}

          {/* 대각선 도로 2개 (X 자) */}
          <View style={[styles.road, { transform: [{ rotate: `${ROAD_ANGLE}deg` }] }]} />
          <View style={[styles.road, { transform: [{ rotate: `${-ROAD_ANGLE}deg` }] }]} />

          {/* 공원 (모양은 단순화) */}
          <View style={styles.park} />

          {/* 지명 */}
          <Text style={styles.areaLabel}>서교동</Text>
          <Text style={[styles.label, styles.parkLabel]}>서교근린공원</Text>
          <Text style={[styles.label, { left: 294.5, top: 285 }]}>홍익대학교</Text>
          <Text style={[styles.label, { left: 19.5, top: 327 }]}>서교동 주민센터</Text>
          <RotatedLabel cx={280} cy={137.5} angle={58}>홍익로</RotatedLabel>
          <RotatedLabel cx={83.5} cy={249.5} angle={-25}>잔다리로</RotatedLabel>

          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: m.street,
    overflow: 'hidden',
  },
  frame: {
    position: 'absolute',
    width: FRAME_W,
    height: FRAME_H,
  },
  crossStreet: {
    position: 'absolute',
    left: -400,
    width: 1200,
    height: STREET_H,
    backgroundColor: m.crossStreet,
  },
  block: {
    position: 'absolute',
    width: BLOCK_W,
    height: BLOCK_H,
    borderRadius: 2,
    backgroundColor: m.block,
  },
  road: {
    position: 'absolute',
    left: ROAD_CENTER.x - ROAD_LENGTH / 2,
    top: ROAD_CENTER.y - ROAD_WIDTH / 2,
    width: ROAD_LENGTH,
    height: ROAD_WIDTH,
    backgroundColor: m.road,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: m.roadBorder,
  },
  park: {
    position: 'absolute',
    left: 12,
    top: 30.5,
    width: 100,
    height: 115,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: m.parkBorder,
    backgroundColor: m.park,
  },
  areaLabel: {
    position: 'absolute',
    left: 231.5,
    top: 37,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 3,
    color: m.areaLabel,
  },
  labelText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: m.label,
  },
  label: {
    position: 'absolute',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: m.label,
  },
  parkLabel: {
    left: 35.5,
    top: 80,
    color: m.parkLabel,
  },
  rotatedWrap: {
    position: 'absolute',
    width: 100,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
