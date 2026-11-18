import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import Text from '../components/AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import SectionTitle from '../components/SectionTitle';
import MenuRow from '../components/MenuRow';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseConfig';
import { useAppData } from '../store/AppDataContext';
import SoftButton from '../components/SoftButton';
import IconBox from '../components/IconBox';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { confirmAction } from '../utils/confirm';
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

  const { sharedReceipts, sharedUid } = useAppData();
  const [confirmUid, setConfirmUid] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // 서버(Firebase) 연결 모드의 로그아웃
  const handleSharedLogout = async () => {
    if (!sharedUid || auth.currentUser?.uid !== sharedUid || busy) return;
    setBusy(true);
    setError('');
    try {
      await signOut(auth);
      setConfirmUid(null);
    } catch (err) {
      setError(err.message || '로그아웃하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  // 확인 후 첫 화면(Welcome)으로 돌아갑니다. TODO: 인증을 붙이면 실제 로그아웃 처리(토큰 삭제 등)를 함께 연결하세요.
  const handleLogout = () => {
    confirmAction({
      title: '로그아웃할까요?',
      confirmLabel: '로그아웃',
      destructive: true,
      onConfirm: () =>
        (navigation.getParent() ?? navigation).dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
        ),
    });
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

        {sharedReceipts ? <>
          {!sharedUid ? <SoftButton label="로그인" onPress={() => navigation.navigate('SharedLogin')} /> :
            confirmUid === sharedUid ? <View style={{ gap: 8 }}>
              <Text>이 기기에서 로그아웃할까요?</Text>
              <SoftButton label={busy ? '로그아웃 중…' : '로그아웃 확인'} onPress={handleSharedLogout} />
              <SoftButton label="취소" onPress={() => !busy && setConfirmUid(null)} />
            </View> : <SoftButton label={logoutLabel} onPress={() => setConfirmUid(sharedUid)} />}
          {error ? <Text accessibilityRole="alert">{error}</Text> : null}
          <SoftButton label="내 생활 리포트" onPress={() => navigation.navigate('SharedReports')} />
        </> : (
          /* 더미 모드: 첫 화면(Welcome)으로 돌아감 */
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}
          >
            <Text style={styles.logoutText}>{logoutLabel}</Text>
            <MaterialCommunityIcons name="logout" size={20} color={colors.textSecondary} />
          </Pressable>
        )}

        {/* 생활 데이터 수정 카드 */}
        <Pressable
          onPress={() => navigation.navigate(sharedReceipts ? (sharedUid ? 'SharedOnboarding' : 'SharedLogin') : 'LifeData')}
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
            <Text style={styles.lifeTitle}>{sharedReceipts ? '내 생활 설정' : lifeData.title}</Text>
            <Text style={styles.lifeDescription}>{sharedReceipts ? '기본 월 예산과 요리 환경을 설정해요.' : lifeData.description}</Text>
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
