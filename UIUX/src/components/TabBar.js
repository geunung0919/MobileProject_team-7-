import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

// 라우트 이름 -> 라벨/아이콘 (탭을 바꿀 때 여기만 수정)
const TAB_CONFIG = {
  Home: { label: '홈', Icon: Ionicons, name: 'home' },
  Spending: { label: '소비', Icon: MaterialCommunityIcons, name: 'receipt-text-outline' },
  Fridge: { label: '냉장고', Icon: MaterialCommunityIcons, name: 'fridge-outline' },
  LifeInfo: { label: '생활정보', Icon: MaterialCommunityIcons, name: 'message-text-outline' },
  More: { label: '더보기', Icon: MaterialCommunityIcons, name: 'dots-horizontal' },
};

// 탭 버튼이 없는 화면 -> 활성으로 표시할 탭 (예: 비상매뉴얼은 생활정보 탭)
const PARENT_TAB = {
  Emergency: 'LifeInfo',
  SurvivalMap: 'LifeInfo',
};

// react-navigation 의 tabBar prop 으로 전달되는 커스텀 탭 바
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const currentName = state.routes[state.index].name;
  const activeTab = PARENT_TAB[currentName] ?? currentName;

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route) => {
          const config = TAB_CONFIG[route.name];
          if (!config) return null;
          const focused = route.name === activeTab;
          const { Icon } = config;
          const iconName = focused ? config.name : config.nameOff || config.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            // 하위 화면(비상매뉴얼)에서 부모 탭을 누르면 탭의 첫 화면으로 돌아갑니다.
            if (route.name !== currentName && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={config.label}
              style={styles.tabSlot}
            >
              <View style={[styles.tab, focused && styles.tabActive]}>
                <Icon
                  name={iconName}
                  size={28}
                  color={focused ? colors.greenLight : colors.tabInactive}
                />
                <Text style={[styles.label, focused && styles.labelActive]}>{config.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// 떠 있는 탭 바의 높이 (스크롤 영역 하단 여백 계산용)
export const TAB_BAR_HEIGHT = 68;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    backgroundColor: colors.white,
    borderRadius: 34,
    shadowColor: '#1F3A30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    width: 70,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.tabActiveBg,
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.tabInactive,
  },
  labelActive: {
    color: colors.greenLight,
  },
});
