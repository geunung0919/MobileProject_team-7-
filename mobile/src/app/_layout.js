
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
        {/* 개발 서버 연결 */}
        <Stack.Screen
          name="index"
          options={{ title: '개발 서버 연결' }}
        />

        {/* 통합 홈 화면 */}
        <Stack.Screen
          name="home"
          options={{ title: '자취생존 AI 홈' }}
        />

        {/* 지도 */}
        <Stack.Screen
          name="map"
          options={{ headerShown: false }}
        />

        {/* 비상 매뉴얼 */}
        <Stack.Screen
          name="emergency"
          options={{ headerShown: false }}
        />

        {/* AI 자취 매니저 */}
        <Stack.Screen
          name="ai-manager"
          options={{ headerShown: false }}
        />

        {/* AI 생활 리포트 - 새로 추가 */}
        <Stack.Screen
          name="ai-report"
          options={{ title: 'AI 생활 리포트' }}
        />

        {/* 소비 관리 */}
        <Stack.Screen
          name="spending"
          options={{
            title: '소비 관리',
            headerBackVisible: false,
          }}
        />

        {/* 결제 자동입력 */}
        <Stack.Screen
          name="spending-import"
          options={{ title: '결제 자동입력' }}
        />

        {/* 결제 알림 수집함 */}
        <Stack.Screen
          name="notification-inbox"
          options={{ title: '결제 자동수집함' }}
        />

        {/* 생활 루틴 */}
        <Stack.Screen
          name="routine"
          options={{ title: '생활 루틴' }}
        />

        {/* 냉장고 */}
        <Stack.Screen
          name="fridge"
          options={{ headerShown: false }}
        />

        {/* 통합 현황 */}
        <Stack.Screen
          name="dashboard"
          options={{ title: '통합 현황' }}
        />

        {/* 마이페이지 */}
        <Stack.Screen
          name="mypage"
          options={{ title: '마이페이지' }}
        />

        {/* 온보딩 */}
        <Stack.Screen
          name="onboarding"
          options={{ title: '생활 설정' }}
        />
      </Stack>
    </SessionProvider>
  );
}
