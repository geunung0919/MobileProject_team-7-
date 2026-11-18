
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../../../firebase/firebaseConfig';
import {
  listTransactions,
  listFridgeItems,
} from '../../../api/receiptApi';

import { spendingData } from '../data/spending/spending';
import { fridgeData } from '../data/fridge/fridge';
import { todoData } from '../data/lifeInfo/todos';
import { routineData } from '../data/lifeInfo/routines';
import { profileData, settingsData } from '../data/more/account';

// 연규 최신 UIUX 생활정보
import { lifeDataForm } from '../data/more/lifeData';

import {
  addDays,
  toDateString,
  parseAmount,
} from '../utils/format';

import { clearRoutineChecks } from '../utils/time';

const AppDataContext = createContext(null);

export function AppDataProvider({
  children,
  sharedReceipts = false,
}) {
  // =====================================
  // 1. 공용 Firebase DB 연동
  // =====================================

  const [sharedUid, setSharedUid] = useState(null);
  const [sharedRows, setSharedRows] = useState(null);

  const generation = useRef(0);

  const refreshShared = useCallback(async (uid) => {
    if (!uid || auth.currentUser?.uid !== uid) {
      return;
    }

    const ticket = ++generation.current;

    const update = async (key, load) => {
      try {
        const result = await load(uid);

        if (
          ticket !== generation.current ||
          auth.currentUser?.uid !== uid
        ) {
          return;
        }

        setSharedRows((previous) => ({
          ...(previous?.uid === uid ? previous : {}),
          uid,
          [key]: result.items,
          [`${key}Truncated`]: result.possiblyTruncated,
          [`${key}Error`]: '',
        }));
      } catch (error) {
        if (
          ticket !== generation.current ||
          auth.currentUser?.uid !== uid
        ) {
          return;
        }

        setSharedRows((previous) => ({
          ...(previous?.uid === uid ? previous : {}),
          uid,
          [`${key}Error`]:
            error.message ||
            '서버 목록을 불러오지 못했어요.',
        }));
      }
    };

    await Promise.all([
      update('spending', listTransactions),
      update('inventory', listFridgeItems),
    ]);
  }, []);

  useEffect(() => {
    if (!sharedReceipts) {
      return;
    }

    const stop = onAuthStateChanged(auth, (user) => {
      generation.current++;

      setSharedUid(user?.uid ?? null);
      setSharedRows(null);

      if (user) {
        refreshShared(user.uid);
      }
    });

    return () => {
      generation.current++;
      stop();
    };
  }, [sharedReceipts, refreshShared]);

  const visibleShared =
    sharedRows?.uid === sharedUid
      ? sharedRows
      : null;

  // =====================================
  // 2. 공통 ID 생성
  // =====================================

  const nextId = useRef(1);

  const makeId = (prefix) =>
    `${prefix}-new-${Date.now()}-${nextId.current++}`;

  // =====================================
  // 3. 소비 데이터
  // =====================================

  const [transactions, setTransactions] = useState(() => {
    const today = toDateString(new Date());

    return spendingData.transactions.map(
      ({ daysAgo, ...transaction }) => ({
        ...transaction,
        date: addDays(today, -daysAgo),
      })
    );
  });

  // 연규 UIUX 추가: 월 예산
  const [budget, setBudget] = useState(spendingData.budget);

  // 사용자 지정 소비 카테고리
  const [customCategories, setCustomCategories] = useState(() => {
    const fixed = [
      spendingData.foodCategory,
      spendingData.defaultCategory,
    ];

    return [...new Set(
      spendingData.transactions.map((t) => t.category)
    )].filter((category) => category && !fixed.includes(category));
  });

  const addCategory = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setCustomCategories((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
  }, []);
  // 로그인 계정별 카테고리 저장소
  const categoryStorageKey = sharedReceipts
    ? (sharedUid ? `spending-categories:${sharedUid}` : null)
    : 'spending-categories:local';

  const [categoryStoreReady, setCategoryStoreReady] = useState(null);

  // 앱 실행 또는 로그인 계정 변경 시 저장된 목록 복원
  useEffect(() => {
    let active = true;

    setCategoryStoreReady(null);
    setCustomCategories([]);

    if (!categoryStorageKey) {
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(categoryStorageKey)
      .then((raw) => {
        if (!active) return;

        const parsed = raw ? JSON.parse(raw) : [];
        const categories = Array.isArray(parsed)
          ? [...new Set(parsed.filter(
              (name) =>
                typeof name === 'string' &&
                name.length > 0 &&
                name.length <= 10
            ))]
          : [];

        setCustomCategories(categories);
        setCategoryStoreReady(categoryStorageKey);
      })
      .catch((error) => {
        console.warn('카테고리 불러오기 실패:', error);
      });

    return () => {
      active = false;
    };
  }, [categoryStorageKey]);

  // 목록을 불러온 이후에만 변경 내용을 저장
  useEffect(() => {
    if (
      !categoryStorageKey ||
      categoryStoreReady !== categoryStorageKey
    ) {
      return;
    }

    AsyncStorage.setItem(
      categoryStorageKey,
      JSON.stringify(customCategories)
    ).catch((error) => {
      console.warn('카테고리 저장 실패:', error);
    });
  }, [categoryStorageKey, categoryStoreReady, customCategories]);
  const addTransaction = useCallback(
    ({
      title,
      amount,
      date,
      category,
      icon,
      source,
      items,
    }) => {
      const entry = {
        id: makeId('t'),
        title,
        amount: parseAmount(amount),
        date,
        category:
          category ?? spendingData.defaultCategory,
        icon:
          icon ?? spendingData.defaultIcon,
        ...(source ? { source } : {}),
        ...(items ? { items } : {}),
      };

      setTransactions((prev) => [entry, ...prev]);
    },
    []
  );

  const updateTransaction = useCallback((id, patch) => {
    const safePatch =
      'amount' in patch
        ? {
            ...patch,
            amount: parseAmount(patch.amount),
          }
        : patch;

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id
          ? { ...transaction, ...safePatch }
          : transaction
      )
    );
  }, []);

  const removeTransaction = useCallback((id) => {
    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== id)
    );
  }, []);

  // =====================================
  // 4. 냉장고 데이터
  // =====================================

  const [fridgeItems, setFridgeItems] = useState(
    fridgeData.items
  );

  const addFridgeItem = useCallback(
    ({
      name,
      quantity,
      unit,
      purchaseDate,
      expiry,
    }) => {
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
    },
    []
  );

  const updateFridgeItem = useCallback(
    (
      id,
      {
        name,
        quantity,
        unit,
        purchaseDate,
        expiry,
      }
    ) => {
      setFridgeItems((prev) =>
        prev.map((item) =>
          item.id !== id
            ? item
            : {
                ...item,
                name,
                amount: quantity,
                unit,
                quantity: `${quantity}${unit}${
                  item.detail
                    ? ` · ${item.detail}`
                    : ''
                }`,
                purchaseDate,
                expiry,
              }
        )
      );
    },
    []
  );

  const removeFridgeItem = useCallback((id) => {
    setFridgeItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }, []);

  // =====================================
  // 5. 할 일 데이터
  // =====================================

  const [todos, setTodos] = useState(() => {
    const today = toDateString(new Date());

    return todoData.items.map(
      ({ daysFromToday, ...todo }) => ({
        ...todo,
        due:
          daysFromToday == null
            ? null
            : addDays(today, daysFromToday),
      })
    );
  });

  // 로그인 계정별 할 일 로컬 저장소
  const todoStorageKey = sharedReceipts
    ? (sharedUid ? `todos:${sharedUid}` : null)
    : 'todos:local';

  const [todoStoreReady, setTodoStoreReady] = useState(null);

  // 앱 시작 또는 계정 변경 시 저장된 할 일 복원
  useEffect(() => {
    let active = true;
    setTodoStoreReady(null);
    setTodos([]);

    if (!todoStorageKey) {
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(todoStorageKey)
      .then((raw) => {
        if (!active) return;

        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) {
            throw new Error('할 일 저장 데이터 형식이 잘못되었습니다.');
          }
          setTodos(parsed);
        } else {
          const today = toDateString(new Date());
          setTodos(
            todoData.items.map(({ daysFromToday, ...todo }) => ({
              ...todo,
              due: daysFromToday == null
                ? null
                : addDays(today, daysFromToday),
            }))
          );
        }

        setTodoStoreReady(todoStorageKey);
      })
      .catch((error) => {
        console.warn('할 일 불러오기 실패:', error);
      });

    return () => {
      active = false;
    };
  }, [todoStorageKey]);

  // 복원이 끝난 후에만 저장해서 기존 기록 덮어쓰기 방지
  useEffect(() => {
    if (!todoStorageKey || todoStoreReady !== todoStorageKey) {
      return;
    }

    AsyncStorage.setItem(
      todoStorageKey,
      JSON.stringify(todos)
    ).catch((error) => {
      console.warn('할 일 저장 실패:', error);
    });
  }, [todoStorageKey, todoStoreReady, todos]);
  const addTodo = useCallback(({ title, due }) => {
    setTodos((prev) => [
      ...prev,
      {
        id: makeId('td'),
        title,
        due,
        done: false,
      },
    ]);
  }, []);

  // 사용자가 선택한 할 일 삭제
  const removeTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.filter((todo) => todo.id !== id)
    );
  }, []);
  const toggleTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? { ...todo, done: !todo.done }
          : todo
      )
    );
  }, []);

  // =====================================
  // 6. 루틴 데이터
  // =====================================

  const [routines, setRoutines] = useState(
    routineData.items
  );

  const routineDay = useRef(
    toDateString(new Date())
  );

  const resetRoutinesIfNewDay = useCallback(() => {
    const today = toDateString(new Date());

    if (routineDay.current === today) {
      return;
    }

    routineDay.current = today;

    setRoutines(clearRoutineChecks);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          resetRoutinesIfNewDay();
        }
      }
    );

    const timer = setInterval(
      resetRoutinesIfNewDay,
      60 * 1000
    );

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [resetRoutinesIfNewDay]);

  const addRoutine = useCallback(
    ({ title, time }) => {
      resetRoutinesIfNewDay();

      setRoutines((prev) => [
        ...prev,
        {
          id: makeId('r'),
          title,
          time,
          doneToday: false,
        },
      ]);
    },
    [resetRoutinesIfNewDay]
  );

  const toggleRoutine = useCallback(
    (id) => {
      resetRoutinesIfNewDay();

      setRoutines((prev) =>
        prev.map((routine) =>
          routine.id === id
            ? {
                ...routine,
                doneToday: !routine.doneToday,
              }
            : routine
        )
      );
    },
    [resetRoutinesIfNewDay]
  );

  // =====================================
  // 7. 사용자 프로필
  // =====================================

  const [profile, setProfile] = useState(
    profileData.initial
  );

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);

  // =====================================
  // 8. 생활정보 - 연규 UIUX 추가
  // =====================================

  const [lifeData, setLifeData] = useState(
    lifeDataForm.initial
  );

  const updateLifeData = useCallback((patch) => {
    setLifeData((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);

  // =====================================
  // 9. 앱 설정
  // =====================================

  const [settings, setSettings] = useState(
    settingsData.initial
  );

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // =====================================
  // 10. 전체 데이터 공유
  // =====================================

  const value = useMemo(
    () => ({
      // 공용 Firestore 조회
      sharedReceipts,
      sharedUid,
      visibleShared,
      refreshShared,

      // 소비
      transactions,
      customCategories,
      addCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,

      // 월 예산
      budget,
      setBudget,

      // 냉장고
      fridgeItems,
      addFridgeItem,
      updateFridgeItem,
      removeFridgeItem,

      // 할 일
      todos,
      addTodo,
      removeTodo,
      toggleTodo,

      // 루틴
      routines,
      addRoutine,
      toggleRoutine,

      // 사용자 프로필
      profile,
      updateProfile,

      // 사용자 생활정보
      lifeData,
      updateLifeData,

      // 설정
      settings,
      updateSetting,
    }),
    [
      sharedReceipts,
      sharedUid,
      visibleShared,
      refreshShared,

      transactions,
      customCategories,
      addCategory,
      addTransaction,
      updateTransaction,
      removeTransaction,

      budget,
      setBudget,

      fridgeItems,
      addFridgeItem,
      updateFridgeItem,
      removeFridgeItem,

      todos,
      addTodo,
      removeTodo,
      toggleTodo,

      routines,
      addRoutine,
      toggleRoutine,

      profile,
      updateProfile,

      lifeData,
      updateLifeData,

      settings,
      updateSetting,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

// =====================================
// 11. 데이터 사용 Hook
// =====================================

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error(
      'useAppData는 AppDataProvider 내부에서 사용해야 합니다.'
    );
  }

  return context;
}
