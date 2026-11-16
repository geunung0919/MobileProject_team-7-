import { Alert, Platform } from 'react-native';

// "정말 삭제할까요?" 같은 확인창. 앱(iOS/Android)에서는 Alert 를, 웹 미리보기에서는 window.confirm 을 씁니다.
// (react-native 의 Alert.alert 는 웹에서 아무 동작도 하지 않아서, 웹으로 실행하면 삭제 버튼이 반응 없는 것처럼 보입니다.)
// 사용: confirmAction({ title, message, confirmLabel: '삭제', destructive: true, onConfirm: () => {...} })
export function confirmAction({ title, message, confirmLabel = '확인', destructive = false, onConfirm }) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined' && window.confirm(text)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

// 안내창(확인 버튼 하나). 웹에서는 window.alert 를 씁니다.
export function showNotice(title, message) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
