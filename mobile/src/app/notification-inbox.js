import { useCallback, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Button, Card, Page, styles, useTask } from '../components/UI';
import { useSession } from '../state/Session';
import {
  clearPendingNotifications,
  getPendingNotifications,
  isNotificationAccessEnabled,
  isPaymentNotificationModuleAvailable,
  markProcessedNotifications,
  openNotificationAccessSettings,
} from '../../modules/payment-notifications';

const when = value => {
  const date = new Date(Number(value));
  return Number.isFinite(date.getTime()) ? date.toLocaleString('ko-KR') : '시간 정보 없음';
};

export default function NotificationInbox() {
  const { api } = useSession();
  const { busy, error, run, setError } = useTask();
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [items, setItems] = useState([]);

  const refresh = async () => {
    setError('');
    if (Platform.OS !== 'android') {
      setAccessEnabled(false);
      setItems([]);
      return;
    }
    if (!isPaymentNotificationModuleAvailable()) {
      throw new Error('자동수집 모듈이 없어요. Expo Go가 아니라 Android Development Build로 실행해 주세요.');
    }
    setAccessEnabled(isNotificationAccessEnabled());
    setItems(getPendingNotifications());
  };

  useFocusEffect(useCallback(() => {
    if (api) run(refresh);
  }, [api])); // eslint-disable-line react-hooks/exhaustive-deps

  if (!api) return <Redirect href="/" />;

  return <Page title="결제 자동수집함">
    <Card>
      <Text style={styles.title}>Android 결제 알림 자동수집</Text>
      <Text style={styles.text}>
        카드·간편결제 알림 중 금액(원)과 승인/결제 키워드가 함께 있는 알림만 기기 안의 수집함에 보관해요.
      </Text>
      {Platform.OS !== 'android'
        ? <Text style={styles.error}>이 기능은 Android 전용이에요.</Text>
        : <Text style={accessEnabled ? styles.text : styles.error}>
            {accessEnabled ? '✓ 알림 접근 허용됨' : '알림 접근 권한을 켜야 자동수집이 시작돼요.'}
          </Text>}
      <View style={styles.row}>
        <Button
          title="알림 접근 설정"
          disabled={busy || Platform.OS !== 'android'}
          onPress={() => run(async () => {
            openNotificationAccessSettings();
          })}
        />
        <Button title="새로고침" disabled={busy} onPress={() => run(refresh)} />
      </View>
      <Text style={styles.small}>
        다른 앱의 모든 알림을 서버로 전송하지 않습니다. 네이티브 서비스가 결제 후보만 로컬에 저장하고,
        앱을 열어 검토할 때 기존 소비관리 API를 사용합니다.
      </Text>
    </Card>

    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

    <Card>
      <Text style={styles.title}>확인 대기 {items.length}건</Text>
      {!items.length && <Text style={styles.text}>아직 수집된 결제 알림이 없어요.</Text>}
      {items.map(item => <View
        key={item.id}
        style={{ gap: 8, borderBottomWidth: 1, borderBottomColor: '#e1eae5', paddingVertical: 12 }}
      >
        <Text style={styles.text}>{item.appLabel || item.packageName}</Text>
        <Text style={styles.small}>{when(item.postedAt)}</Text>
        {!!item.title && <Text style={styles.text}>{item.title}</Text>}
        {!!item.text && <Text style={styles.small}>{item.text}</Text>}
        <View style={styles.row}>
          <Button
            title="검토 / 저장"
            disabled={busy}
            onPress={() => router.push({
              pathname: '/spending-import',
              params: { notificationId: item.id },
            })}
          />
          <Button
            title="무시"
            disabled={busy}
            onPress={() => run(async () => {
              markProcessedNotifications([item.id]);
              await refresh();
            })}
          />
        </View>
      </View>)}
      {!!items.length && <Button
        title="수집함 모두 비우기"
        disabled={busy}
        onPress={() => run(async () => {
          clearPendingNotifications();
          await refresh();
        })}
      />}
    </Card>

    <Card>
      <Text style={styles.title}>현재 자동수집 범위</Text>
      <Text style={styles.small}>포함: 원화 금액 + 승인/결제/이용/사용/구매/페이 키워드가 있는 알림</Text>
      <Text style={styles.small}>제외: 취소·거절·실패·환불·입금·광고/혜택 알림</Text>
      <Text style={styles.small}>최대 최근 50건, 최대 30일 동안 기기 내부에만 보관합니다.</Text>
    </Card>
  </Page>;
}
