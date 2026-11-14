
import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';

import {
  Page,
  Card,
  Field,
  Button,
  styles,
  useTask,
} from '../components/UI';

import { useSession } from '../state/Session';
import { createApi, normalizeUrl } from '../lib/api';

export default function Connect() {
  const [url, setUrl] = useState(
    process.env.EXPO_PUBLIC_API_URL || ''
  );

  const [token, setToken] = useState('');

  const { setSession } = useSession();
  const { busy, error, run } = useTask();

  // 기존 개발 서버 연결 기능
  const handleConnect = () => {
    run(async () => {
      const api = createApi(url, token);

      // 사용자 정보 확인
      const identity = await api('me/identity');

      if (!identity.user_id) {
        throw new Error(
          '서버의 사용자 정보를 확인하지 못했어요.'
        );
      }

      // 소비 관리 데이터 확인
      await api('me/spending');

      // 로그인 세션 저장
      setSession({
        url: normalizeUrl(url),
        token: token.trim(),
        userId: identity.user_id,
      });

      // 기존 소비 관리 화면 이동
      router.replace('/spending');
    });
  };

  // 통합 홈 화면 이동
  const openHome = () => {
    router.push('/home');
  };

  return (
    <Page title="내 생활비, 한눈에">
      <Text style={styles.text}>
        온보딩과 소비 관리 서버에 연결해요.
      </Text>

      {/* 기존 개발 서버 연결 영역 */}
      <Card>
        <Field
          label="서버 주소"
          placeholder="http://192.168.0.10:8000"
          value={url}
          onChangeText={setUrl}
          editable={!busy}
          keyboardType="url"
        />

        <Field
          label="개발 토큰"
          value={token}
          onChangeText={setToken}
          secureTextEntry
          editable={!busy}
        />

        <Text style={styles.small}>
          휴대폰에서는 PC의 Wi-Fi IPv4 주소를
          입력하세요.
          토큰은 앱 메모리에만 보관해요.
          실제 로그인은 아직 연결 전이에요.
        </Text>

        <Button
          title={busy ? '연결 중…' : '연결하기'}
          disabled={busy}
          onPress={handleConnect}
        />

        {!!error && (
          <Text
            accessibilityRole="alert"
            style={styles.error}
          >
            {error}
          </Text>
        )}
      </Card>

      {/* 통합 홈 화면 테스트 */}
      <Card>
        <Text style={styles.text}>
          자취생존 AI 통합 홈 화면
        </Text>

        <Text style={styles.small}>
          개발 서버 연결 없이 홈 화면과
          기본 모듈 이동을 테스트할 수 있어요.
        </Text>

        <Button
          title="통합 홈 화면 테스트"
          onPress={openHome}
        />
      </Card>
    </Page>
  );
}
