import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spendingData } from '../data/spending/spending';
import { fridgeData } from '../data/fridge/fridge';
import { todoData } from '../data/lifeInfo/todos';
import { routineData } from '../data/lifeInfo/routines';
import { profileData, settingsData } from '../data/more/account';
import { addDays, toDateString, parseAmount } from '../utils/format';
import { ALL_DAYS, clearRoutineChecks } from '../utils/time';
import { api, isServerConfigured } from '../lib/api';
import {
  expenseToTransaction,
  transactionToExpenseInput,
  receiptConfirmInput,
  fridgeToServerItem,
  serverItemToFridge,
  fridgeText,
} from '../lib/serverData';

// 앱 전체가 함께 쓰는 데이터 저장소. 화면은 모두 useAppData() 로 여기서 읽고 씁니다.
//
// 서버 모드 (UIUX/.env.local 에 EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_TOKEN 설정)
//   - 소비(transactions), 월 예산(budget), 냉장고(fridgeItems)는 jachwi-core 서버에 저장 -> 서버가 Firestore 에 저장
//   - 영수증 촬영 저장은 서버의 영수증 저장(중복 방지·식재료 학습)을 거칩니다.
// 더미 모드 (설정 없음): 예전처럼 src/data 의 더미 데이터로 시작합니다.
// 할 일, 루틴, 프로필, 앱 설정은 두 모드 모두 이 휴대폰(AsyncStorage)에 저장합니다. (서버 API 가 아직 없음)
//
// 화면에 더해 주는 값: budget, setBudget, syncState('local'|'loading'|'ready'|'error'), syncError, refresh
// 사용: const { transactions, addTransaction, todos, toggleTodo, ... } = useAppData();

const AppDataContext = createContext(null);
const SERVER = isServerConfigured;
const LOCAL_KEY = 'jachwi.uiux.local.v1';
const FIXED_CATEGORIES = [spendingData.foodCategory, spendingData.defaultCategory];

const currentPeriod = () => toDateString(new Date()).slice(0, 7);

const dummyTransactions = () => {
  const today = toDateString(new Date());
  return spendingData.transactions.map(({ daysAgo, ...t }) => ({ ...t, date: addDays(today, -daysAgo) }));
};
const dummyTodos = () => {
  const today = toDateString(new Date());
  return todoData.items.map(({ daysFromToday, ...t }) => ({
    ...t,
    due: daysFromToday == null ? null : addDays(today, daysFromToday),
  }));
};

const reportError = (title) => (error) => {
  console.warn(`[서버] ${title}:`, error?.message ?? error);
  Alert.alert(title, error?.message ?? '잠시 후 다시 시도해 주세요.');
};

