import { Alert, Platform } from 'react-native';

// 확인 대화상자. React Native Web 의 Alert.alert 는 버튼을 띄우지 않으므로(아무 동작 없음) 웹에서는 window.confirm 을 씁니다.
export function confirmAction({ title, message = '', confirmLabel = '확인', destructive = false, onConfirm }) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm([title, message].filter(Boolean).join('\n'))) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
