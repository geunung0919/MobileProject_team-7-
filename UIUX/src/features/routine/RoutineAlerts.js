import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listRoutines } from '../../../../api/receiptApi';
import { environment } from '../../../../config/environment';
import { useAppData } from '../../store/AppDataContext';
import { reconcileRoutineNotifications, requestRoutinePermission, routineNotificationsSupported } from './services/notifications';

const Context = createContext(null);
const dayNumbers = ['일', '월', '화', '수', '목', '금', '토'];

export function RoutineAlerts({ children }) {
  const { sharedReceipts, sharedUid } = useAppData();
  const scope = sharedReceipts && sharedUid ? `${environment.firebaseTarget}:${sharedUid}` : null;
  const key = scope ? `routine-alerts:${scope}` : null;
  const [config, setConfig] = useState(null);
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const prefLock = useRef(false);
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const enabled = config?.scope === scope ? config.enabled : null;
  useEffect(() => {
    if (!routineNotificationsSupported || !scope) return;
    let active = true;
    AsyncStorage.getItem(key).then((value) => {
      if (active) setConfig({ scope, enabled: value === 'true' });
    }).catch(() => {
      if (active) setResult({ scope, text: '기기 알림 설정을 불러오지 못했어요.' });
    });
    return () => { active = false; };
  }, [scope, key]);
  useEffect(() => {
    if (!routineNotificationsSupported || !sharedReceipts) return;
    let active = true;
    let request = 0;
    const report = (text) => { if (active) setResult({ scope, text }); };
    const tick = async () => {
      const ticket = ++request;
      try {
        if (!scope || enabled !== true) {
          await reconcileRoutineNotifications({ scope, ready: !scope || enabled !== null, enabled: false });
          if (enabled === false) report('이 기기의 루틴 알림이 꺼져 있어요.');
          return;
        }
        const data = await listRoutines(sharedUid);
        if (!active || ticket !== request) return;
        const state = { routines: data.items.map((item) => ({
          id: item.id, title: item.title,
          days: item.repeat_days?.length ? item.repeat_days.map((day) => dayNumbers.indexOf(day)) : [0, 1, 2, 3, 4, 5, 6],
          reminderTime: item.time || null, energy: 'normal', completedDates: item.doneToday ? [data.date] : [],
        })) };
        const plan = await reconcileRoutineNotifications({ scope, state, ready: true, enabled: true });
        if (ticket !== request) return;
        if (plan.status === 'scheduled') report(`앞으로 7일간 알림 ${plan.count}건이 예약됐어요.`);
        if (plan.status === 'permission_denied') report('기기 설정에서 알림 권한을 허용해 주세요.');
      } catch (error) {
        if (ticket === request) report(error.message || '알림 예약을 갱신하지 못했어요.');
      }
    };
    reconcileRoutineNotifications({ scope, ready: false, enabled: false }).catch((error) => report(error.message));
    tick();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') tick(); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') tick(); }, 60000);
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [scope, sharedUid, enabled, revision, sharedReceipts]);

  async function toggle() {
    if (prefLock.current || !scope || enabled === null) return;
    prefLock.current = true;
    setBusy(true);
    try {
      if (!enabled) await requestRoutinePermission();
      if (activeScope.current !== scope) return;
      await AsyncStorage.setItem(key, String(!enabled));
      if (activeScope.current === scope) setConfig({ scope, enabled: !enabled });
    } catch (error) {
      if (activeScope.current === scope) setResult({ scope, text: error.message });
    } finally { prefLock.current = false; setBusy(false); }
  }
  return <Context.Provider value={{ supported: routineNotificationsSupported, enabled, busy,
    status: result?.scope === scope ? result.text : '', toggle, refresh: () => setRevision((n) => n + 1) }}>
    {children}
  </Context.Provider>;
}
export const useRoutineAlerts = () => useContext(Context);