export function AppDataProvider({ children }) {
  const nextId = useRef(1);
  const makeId = (prefix) => `${prefix}-new-${Date.now()}-${nextId.current++}`;

  const [transactions, setTransactions] = useState(() => (SERVER ? [] : dummyTransactions()));
  const [fridgeItems, setFridgeItems] = useState(() => (SERVER ? [] : fridgeData.items));
  const [budgetInfo, setBudgetInfo] = useState({ period: currentPeriod(), budget: null, suggested: null });
  const [addedCategories, setAddedCategories] = useState([]);
  const [todos, setTodos] = useState(dummyTodos);
  const [routines, setRoutines] = useState(routineData.items);
  const [profile, setProfile] = useState(profileData.initial);
  const [settings, setSettings] = useState(settingsData.initial);
  const [syncState, setSyncState] = useState(SERVER ? 'loading' : 'local');
  const [syncError, setSyncError] = useState('');

  // ---- 소비 카테고리: 지출에 쓰인 카테고리 + 사용자가 방금 추가한 것 (식품·기타는 고정이라 제외) ----
  const customCategories = useMemo(() => {
    const used = transactions.map((t) => t.category);
    return [...new Set([...used, ...addedCategories])].filter((c) => c && !FIXED_CATEGORIES.includes(c));
  }, [transactions, addedCategories]);

  // ---- 서버에서 불러오기 ----
  const inventory = useRef({ revision: 0, items: [] }); // 서버에 마지막으로 저장된 재고
  const inventoryQueue = useRef(Promise.resolve());

  const applyInventory = useCallback((state) => {
    const items = state ? state.snapshot.data.items.map((s) => serverItemToFridge(s)) : [];
    inventory.current = { revision: state ? state.revision : 0, items };
    setFridgeItems(items);
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      applyInventory(await api('me/inventory'));
    } catch (error) {
      if (error.status !== 404) throw error;
      applyInventory(null); // 아직 서버 재고가 없음
    }
  }, [applyInventory]);

  const loadSpending = useCallback(async () => {
    const period = currentPeriod();
    const [all, month] = await Promise.all([
      api('me/spending/expenses'),
      api(`me/spending?period=${period}`),
    ]);
    setTransactions(all.expenses.map(expenseToTransaction));
    setBudgetInfo({ period, budget: month.data.budget_krw ?? null, suggested: month.suggested_budget_krw ?? null });
  }, []);

  const refresh = useCallback(async () => {
    if (!SERVER) return;
    try {
      await Promise.all([loadSpending(), loadInventory()]);
      setSyncError('');
      setSyncState('ready');
    } catch (error) {
      setSyncError(error.message);
      setSyncState('error');
    }
  }, [loadSpending, loadInventory]);

  useEffect(() => {
    if (!SERVER) return undefined;
    refresh();
    // 앱으로 돌아오면 다시 불러옵니다 (다른 기기에서 바꾼 내용 반영)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  // ---- 이 휴대폰에 저장하는 값 (할 일, 루틴, 프로필, 설정) ----
  const routineDay = useRef(toDateString(new Date()));
  const [localLoaded, setLocalLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCAL_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.todos)) setTodos(saved.todos);
        if (Array.isArray(saved.routines)) {
          const today = toDateString(new Date());
          // 저장한 날과 오늘이 다르면 "오늘 완료" 체크를 해제해서 불러옵니다.
          setRoutines(saved.routineDay === today ? saved.routines : clearRoutineChecks(saved.routines));
        }
        if (saved.profile) setProfile((prev) => ({ ...prev, ...saved.profile }));
        if (saved.settings) setSettings((prev) => ({ ...prev, ...saved.settings }));
      })
      .catch((error) => console.warn('[기기 저장] 불러오기 실패:', error?.message))
      .finally(() => setLocalLoaded(true));
  }, []);

  useEffect(() => {
    if (!localLoaded) return; // 불러오기 전에 빈 값으로 덮어쓰지 않기
    const data = { todos, routines, profile, settings, routineDay: routineDay.current };
    AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(data)).catch((error) =>
      console.warn('[기기 저장] 저장 실패:', error?.message)
    );
  }, [localLoaded, todos, routines, profile, settings]);

  // 날짜가 바뀌면 루틴의 "오늘 완료" 체크를 모두 해제합니다.
  // 확인 시점: 앱 복귀 / 1분마다 / 루틴 체크·추가 직전.
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

  // ---- 소비 ----
  // 소비 추가: { title, amount, date: 'YYYY-MM-DD', category?, icon?, source?, items?, ocr? }
  // ocr: 영수증 촬영 결과({ raw_text, receipt_items }). 있으면 서버의 영수증 저장으로 보냅니다.
  const addTransaction = useCallback(({ title, amount, date, category, icon, source, items, ocr }) => {
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
    if (!SERVER) {
      setTransactions((prev) => [entry, ...prev]); // 새 항목을 맨 앞에 (같은 날짜면 최신이 위)
      return;
    }
    const request = ocr?.raw_text
      ? api('me/spending/imports/confirm', 'POST', receiptConfirmInput(entry, ocr))
      : api('me/spending/expenses', 'POST', transactionToExpenseInput(entry));
    request
      .then((saved) => {
        setTransactions((prev) => [expenseToTransaction(saved), ...prev]);
      })
      .catch((error) => {
        if (error.status === 409 && ocr) {
          Alert.alert('이미 저장한 영수증이에요', '같은 영수증은 한 번만 저장할 수 있어요.');
          return;
        }
        reportError('지출을 저장하지 못했어요')(error);
      });
  }, []);

  // 카테고리 추가: 이름만 넘깁니다 (중복/예약어 확인은 utils/category.js 의 validateCategoryName 으로 먼저 하세요)
  const addCategory = useCallback((name) => {
    const trimmed = name.trim();
    setAddedCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  // 소비 수정: 바꾼 값만 넘기면 나머지(카테고리, 아이콘 등)는 그대로 둡니다.
  const updateTransaction = useCallback(
    (id, patch) => {
      const safePatch = 'amount' in patch ? { ...patch, amount: parseAmount(patch.amount) } : patch;
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...safePatch } : t)));
      if (!SERVER) return;
      const current = transactions.find((t) => t.id === id);
      if (!current) return;
      api(`me/spending/expenses/${id}`, 'PUT', transactionToExpenseInput({ ...current, ...safePatch }))
        .then((saved) => setTransactions((prev) => prev.map((t) => (t.id === id ? expenseToTransaction(saved) : t))))
        .catch((error) => {
          reportError('지출을 수정하지 못했어요')(error);
          refresh();
        });
    },
    [transactions, refresh]
  );

  // 소비 삭제 (냉장고에 담긴 식재료는 따로 관리되어 그대로 남습니다)
  const removeTransaction = useCallback(
    (id) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (!SERVER) return;
      api(`me/spending/expenses/${id}`, 'DELETE').catch((error) => {
        reportError('지출을 삭제하지 못했어요')(error);
        refresh();
      });
    },
    [refresh]
  );

  // 이번 달 예산. 서버에 없으면 생활 설정(온보딩)의 예산, 그것도 없으면 기본값을 보여 줍니다.
  const budget = budgetInfo.budget ?? budgetInfo.suggested ?? spendingData.budget;
  const budgetIsSet = !SERVER || budgetInfo.budget != null;

  // 이번 달 예산 저장: setBudget(500000)
  const setBudget = useCallback((amount) => {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    const period = currentPeriod();
    setBudgetInfo((prev) => ({ ...prev, period, budget: value }));
    if (!SERVER) return;
    api(`me/spending/budgets/${period}`, 'PUT', { budget_krw: value }).catch(
      reportError('예산을 저장하지 못했어요')
    );
  }, []);

  // ---- 냉장고 ----
  // 서버 재고는 목록 전체를 버전(revision)과 함께 저장합니다. 변경은 순서대로 보내고,
  // 다른 기기가 먼저 바꿔서 충돌(409)하면 최신 목록을 받아 같은 변경을 한 번 더 적용합니다.
  const changeFridge = useCallback(
    (change) => {
      setFridgeItems(change); // 화면은 바로 바꿉니다
      if (!SERVER) return;
      inventoryQueue.current = inventoryQueue.current
        .then(async () => {
          for (let attempt = 0; attempt < 2; attempt += 1) {
            const base = inventory.current;
            const items = change(base.items);
            try {
              const saved = await api('me/inventory', 'PUT', {
                expected_revision: base.revision,
                data: { items: items.map(fridgeToServerItem) },
              });
              applyInventory(saved);
              return;
            } catch (error) {
              if (error.status !== 409 || attempt > 0) throw error;
              await loadInventory();
            }
          }
        })
        .catch((error) => {
          reportError('냉장고를 저장하지 못했어요')(error);
          loadInventory().catch(() => {});
        });
    },
    [applyInventory, loadInventory]
  );

  // 식재료 추가: { name, quantity(숫자), unit, purchaseDate: 'YYYY-MM-DD'|null, expiry: 'YYYY-MM-DD' }
  const addFridgeItem = useCallback(
    ({ name, quantity, unit, purchaseDate, expiry }) => {
      const entry = {
        id: makeId('f'),
        name,
        quantity: fridgeText(quantity, unit),
        amount: quantity,
        unit,
        purchaseDate,
        expiry,
        icon: fridgeData.defaultIcon,
      };
      changeFridge((prev) => [entry, ...prev]);
    },
    [changeFridge]
  );

  // 식재료 수정: addFridgeItem 과 같은 값을 통째로 넘깁니다.
  const updateFridgeItem = useCallback(
    (id, { name, quantity, unit, purchaseDate, expiry }) => {
      changeFridge((prev) =>
        prev.map((it) =>
          it.id !== id
            ? it
            : {
                ...it,
                name,
                amount: quantity,
                unit,
                quantity: fridgeText(quantity, unit, it.detail),
                purchaseDate,
                expiry,
              }
        )
      );
    },
    [changeFridge]
  );

  const removeFridgeItem = useCallback(
    (id) => changeFridge((prev) => prev.filter((it) => it.id !== id)),
    [changeFridge]
  );

  // ---- 할 일 / 루틴 / 프로필 / 설정 (이 휴대폰에 저장) ----
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
      budget,
      budgetIsSet,
      setBudget,
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
      isServer: SERVER,
      syncState,
      syncError,
      refresh,
    }),
    [
      transactions,
      addTransaction,
      updateTransaction,
      removeTransaction,
      customCategories,
      addCategory,
      budget,
      budgetIsSet,
      setBudget,
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
      syncState,
      syncError,
      refresh,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData 는 AppDataProvider 안에서만 쓸 수 있어요.');
  return ctx;
}
