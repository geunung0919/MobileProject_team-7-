import React from 'react';
import { View, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import SectionTitle from '../components/SectionTitle';
import MenuRow from '../components/MenuRow';
import IconBox from '../components/IconBox';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { moreData } from '../data/more/more';
import { colors, fonts, radius, spacing } from '../theme';

// 메뉴 id -> 이동할 화면 이름
const MENU_ROUTES = { profile: 'Profile', settings: 'Settings', help: 'Help' };

export default function MoreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { subtitle, accountSection, accountMenus, logoutLabel, lifeData, appSection, appMenus } =
    moreData;

  const openMenu = (id) => {
    const screen = MENU_ROUTES[id];
    if (screen) navigation.navigate(screen);
  };

  // TODO: 인증을 붙이면 확인 후 실제 로그아웃 처리를 연결하세요.
  const handleLogout = () => {
    Alert.alert('로그아웃할까요?', '', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <ScreenHeader title="더보기" subtitle={subtitle} />

        {/* 계정 관리 */}
        <SectionTitle style={styles.sectionTitle}>{accountSection}</SectionTitle>
        {accountMenus.map((menu) => (
          <MenuRow key={menu.id} {...menu} onPress={() => openMenu(menu.id)} />
        ))}

        {/* 로그아웃: 실제 로그아웃 동작은 인증 구현 후 연결 */}
        <Pressable
          onPress={handleLogout}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>{logoutLabel}</Text>
          <MaterialCommunityIcons name="logout" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* 생활 데이터 수정 카드 */}
        <Pressable
          onPress={() => {}}
          accessibilityRole="button"
          style={({ pressed }) => [styles.lifeCard, pressed && styles.pressed]}
        >
          <IconBox
            name={lifeData.icon}
            size={44}
            iconColor={colors.green}
            backgroundColor={colors.badgeBg}
          />
          <View style={styles.lifeTexts}>
            <Text style={styles.lifeTitle}>{lifeData.title}</Text>
            <Text style={styles.lifeDescription}>{lifeData.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.green} />
        </Pressable>

        {/* 앱 이용 안내 */}
        <SectionTitle style={[styles.sectionTitle, styles.sectionAfterCard]}>
          {appSection}
        </SectionTitle>
        {appMenus.map((menu) => (
          <MenuRow key={menu.id} {...menu} onPress={() => openMenu(menu.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionAfterCard: {
    marginTop: 30,
  },
  pressed: {
    opacity: 0.75,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // 아이콘 박스(42) + 간격(16) 만큼 들여써서 위 메뉴의 글자와 줄을 맞춥니다.
    paddingLeft: 58,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 20,
  },
  logoutText: {
    marginRight: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  lifeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.heroBg,
    borderRadius: radius.card,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  lifeTexts: {
    flex: 1,
    marginLeft: 16,
  },
  lifeTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  lifeDescription: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
