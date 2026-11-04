import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

let nativeModule = null;
if (Platform.OS === 'android') {
  try {
    nativeModule = requireNativeModule('PaymentNotifications');
  } catch {
    nativeModule = null;
  }
}

export function isPaymentNotificationModuleAvailable() {
  return Platform.OS === 'android' && nativeModule !== null;
}

export function isNotificationAccessEnabled() {
  return nativeModule ? nativeModule.isAccessEnabled() : false;
}

export function openNotificationAccessSettings() {
  if (!nativeModule) {
    throw new Error('결제 알림 자동수집은 Android Development Build에서만 사용할 수 있어요.');
  }
  return nativeModule.openAccessSettings();
}

export function getPendingNotifications() {
  return nativeModule ? nativeModule.getPendingNotifications() : [];
}

export function markProcessedNotifications(ids) {
  if (!nativeModule) return 0;
  return nativeModule.markProcessed(ids);
}

export function clearPendingNotifications() {
  if (!nativeModule) return 0;
  return nativeModule.clearPending();
}
