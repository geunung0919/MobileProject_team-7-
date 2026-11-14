
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import {
  Page,
  Card,
  Button,
  styles,
} from '../components/UI';

import { useSession } from '../state/Session';

export default function HomeScreen() {
  const { api } = useSession();
  const connected = Boolean(api);

  const modules = [
    {
      name: '지도 · 생활정보',
      description: '주변 생활시설과 장소 정보',
      route: '/map',
      requiresServer: false,
    },
    {
      name: '비상 매뉴얼 · AI',
      description: '생활 응급상황 대처 및 AI 상담',
      route: '/emergency',
      requiresServer: false,
    },
    {
      name: 'AI 자취 매니저',
      description: 'AI 생활 상담 및 맞춤형 리포트',
      route: '/ai-manager',
      requiresServer: false,
    },
    {
      name: '냉장고 · 레시피',
      description: '식재료 재고, 식사, 장보기 관리',
      route: '/fridge',
      requiresServer: true,
    },
    {
      name: '가계부 · 소비 관리',
      description: '지출 및 예산 관리',
      route: '/spending',
      requiresServer: true,
    },
    {
      name: '생활 루틴',
      description: '반복 일정과 완료 기록',
      route: '/routine',
      requiresServer: true,
    },
    {
      name: '온보딩',
      description: '자취 생활 정보 설정',
      route: '/onboarding',
      requiresServer: true,
    },
    {
      name: '마이페이지',
      description: '사용자 정보 및 알림 설정',
      route: '/mypage',
      requiresServer: true,
    },
    {
      name: '통합 현황',
      description: '모듈별 데이터 현황',
      route: '/dashboard',
      requiresServer: true,
    },
  ];

  return (
    <Page title="자취생존 AI">
      <Text style={styles.text}>
        자취 생활을 하나의 앱에서 관리해 보세요.
      </Text>

      <Card>
        <Text style={localStyles.sectionTitle}>
          통합 앱 연결 상태
        </Text>

        <Text style={styles.small}>
          {connected
            ? '개발 서버 연결됨'
            : '개발 서버 미연결 · 일부 기능 제한'}
        </Text>

        <Button
          title="개발 서버 연결 화면"
          onPress={() => router.push('/')}
        />
      </Card>

      <Text style={localStyles.sectionTitle}>
        생활 관리 모듈
      </Text>

      {modules.map((item) => {
        const locked = item.requiresServer && !connected;

        return (
          <Card key={item.route}>
            <Text style={localStyles.moduleTitle}>
              {item.name}
            </Text>

            <Text style={styles.small}>
              {item.description}
            </Text>

            {locked && (
              <Text style={localStyles.notice}>
                개발 서버 연결 후 이용 가능
              </Text>
            )}

            <Button
              title={locked ? '서버 연결 필요' : '화면 열기'}
              disabled={locked}
              onPress={() => router.push(item.route)}
            />
          </Card>
        );
      })}

      <Card>
        <Text style={localStyles.sectionTitle}>
          추가 통합 예정
        </Text>

        <Text style={styles.small}>
          AI 리포트 상세 · 지난 리포트 목록
        </Text>

        <Text style={styles.small}>
          공유 · 케어
        </Text>

        <Text style={localStyles.notice}>
          해당 기능의 화면 및 DB 연동이 완료되면
          활성화할 예정입니다.
        </Text>
      </Card>
    </Page>
  );
}

const localStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#163D35',
  },

  moduleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#166B55',
  },

  notice: {
    fontSize: 12,
    color: '#B45309',
  },
});
