import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius } from '../theme';

export default function HeroCard({ label, badge, title, description }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.heroBg,
    borderRadius: radius.card,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.green,
  },
  badge: {
    backgroundColor: colors.badgeBg,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: -4,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.green,
  },
  title: {
    marginTop: 22,
    fontFamily: fonts.bold,
    fontSize: 25,
    lineHeight: 37,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 23,
    color: colors.textSecondary,
  },
});
