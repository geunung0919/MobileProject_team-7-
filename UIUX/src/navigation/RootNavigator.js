
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  View,
} from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../../../firebase/firebaseConfig';

// 메인 탭
import TabNavigator from './TabNavigator';

// Firebase 로그인 및 연규 최신 UIUX
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import LifeDataScreen from '../screens/LifeDataScreen';
import FridgeCloudDiscardScreen from '../screens/FridgeCloudDiscardScreen';
import FridgeShoppingScreen from '../screens/FridgeShoppingScreen';

// 기존 로그인 테스트
import AuthTestScreen from '../../../AuthTestScreen';

// 소비 관련
import ManualEntryScreen from '../screens/ManualEntryScreen';
import ReceiptResultScreen from '../screens/ReceiptResultScreen';
import SpendingAnalysisScreen from '../screens/SpendingAnalysisScreen';
import SpendingDetailScreen from '../screens/SpendingDetailScreen';
import SpendingAllScreen from '../screens/SpendingAllScreen';


// 냉장고 관련
import FridgeAddScreen from '../screens/FridgeAddScreen';
import FridgeDiscardScreen from '../screens/FridgeDiscardScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import FridgeUseScreen from '../screens/FridgeUseScreen';
import RecipeShoppingBridgeScreen from '../screens/RecipeShoppingBridgeScreen';
import FridgeMealScreen from '../screens/FridgeMealScreen';
import FridgeMealInventoryScreen from '../screens/FridgeMealInventoryScreen';
import FridgeExpiryAlertScreen from '../screens/FridgeExpiryAlertScreen';

// 루틴 / 할 일
import TodoScreen from '../screens/TodoScreen';
import RoutineScreen from '../screens/RoutineScreen';

// 비상 매뉴얼
import EmergencyDetailScreen from '../screens/EmergencyDetailScreen';
import EmergencyAiScreen from '../screens/EmergencyAiScreen';

// AI 자취매니저
import AiManagerScreen from '../screens/AiManagerScreen';

// 연규 최신 UIUX 리포트
import ReportListScreen from '../screens/ReportListScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';

// 선웅 공용 Firestore 기능
import SharedOnboardingScreen from '../screens/SharedOnboardingScreen';
import SharedReportsScreen from '../screens/SharedReportsScreen';
import SharedReceiptScreen from '../screens/SharedReceiptScreen';

// 더보기
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // Firebase 로그인 상태
  const [authReady, setAuthReady] = useState(false);
  const [initialUser, setInitialUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log(
          '[Auth] 로그인 상태:',
          user ? '로그인됨' : '로그아웃됨'
        );

        if (!authReady) {
          setInitialUser(user);
          setAuthReady(true);
        }
      },
      (error) => {
        console.error(
          '[Auth] 인증 상태 확인 실패:',
          error?.code || error?.message
        );

        setAuthReady(true);
      }
    );

    return unsubscribe;
  }, []);

  // Firebase가 로그인 정보를 확인할 때까지 로딩
  if (!authReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#26784F"
        />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialUser ? 'Tabs' : 'Login'}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* 로그인 및 회원가입 */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />

      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
      />

      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
      />

      {/* 메인 홈 */}
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
      />

      {/* 기존 Firebase 로그인 테스트 */}
      <Stack.Screen
        name="SharedLogin"
        component={AuthTestScreen}
      />

      {/* 공용 DB 및 온보딩 */}
      <Stack.Screen
        name="SharedOnboarding"
        component={SharedOnboardingScreen}
      />

      <Stack.Screen
        name="SharedReports"
        component={SharedReportsScreen}
      />

      <Stack.Screen
        name="SharedReceipt"
        component={SharedReceiptScreen}
      />

      {/* 소비 관련 */}
      <Stack.Screen
        name="ManualEntry"
        component={ManualEntryScreen}
      />

      <Stack.Screen
        name="ReceiptResult"
        component={ReceiptResultScreen}
      />

      <Stack.Screen
        name="SpendingAnalysis"
        component={SpendingAnalysisScreen}
      />

      <Stack.Screen
        name="SpendingDetail"
        component={SpendingDetailScreen}
      />

      <Stack.Screen
        name="SpendingAll"
        component={SpendingAllScreen}
      />

      {/* 냉장고 관련 */}
      <Stack.Screen
        name="FridgeAdd"
        component={FridgeAddScreen}
      />

      <Stack.Screen
        name="FridgeDiscard"
        component={FridgeDiscardScreen}
      />

      <Stack.Screen
        name="RecipeList"
        component={RecipeListScreen}
      />

      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
      />

      {/* 루틴 / 할 일 */}
      <Stack.Screen
        name="Todo"
        component={TodoScreen}
      />

      <Stack.Screen
        name="Routine"
        component={RoutineScreen}
      />

      {/* 비상 매뉴얼 */}
      <Stack.Screen
        name="EmergencyDetail"
        component={EmergencyDetailScreen}
      />

      <Stack.Screen
        name="EmergencyAi"
        component={EmergencyAiScreen}
      />

      {/* AI 자취매니저 */}
      <Stack.Screen
        name="AiManager"
        component={AiManagerScreen}
      />

      {/* AI 리포트 */}
      <Stack.Screen
        name="ReportList"
        component={ReportListScreen}
      />

      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
      />

      {/* 더보기 */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
      />

      <Stack.Screen
        name="LifeData"
        component={LifeDataScreen}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />

      <Stack.Screen
        name="Help"
        component={HelpScreen}
      />
      <Stack.Screen
        name="FridgeUse"
        component={FridgeUseScreen}
      />
      <Stack.Screen
        name="FridgeCloudDiscard"
        component={FridgeCloudDiscardScreen}
      />
      <Stack.Screen
        name="FridgeShopping"
        component={FridgeShoppingScreen}
      />
      <Stack.Screen
        name="RecipeShoppingBridge"
        component={RecipeShoppingBridgeScreen}
      />
      <Stack.Screen
        name="FridgeMeal"
        component={FridgeMealScreen}
      />
      <Stack.Screen
        name="FridgeMealInventory"
        component={FridgeMealInventoryScreen}
      />
      <Stack.Screen
        name="FridgeExpiryAlert"
        component={FridgeExpiryAlertScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
