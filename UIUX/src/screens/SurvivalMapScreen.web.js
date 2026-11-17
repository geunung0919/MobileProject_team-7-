import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export default function SurvivalMapScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>생활지도</Text>
      <Text style={styles.message}>생활지도는 모바일 앱에서 이용할 수 있어요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.textPrimary },
  message: { marginTop: 10, color: colors.textSecondary },
});
