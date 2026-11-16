import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBar from '../components/TabBar';
import HomeScreen from '../screens/HomeScreen';
import SpendingScreen from '../screens/SpendingScreen';
import FridgeScreen from '../screens/FridgeScreen';
import LifeInfoScreen from '../screens/LifeInfoScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import SurvivalMapScreen from '../screens/SurvivalMapScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator();

// 탭 5개와, 탭 바는 보이지만 탭 버튼은 없는 하위 화면
export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="history"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Spending" component={SpendingScreen} />
      <Tab.Screen name="Fridge" component={FridgeScreen} />
      <Tab.Screen name="LifeInfo" component={LifeInfoScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
      {/* 활성 탭은 TabBar 의 PARENT_TAB 에서 지정 */}
      <Tab.Screen name="Emergency" component={EmergencyScreen} />
      <Tab.Screen name="SurvivalMap" component={SurvivalMapScreen} />
    </Tab.Navigator>
  );
}
