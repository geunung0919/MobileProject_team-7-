
import React from 'react';
import { Stack } from 'expo-router';

import { useSession } from '../../state/Session';
import { AppProvider } from '../../features/fridge/state/AppProvider';

const TEST_STORAGE_KEY = 'jachwi:fridge:integration-test:v1';

export default function FridgeLayout() {
  const { api, storageScope } = useSession();

  // 중앙 서버 연결이 있다면 기존 사용자별 저장 공간 유지
  // 서버가 없다면 통합 테스트 전용 로컬 저장 공간 사용
  const activeStorageKey =
    api && storageScope
      ? storageScope
      : TEST_STORAGE_KEY;

  return (
    <AppProvider
      key={activeStorageKey}
      storageKey={activeStorageKey}
    >
      <Stack
        screenOptions={{
          headerTintColor: '#166b55',
          title: '냉장고·식사',
        }}
      />
    </AppProvider>
  );
}
