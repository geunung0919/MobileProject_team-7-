
import React from 'react';
import './firebase/firebaseConfig';

import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  useFonts,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
} from '@expo-google-fonts/noto-sans-kr';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 기존 지도 및 생활안전 화면
import SurvivalMapScreen from './UIUX/src/screens/SurvivalMapScreen';
import EmergencyScreen from './UIUX/src/screens/EmergencyScreen';
import EmergencyDetailScreen from './UIUX/src/screens/EmergencyDetailScreen';

// 기존 AI 채팅 화면 (유지)
import EmergencyAIChatScreen from './UIUX/src/screens/EmergencyAIChatScreen';

// 정진혁 AI 채팅 화면
import EmergencyAiScreen from './UIUX/src/screens/EmergencyAiScreen';

// Firebase 로그인 테스트 화면
import AuthTestScreen from './AuthTestScreen';

const Stack = createNativeStackNavigator();

// 개발 시작 화면
// 'emergency', 'map', 'auth'
const DEV_SCREEN = 'emergency';

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
        }}
      />
    );
  }

  const initialScreen =
    DEV_SCREEN === 'map'
      ? 'SurvivalMap'
      : DEV_SCREEN === 'auth'
        ? 'AuthTest'
        : 'Emergency';

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialScreen}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* 비상 매뉴얼 메인 */}
          <Stack.Screen
            name="Emergency"
            component={EmergencyScreen}
          />

          {/* 비상 매뉴얼 상세 */}
          <Stack.Screen
            name="EmergencyDetail"
            component={EmergencyDetailScreen}
          />

          {/* 정진혁 비상 매뉴얼 AI */}
          <Stack.Screen
            name="EmergencyAi"
            component={EmergencyAiScreen}
          />

          {/* 기존 AI 채팅 화면 유지 */}
          <Stack.Screen
            name="EmergencyAIChat"
            component={EmergencyAIChatScreen}
          />

          {/* 지도 화면 */}
          <Stack.Screen
            name="SurvivalMap"
            component={SurvivalMapScreen}
          />

          {/* 로그인 테스트 화면 */}
          <Stack.Screen
            name="AuthTest"
            component={AuthTestScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
