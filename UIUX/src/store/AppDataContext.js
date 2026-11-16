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
import { ALL_DAYS } from '../utils/time';
import { clearRoutineChecks } from '../utils/time';

// 앱 전체가 함께 쓰는 데이터 저장소 (소비, 소비 카테고리, 식재료, 할 일, 루틴, 프로필, 설정). 지금은 메모리에만 저장됩니다.
// TODO: 서버(Firebase 등) 연결은 이 파일의 불러오기(useState 초기값)와 add/update/remove/toggle 함수 안에서 하세요.
//       화면 코드는 그대로 둘 수 있습니다.
// 사용: const { transactions, addTransaction, todos, toggleTodo, ... } = useAppData();

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const nextId = useRef(1);
  const makeId = (prefix) => `${prefix}-new-${Date.now()}-${nextId.current++}`;

  // 더미 소비 내역의 daysAgo 를 실제 날짜로 바꿔서 시작합니다.
  const [transactions, setTransactions] = useState(() => {
    const today = toDateString(new Date());
    return spendingData.transactions.map(({ daysAgo, ...t }) => ({
      ...t,
      date: addDays(today, -daysAgo),
    }));
  });
  const [fridgeItems, setFridgeItems] = useState(fridgeData.items);

  // 사용자가 추가한 소비 카테고리 (식품은 고정이라 여기에 없음). 한 번 추가하면 다음에도 선택할 수 있습니다.
  // 처음에는 더미 소비 내역에 쓰인 카테고리로 채웁니다. 서버 연결 시 사용자별 목록을 불러오세요.
  const [customCategories, setCustomCategories] = useState(() => {
    const fixed = [spendingData.foodCategory, spendingData.defaultCategory];
    return [...new Set(spendingData.transactions.map((t) => t.category))].filter(
      (c) => c && !fixed.includes(c)
    );
  });

  // 더미 할 일의 daysFromToday 를 실제 마감일(due)로 바꿔서 시작합니다.
  const [todos, setTodos] = useState(() => {
    const today = toDateString(new Date());
    return todoData.items.map(({ daysFromToday, ...t }) => ({
      ...t,
      due: daysFromToday == null ? null : addDays(today, daysFromToday),
    }));
  });
  const [routines, setRoutines] = useState(routineData.items);

  // 날짜가 바뀌면 루틴의 "오늘 완료" 체크를 모두 해제합니다.
  // 확인 시점: 앱 복귀 / 1분마다 / 루틴 체크·추가 직전. (서버에 날짜별 기록을 저장한다면 서버 기준으로 바꾸세요)
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

  // 소비 추가: { title, amount, date: 'YYYY-MM-DD', category?, icon?, source?, items? }
  const addTransaction = useCallback(({ title, amount, date, category, icon, source, items }) => {
    const entry = {
      id: makeId('t'),
      title,
      amount: parseAmount(amount), // 잘못된 값은 0 으로 저장 (합계 보호)
      date,
      category: category ?? spendingData.defaultCategory,
      icon: icon ?? spendingData.defaultIcon,
      ...(source ? { source } : {}),
      ...(items ? { items } : {}),
    };
    setTransactions((prev) => [entry, ...prev]); // 새 항목을 맨 앞에 (같은 날짜면 최신이 위)
  }, []);

  // 카테고리 추가: 이름만 넘깁니다 (중복/예약어 확인은 utils/category.js 의 validateCategoryName 으로 먼저 하세요)
  const addCategory = useCallback((name) => {
    const trimmed = name.trim();
    setCustomCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  // 소비 수정: 바꾼 값만 넘기면 나머지(카테고리, 아이콘 등)는 그대로 둡니다.
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

  // 식재료 수정: addFridgeItem 과 같은 값을 통째로 넘깁니다.
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

  const removeFridgeItem = useCallback((id) => {
    setFridgeItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  // 할 일 추가: { title, due: 'YYYY-MM-DD'|null }
  const addTodo = useCallback(({ title, due }) => {
    setTodos((prev) => [...prev, { id: makeId('td'), title, due, done: false }]);
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  // 루틴 추가: { title, time: 'HH:mm' (24시간제), days: [0~6] (0=일요일 ... 6=토요일, 없으면 매일) }
  const addRoutine = useCallback(
    ({ title, time, days = ALL_DAYS }) => {
      resetRoutinesIfNewDay();
      setRoutines((prev) => [...prev, { id: makeId('r'), title, time, days, doneToday: false }]);
    },
    [resetRoutinesIfNewDay]
  );

  // 루틴 체크 켜기/끄기 (날이 바뀌었다면 먼저 초기화)
  const toggleRoutine = useCallback(
    (id) => {
      resetRoutinesIfNewDay();
      setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, doneToday: !r.doneToday } : r)));
    },
    [resetRoutinesIfNewDay]
  );

  // 개인정보 수정: { nickname?, region? } 중 바꿀 값만 넘깁니다.
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
      customCategories,
      addCategory,
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
      customCategories,
      addCategory,
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
