import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { spendingData } from '../data/spending/spending';
import { fridgeData } from '../data/fridge/fridge';
import { todoData } from '../data/lifeInfo/todos';
import { routineData } from '../data/lifeInfo/routines';
import { profileData, settingsData } from '../data/more/account';
import { addDays, toDateString, parseAmount } from '../utils/format';
import { clearRoutineChecks } from '../utils/time';

// 앱 전체에서 함께 쓰는 데이터 보관소 (소비 내역, 냉장고 식재료, 할 일, 생활 루틴, 내 정보, 앱 설정).
// 지금은 앱을 끄면 사라지는 메모리 저장소입니다.
// TODO: Firebase 등을 연결할 때는 이 파일의 add 함수 안에서 서버에 저장/불러오기만 바꾸면
//       화면 코드는 그대로 둘 수 있어요.
//
// 사용법:
//   const { transactions, addTransaction, updateTransaction, removeTransaction, fridgeItems, addFridgeItem, updateFridgeItem, removeFridgeItem } = useAppData();
//   const { todos, addTodo, toggleTodo, routines, addRoutine, toggleRoutine } = useAppData();
//   const { profile, updateProfile, settings, updateSetting } = useAppData();

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const nextId = useRef(1);
  const makeId = (prefix) => `${prefix}-new-${Date.now()}-${nextId.current++}`;

  // 더미 소비 내역은 "오늘로부터 며칠 전(daysAgo)"을 실제 날짜로 바꿔서 시작합니다.
  const [transactions, setTransactions] = useState(() => {
    const today = toDateString(new Date());
    return spendingData.transactions.map(({ daysAgo, ...t }) => ({
      ...t,
      date: addDays(today, -daysAgo),
    }));
  });
  const [fridgeItems, setFridgeItems] = useState(fridgeData.items);

  // 더미 할 일은 "오늘로부터 며칠 뒤(daysFromToday)"를 실제 마감일(due)로 바꿔서 시작합니다.
  const [todos, setTodos] = useState(() => {
    const today = toDateString(new Date());
    return todoData.items.map(({ daysFromToday, ...t }) => ({
      ...t,
      due: daysFromToday == null ? null : addDays(today, daysFromToday),
    }));
  });
  const [routines, setRoutines] = useState(routineData.items);

  // 루틴은 매일 반복되므로, 날짜가 바뀌면 "오늘 완료" 체크를 모두 해제합니다.
  // - routineDay: 지금 체크 상태가 어느 날의 것인지 ('YYYY-MM-DD')
  // - 확인 시점: 앱으로 돌아왔을 때 / 앱이 켜져 있는 동안 1분마다 / 루틴을 체크·추가하기 직전
  // TODO: 서버에 완료 기록을 날짜별로 저장한다면 이 초기화는 서버 기준으로 바꾸세요.
  const routineDay = useRef(toDateString(new Date()));
  const resetRoutinesIfNewDay = useCallback(() => {
    const today = toDateString(new Date());
    if (routineDay.current === today) return;
    routineDay.current = today;
    setRoutines(clearRoutineChecks);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') resetRoutinesIfNewDay();
    });
    const timer = setInterval(resetRoutinesIfNewDay, 60 * 1000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [resetRoutinesIfNewDay]);

  const [profile, setProfile] = useState(profileData.initial);
  const [settings, setSettings] = useState(settingsData.initial);

  // 소비 추가: { title, amount, date: 'YYYY-MM-DD', category?, icon?, source?('receipt'), items? }
  const addTransaction = useCallback(({ title, amount, date, category, icon, source, items }) => {
    const entry = {
      id: makeId('t'),
      title,
      amount: parseAmount(amount), // 숫자가 아니거나 음수면 0 으로 저장해 합계가 깨지지 않게 합니다.
      date,
      category: category ?? spendingData.defaultCategory,
      icon: icon ?? spendingData.defaultIcon,
      ...(source ? { source } : {}),
      ...(items ? { items } : {}),
    };
    setTransactions((prev) => [entry, ...prev]); // 새 항목을 맨 앞에 (같은 날짜면 최신이 위)
  }, []);

  // 소비 수정: { title, amount, date, items } 중 바꾼 값을 넘기면 나머지(카테고리, 아이콘, 출처 등)는 그대로 둡니다.
  const updateTransaction = useCallback((id, patch) => {
    const safePatch = 'amount' in patch ? { ...patch, amount: parseAmount(patch.amount) } : patch;
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...safePatch } : t)));
  }, []);

  // 소비 삭제 (냉장고에 담긴 식재료는 따로 관리되어 그대로 남습니다)
  const removeTransaction = useCallback((id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 식재료 추가: { name, quantity(숫자), unit, purchaseDate: 'YYYY-MM-DD'|null, expiry: 'YYYY-MM-DD' }
  const addFridgeItem = useCallback(({ name, quantity, unit, purchaseDate, expiry }) => {
    const entry = {
      id: makeId('f'),
      name,
      quantity: `${quantity}${unit}`,
      amount: quantity,
      unit,
      purchaseDate,
      expiry,
      icon: fridgeData.defaultIcon,
    };
    setFridgeItems((prev) => [entry, ...prev]);
  }, []);

  // 식재료 수정: addFridgeItem 과 같은 값(name, quantity(숫자), unit, purchaseDate, expiry)을 통째로 넘깁니다.
  const updateFridgeItem = useCallback((id, { name, quantity, unit, purchaseDate, expiry }) => {
    setFridgeItems((prev) =>
      prev.map((it) =>
        it.id !== id
          ? it
          : {
              ...it,
              name,
              amount: quantity,
              unit,
              quantity: `${quantity}${unit}${it.detail ? ` · ${it.detail}` : ''}`,
              purchaseDate,
              expiry,
            },
      ),
    );
  }, []);

  // 식재료 삭제
  const removeFridgeItem = useCallback((id) => {
    setFridgeItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  // 할 일 추가: { title, due: 'YYYY-MM-DD'|null }  (새 할 일은 목록 끝에 추가, 화면에서 마감일 순으로 정렬해 보여 줍니다)
  const addTodo = useCallback(({ title, due }) => {
    setTodos((prev) => [...prev, { id: makeId('td'), title, due, done: false }]);
  }, []);

  // 할 일 완료 체크 켜기/끄기
  const toggleTodo = useCallback((id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  // 루틴 추가: { title, time: 'HH:mm' (24시간제) }
  const addRoutine = useCallback(
    ({ title, time }) => {
      resetRoutinesIfNewDay();
      setRoutines((prev) => [...prev, { id: makeId('r'), title, time, doneToday: false }]);
    },
    [resetRoutinesIfNewDay]
  );

  // 루틴 오늘 완료 체크 켜기/끄기 (날이 바뀌었다면 먼저 어제의 체크를 모두 해제합니다)
  const toggleRoutine = useCallback(
    (id) => {
      resetRoutinesIfNewDay();
      setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, doneToday: !r.doneToday } : r)));
    },
    [resetRoutinesIfNewDay]
  );

  // 개인정보 수정: { nickname?, region? } 중 바꿀 값만 넘기면 됩니다.
  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  // 앱 설정 켜기/끄기: updateSetting('notifyFridge', true)
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      addTransaction,
      updateTransaction,
      removeTransaction,
      fridgeItems,
      addFridgeItem,
      updateFridgeItem,
      removeFridgeItem,
      todos,
      addTodo,
      toggleTodo,
      routines,
      addRoutine,
      toggleRoutine,
      profile,
      updateProfile,
      settings,
      updateSetting,
    }),
    [
      transactions,
      addTransaction,
      updateTransaction,
      removeTransaction,
      fridgeItems,
      addFridgeItem,
      updateFridgeItem,
      removeFridgeItem,
      todos,
      addTodo,
      toggleTodo,
      routines,
      addRoutine,
      toggleRoutine,
      profile,
      updateProfile,
      settings,
      updateSetting,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData 는 AppDataProvider 안에서만 쓸 수 있어요.');
  return ctx;
}
