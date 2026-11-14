
import React from 'react';
import { Stack } from 'expo-router';

import ReminderObserver from '../features/fridge/components/ReminderObserver';
import { SessionProvider } from '../state/Session';

export default function Layout() {
  return (
    <SessionProvider>
      <ReminderObserver />

      <Stack
        screenOptions={{
          headerTintColor: '#166b55',
          headerTitle: '자취 생존 AI',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: '개발 서버 연결' }}
        />

        <Stack.Screen
          name="home"
          options={{ title: '자취생존 AI 홈' }}
        />

        <Stack.Screen
          name="map"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="emergency"
          options={{ headerShown: false }}
        />

        {/* AI 자취 매니저 - 새로 추가 */}
        <Stack.Screen
          name="ai-manager"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="spending"
          options={{
            title: '소비 관리',
            headerBackVisible: false,
          }}
        />

        <Stack.Screen
          name="spending-import"
          options={{ title: '결제 자동입력' }}
        />

        <Stack.Screen
          name="notification-inbox"
          options={{ title: '결제 자동수집함' }}
        />

        <Stack.Screen
          name="routine"
          options={{ title: '생활 루틴' }}
        />

        <Stack.Screen
          name="fridge"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="dashboard"
          options={{ title: '통합 현황' }}
        />

        <Stack.Screen
          name="mypage"
          options={{ title: '마이페이지' }}
        />

        <Stack.Screen
          name="onboarding"
          options={{ title: '생활 설정' }}
        />
      </Stack>
    </SessionProvider>
  );
}
