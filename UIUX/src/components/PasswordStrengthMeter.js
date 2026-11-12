import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';
import { passwordStrength } from '../utils/authRules';

// 비밀번호 강도 막대 (4칸) + 등급 글자 + 고칠 점 한 줄. 색만으로 구분하지 않도록 등급을 글자로도 보여 줍니다.
const LEVEL_COLOR = { weak: colors.danger, fair: colors.warnText, good: colors.accent, strong: colors.green };

export default function PasswordStrengthMeter({ password, loginId }) {
  const { score, level, label, tips } = passwordStrength(password, loginId);
  if (level === 'empty') return null;
  const color = LEVEL_COLOR[level];
  const filled = Math.max(1, score);
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`비밀번호 강도 ${label}`} accessibilityLiveRegion="polite">
      <View style={styles.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < filled ? color : colors.divider }]} />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>비밀번호 강도: {label}</Text>
      {tips[0] ? <Text style={styles.tip}>{tips[0]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  label: { marginTop: 6, fontFamily: fonts.bold, fontSize: 14 },
  tip: { marginTop: 2, fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
});
