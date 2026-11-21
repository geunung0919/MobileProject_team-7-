import { Alert, Platform } from 'react-native';

// react-native-web 의 Alert.alert 는 아무것도 하지 않습니다.
// 그래서 웹(아이폰 Safari·PC)에서는 "삭제할까요?", "사용량 저장" 처럼 확인을 거치는 버튼이 반응 없는 것처럼 보이고
// 입력 오류 안내도 보이지 않았습니다. 앱 시작 시 한 번 불러서, 웹에서만 브라우저 기본 창(alert/confirm)으로 바꿉니다.
// 앱(iOS/Android)에서는 아무것도 바꾸지 않습니다.
const CANCEL_WORDS = ['취소', '닫기', '아니요', 'Cancel'];

function textOf(title, message) {
  return [title, message].filter((part) => part != null && String(part).trim()).join('\n\n');
}

function run(button) {
  if (typeof button?.onPress === 'function') {
    setTimeout(() => button.onPress(), 0);
  }
}

export function webAlert(title, message, buttons) {
  if (typeof window === 'undefined') return;
  const text = textOf(title, message);
  const list = Array.isArray(buttons) ? buttons.filter(Boolean) : [];

  if (list.length <= 1) {
    window.alert(text);
    run(list[0]);
    return;
  }

  const cancel = list.find((b) => b.style === 'cancel' || CANCEL_WORDS.includes(b.text)) || null;
  const actions = list.filter((b) => b !== cancel);
  const action = actions[actions.length - 1];
  const hint = action?.text && !['확인', 'OK'].includes(action.text) ? `\n\n[확인]을 누르면 "${action.text}"` : '';

  if (window.confirm(text + hint)) run(action);
  else run(cancel);
}

let installed = false;
export function installWebAlert() {
  if (installed || Platform.OS !== 'web') return;
  installed = true;
  Alert.alert = webAlert;
}

installWebAlert();
