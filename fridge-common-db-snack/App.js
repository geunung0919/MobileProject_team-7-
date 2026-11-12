// Team UI + refrigerator (no login) | Expo Snack SDK 54 | AI is a local mock; inventory notifications use native local scheduling.
import External0 from "react";
import * as External1 from "react-native";
import External2 from "@react-native-async-storage/async-storage";
import * as External3 from "expo-notifications";
import * as External4 from "@react-navigation/native";
import * as External5 from "@expo-google-fonts/noto-sans-kr";
import * as External6 from "react-native-safe-area-context";
import * as External7 from "@react-navigation/native-stack";
import * as External8 from "@react-navigation/bottom-tabs";
import {Ionicons as IconIonicons,MaterialCommunityIcons as IconMaterialCommunityIcons} from '@expo/vector-icons';
const __modules={"IntegrationApp.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = App;
var _InventoryNotificationObserver = _interopRequireDefault(__load("integration/InventoryNotificationObserver.js"));
var _react = _interopRequireDefault(__load("react"));
var _notoSansKr = __load("@expo-google-fonts/noto-sans-kr");
var _reactNative = __load("react-native");
var _native = __load("@react-navigation/native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _AppProvider = __load("module3/state/AppProvider.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _RootNavigator = _interopRequireDefault(__load("src/navigation/RootNavigator.js"));
var _router = __load("integration/router.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function App() {
  const [loaded, error] = (0, _notoSansKr.useFonts)({
    NotoSansKR_400Regular: _notoSansKr.NotoSansKR_400Regular,
    NotoSansKR_500Medium: _notoSansKr.NotoSansKR_500Medium,
    NotoSansKR_700Bold: _notoSansKr.NotoSansKR_700Bold
  });
  if (!loaded && !error) return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ActivityIndicator, {
    color: "#2F8A5B"
  }));
  return /*#__PURE__*/_react.default.createElement(_reactNativeSafeAreaContext.SafeAreaProvider, null, /*#__PURE__*/_react.default.createElement(_reactNative.StatusBar, {
    barStyle: "dark-content"
  }), /*#__PURE__*/_react.default.createElement(_AppProvider.AppProvider, null, /*#__PURE__*/_react.default.createElement(_AppDataContext.AppDataProvider, null, /*#__PURE__*/_react.default.createElement(_native.NavigationContainer, {
    ref: _router.navigationRef,
    onReady: _router.flushPendingNavigation
  }, /*#__PURE__*/_react.default.createElement(_RootNavigator.default, null), /*#__PURE__*/_react.default.createElement(_InventoryNotificationObserver.default, null)))));
}
},
"integration/InventoryNotificationObserver.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = InventoryNotificationObserver;
var _react = __load("react");
var _reactNative = __load("react-native");
var _AppProvider = __load("module3/state/AppProvider.js");
var _inventoryNotifications = __load("module3/services/inventoryNotifications.js");
var _router = __load("integration/router.js");
function InventoryNotificationObserver() {
  const {
    state
  } = (0, _AppProvider.useApp)();
  const latest = (0, _react.useRef)(state);
  latest.current = state;
  const [error, setError] = (0, _react.useState)('');
  (0, _react.useEffect)(() => {
    if (!_inventoryNotifications.supported) return;
    let active = true;
    const refresh = () => {
      const s = latest.current;
      (0, _inventoryNotifications.syncInventoryNotifications)(s.inventory, s.alertSettings).then(r => {
        if (active) setError(r.permissionDenied ? '휴대폰 설정에서 알림 권한을 허용해 주세요.' : r.omitted ? `예약 한도로 ${r.omitted}건이 예약되지 않았어요.` : '');
      }).catch(e => {
        if (active) setError(e.message);
      });
    };
    refresh();
    const sub = _reactNative.AppState.addEventListener('change', s => {
      if (s === 'active') refresh();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [state.inventory, state.alertSettings]);
  (0, _react.useEffect)(() => {
    if (!_inventoryNotifications.supported) return;
    return (0, _inventoryNotifications.observeInventoryNotifications)(() => _router.router.toFridge());
  }, []);
  return error ? /*#__PURE__*/React.createElement(_reactNative.View, {
    style: {
      backgroundColor: '#fff2e8',
      padding: 8
    }
  }, /*#__PURE__*/React.createElement(_reactNative.Text, {
    accessibilityRole: "alert"
  }, "\uC54C\uB9BC \uC608\uC57D \uD655\uC778: ", error)) : null;
}
},
"module3/state/AppProvider.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppProvider = AppProvider;
exports.useApp = exports.newId = void 0;
var _inventoryCommands = __load("module3/domain/inventoryCommands.mjs");
var _inventoryFields = __load("module3/domain/inventoryFields.mjs");
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _asyncStorage = _interopRequireDefault(__load("@react-native-async-storage/async-storage"));
var _seed = __load("module3/data/seed.js");
var _shopping = __load("module3/domain/shopping.mjs");
var _inventory = __load("module3/domain/inventory.mjs");
var _persistentStore = __load("module3/state/persistentStore.mjs");
var _nonAi = __load("module3/domain/nonAi.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
const Context = (0, _react.createContext)(null);
const KEY = 'module3.ui.gyu0201.snack.v1';
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
exports.newId = newId;
function AppProvider({
  children
}) {
  const [state, setState] = (0, _react.useState)(null);
  const [error, setError] = (0, _react.useState)('');
  const store = (0, _react.useRef)(null);
  (0, _react.useEffect)(() => {
    let active = true;
    _asyncStorage.default.getItem(KEY).then(raw => {
      const value = raw ? JSON.parse(raw) : (0, _seed.initialState)();
      if (!Array.isArray(value.inventory) || !Array.isArray(value.meals) || !Array.isArray(value.shopping)) throw new Error('invalid');
      const migrated = {
        ...value,
        inventoryEvents: value.inventoryEvents || [],
        usages: value.usages || [],
        conditions: {
          ..._nonAi.defaultConditions,
          ...value.conditions
        },
        alertSettings: {
          ..._nonAi.defaultAlertSettings,
          ...value.alertSettings
        },
        discards: value.discards || [],
        undo: value.undo || null,
        processedIds: value.processedIds || []
      };
      if (!active) return;
      store.current = (0, _persistentStore.createPersistentStore)(migrated, next => _asyncStorage.default.setItem(KEY, JSON.stringify(next)), next => {
        if (active) setState(next);
      });
      setState(migrated);
    }).catch(() => {
      if (active) setError('저장 데이터를 읽지 못했어요. 앱을 다시 실행해 주세요.');
    });
    return () => {
      active = false;
    };
  }, []);
  async function update(fn) {
    try {
      const result = await store.current.update(fn);
      setError('');
      return result;
    } catch (e) {
      setError(e.message || '저장하지 못했어요. 다시 시도해 주세요.');
      throw e;
    }
  }
  const api = {
    state,
    error,
    saveItem: item => update(s => (0, _inventoryCommands.executeInventoryCommand)(s, {
      type: 'inventory.save',
      requestId: newId(),
      payload: {
        item
      }
    })),
    registerReceiptItem: (input, requestId = newId()) => update(s => (0, _inventoryCommands.executeInventoryCommand)(s, {
      type: 'receipt.register',
      requestId,
      payload: input
    })),
    saveConditions: input => update(s => ({
      ...s,
      conditions: (0, _nonAi.conditions)(input)
    })),
    saveAlertSettings: input => update(s => ({
      ...s,
      alertSettings: (0, _nonAi.alertSettings)(input)
    })),
    useItem: (id, amount, requestId) => update(s => (0, _inventoryCommands.executeInventoryCommand)(s, {
      type: 'inventory.use',
      requestId,
      payload: {
        id,
        quantity: amount
      }
    })),
    confirmHousehold: id => update(s => {
      const item = s.inventory.find(i => i.id === id);
      if (!item) throw new Error('재고가 없어요.');
      return (0, _nonAi.saveInventory)(s, {
        ...item,
        lastConfirmedAt: new Date().toISOString()
      }, newId());
    }),
    deleteItem: id => update(s => (0, _nonAi.logChange)({
      ...s,
      undo: null,
      inventory: s.inventory.filter(i => i.id !== id)
    }, 'delete', s.inventory.find(i => i.id === id), null, newId())),
    recordMeal: (recipe, usage, id) => update(s => (0, _inventoryCommands.executeInventoryCommand)(s, {
      type: 'meal.complete',
      requestId: id,
      payload: {
        recipe,
        usage
      }
    })),
    discardItem: (batchId, amount, reason, id) => update(s => (0, _inventoryCommands.executeInventoryCommand)(s, {
      type: 'inventory.discard',
      requestId: id,
      payload: {
        id: batchId,
        quantity: amount,
        reason
      }
    })),
    undoLatest: id => update(s => (0, _inventoryCommands.executeInventoryCommand)(s, {
      type: 'inventory.undo',
      requestId: newId(),
      payload: {
        operationId: id
      }
    })),
    addShopping: items => update(s => ({
      ...s,
      shopping: (0, _shopping.mergeShopping)(s.shopping, items, newId)
    })),
    registerShopping: (shoppingId, item) => update(s => {
      const now = new Date().toISOString(),
        record = {
          ...(0, _inventoryFields.inventoryRecord)(item, item.id || newId()),
          createdAt: now,
          updatedAt: now,
          version: 1
        };
      return (0, _nonAi.logChange)((0, _shopping.registerPurchased)(s, shoppingId, record), 'create', null, record, newId(), now);
    }),
    removeShoppingRecipe: recipeId => update(s => ({
      ...s,
      shopping: (0, _shopping.removeShoppingRecipe)(s.shopping, recipeId)
    })),
    editShopping: (id, input) => update(s => {
      const original = s.shopping.find(i => i.id === id);
      if (!original || original.inventoryId) throw new Error('수정할 수 없는 품목이에요.');
      const item = (0, _shopping.editShoppingItem)(original, input);
      if (s.shopping.some(i => i.id !== id && !i.done && i.name === item.name && i.unit === item.unit)) throw new Error('같은 이름과 단위의 미구매 품목이 있어요. 해당 품목을 수정해 주세요.');
      return {
        ...s,
        shopping: s.shopping.map(i => i.id === id ? {
          ...i,
          ...item
        } : i)
      };
    }),
    toggleShopping: id => update(s => ({
      ...s,
      shopping: s.shopping.map(i => i.id === id ? {
        ...i,
        done: !i.done
      } : i)
    })),
    deleteShopping: id => update(s => ({
      ...s,
      shopping: s.shopping.filter(i => i.id !== id)
    }))
  };
  api.addMissing = recipe => update(s => ({
    ...s,
    shopping: (0, _shopping.replaceRecipeShopping)(s.shopping, (0, _inventory.shortages)(s.inventory, recipe), recipe, newId)
  }));
  if (!state) return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, error ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, error) : /*#__PURE__*/_react.default.createElement(_reactNative.ActivityIndicator, null));
  return /*#__PURE__*/_react.default.createElement(Context.Provider, {
    value: api
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    }
  }, error ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityRole: "alert",
    style: {
      padding: 12,
      color: "#9B2929",
      backgroundColor: "#FFF2EE"
    }
  }, error) : null, children));
}
const useApp = () => (0, _react.useContext)(Context);
exports.useApp = useApp;
},
"module3/domain/inventoryCommands.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeInventoryCommand = executeInventoryCommand;
var _inventoryFields = __load("module3/domain/inventoryFields.mjs");
var _nonAi = __load("module3/domain/nonAi.mjs");
var _transactions = __load("module3/domain/transactions.mjs");
var _receiptInventory = __load("module3/domain/receiptInventory.mjs");
// Pure command handler: no React, AsyncStorage, Firebase SDK or credentials.
// Server must authenticate the user, read current state, execute this inside
// its transaction and persist all affected records atomically.

function executeInventoryCommand(state, command, {
  now = new Date().toISOString()
} = {}) {
  const {
    type,
    requestId,
    payload = {}
  } = command;
  if (typeof requestId !== 'string' || !requestId.trim()) throw new Error('요청 ID가 필요해요.');
  if ((state.processedIds || []).includes(requestId)) return state;
  let next;
  switch (type) {
    case 'inventory.save':
      {
        const before = state.inventory.find(i => i.id === payload.item?.id);
        if (payload.expectedVersion !== undefined && (before?.version || 0) !== payload.expectedVersion) throw new Error('재고가 변경되었어요. 새로 조회해 주세요.');
        const item = (0, _inventoryFields.inventoryRecord)(payload.item, payload.item?.id || requestId, before || {});
        next = (0, _nonAi.saveInventory)(state, item, requestId, now);
        break;
      }
    case 'inventory.use':
      next = (0, _nonAi.useInventory)(state, payload.id, payload.quantity, requestId, now);
      break;
    case 'inventory.discard':
      next = (0, _transactions.applyDiscard)(state, payload.id, payload.quantity, payload.reason || '', requestId, now);
      break;
    case 'meal.complete':
      next = (0, _transactions.applyMeal)(state, payload.recipe, payload.usage, requestId, now);
      break;
    case 'inventory.undo':
      next = (0, _nonAi.logChange)((0, _transactions.undoLatest)(state, payload.operationId), 'undo', null, {
        id: payload.operationId
      }, requestId, now);
      break;
    case 'receipt.register':
      next = (0, _receiptInventory.registerReceiptInventory)(state, payload, requestId, requestId);
      break;
    default:
      throw new Error('지원하지 않는 재고 명령이에요.');
  }
  if (next === state) return state;
  return {
    ...next,
    processedIds: [...new Set([...(next.processedIds || []), requestId])]
  };
}
},
"module3/domain/inventoryFields.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STORAGE_METHODS = exports.DATE_TYPES = void 0;
exports.inventoryDraft = inventoryDraft;
exports.inventoryRecord = inventoryRecord;
exports.validateInventoryDraft = validateInventoryDraft;
var _foodUnits = __load("module3/domain/foodUnits.mjs");
var _transactions = __load("module3/domain/transactions.mjs");
var _inventory = __load("module3/domain/inventory.mjs");
const STORAGE_METHODS = exports.STORAGE_METHODS = [{
  value: 'refrigerated',
  label: '냉장'
}, {
  value: 'frozen',
  label: '냉동'
}, {
  value: 'room',
  label: '실온'
}];
const DATE_TYPES = exports.DATE_TYPES = [{
  value: 'package',
  label: '포장지 표시 소비기한'
}, {
  value: 'reference',
  label: '직접 설정한 보관 참고일'
}];

// 과거 데이터의 구매일/날짜 출처를 추측하지 않습니다.
function inventoryDraft(item, today = (0, _inventory.dayKey)()) {
  return {
    category: item?.category || 'food',
    openedAt: item?.openedAt || '',
    reviewDays: String(item?.reviewDays || 7),
    name: item?.name ?? '',
    quantity: item ? String(item.quantity) : '',
    unit: item?.unit ?? '개',
    purchasedAt: item ? item.purchasedAt ?? '' : today,
    expiresAt: item?.expiresAt ?? today,
    storageMethod: item?.storageMethod ?? '',
    dateType: item?.dateType ?? '',
    remainingCost: item?.remainingCost == null ? '' : String(item.remainingCost)
  };
}
function validateInventoryDraft(draft, today = (0, _inventory.dayKey)()) {
  if (!draft.name.trim()) return '식재료명을 입력해 주세요.';
  try {
    (0, _transactions.quantity)(draft.quantity);
  } catch (e) {
    return e.message;
  }
  if (!draft.unit.trim()) return '단위를 입력해 주세요.';
  if (!(0, _inventory.validDate)(draft.purchasedAt)) return '구매일을 YYYY-MM-DD 형식의 올바른 날짜로 입력해 주세요.';
  if (draft.purchasedAt > today) return '구매일은 오늘 이후로 설정할 수 없어요.';
  if ((draft.category !== 'household' || draft.expiresAt) && !(0, _inventory.validDate)(draft.expiresAt)) return '소비기한 또는 보관 참고일을 올바른 날짜로 입력해 주세요.';
  if (!STORAGE_METHODS.some(option => option.value === draft.storageMethod)) return '보관 방법을 선택해 주세요.';
  if (!DATE_TYPES.some(option => option.value === draft.dateType)) return '날짜 유형을 선택해 주세요.';
  if (draft.remainingCost != null && draft.remainingCost !== '' && (!/^\d+$/.test(String(draft.remainingCost)) || !Number.isSafeInteger(Number(draft.remainingCost)))) return '구매 금액은 0 이상의 정수(원)로 입력해 주세요.';
  if (draft.category && !['food', 'household'].includes(draft.category)) return '분류를 확인해 주세요.';
  if (draft.openedAt && (!(0, _inventory.validDate)(draft.openedAt) || draft.openedAt > today || draft.openedAt < draft.purchasedAt)) return '개봉일은 구매일부터 오늘 사이의 날짜여야 해요.';
  if (draft.reviewDays != null && (!/^\d+$/.test(String(draft.reviewDays)) || Number(draft.reviewDays) < 1 || Number(draft.reviewDays) > 365)) return '확인 주기는 1~365일로 입력해 주세요.';
  // 기한이 지난 재고도 등록 가능하며 자동 폐기하지 않습니다.
  return '';
}
function inventoryRecord(draft, id, previous = {}) {
  if (!draft || typeof draft.name !== 'string' || typeof draft.unit !== 'string') throw new Error('식재료명과 단위를 확인해 주세요.');
  draft = (0, _foodUnits.normalizeFoodDraft)(draft);
  const error = validateInventoryDraft(draft);
  if (error) throw new Error(error);
  return {
    ...previous,
    ...draft,
    id,
    reviewDays: Number(draft.reviewDays || 7),
    name: draft.name.trim(),
    unit: draft.unit.trim(),
    quantity: Number(draft.quantity),
    remainingCost: draft.remainingCost == null || draft.remainingCost === '' ? null : Number(draft.remainingCost)
  };
}
},
"module3/domain/foodUnits.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.foodUnit = foodUnit;
exports.normalizeFoodDraft = normalizeFoodDraft;
var _ingredientCatalog = __load("module3/domain/ingredientCatalog.mjs");
function foodUnit(name) {
  const i = (0, _ingredientCatalog.exactIngredient)(name);
  return i ? {
    name: i.name,
    unit: i.unit
  } : null;
}
function normalizeFoodDraft(draft) {
  const match = draft.category === 'household' ? null : foodUnit(draft.name);
  let unit = String(draft.unit || '').trim(),
    quantity = draft.quantity;
  // Only exact metric conversions. A pack, bowl, piece or bottle has no assumed weight.
  if (unit === 'kg' || unit === 'L' || unit === 'l') {
    const n = Number(quantity);
    if (String(quantity).trim() !== '' && Number.isFinite(n) && n >= 0) {
      quantity = String(Math.round(n * 1000 * 1000000) / 1000000);
      unit = unit === 'kg' ? 'g' : 'ml';
    }
  }
  return {
    ...draft,
    ingredientId: draft.category === 'household' ? null : (0, _ingredientCatalog.exactIngredient)(draft.name)?.id || null,
    name: match?.name || draft.name,
    unit,
    quantity
  };
}
},
"module3/domain/ingredientCatalog.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exactIngredient = exactIngredient;
exports.ingredientCatalog = void 0;
exports.suggestIngredients = suggestIngredients;
// Small app-owned vocabulary. Exact aliases normalize; partial matches require selection.
const ingredientCatalog = exports.ingredientCatalog = [['rice', '밥', '공기', ['흰밥', '쌀밥']], ['egg', '달걀', '개', ['계란']], ['tofu', '두부', '모', []], ['kimchi', '김치', 'g', []], ['spaghetti', '스파게티면', 'g', ['스파게티 면']], ['tomato-sauce', '토마토소스', 'g', ['토마토 소스']], ['garlic', '마늘', 'g', []], ['olive-oil', '올리브유', 'ml', ['올리브 오일', '올리브오일']], ['milk', '우유', 'ml', []], ['onion', '양파', '개', []], ['carrot', '당근', '개', []], ['potato', '감자', '개', []], ['green-onion', '대파', 'g', []], ['spinach', '시금치', 'g', []], ['tomato', '토마토', '개', []], ['apple', '사과', '개', []], ['chicken-breast', '닭가슴살', 'g', ['닭 가슴살']], ['pork', '돼지고기', 'g', []], ['beef', '소고기', 'g', ['쇠고기']], ['soy-sauce', '간장', 'ml', []], ['salt', '소금', 'g', []], ['sugar', '설탕', 'g', []], ['cooking-oil', '식용유', 'ml', []], ['gochujang', '고추장', 'g', []]].map(([id, name, unit, aliases]) => ({
  id,
  name,
  unit,
  aliases
}));
const key = value => String(value || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
function exactIngredient(name) {
  return ingredientCatalog.find(i => [i.name, ...i.aliases].some(n => key(n) === key(name))) || null;
}
function suggestIngredients(query) {
  const q = key(query);
  if (!q) return [];
  return ingredientCatalog.filter(i => [i.name, ...i.aliases].some(n => key(n).includes(q))).sort((a, b) => Number(exactIngredient(query)?.id === b.id) - Number(exactIngredient(query)?.id === a.id)).slice(0, 6);
}
},
"module3/domain/transactions.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.aggregateUsage = aggregateUsage;
exports.applyDiscard = applyDiscard;
exports.applyMeal = applyMeal;
exports.money = void 0;
exports.planMeal = planMeal;
exports.quantity = quantity;
exports.removeFromBatch = removeFromBatch;
exports.roundQuantity = void 0;
exports.undoLatest = undoLatest;
var _ingredientCatalog = __load("module3/domain/ingredientCatalog.mjs");
var _inventory = __load("module3/domain/inventory.mjs");
const roundQuantity = n => Math.round(n * 1e6) / 1e6;
exports.roundQuantity = roundQuantity;
function quantity(value, allowZero = false) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,6})?$/.test(text)) throw new Error('수량은 소수점 6자리 이내의 숫자로 입력해 주세요.');
  const n = Number(text);
  if (!Number.isFinite(n) || n > 1e9 || n < 0 || !allowZero && n === 0) throw new Error('수량은 0보다 크고 10억 이하여야 해요.');
  return n;
}
function removeFromBatch(item, amount, at = new Date().toISOString()) {
  const used = quantity(amount);
  if (used > item.quantity) throw new Error(`${item.name}의 재고가 부족해요.`);
  const left = roundQuantity(item.quantity - used);
  const known = Number.isSafeInteger(item.remainingCost) && item.remainingCost >= 0;
  const cost = known ? left === 0 ? item.remainingCost : Math.round(item.remainingCost * used / item.quantity) : null;
  return {
    item: {
      ...item,
      updatedAt: at,
      version: (item.version || 0) + 1,
      quantity: left,
      remainingCost: known ? item.remainingCost - cost : null
    },
    cost
  };
}
function aggregateUsage(rows) {
  if (!Array.isArray(rows)) throw new Error('사용량을 확인해 주세요.');
  const map = new Map();
  for (const row of rows) {
    const q = quantity(row.quantity, true);
    if (!row.name?.trim() || !row.unit?.trim()) throw new Error('재료명과 단위를 확인해 주세요.');
    if (!q) continue;
    const ingredientId = row.ingredientId || (0, _ingredientCatalog.exactIngredient)(row.name)?.id || null;
    const key = JSON.stringify([ingredientId || row.name, row.unit]);
    const prev = map.get(key);
    map.set(key, {
      ingredientId,
      name: row.name,
      unit: row.unit,
      quantity: roundQuantity((prev?.quantity || 0) + q)
    });
  }
  if (!map.size) throw new Error('한 가지 이상의 재료 사용량을 입력해 주세요.');
  return [...map.values()];
}
function planMeal(inventory, rows, today = (0, _inventory.dayKey)(), at = new Date().toISOString()) {
  const usage = aggregateUsage(rows);
  const next = inventory.map(i => ({
    ...i
  }));
  const changes = [];
  for (const row of usage) {
    let remaining = row.quantity;
    const batches = next.filter(i => i.category !== 'household' && (row.ingredientId ? (i.ingredientId || (0, _ingredientCatalog.exactIngredient)(i.name)?.id) === row.ingredientId : i.name === row.name) && i.unit === row.unit && (0, _inventory.daysLeft)(i.expiresAt, today) >= 0).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
    for (const batch of batches) {
      if (remaining <= 0) break;
      const amount = Math.min(batch.quantity, remaining);
      if (amount <= 0) continue;
      const result = removeFromBatch(batch, amount, at);
      changes.push({
        batchId: batch.id,
        name: batch.name,
        quantity: amount,
        unit: batch.unit,
        cost: result.cost
      });
      Object.assign(batch, result.item);
      remaining = roundQuantity(remaining - amount);
    }
    if (remaining > 0) throw new Error(`${row.name} ${remaining}${row.unit}가 부족해요. 사용량 또는 재고를 확인해 주세요.`);
  }
  return {
    inventory: next.filter(i => i.quantity > 0),
    usage,
    changes
  };
}
function applyMeal(state, recipe, rows, id, createdAt = new Date().toISOString(), today = (0, _inventory.dayKey)()) {
  if (state.meals.some(m => m.id === id) || (state.processedIds || []).includes(id)) return state;
  const plan = planMeal(state.inventory, rows, today, createdAt);
  return {
    ...state,
    inventory: plan.inventory,
    meals: [{
      id,
      recipeId: recipe.id,
      name: recipe.name,
      createdAt,
      usage: plan.usage,
      changes: plan.changes
    }, ...state.meals],
    processedIds: [...(state.processedIds || []), id],
    undo: {
      id,
      kind: 'meal',
      label: recipe.name,
      inventory: state.inventory,
      expectedInventory: plan.inventory
    }
  };
}
function applyDiscard(state, batchId, amount, reason, id, createdAt = new Date().toISOString()) {
  if ((state.processedIds || []).includes(id)) return state;
  const batch = state.inventory.find(i => i.id === batchId);
  if (!batch) throw new Error('재고를 찾을 수 없어요.');
  const q = quantity(amount);
  const result = removeFromBatch(batch, q, createdAt);
  return {
    ...state,
    inventory: state.inventory.map(i => i.id === batchId ? result.item : i).filter(i => i.quantity > 0),
    discards: [{
      id,
      batchId,
      name: batch.name,
      quantity: q,
      unit: batch.unit,
      cost: result.cost,
      reason,
      createdAt
    }, ...(state.discards || [])],
    processedIds: [...(state.processedIds || []), id],
    undo: {
      id,
      kind: 'discard',
      label: batch.name,
      inventory: state.inventory,
      expectedInventory: state.inventory.map(i => i.id === batchId ? result.item : i).filter(i => i.quantity > 0)
    }
  };
}
function undoLatest(state, id) {
  if (!state.undo || state.undo.id !== id) throw new Error('이 작업은 더 이상 되돌릴 수 없어요.');
  if (!state.undo.expectedInventory) throw new Error('이전 버전 작업은 안전하게 되돌릴 수 없어요.');
  const before = state.undo.inventory,
    after = state.undo.expectedInventory;
  const affected = [...new Set([...before, ...after].map(i => i.id))].filter(key => JSON.stringify(before.find(i => i.id === key)) !== JSON.stringify(after.find(i => i.id === key)));
  for (const key of affected) {
    if (JSON.stringify(state.inventory.find(i => i.id === key)) !== JSON.stringify(after.find(i => i.id === key))) throw new Error('재고가 변경되어 되돌릴 수 없어요.');
  }
  const restored = state.inventory.filter(i => !affected.includes(i.id));
  for (const key of affected) {
    const old = before.find(i => i.id === key);
    if (old) restored.push({
      ...old,
      version: Math.max(old.version || 0, after.find(i => i.id === key)?.version || 0) + 1,
      updatedAt: new Date().toISOString()
    });
  }
  return {
    ...state,
    inventory: restored,
    undo: null,
    meals: state.undo.kind === 'meal' ? state.meals.filter(m => m.id !== id) : state.meals,
    usages: state.undo.kind === 'use' ? (state.usages || []).filter(u => u.id !== id) : state.usages || [],
    discards: state.undo.kind === 'discard' ? state.discards.filter(d => d.id !== id) : state.discards
  };
}
const money = value => value == null ? '금액 미입력' : `${value.toLocaleString('ko-KR')}원`;
exports.money = money;
},
"module3/domain/inventory.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.available = available;
exports.consume = consume;
exports.dayKey = dayKey;
exports.daysLeft = daysLeft;
exports.rankRecipes = rankRecipes;
exports.sameIngredient = sameIngredient;
exports.shortages = shortages;
exports.validDate = validDate;
var _ingredientCatalog = __load("module3/domain/ingredientCatalog.mjs");
function sameIngredient(a, b) {
  const x = a.ingredientId || (0, _ingredientCatalog.exactIngredient)(a.name)?.id;
  const y = b.ingredientId || (0, _ingredientCatalog.exactIngredient)(b.name)?.id;
  return x && y ? x === y : a.name === b.name;
}
function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
function daysLeft(value, today = dayKey()) {
  const utc = s => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(value) - utc(today)) / 86400000);
}
function available(inventory, ingredient, today = dayKey()) {
  return inventory.filter(i => i.category !== 'household' && sameIngredient(i, ingredient) && i.unit === ingredient.unit && daysLeft(i.expiresAt, today) >= 0).reduce((s, i) => s + i.quantity, 0);
}
function shortages(inventory, recipe, today = dayKey()) {
  return recipe.ingredients.map(i => ({
    ...i,
    quantity: Math.max(0, i.quantity - available(inventory, i, today))
  })).filter(i => i.quantity > 0);
}
function consume(inventory, recipe, today = dayKey()) {
  if (shortages(inventory, recipe, today).length) throw new Error('재료가 부족하거나 소비기한이 지났어요.');
  const next = inventory.map(i => ({
    ...i
  }));
  for (const ingredient of recipe.ingredients) {
    let remaining = ingredient.quantity;
    const batches = next.filter(i => i.category !== 'household' && sameIngredient(i, ingredient) && i.unit === ingredient.unit && daysLeft(i.expiresAt, today) >= 0).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
    for (const batch of batches) {
      const used = Math.min(remaining, batch.quantity);
      batch.quantity -= used;
      remaining -= used;
      if (remaining <= 0) break;
    }
  }
  return next.filter(i => i.quantity > 0);
}
function rankRecipes(inventory, recipes) {
  return recipes.map(recipe => {
    const missing = shortages(inventory, recipe);
    const urgent = recipe.ingredients.filter(g => inventory.some(i => sameIngredient(i, g) && i.unit === g.unit && i.quantity > 0 && daysLeft(i.expiresAt) >= 0 && daysLeft(i.expiresAt) <= 3)).length;
    return {
      ...recipe,
      missing,
      score: 100 - missing.length * 25 + urgent * 10
    };
  }).sort((a, b) => b.score - a.score);
}
},
"module3/domain/nonAi.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.INVENTORY_ALERT_OWNER = void 0;
exports.alertSettings = alertSettings;
exports.conditions = conditions;
exports.defaultConditions = exports.defaultAlertSettings = void 0;
exports.householdForecast = householdForecast;
exports.inventoryAlertPlan = inventoryAlertPlan;
exports.logChange = logChange;
exports.matchesConditions = matchesConditions;
exports.monthlyWaste = monthlyWaste;
exports.normalizeName = void 0;
exports.reconcileAlerts = reconcileAlerts;
exports.saveInventory = saveInventory;
exports.stockMatches = stockMatches;
exports.useInventory = useInventory;
var _inventory = __load("module3/domain/inventory.mjs");
var _transactions = __load("module3/domain/transactions.mjs");
const defaultConditions = exports.defaultConditions = {
  tools: ['pan'],
  maxMinutes: 0,
  budget: null,
  energy: 'normal',
  excluded: '',
  onePan: false,
  minCleanup: false
};
const defaultAlertSettings = exports.defaultAlertSettings = {
  enabled: false,
  days: [3, 1],
  hour: 9,
  minute: 0
};
function conditions(input) {
  const c = {
    ...defaultConditions,
    ...input
  };
  if (!Array.isArray(c.tools) || !c.tools.length || c.tools.some(x => !['pan', 'microwave', 'pot'].includes(x))) throw new Error('사용 가능한 조리 도구를 선택해 주세요.');
  c.maxMinutes = Number(c.maxMinutes);
  if (!Number.isInteger(c.maxMinutes) || c.maxMinutes < 0 || c.maxMinutes > 240) throw new Error('시간은 0~240분으로 입력해 주세요. 0은 제한 없음이에요.');
  c.budget = c.budget === '' || c.budget == null ? null : Number(c.budget);
  if (c.budget !== null && (!Number.isSafeInteger(c.budget) || c.budget < 0)) throw new Error('예산은 0 이상의 정수로 입력해 주세요.');
  if (!['normal', 'low'].includes(c.energy)) throw new Error('체력 설정을 확인해 주세요.');
  c.excluded = String(c.excluded || '').trim();
  return c;
}
const normalizeName = name => String(name).normalize('NFKC').replace(/계란/g, '달걀').replace(/\s/g, '').toLowerCase();
exports.normalizeName = normalizeName;
function matchesConditions(recipe, input) {
  const c = conditions(input),
    excluded = c.excluded.split(/[,\n]/).map(x => normalizeName(x)).filter(Boolean);
  if (excluded.some(x => recipe.ingredients.some(i => normalizeName(i.name).includes(x)))) return false;
  if (c.maxMinutes && recipe.minutes > c.maxMinutes) return false;
  if (!recipe.tools?.length || recipe.tools.some(t => !c.tools.includes(t))) return false;
  if (c.onePan && !recipe.onePan || c.minCleanup && !recipe.minCleanup) return false;
  if (c.energy === 'low' && (!recipe.minCleanup || recipe.minutes > 15)) return false;
  // 검증된 비용 정보가 없는 요리는 예산 충족을 보장하지 않습니다.
  if (c.budget !== null && (!Number.isFinite(recipe.estimatedCost) || recipe.estimatedCost > c.budget)) return false;
  return true;
}
function logChange(state, kind, before, after, id, at = new Date().toISOString()) {
  return {
    ...state,
    inventoryEvents: [{
      id,
      kind,
      batchId: (after || before)?.id,
      before: before || null,
      after: after || null,
      at
    }, ...(state.inventoryEvents || [])]
  };
}
function saveInventory(state, item, id, at) {
  const before = state.inventory.find(i => i.id === item.id);
  const now = at || new Date().toISOString();
  const next = {
    ...item,
    version: (before?.version || 0) + 1,
    updatedAt: now,
    createdAt: before?.createdAt || item.createdAt || now
  };
  return logChange({
    ...state,
    undo: null,
    inventory: before ? state.inventory.map(i => i.id === item.id ? next : i) : [...state.inventory, next]
  }, before ? 'edit' : 'create', before, next, id, now);
}
function useInventory(state, batchId, amount, id, at = new Date().toISOString()) {
  if ((state.processedIds || []).includes(id)) return state;
  const before = state.inventory.find(i => i.id === batchId);
  if (!before) throw new Error('재고를 찾을 수 없어요.');
  const q = (0, _transactions.quantity)(amount),
    result = (0, _transactions.removeFromBatch)(before, q, at);
  const after = {
    ...result.item,
    updatedAt: at
  };
  return logChange({
    ...state,
    inventory: state.inventory.map(i => i.id === batchId ? after : i).filter(i => i.quantity > 0),
    usages: [{
      id,
      batchId,
      name: before.name,
      unit: before.unit,
      quantity: q,
      cost: result.cost,
      at
    }, ...(state.usages || [])],
    processedIds: [...(state.processedIds || []), id],
    undo: {
      id,
      kind: 'use',
      label: before.name,
      inventory: state.inventory,
      expectedInventory: state.inventory.map(i => i.id === batchId ? after : i).filter(i => i.quantity > 0)
    }
  }, 'use', before, after, id, at);
}
function monthlyWaste(discards, month) {
  if (!/^\d{4}-\d{2}$/.test(month) || Number(month.slice(5)) < 1 || Number(month.slice(5)) > 12) throw new Error('월은 YYYY-MM 형식으로 입력해 주세요.');
  const rows = discards.filter(d => (0, _inventory.dayKey)(new Date(d.createdAt)).slice(0, 7) === month);
  return {
    rows,
    total: rows.reduce((sum, d) => sum + (Number.isSafeInteger(d.cost) ? d.cost : 0), 0),
    unknown: rows.filter(d => !Number.isSafeInteger(d.cost)).length
  };
}
function stockMatches(inventory, input) {
  return inventory.filter(i => i.quantity > 0 && normalizeName(i.name) === normalizeName(input.name));
}
function householdForecast(item, usages, now = new Date()) {
  const events = usages.filter(u => u.batchId === item.id && u.unit === item.unit && u.name === item.name).sort((a, b) => a.at.localeCompare(b.at));
  const last = events[events.length - 1];
  const anchor = [item.lastConfirmedAt, item.updatedAt, last?.at].filter(Boolean).sort().pop();
  const confirmedDate = anchor || item.updatedAt || item.createdAt;
  const due = new Date(confirmedDate || now);
  due.setDate(due.getDate() + (Number(item.reviewDays) || 7));
  if (events.length < 2) return {
    mode: 'manual',
    reviewAt: (0, _inventory.dayKey)(due)
  };
  const span = (new Date(last.at) - new Date(events[0].at)) / 86400000;
  if (span < 1) return {
    mode: 'manual',
    reviewAt: (0, _inventory.dayKey)(due)
  };
  const rate = events.slice(1).reduce((n, u) => n + u.quantity, 0) / span;
  if (!(rate > 0)) return {
    mode: 'manual',
    reviewAt: (0, _inventory.dayKey)(due)
  };
  const days = Math.max(0, (now - new Date(anchor)) / 86400000);
  return {
    mode: 'estimate',
    quantity: Math.max(0, Math.round((item.quantity - rate * days) * 100) / 100),
    dailyRate: rate,
    reviewAt: (0, _inventory.dayKey)(due)
  };
}
function alertSettings(input) {
  const value = {
    ...defaultAlertSettings,
    ...input
  };
  if (!Array.isArray(value.days) || !value.days.length || value.days.some(n => !Number.isInteger(n) || n < 0 || n > 30)) throw new Error('알림 기준일은 0~30일 사이로 선택해 주세요.');
  value.days = [...new Set(value.days)].sort((a, b) => b - a);
  value.hour = Number(value.hour);
  value.minute = Number(value.minute);
  if (!Number.isInteger(value.hour) || value.hour < 0 || value.hour > 23 || !Number.isInteger(value.minute) || value.minute < 0 || value.minute > 59) throw new Error('알림 시각을 확인해 주세요.');
  return value;
}
const INVENTORY_ALERT_OWNER = exports.INVENTORY_ALERT_OWNER = 'module3.inventory.v1';
function inventoryAlertPlan(inventory, settings, now = new Date()) {
  const s = alertSettings(settings);
  if (!s.enabled) return [];
  const result = [];
  for (const item of inventory) {
    if (item.quantity <= 0 || item.category === 'household' || !(0, _inventory.validDate)(item.expiresAt)) continue;
    for (const days of s.days) {
      const [y, m, d] = item.expiresAt.split('-').map(Number),
        date = new Date(y, m - 1, d - days, s.hour, s.minute);
      if (date <= now) continue;
      const key = JSON.stringify([item.id, item.expiresAt, days]);
      const label = item.dateType === 'package' ? '표시 소비기한' : '보관 참고일';
      result.push({
        key,
        at: date.toISOString(),
        title: `${item.name} ${label} ${days === 0 ? '당일' : `${days}일 전`}`,
        body: '날짜와 보관 상태를 확인하고 사용 계획을 세워 보세요.',
        batchId: item.id
      });
    }
  }
  return result.sort((a, b) => a.at.localeCompare(b.at));
}
// 이 소유자의 예약만 변경합니다. 실패하면 다음 동기화에서 다시 비교합니다.
async function reconcileAlerts(api, plan) {
  const existing = await api.list(),
    owned = existing.filter(n => n.content?.data?.owner === INVENTORY_ALERT_OWNER);
  const capacity = Math.max(0, 60 - (existing.length - owned.length));
  const desired = plan.slice(0, capacity),
    kept = new Set();
  let scheduled = 0;
  for (const n of owned) {
    const match = desired.find(p => p.key === n.content.data.key && p.at === n.content.data.at && p.title === n.content.title);
    if (!match || kept.has(match.key)) await api.cancel(n.identifier);else kept.add(match.key);
  }
  for (const p of desired) if (!kept.has(p.key)) {
    await api.schedule(p);
    scheduled++;
  }
  return {
    count: desired.length,
    omitted: plan.length - desired.length,
    scheduled
  };
}
},
"module3/domain/receiptInventory.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.receiptInventoryRecord = receiptInventoryRecord;
exports.registerReceiptInventory = registerReceiptInventory;
var _inventoryFields = __load("module3/domain/inventoryFields.mjs");
var _nonAi = __load("module3/domain/nonAi.mjs");
// The receipt module must supply reviewed quantity/content units and dates.
// Purchase pack counts are never guessed into grams, ml, or pieces.
function receiptInventoryRecord(input, id) {
  if (input.reviewStatus !== 'confirmed' || input.inventorySelected !== true) throw new Error('재고 등록할 품목을 선택하고 확인해 주세요.');
  for (const key of ['receiptId', 'receiptItemId', 'expenseId']) if (typeof input[key] !== 'string' || !input[key].trim()) throw new Error('영수증·품목·소비 ID가 필요해요.');
  if (!['ingredient', 'prepared_food', 'household'].includes(input.itemType)) throw new Error('재고로 등록 가능한 분류를 선택해 주세요.');
  return (0, _inventoryFields.inventoryRecord)({
    name: input.name,
    quantity: input.quantity,
    unit: input.unit,
    category: input.itemType === 'household' ? 'household' : 'food',
    purchasedAt: input.purchasedAt,
    expiresAt: input.expiresAt || '',
    storageMethod: input.storageMethod,
    dateType: input.dateType,
    remainingCost: input.linePaidAmount ?? null,
    sourceReceiptId: input.receiptId,
    sourceReceiptItemId: input.receiptItemId,
    sourceExpenseId: input.expenseId,
    rawName: input.rawName || input.name
  }, id);
}
function registerReceiptInventory(state, input, id, eventId) {
  const record = receiptInventoryRecord(input, id);
  const key = JSON.stringify([input.receiptId, input.receiptItemId]);
  // Preserve links even after stock is consumed/deleted, so retries cannot recreate it.
  const links = state.receiptInventoryLinks || {};
  if (Object.prototype.hasOwnProperty.call(links, key)) return state;
  const existing = state.inventory.find(i => i.sourceReceiptId === input.receiptId && i.sourceReceiptItemId === input.receiptItemId);
  if (existing) return {
    ...state,
    receiptInventoryLinks: {
      ...links,
      [key]: existing.id
    }
  };
  const next = (0, _nonAi.saveInventory)(state, record, eventId);
  return {
    ...next,
    receiptInventoryLinks: {
      ...links,
      [key]: record.id
    }
  };
}
},
"module3/data/seed.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialState = initialState;
exports.recipes = void 0;
var _inventory = __load("module3/domain/inventory.mjs");
const after = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return (0, _inventory.dayKey)(d);
};
function initialState() {
  return {
    inventory: [{
      id: 'egg',
      name: '달걀',
      quantity: 6,
      unit: '개',
      expiresAt: after(5),
      category: 'food',
      purchasedAt: after(0),
      storageMethod: 'refrigerated',
      dateType: 'reference',
      remainingCost: 3000
    }, {
      id: 'rice',
      name: '밥',
      quantity: 2,
      unit: '공기',
      expiresAt: after(2),
      category: 'food',
      purchasedAt: after(0),
      storageMethod: 'refrigerated',
      dateType: 'reference',
      remainingCost: 2000
    }, {
      id: 'kimchi',
      name: '김치',
      quantity: 300,
      unit: 'g',
      expiresAt: after(14),
      category: 'food',
      purchasedAt: after(0),
      storageMethod: 'refrigerated',
      dateType: 'reference',
      remainingCost: 3000
    }],
    meals: [],
    shopping: []
  };
}
const recipes = exports.recipes = [{
  id: 'tomato-spaghetti',
  name: '토마토 스파게티',
  aliases: ['파스타', '토마토 파스타', '스파게티'],
  minutes: 20,
  tools: ['pot', 'pan'],
  onePan: false,
  minCleanup: false,
  ingredients: [{
    name: '스파게티면',
    quantity: 100,
    unit: 'g'
  }, {
    name: '토마토소스',
    quantity: 150,
    unit: 'g'
  }, {
    name: '마늘',
    quantity: 10,
    unit: 'g'
  }, {
    name: '올리브유',
    quantity: 10,
    unit: 'ml'
  }],
  steps: ['냄비에 물을 끓이고 스파게티면을 제품에 표시된 시간에 맞춰 삶아요.', '마늘을 썰고 팬에 올리브유를 두른 뒤 약불에서 볶아요.', '토마토소스를 넣고 저으며 데워요.', '삶은 면을 소스와 함께 충분히 익혀 담아요.']
}, {
  id: 'fried-rice',
  name: '김치 볶음밥',
  minutes: 15,
  tools: ['pan'],
  onePan: true,
  minCleanup: true,
  ingredients: [{
    name: '밥',
    quantity: 1,
    unit: '공기'
  }, {
    name: '김치',
    quantity: 100,
    unit: 'g'
  }, {
    name: '달걀',
    quantity: 1,
    unit: '개'
  }],
  steps: ['김치를 잘게 썰어요.', '팬에 기름을 두르고 김치를 볶아요.', '밥을 넣고 볶다가 한쪽에서 달걀을 충분히 익혀 함께 섞어요.']
}, {
  id: 'egg-rice',
  name: '달걀 덮밥',
  minutes: 10,
  tools: ['pan'],
  onePan: true,
  minCleanup: true,
  ingredients: [{
    name: '밥',
    quantity: 1,
    unit: '공기'
  }, {
    name: '달걀',
    quantity: 2,
    unit: '개'
  }],
  steps: ['달걀을 풀고 소금으로 간해요.', '팬에서 달걀을 부드럽게 익혀요.', '따뜻한 밥 위에 올려요.']
}, {
  id: 'tofu',
  name: '두부 김치',
  minutes: 15,
  tools: ['pan', 'pot'],
  onePan: false,
  minCleanup: false,
  ingredients: [{
    name: '두부',
    quantity: 1,
    unit: '모'
  }, {
    name: '김치',
    quantity: 150,
    unit: 'g'
  }],
  steps: ['두부를 데쳐 먹기 좋게 잘라요.', '김치를 팬에 볶아요.', '두부와 김치를 함께 담아요.']
}, {
  id: 'microwave-rice',
  name: '전자레인지 달걀밥',
  minutes: 10,
  tools: ['microwave'],
  onePan: false,
  minCleanup: true,
  ingredients: [{
    name: '밥',
    quantity: 1,
    unit: '공기'
  }, {
    name: '달걀',
    quantity: 1,
    unit: '개'
  }],
  steps: ['전자레인지용 용기에 밥과 껍질을 제거해 잘 푼 달걀을 담아요.', '밀폐하지 말고 기기와 용기의 사용 지침에 맞춰 가열해요.', '중간에 섞고 달걀이 속까지 완전히 익었는지 확인해요.']
}];
},
"module3/domain/shopping.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.editShoppingItem = editShoppingItem;
exports.mergeShopping = mergeShopping;
exports.purchaseUrl = purchaseUrl;
exports.registerPurchased = registerPurchased;
exports.removeShoppingRecipe = removeShoppingRecipe;
exports.replaceRecipeShopping = replaceRecipeShopping;
exports.shoppingItem = shoppingItem;
exports.shoppingSources = shoppingSources;
function shoppingItem(input) {
  const name = String(input.name || '').trim(),
    unit = String(input.unit || '').trim(),
    quantity = Number(input.quantity);
  if (!name || name.length > 80 || !unit || unit.length > 20 || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1000000) throw new Error('재료명과 단위, 0보다 큰 수량을 확인해 주세요.');
  const estimatedUnitPrice = input.estimatedUnitPrice == null || input.estimatedUnitPrice === '' ? null : Number(input.estimatedUnitPrice);
  if (estimatedUnitPrice !== null && (!Number.isSafeInteger(estimatedUnitPrice) || estimatedUnitPrice < 0 || !Number.isSafeInteger(Math.round(estimatedUnitPrice * quantity)))) throw new Error('예상 단가는 0 이상의 정수로 입력해 주세요.');
  return {
    ...input,
    name,
    unit,
    quantity,
    estimatedUnitPrice
  };
}
const round = n => Math.round(n * 1e6) / 1e6;
function shoppingSources(item) {
  return Array.isArray(item.sources) ? item.sources : [{
    key: 'manual',
    type: 'manual',
    name: '직접 추가 / 이전 항목',
    quantity: item.quantity
  }];
}
function withSources(item, sources) {
  return {
    ...item,
    sources,
    quantity: round(sources.reduce((n, s) => n + s.quantity, 0))
  };
}
function mergeShopping(existing, items, makeId) {
  const next = existing.map(i => ({
    ...i
  }));
  for (const input of items) {
    const item = shoppingItem(input);
    const contribution = input.recipeSource ? {
      key: `recipe:${input.recipeSource.id}`,
      type: 'recipe',
      recipeId: input.recipeSource.id,
      name: input.recipeSource.name,
      quantity: item.quantity
    } : {
      key: 'manual',
      type: 'manual',
      name: '직접 추가',
      quantity: item.quantity
    };
    const found = next.find(i => i.name === item.name && i.unit === item.unit && !i.done && !i.inventoryId);
    if (found) {
      const sources = shoppingSources(found).map(s => ({
        ...s
      }));
      const old = sources.find(s => s.key === contribution.key);
      if (old) Object.assign(old, {
        ...contribution,
        quantity: contribution.type === 'manual' ? Math.max(old.quantity, contribution.quantity) : contribution.quantity
      });else sources.push(contribution);
      Object.assign(found, withSources(found, sources));
    } else {
      const {
        recipeSource,
        ...clean
      } = item;
      next.push(withSources({
        ...clean,
        id: makeId(),
        done: false
      }, [contribution]));
    }
  }
  return next;
}
function removeShoppingRecipe(items, recipeId) {
  return items.map(i => i.done || i.inventoryId ? i : withSources(i, shoppingSources(i).filter(s => !(s.type === 'recipe' && s.recipeId === recipeId)))).filter(i => i.quantity > 0);
}
function replaceRecipeShopping(items, missing, recipe, makeId) {
  // Refresh one recipe against the latest inventory without touching other sources.
  return mergeShopping(removeShoppingRecipe(items, recipe.id), missing.map(i => ({
    ...i,
    recipeSource: {
      id: recipe.id,
      name: recipe.name
    }
  })), makeId);
}
function editShoppingItem(original, input) {
  const item = shoppingItem(input);
  if (shoppingSources(original).some(s => s.type === 'recipe') && (item.name !== original.name || item.unit !== original.unit || item.quantity !== original.quantity)) throw new Error('레시피 연결 품목은 출처를 제외한 뒤 직접 추가해 주세요. 예상 가격은 수정할 수 있어요.');
  return {
    ...original,
    ...item,
    sources: shoppingSources(original).some(s => s.type === 'recipe') ? shoppingSources(original) : [{
      key: 'manual',
      type: 'manual',
      name: '직접 추가',
      quantity: item.quantity
    }]
  };
}
function purchaseUrl(name) {
  const value = String(name || '').trim();
  if (!value || value.length > 80) throw new Error('검색할 재료명을 확인해 주세요.');
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(value)}`;
}
function registerPurchased(state, shoppingId, item) {
  const source = state.shopping.find(i => i.id === shoppingId);
  if (!source) throw new Error('장보기 항목이 삭제되었어요. 다시 확인해 주세요.');
  if (source.inventoryId) throw new Error('이미 재고에 등록한 품목이에요.');
  return {
    ...state,
    undo: null,
    inventory: [...state.inventory, item],
    shopping: state.shopping.map(i => i.id === shoppingId ? {
      ...i,
      done: true,
      inventoryId: item.id
    } : i)
  };
}
},
"module3/state/persistentStore.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPersistentStore = createPersistentStore;
// 모든 변경은 순서대로 저장하며, 저장 성공 후에만 화면 상태를 바꿉니다.
function createPersistentStore(initial, persist, publish) {
  let current = initial;
  let queue = Promise.resolve();
  return {
    get: () => current,
    update(transform) {
      const task = queue.then(async () => {
        const next = transform(current);
        if (next === current) return current;
        await persist(next);
        current = next;
        publish(next);
        return next;
      });
      queue = task.catch(() => {});
      return task;
    }
  };
}
},
"module3/services/inventoryNotifications.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cancelInventoryTest = cancelInventoryTest;
exports.observeInventoryNotifications = observeInventoryNotifications;
exports.requestInventoryPermission = requestInventoryPermission;
exports.scheduleInventoryTest = scheduleInventoryTest;
exports.supported = void 0;
exports.syncInventoryNotifications = syncInventoryNotifications;
var _reactNative = __load("react-native");
var Notifications = _interopRequireWildcard(__load("expo-notifications"));
var _nonAi = __load("module3/domain/nonAi.mjs");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
const supported = exports.supported = _reactNative.Platform.OS !== 'web';
if (supported) Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});
const channel = 'module3-inventory-v2';
let queue = Promise.resolve();
const granted = p => p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
async function requestInventoryPermission() {
  if (!supported) throw new Error('실제 알림은 휴대폰 앱에서 설정해 주세요.');
  if (_reactNative.Platform.OS === 'android') await Notifications.setNotificationChannelAsync(channel, {
    name: '재고 날짜 알림',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default'
  });
  const current = await Notifications.getPermissionsAsync();
  if (!granted(current) && !granted(await Notifications.requestPermissionsAsync())) throw new Error('알림 권한을 허용해 주세요.');
}
function syncInventoryNotifications(inventory, settings) {
  if (!supported) return Promise.resolve({
    count: 0,
    omitted: 0,
    unsupported: true
  });
  const task = queue.then(async () => {
    const allowed = granted(await Notifications.getPermissionsAsync());
    if (allowed && settings.enabled && _reactNative.Platform.OS === 'android') await Notifications.setNotificationChannelAsync(channel, {
      name: '재고 날짜 알림',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default'
    });
    const plan = (0, _nonAi.inventoryAlertPlan)(inventory, {
      ...settings,
      enabled: settings.enabled && allowed
    });
    const result = await (0, _nonAi.reconcileAlerts)({
      list: () => Notifications.getAllScheduledNotificationsAsync(),
      cancel: id => Notifications.cancelScheduledNotificationAsync(id),
      schedule: p => Notifications.scheduleNotificationAsync({
        content: {
          title: p.title,
          body: p.body,
          sound: 'default',
          data: {
            owner: _nonAi.INVENTORY_ALERT_OWNER,
            key: p.key,
            at: p.at,
            batchId: p.batchId
          }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(p.at),
          channelId: channel
        }
      })
    }, plan);
    return {
      ...result,
      permissionDenied: settings.enabled && !allowed
    };
  });
  queue = task.catch(() => {});
  return task;
}
function observeInventoryNotifications(onId) {
  if (!supported) return () => {};
  const receive = response => {
    const data = response?.notification?.request?.content?.data;
    if (data?.owner === _nonAi.INVENTORY_ALERT_OWNER || data?.owner === _nonAi.INVENTORY_ALERT_OWNER + '-test') {
      onId(data.batchId, response.notification.request.identifier);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }
  };
  const sub = Notifications.addNotificationResponseReceivedListener(receive);
  Notifications.getLastNotificationResponseAsync().then(receive).catch(() => {});
  return () => sub.remove();
}
async function scheduleInventoryTest() {
  await requestInventoryPermission();
  return Notifications.scheduleNotificationAsync({
    identifier: 'module3-inventory-test',
    content: {
      title: '냉장고 날짜 알림 테스트',
      body: '실제 기기 알림이에요. 날짜 임박 재고도 같은 방식으로 알려드려요.',
      sound: 'default',
      data: {
        owner: _nonAi.INVENTORY_ALERT_OWNER + '-test',
        test: true
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60,
      repeats: false,
      channelId: channel
    }
  });
}
async function cancelInventoryTest() {
  if (supported) await Notifications.cancelScheduledNotificationAsync('module3-inventory-test');
}
},
"integration/router.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flushPendingNavigation = flushPendingNavigation;
exports.navigationRef = void 0;
Object.defineProperty(exports, "resolveTarget", {
  enumerable: true,
  get: function () {
    return _routes.resolveTarget;
  }
});
exports.router = void 0;
Object.defineProperty(exports, "useFocusEffect", {
  enumerable: true,
  get: function () {
    return _native.useFocusEffect;
  }
});
exports.useRootNavigationState = exports.useLocalSearchParams = void 0;
var _native = __load("@react-navigation/native");
var _routes = __load("integration/routes.mjs");
const navigationRef = exports.navigationRef = (0, _native.createNavigationContainerRef)();
const useRootNavigationState = () => ({
  key: 'integration'
});
exports.useRootNavigationState = useRootNavigationState;
function go(target, replace = false) {
  if (!navigationRef.isReady()) return;
  const r = (0, _routes.resolveTarget)(target);
  if (r.name === 'Tabs' || r.name === 'RecipeList') {
    navigationRef.navigate(r.name, r.params);
    return;
  }
  navigationRef.dispatch(replace ? _native.StackActions.replace(r.name, r.params) : _native.StackActions.push(r.name, r.params));
}
let pendingFridge = false;
function flushPendingNavigation() {
  if (!pendingFridge || !navigationRef.isReady()) return;
  pendingFridge = false;
  navigationRef.resetRoot({
    index: 0,
    routes: [{
      name: 'Tabs',
      state: {
        index: 0,
        routes: [{
          name: 'Fridge'
        }]
      }
    }]
  });
}
function toFridge() {
  pendingFridge = true;
  flushPendingNavigation();
}
const router = exports.router = {
  toFridge,
  push: t => go(t),
  replace: t => go(t, true),
  back: () => {
    if (navigationRef.canGoBack()) navigationRef.goBack();else navigationRef.navigate('Tabs', {
      screen: 'Fridge'
    });
  }
};
const useLocalSearchParams = () => (0, _native.useRoute)().params || {};
exports.useLocalSearchParams = useLocalSearchParams;
},
"integration/routes.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveTarget = resolveTarget;
function resolveTarget(target) {
  const input = typeof target === 'string' ? {
    pathname: target
  } : target;
  const path = input.pathname;
  if (path === '/(tabs)/recipe') return {
    name: 'RecipeList',
    params: {}
  };
  if (path === '/(tabs)/inventory') return {
    name: 'Tabs',
    params: {
      screen: 'Fridge'
    }
  };
  const params = {
    ...input.params,
    path
  };
  if (path.startsWith('/inventory/') && !['new', 'history', 'alerts', 'manage'].includes(path.split('/')[2])) params.id = decodeURIComponent(path.split('/').pop());
  if (path.startsWith('/recipe/') && !['conditions', 'reminders'].includes(path.split('/')[2])) params.id = decodeURIComponent(path.split('/')[2]);
  return {
    name: 'Module3',
    params
  };
}
},
"src/store/AppDataContext.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppDataProvider = AppDataProvider;
exports.useAppData = useAppData;
var _AppProvider = __load("module3/state/AppProvider.js");
var _inventoryBridge = __load("integration/inventoryBridge.mjs");
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _spending = __load("src/data/spending/spending.js");
var _fridge = __load("src/data/fridge/fridge.js");
var _todos = __load("src/data/lifeInfo/todos.js");
var _routines = __load("src/data/lifeInfo/routines.js");
var _account = __load("src/data/more/account.js");
var _format = __load("src/utils/format.js");
var _time = __load("src/utils/time.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 앱 전체가 함께 쓰는 데이터 저장소 (소비, 식재료, 할 일, 루틴, 프로필, 설정). 지금은 메모리에만 저장됩니다.
// TODO: 서버(Firebase 등) 연결은 이 파일의 불러오기(useState 초기값)와 add/update/remove/toggle 함수 안에서 하세요.
//       화면 코드는 그대로 둘 수 있습니다.
// 사용: const { transactions, addTransaction, todos, toggleTodo, ... } = useAppData();

const AppDataContext = (0, _react.createContext)(null);
function AppDataProvider({
  children
}) {
  const nextId = (0, _react.useRef)(1);
  const makeId = prefix => `${prefix}-new-${Date.now()}-${nextId.current++}`;

  // 더미 소비 내역의 daysAgo 를 실제 날짜로 바꿔서 시작합니다.
  const [transactions, setTransactions] = (0, _react.useState)(() => {
    const today = (0, _format.toDateString)(new Date());
    return _spending.spendingData.transactions.map(({
      daysAgo,
      ...t
    }) => ({
      ...t,
      date: (0, _format.addDays)(today, -daysAgo)
    }));
  });
  const module = (0, _AppProvider.useApp)();
  const fridgeItems = (0, _react.useMemo)(() => module.state.inventory.filter(i => i.category !== 'household' && i.quantity > 0).map(_inventoryBridge.toTeamItem), [module.state.inventory]);

  // 더미 할 일의 daysFromToday 를 실제 마감일(due)로 바꿔서 시작합니다.
  const [todos, setTodos] = (0, _react.useState)(() => {
    const today = (0, _format.toDateString)(new Date());
    return _todos.todoData.items.map(({
      daysFromToday,
      ...t
    }) => ({
      ...t,
      due: daysFromToday == null ? null : (0, _format.addDays)(today, daysFromToday)
    }));
  });
  const [routines, setRoutines] = (0, _react.useState)(_routines.routineData.items);

  // 날짜가 바뀌면 루틴의 "오늘 완료" 체크를 모두 해제합니다.
  // 확인 시점: 앱 복귀 / 1분마다 / 루틴 체크·추가 직전. (서버에 날짜별 기록을 저장한다면 서버 기준으로 바꾸세요)
  const routineDay = (0, _react.useRef)((0, _format.toDateString)(new Date()));
  const resetRoutinesIfNewDay = (0, _react.useCallback)(() => {
    const today = (0, _format.toDateString)(new Date());
    if (routineDay.current === today) return;
    routineDay.current = today;
    setRoutines(_time.clearRoutineChecks);
  }, []);
  (0, _react.useEffect)(() => {
    const subscription = _reactNative.AppState.addEventListener('change', state => {
      if (state === 'active') resetRoutinesIfNewDay();
    });
    const timer = setInterval(resetRoutinesIfNewDay, 60 * 1000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [resetRoutinesIfNewDay]);
  const [profile, setProfile] = (0, _react.useState)(_account.profileData.initial);
  const [settings, setSettings] = (0, _react.useState)(_account.settingsData.initial);

  // 소비 추가: { title, amount, date: 'YYYY-MM-DD', category?, icon?, source?, items? }
  const addTransaction = (0, _react.useCallback)(({
    title,
    amount,
    date,
    category,
    icon,
    source,
    items
  }) => {
    const entry = {
      id: makeId('t'),
      title,
      amount: (0, _format.parseAmount)(amount),
      // 잘못된 값은 0 으로 저장 (합계 보호)
      date,
      category: category ?? _spending.spendingData.defaultCategory,
      icon: icon ?? _spending.spendingData.defaultIcon,
      ...(source ? {
        source
      } : {}),
      ...(items ? {
        items
      } : {})
    };
    setTransactions(prev => [entry, ...prev]); // 새 항목을 맨 앞에 (같은 날짜면 최신이 위)
  }, []);

  // 소비 수정: 바꾼 값만 넘기면 나머지(카테고리, 아이콘 등)는 그대로 둡니다.
  const updateTransaction = (0, _react.useCallback)((id, patch) => {
    const safePatch = 'amount' in patch ? {
      ...patch,
      amount: (0, _format.parseAmount)(patch.amount)
    } : patch;
    setTransactions(prev => prev.map(t => t.id === id ? {
      ...t,
      ...safePatch
    } : t));
  }, []);

  // 소비 삭제 (냉장고에 담긴 식재료는 따로 관리되어 그대로 남습니다)
  const removeTransaction = (0, _react.useCallback)(id => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);
  const addFridgeItem = input => {
    module.saveItem((0, _inventoryBridge.fromTeamItem)(input, (0, _AppProvider.newId)())).catch(() => {});
  };
  const updateFridgeItem = (id, input) => {
    module.saveItem((0, _inventoryBridge.fromTeamItem)(input, id, module.state.inventory.find(i => i.id === id))).catch(() => {});
  };
  const removeFridgeItem = id => {
    module.deleteItem(id).catch(() => {});
  };

  // 할 일 추가: { title, due: 'YYYY-MM-DD'|null }
  const addTodo = (0, _react.useCallback)(({
    title,
    due
  }) => {
    setTodos(prev => [...prev, {
      id: makeId('td'),
      title,
      due,
      done: false
    }]);
  }, []);
  const toggleTodo = (0, _react.useCallback)(id => {
    setTodos(prev => prev.map(t => t.id === id ? {
      ...t,
      done: !t.done
    } : t));
  }, []);

  // 루틴 추가: { title, time: 'HH:mm' (24시간제) }
  const addRoutine = (0, _react.useCallback)(({
    title,
    time
  }) => {
    resetRoutinesIfNewDay();
    setRoutines(prev => [...prev, {
      id: makeId('r'),
      title,
      time,
      doneToday: false
    }]);
  }, [resetRoutinesIfNewDay]);

  // 루틴 체크 켜기/끄기 (날이 바뀌었다면 먼저 초기화)
  const toggleRoutine = (0, _react.useCallback)(id => {
    resetRoutinesIfNewDay();
    setRoutines(prev => prev.map(r => r.id === id ? {
      ...r,
      doneToday: !r.doneToday
    } : r));
  }, [resetRoutinesIfNewDay]);

  // 개인정보 수정: { nickname?, region? } 중 바꿀 값만 넘깁니다.
  const updateProfile = (0, _react.useCallback)(patch => {
    setProfile(prev => ({
      ...prev,
      ...patch
    }));
  }, []);

  // 앱 설정 켜기/끄기: updateSetting('notifyFridge', true)
  const updateSetting = (0, _react.useCallback)((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  const value = (0, _react.useMemo)(() => ({
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
    updateSetting
  }), [transactions, addTransaction, updateTransaction, removeTransaction, fridgeItems, addFridgeItem, updateFridgeItem, removeFridgeItem, todos, addTodo, toggleTodo, routines, addRoutine, toggleRoutine, profile, updateProfile, settings, updateSetting]);
  return /*#__PURE__*/_react.default.createElement(AppDataContext.Provider, {
    value: value
  }, children);
}
function useAppData() {
  const ctx = (0, _react.useContext)(AppDataContext);
  if (!ctx) throw new Error('useAppData 는 AppDataProvider 안에서만 쓸 수 있어요.');
  return ctx;
}
},
"integration/inventoryBridge.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.foodIcon = foodIcon;
exports.fromTeamItem = fromTeamItem;
exports.toTeamItem = toTeamItem;
function foodIcon(name = '') {
  if (/우유/.test(name)) return 'bottle-soda-outline';
  if (/달걀|계란/.test(name)) return 'egg-outline';
  if (/밥|쌀/.test(name)) return 'rice';
  if (/당근/.test(name)) return 'carrot';
  if (/시금치|상추|채소/.test(name)) return 'leaf';
  if (/두부/.test(name)) return 'cube-outline';
  if (/김치/.test(name)) return 'food-variant';
  return 'food-apple-outline';
}
function toTeamItem(i) {
  return {
    ...i,
    amount: i.quantity,
    quantity: `${i.quantity}${i.unit}`,
    purchaseDate: i.purchasedAt,
    expiry: i.expiresAt || null,
    date_source: i.dateType === 'package' ? 'label' : 'reference',
    icon: i.icon || foodIcon(i.name)
  };
}
function fromTeamItem(i, id, previous = {}) {
  return {
    ...previous,
    id,
    name: i.name.trim(),
    quantity: Number(i.quantity),
    unit: i.unit || '개',
    category: 'food',
    purchasedAt: i.purchaseDate || '',
    expiresAt: i.expiry || '',
    dateType: i.date_source === 'label' ? 'package' : 'reference',
    storageMethod: i.storageMethod || previous.storageMethod || '',
    remainingCost: i.remainingCost ?? previous.remainingCost ?? null
  };
}
},
"src/data/spending/spending.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.spendingData = void 0;
var _receipt = __load("src/data/spending/receipt.js");
// 소비 화면 더미 데이터. icon 은 MaterialCommunityIcons 이름입니다.
// - daysAgo: 더미 전용. 오늘로부터 며칠 전 지출인지 (AppDataContext 가 실제 date 로 바꿔 줌)
//   실제 데이터에는 date("YYYY-MM-DD")를 넣으세요.
// - source: 'receipt' 면 영수증 지출 (상세에서 "영수증 · 식료품" 으로 표시)
// - items: 구매 품목 [{ id, name, unitPrice, quantity, inFridge }] (없으면 상세에 품목 없이 표시)

const spendingData = exports.spendingData = {
  budget: 1000000,
  // 카테고리를 고르지 않은 지출(직접 입력 등)의 기본값
  defaultCategory: '기타',
  defaultIcon: 'wallet-outline',
  transactions: [{
    id: 't1',
    title: '이마트 성수점',
    daysAgo: 0,
    category: '식료품',
    amount: 48500,
    icon: 'basket-outline',
    source: 'receipt',
    items: _receipt.sampleReceipt.items
  }, {
    id: 't2',
    title: '오늘의 식탁',
    daysAgo: 0,
    category: '식비',
    amount: 12000,
    icon: 'silverware-fork-knife'
  }, {
    id: 't3',
    title: '스타벅스',
    daysAgo: 1,
    category: '카페·간식',
    amount: 5500,
    icon: 'coffee-outline'
  }, {
    id: 't4',
    title: '올리브영',
    daysAgo: 1,
    category: '생활용품',
    amount: 23900,
    icon: 'shopping-outline'
  }],
  // + 버튼의 "소비 추가" 시트 선택지
  addOptions: [{
    id: 'receipt',
    title: '영수증 촬영하기',
    description: '영수증을 촬영해 소비를 기록해요.',
    icon: 'camera-outline'
  }, {
    id: 'gallery',
    title: '사진에서 선택하기',
    description: '앨범의 영수증 사진으로 소비를 기록해요.',
    icon: 'image-outline'
  }, {
    id: 'manual',
    title: '직접 입력하기',
    description: '구매 품목, 가격, 날짜를 입력해요.',
    icon: 'square-edit-outline'
  }]
};
},
"src/data/spending/receipt.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sampleReceipt = exports.receiptTexts = void 0;
var _format = __load("src/utils/format.js");
// 영수증 인식 결과 화면 더미 데이터.
// 카메라/OCR 화면은 인식 결과를 아래 형식으로 넘기면 됩니다: navigation.navigate('ReceiptResult', { receipt })
// (params 가 없으면 이 파일의 sampleReceipt 를 대신 보여줍니다. 사용자는 화면에서 모든 값을 수정할 수 있습니다.)
// receipt = {
//   store: '이마트 성수점',  // 상호명
//   date: '2026-10-24',     // YYYY-MM-DD
//   time: '14:32',          // HH:mm
//   total: 48500,           // 영수증에 찍힌 총액
//   items: [{ id, name, unitPrice, quantity, inFridge }],
// }
// inFridge: 냉장고에 보관하는 식품이면 true (OCR 이 구분하지 못하면 생략, false 로 취급)

// 샘플 영수증의 날짜는 항상 오늘입니다 (저장하면 이번 달 "최근 지출 내역"에 바로 보이도록).
const sampleReceipt = exports.sampleReceipt = {
  store: '이마트 성수점',
  date: (0, _format.toDateString)(new Date()),
  time: '14:32',
  total: 48500,
  items: [{
    id: 'r1',
    name: '서울우유 1L',
    unitPrice: 2800,
    quantity: 2,
    inFridge: true
  }, {
    id: 'r2',
    name: '무항생제 달걀 15구',
    unitPrice: 7900,
    quantity: 1,
    inFridge: true
  }, {
    id: 'r3',
    name: '국산콩 두부 300g',
    unitPrice: 1800,
    quantity: 2,
    inFridge: true
  }, {
    id: 'r4',
    name: '바나나 한 송이',
    unitPrice: 4900,
    quantity: 1,
    inFridge: true
  }, {
    id: 'r5',
    name: '햇쌀 4kg',
    unitPrice: 18900,
    quantity: 1,
    inFridge: false
  }, {
    id: 'r6',
    name: '데일리 샐러드',
    unitPrice: 3800,
    quantity: 2,
    inFridge: true
  }]
};
const receiptTexts = exports.receiptTexts = {
  title: '영수증 인식 결과',
  subtitle: '촬영한 영수증의 내용을 읽어왔어요.',
  totalLabel: '영수증 총액',
  badge: '인식 완료',
  itemsTitle: '세부 품목',
  headerName: '품목 / 단가',
  headerQty: '수량',
  headerSum: '품목 합계',
  saveLabel: '저장하기',
  // 수정 모드: 영수증을 잘못 읽었을 때 사용자가 직접 고칠 수 있습니다.
  editLabel: '수정',
  editSubtitle: '잘못 읽은 부분을 직접 고쳐 주세요.',
  editHint: '식품은 체크하면 냉장고에 담겨요',
  doneLabel: '수정 완료',
  cancelLabel: '취소',
  storeLabel: '상호명',
  storePlaceholder: '예: 이마트 성수점',
  dateLabel: '구매일',
  totalFieldLabel: '영수증 총액',
  addItemLabel: '품목 추가',
  // 영수증 총액과 품목 합계가 다를 때 (인식 오류 가능성)
  mismatch: (total, itemsTotal) => `영수증 총액(${total}원)과 품목 합계(${itemsTotal}원)가 달라요. 잘못 읽은 곳이 없는지 확인해 주세요.`,
  matchAction: '품목 합계로 맞추기',
  fridgeSaveLabel: count => `저장하고 냉장고에 ${count}개 담기`
};
},
"src/utils/format.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toDateString = exports.parseAmount = exports.pad = exports.isValidDateString = exports.fromDateString = exports.formatNumber = exports.formatMonthDay = exports.formatKoreanMonthDay = exports.formatKoreanDateWithYear = exports.formatKoreanDateShort = exports.formatKoreanDate = exports.formatDotDate = exports.daysBetween = exports.compareDateDesc = exports.addDays = void 0;
// 1234567 -> "1,234,567"
const formatNumber = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// "2026-11-02" -> "11.02"
exports.formatNumber = formatNumber;
const formatMonthDay = dateStr => dateStr.slice(5).replace('-', '.');

// "2026-11-02" -> "2026.11.02"
exports.formatMonthDay = formatMonthDay;
const formatDotDate = dateStr => dateStr.replace(/-/g, '.');

// 7 -> "07" (두 자리로 맞추기)
exports.formatDotDate = formatDotDate;
const pad = n => String(n).padStart(2, '0');
exports.pad = pad;
const parseDate = dateStr => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

// Date -> "YYYY-MM-DD" (기기의 현지 날짜 기준)
const toDateString = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// "YYYY-MM-DD" 에 일수를 더한 "YYYY-MM-DD"
exports.toDateString = toDateString;
const addDays = (dateStr, days) => {
  const d = new Date(parseDate(dateStr) + days * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

// 두 날짜("YYYY-MM-DD") 사이의 일수 (to - from)
exports.addDays = addDays;
const daysBetween = (fromStr, toStr) => Math.round((parseDate(toStr) - parseDate(fromStr)) / 86400000);
exports.daysBetween = daysBetween;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// Date -> "11월 4일 수요일"
const formatKoreanDate = date => `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;

// "2026-11-08" -> "11월 8일"
exports.formatKoreanDate = formatKoreanDate;
const formatKoreanMonthDay = dateStr => {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}월 ${d}일`;
};

// Date -> "2026년 11월 2일 월요일"
exports.formatKoreanMonthDay = formatKoreanMonthDay;
const formatKoreanDateWithYear = date => `${date.getFullYear()}년 ${formatKoreanDate(date)}`;

// Date -> "2026년 11월 8일 (일)"
exports.formatKoreanDateWithYear = formatKoreanDateWithYear;
const formatKoreanDateShort = date => `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;

// "2026-11-04" -> 기기 현지 시간의 Date (날짜 시트에 넘기는 용도)
exports.formatKoreanDateShort = formatKoreanDateShort;
const fromDateString = dateStr => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// 날짜(date: "YYYY-MM-DD") 최신순 정렬용 비교 함수. 같은 날짜면 순서를 바꾸지 않습니다.
exports.fromDateString = fromDateString;
const compareDateDesc = (a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0;

// 금액/수량 입력값을 안전한 숫자로 바꿉니다. 숫자가 아니거나 0 이하, 무한대면 0 입니다.
exports.compareDateDesc = compareDateDesc;
const parseAmount = value => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// "YYYY-MM-DD" 모양이고 실제로 있는 날짜인지 확인합니다. (예: "2026-02-31" 은 false)
exports.parseAmount = parseAmount;
const isValidDateString = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};
exports.isValidDateString = isValidDateString;
},
"src/data/fridge/fridge.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fridgeData = void 0;
// 냉장고 더미 데이터.
// - daysFromToday: 더미 전용. 오늘로부터 며칠 뒤가 유통기한인지 (실제 데이터에는 expiry "YYYY-MM-DD" 를 넣으세요)
// - icon: MaterialCommunityIcons 이름
// - amount / unit: 수량 숫자와 단위 (수정 화면이 불러옴). detail: 수정하지 않는 규격 덧붙임 (예: '1L')
// - quantity: 목록에 보이는 글자. 수정하면 amount + unit + detail 로 다시 만들어집니다.

const fridgeData = exports.fridgeData = {
  urgentWithinDays: 3,
  // 식재료 추가 화면에서 만든 항목에 쓰는 기본 아이콘
  defaultIcon: 'food-variant',
  // 식재료 추가 화면의 "단위 선택" 시트에 나오는 단위들
  unitOptions: ['개', '공기', '봉', '모', '팩', '병', '캔', 'g', 'kg', 'ml', 'L'],
  items: [{
    id: 'f1',
    name: '우유',
    quantity: '1개 · 1L',
    amount: 1,
    unit: '개',
    detail: '1L',
    daysFromToday: 0,
    icon: 'bottle-tonic-outline'
  }, {
    id: 'f2',
    name: '두부',
    quantity: '1모 · 300g',
    amount: 1,
    unit: '모',
    detail: '300g',
    daysFromToday: 1,
    icon: 'cube-outline'
  }, {
    id: 'f3',
    name: '시금치',
    quantity: '1봉 · 200g',
    amount: 1,
    unit: '봉',
    detail: '200g',
    daysFromToday: 2,
    icon: 'sprout-outline'
  }, {
    id: 'f4',
    name: '당근',
    quantity: '2개',
    amount: 2,
    unit: '개',
    daysFromToday: 6,
    icon: 'carrot'
  }, {
    id: 'f5',
    name: '달걀',
    quantity: '6개',
    amount: 6,
    unit: '개',
    daysFromToday: 10,
    icon: 'egg-outline'
  }, {
    id: 'f6',
    name: '사과',
    quantity: '3개',
    amount: 3,
    unit: '개',
    daysFromToday: 12,
    icon: 'food-apple-outline'
  }]
};
},
"src/data/lifeInfo/todos.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.todoData = void 0;
// 할 일 더미 데이터.
// - daysFromToday: 더미 전용. 오늘로부터 며칠 뒤가 마감인지 (음수 = 지남, null = 기한 없음)
//   실제 데이터에는 due("YYYY-MM-DD", 없으면 null)를 넣으세요.
// - done: 완료 여부

const todoData = exports.todoData = {
  sortLabel: '마감일 가까운 순',
  items: [{
    id: 'td1',
    title: '도시가스 요금 납부하기',
    daysFromToday: -1,
    done: false
  }, {
    id: 'td2',
    title: '전기요금 납부하기',
    daysFromToday: 0,
    done: false
  }, {
    id: 'td3',
    title: '분리수거 내놓기',
    daysFromToday: 1,
    done: false
  }, {
    id: 'td4',
    title: '겨울 이불 세탁하기',
    daysFromToday: 6,
    done: false
  }, {
    id: 'td5',
    title: '옷장 정리하기',
    daysFromToday: null,
    done: false
  }, {
    id: 'td6',
    title: '생필품 주문하기',
    daysFromToday: -1,
    done: true
  }, {
    id: 'td7',
    title: '욕실 청소하기',
    daysFromToday: null,
    done: true
  }]
};
},
"src/data/lifeInfo/routines.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.routineData = void 0;
// 생활 루틴 더미 데이터.
// - time: 24시간제 "HH:mm" 문자열 (예: 오후 7시 = "19:00")
// - doneToday: 오늘 완료 여부 (날이 바뀌면 AppDataContext 가 false 로 초기화)

const routineData = exports.routineData = {
  sortLabel: '이른 시간 순',
  items: [{
    id: 'r1',
    title: '일어나서 물 한 잔 마시기',
    time: '07:00',
    doneToday: true
  }, {
    id: 'r2',
    title: '창문 열고 환기하기',
    time: '07:30',
    doneToday: false
  }, {
    id: 'r3',
    title: '아침 식사 챙겨 먹기',
    time: '08:00',
    doneToday: true
  }, {
    id: 'r4',
    title: '점심 먹고 가볍게 걷기',
    time: '12:30',
    doneToday: false
  }, {
    id: 'r5',
    title: '저녁 먹고 설거지하기',
    time: '19:00',
    doneToday: false
  }, {
    id: 'r6',
    title: '잠들기 전 10분 정리하기',
    time: '22:30',
    doneToday: false
  }]
};
},
"src/data/more/account.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.settingsData = exports.profileData = exports.helpData = void 0;
// 더보기 > 개인정보 / 앱 설정 / 도움말 데이터. initial 은 로그인한 사용자 정보로 교체하세요.

const profileData = exports.profileData = {
  title: '개인정보 관리',
  subtitle: '계정의 개인정보를 확인하고 수정해요.',
  // email 은 로그인 계정이라 화면에서 읽기만 가능합니다.
  initial: {
    nickname: '자취생',
    email: 'user@example.com',
    region: ''
  },
  nicknameLabel: '닉네임',
  emailLabel: '이메일',
  emailHint: '로그인에 사용하는 이메일은 바꿀 수 없어요.',
  regionLabel: '거주 지역',
  regionPlaceholder: '예: 서울시 마포구',
  saveLabel: '저장하기'
};
const settingsData = exports.settingsData = {
  title: '앱 설정',
  subtitle: '알림과 앱 이용 환경을 설정해요.',
  initial: {
    notifyFridge: true,
    notifyRoutine: true,
    notifyTodo: true,
    notifySpending: false
  },
  notifySection: '알림',
  // key 는 settings 의 값 이름과 같아야 합니다.
  toggles: [{
    key: 'notifyFridge',
    title: '유통기한 알림',
    description: '기한이 임박한 식재료를 알려줘요.'
  }, {
    key: 'notifyRoutine',
    title: '루틴 알림',
    description: '정해 둔 시간에 루틴을 알려줘요.'
  }, {
    key: 'notifyTodo',
    title: '할 일 마감 알림',
    description: '마감이 다가오는 할 일을 알려줘요.'
  }, {
    key: 'notifySpending',
    title: '예산 알림',
    description: '이번 달 예산을 넘기기 전에 알려줘요.'
  }],
  infoSection: '앱 정보',
  version: '1.0.0',
  versionLabel: '앱 버전'
};
const helpData = exports.helpData = {
  title: '도움말',
  subtitle: '이용 방법을 확인하고 문의해요.',
  faqSection: '자주 묻는 질문',
  faqs: [{
    id: 'receipt',
    q: '영수증은 어떻게 등록하나요?',
    a: '소비 탭에서 영수증을 촬영하거나, 직접 입력으로 품목과 가격을 적어 등록할 수 있어요.'
  }, {
    id: 'fridge',
    q: '식재료 유통기한은 어떻게 관리하나요?',
    a: '냉장고 탭에서 식재료를 추가하면 기한이 가까운 순서대로 보여 드려요.'
  }, {
    id: 'routine',
    q: '루틴과 할 일은 어떻게 달라요?',
    a: '루틴은 매일 반복하는 습관이고, 할 일은 마감일이 있는 한 번짜리 일이에요.'
  }, {
    id: 'emergency',
    q: '비상매뉴얼은 인터넷 없이도 볼 수 있나요?',
    a: '앱에 들어 있는 안내라서 상황별 대처법은 바로 볼 수 있어요. 전화 연결은 통신이 필요해요.'
  }],
  contactSection: '문의하기',
  contactDescription: '해결되지 않았다면 메일로 알려 주세요.',
  contactLabel: '메일로 문의하기',
  // TODO: 실제 문의 메일 주소로 바꿔 주세요.
  contactEmail: 'support@example.com'
};
},
"src/utils/time.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.to24HourString = exports.formatRoutineTime = exports.clearRoutineChecks = void 0;
var _format = __load("src/utils/format.js");
// "19:00" -> "오후 07:00"
const formatRoutineTime = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${(0, _format.pad)(hour12)}:${(0, _format.pad)(m)}`;
};

// 루틴의 "오늘 완료" 체크를 모두 해제 (체크된 게 없으면 같은 배열을 그대로 반환)
exports.formatRoutineTime = formatRoutineTime;
const clearRoutineChecks = routines => routines.some(r => r.doneToday) ? routines.map(r => r.doneToday ? {
  ...r,
  doneToday: false
} : r) : routines;

// ('pm', 7, 0) -> "19:00"   (period: 'am' | 'pm', hour12: 1~12)
exports.clearRoutineChecks = clearRoutineChecks;
const to24HourString = (period, hour12, minute) => `${(0, _format.pad)(hour12 % 12 + (period === 'pm' ? 12 : 0))}:${(0, _format.pad)(minute)}`;
exports.to24HourString = to24HourString;
},
"src/navigation/RootNavigator.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = RootNavigator;
var _ModuleScreen = _interopRequireDefault(__load("integration/ModuleScreen.js"));
var _react = _interopRequireDefault(__load("react"));
var _nativeStack = __load("@react-navigation/native-stack");
var _TabNavigator = _interopRequireDefault(__load("src/navigation/TabNavigator.js"));
var _ManualEntryScreen = _interopRequireDefault(__load("src/screens/ManualEntryScreen.js"));
var _FridgeAddScreen = _interopRequireDefault(__load("src/screens/FridgeAddScreen.js"));
var _RecipeListScreen = _interopRequireDefault(__load("src/screens/RecipeListScreen.js"));
var _RecipeDetailScreen = _interopRequireDefault(__load("src/screens/RecipeDetailScreen.js"));
var _TodoScreen = _interopRequireDefault(__load("src/screens/TodoScreen.js"));
var _RoutineScreen = _interopRequireDefault(__load("src/screens/RoutineScreen.js"));
var _ReceiptResultScreen = _interopRequireDefault(__load("src/screens/ReceiptResultScreen.js"));
var _SpendingAnalysisScreen = _interopRequireDefault(__load("src/screens/SpendingAnalysisScreen.js"));
var _SpendingDetailScreen = _interopRequireDefault(__load("src/screens/SpendingDetailScreen.js"));
var _SpendingAllScreen = _interopRequireDefault(__load("src/screens/SpendingAllScreen.js"));
var _EmergencyDetailScreen = _interopRequireDefault(__load("src/screens/EmergencyDetailScreen.js"));
var _AiManagerScreen = _interopRequireDefault(__load("src/screens/AiManagerScreen.js"));
var _EmergencyAiScreen = _interopRequireDefault(__load("src/screens/EmergencyAiScreen.js"));
var _ReportDetailScreen = _interopRequireDefault(__load("src/screens/ReportDetailScreen.js"));
var _ReportListScreen = _interopRequireDefault(__load("src/screens/ReportListScreen.js"));
var _ProfileScreen = _interopRequireDefault(__load("src/screens/ProfileScreen.js"));
var _SettingsScreen = _interopRequireDefault(__load("src/screens/SettingsScreen.js"));
var _HelpScreen = _interopRequireDefault(__load("src/screens/HelpScreen.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const Stack = (0, _nativeStack.createNativeStackNavigator)();

// 탭 바가 없는 화면(상세, 입력 등)은 여기에 등록합니다.
function RootNavigator() {
  return /*#__PURE__*/_react.default.createElement(Stack.Navigator, {
    initialRouteName: "Tabs",
    screenOptions: {
      headerShown: false
    }
  }, /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "Module3",
    component: _ModuleScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "Tabs",
    component: _TabNavigator.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "ManualEntry",
    component: _ManualEntryScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "FridgeAdd",
    component: _FridgeAddScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "RecipeList",
    component: _RecipeListScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "RecipeDetail",
    component: _RecipeDetailScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "Todo",
    component: _TodoScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "Routine",
    component: _RoutineScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "ReceiptResult",
    component: _ReceiptResultScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "SpendingAnalysis",
    component: _SpendingAnalysisScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "SpendingDetail",
    component: _SpendingDetailScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "SpendingAll",
    component: _SpendingAllScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "EmergencyDetail",
    component: _EmergencyDetailScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "AiManager",
    component: _AiManagerScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "EmergencyAi",
    component: _EmergencyAiScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "ReportDetail",
    component: _ReportDetailScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "ReportList",
    component: _ReportListScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "Profile",
    component: _ProfileScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "Settings",
    component: _SettingsScreen.default
  }), /*#__PURE__*/_react.default.createElement(Stack.Screen, {
    name: "Help",
    component: _HelpScreen.default
  }));
}
},
"integration/ModuleScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ModuleScreen;
var _native = __load("@react-navigation/native");
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _inventory = _interopRequireDefault(__load("module3/app/(tabs)/inventory.js"));
var _recipe = _interopRequireDefault(__load("module3/app/(tabs)/recipe.js"));
var _meal = _interopRequireDefault(__load("module3/app/(tabs)/meal.js"));
var _shopping = _interopRequireDefault(__load("module3/app/(tabs)/shopping.js"));
var _new = _interopRequireDefault(__load("module3/app/inventory/new.js"));
var _id = _interopRequireDefault(__load("module3/app/inventory/[id].js"));
var _id2 = _interopRequireDefault(__load("module3/app/inventory/use/[id].js"));
var _id3 = _interopRequireDefault(__load("module3/app/inventory/discard/[id].js"));
var _history = _interopRequireDefault(__load("module3/app/inventory/history.js"));
var _alerts = _interopRequireDefault(__load("module3/app/inventory/alerts.js"));
var _id4 = _interopRequireDefault(__load("module3/app/recipe/[id].js"));
var _conditions = _interopRequireDefault(__load("module3/app/recipe/conditions.js"));
var _reminders = _interopRequireDefault(__load("module3/app/recipe/reminders.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function ModuleScreen({
  route,
  navigation
}) {
  const focused = (0, _native.useIsFocused)();
  const inset = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)(),
    p = route.params?.path || '/inventory/new';
  const Screen = p === '/inventory/new' ? _new.default : p === '/inventory/manage' ? _inventory.default : p === '/inventory/history' ? _history.default : p === '/inventory/alerts' ? _alerts.default : p.startsWith('/inventory/use/') ? _id2.default : p.startsWith('/inventory/discard/') ? _id3.default : p.startsWith('/inventory/') ? _id.default : p === '/(tabs)/recipe' ? _recipe.default : p === '/(tabs)/meal' ? _meal.default : p === '/(tabs)/shopping' ? _shopping.default : p === '/recipe/conditions' ? _conditions.default : p === '/recipe/reminders' ? _reminders.default : _id4.default;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1,
      paddingTop: inset.top,
      paddingBottom: inset.bottom,
      backgroundColor: 'white'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    accessibilityRole: "button",
    onPress: () => navigation.goBack(),
    style: {
      padding: 16,
      borderBottomWidth: 1,
      borderColor: '#edf1ee'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      fontSize: 17,
      color: '#217451'
    }
  }, "\u2039 \uB0C9\uC7A5\uACE0 \xB7 \uB4A4\uB85C")), focused && /*#__PURE__*/_react.default.createElement(Screen, {
    key: p + JSON.stringify(route.params)
  }));
}
},
"module3/app/(tabs)/inventory.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Inventory;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _Choices = _interopRequireDefault(__load("module3/components/Choices.js"));
var _ReferenceNotice = _interopRequireDefault(__load("module3/components/ReferenceNotice.js"));
var _UndoCard = _interopRequireDefault(__load("module3/components/UndoCard.js"));
var _AppProvider = __load("module3/state/AppProvider.js");
var _useDayClock = __load("module3/hooks/useDayClock.js");
var _inventory = __load("module3/domain/inventory.mjs");
var _inventoryFields = __load("module3/domain/inventoryFields.mjs");
var _transactions = __load("module3/domain/transactions.mjs");
var _nonAi = __load("module3/domain/nonAi.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Inventory() {
  const {
      state,
      confirmHousehold
    } = (0, _AppProvider.useApp)(),
    {
      today
    } = (0, _useDayClock.useDayClock)();
  const [query, setQuery] = (0, _react.useState)(''),
    [place, setPlace] = (0, _react.useState)('all'),
    [period, setPeriod] = (0, _react.useState)('all'),
    [error, setError] = (0, _react.useState)('');
  const items = state.inventory.filter(i => i.name.includes(query) && (place === 'all' || (place === 'household' ? i.category === 'household' : i.storageMethod === place)) && (period === 'all' || i.category !== 'household' && (period === 'urgent' ? (0, _inventory.daysLeft)(i.expiresAt, today) >= 0 && (0, _inventory.daysLeft)(i.expiresAt, today) <= 3 : (0, _inventory.daysLeft)(i.expiresAt, today) < 0))).sort((a, b) => (a.expiresAt || '9999').localeCompare(b.expiresAt || '9999'));
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uB0C9\uC7A5\uACE0\xB7\uCC3D\uACE0",
    subtitle: "\uAC19\uC740 \uD488\uBAA9\uB3C4 \uAD6C\uB9E4 \uBB36\uC74C\uBCC4\uB85C \uAD6C\uBD84\uD574\uC694."
  }, /*#__PURE__*/_react.default.createElement(_UndoCard.default, null), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uC804\uCCB4 \uC7AC\uACE0 \uBCC0\uACBD \uC774\uB825",
    onPress: () => _router.router.push("/inventory/history")
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "+ \uC7AC\uACE0 \uB4F1\uB85D",
    onPress: () => _router.router.push('/inventory/new')
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uB0C9\uC7A5\uACE0 \uB808\uC2DC\uD53C",
    onPress: () => _router.router.push('/(tabs)/recipe')
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uC7AC\uACE0 \uC784\uBC15 \uC54C\uB9BC \uC124\uC815",
    onPress: () => _router.router.push('/inventory/alerts')
  }), /*#__PURE__*/_react.default.createElement(_Choices.default, {
    label: "\uBCF4\uAD00 \uC7A5\uC18C / \uBD84\uB958",
    value: place,
    onChange: setPlace,
    options: [{
      value: 'all',
      label: '전체'
    }, ..._inventoryFields.STORAGE_METHODS, {
      value: 'household',
      label: '생필품'
    }]
  }), /*#__PURE__*/_react.default.createElement(_Choices.default, {
    label: "\uB0A0\uC9DC \uC0C1\uD0DC",
    value: period,
    onChange: setPeriod,
    options: [{
      value: 'all',
      label: '전체'
    }, {
      value: 'urgent',
      label: '3일 이내'
    }, {
      value: 'past',
      label: '날짜 경과'
    }]
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC7AC\uACE0 \uC774\uB984 \uAC80\uC0C9",
    value: query,
    onChangeText: setQuery
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, today, " \uAE30\uC900 \xB7 ", items.length, "\uAC1C \uAD6C\uB9E4 \uBB36\uC74C"), !!error && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.error
  }, error), items.map(i => {
    const d = (0, _inventory.daysLeft)(i.expiresAt, today),
      forecast = i.category === 'household' ? (0, _nonAi.householdForecast)(i, state.usages) : null;
    return /*#__PURE__*/_react.default.createElement(_UI.Card, {
      key: i.id
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: _UI.styles.label
    }, i.name, " \xB7 ", i.quantity, i.unit), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, i.category === 'household' ? '생필품' : '식재료', " \xB7 ", _inventoryFields.STORAGE_METHODS.find(o => o.value === i.storageMethod)?.label || '보관 미입력'), !!i.expiresAt && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: d < 0 ? _UI.styles.error : _UI.styles.muted
    }, i.dateType === 'package' ? '표시 소비기한' : '보관 참고일', " ", i.expiresAt, " \xB7 ", d < 0 ? `${-d}일 지남` : d === 0 ? '오늘까지' : `${d}일 남음`), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: _UI.styles.muted
    }, "\uAD6C\uB9E4\uC77C ", i.purchasedAt || '미입력', " \xB7 \uAC1C\uBD09 ", i.openedAt || '미확인'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC794\uC5EC \uAE08\uC561 ", (0, _transactions.money)(i.remainingCost)), /*#__PURE__*/_react.default.createElement(_UI.Button, {
      secondary: true,
      title: "\uC218\uC815 / \uC0AD\uC81C / \uBCF4\uAD00 \uC0C1\uD0DC",
      onPress: () => _router.router.push(`/inventory/${i.id}`)
    }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
      secondary: true,
      title: "\uC2E4\uC81C \uC0AC\uC6A9\uB7C9 \uC785\uB825",
      onPress: () => _router.router.push(`/inventory/use/${i.id}`)
    }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
      secondary: true,
      title: "\uC77C\uBD80 \uC218\uB7C9 \uD3D0\uAE30",
      onPress: () => _router.router.push(`/inventory/discard/${i.id}`)
    }), forecast && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: _UI.styles.muted
    }, forecast.mode === 'estimate' ? `사용 기록 기준 예상 잔량 ${forecast.quantity}${i.unit} (추정) · 기록 잔량은 자동 변경하지 않아요.` : '사용 기록이 부족해 잔량을 예측하지 않아요.'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uB2E4\uC74C \uC218\uB3D9 \uD655\uC778\uC77C ", forecast.reviewAt), /*#__PURE__*/_react.default.createElement(_UI.Button, {
      secondary: true,
      title: "\uC544\uC9C1 \uB0A8\uC74C \xB7 \uAE30\uB85D \uC794\uB7C9\uACFC \uAC19\uC74C",
      onPress: () => confirmHousehold(i.id).catch(e => setError(e.message))
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: _UI.styles.muted
    }, "\uC2E4\uC81C \uC794\uB7C9\uC774 \uB2E4\uB974\uBA74 \uC218\uC815 \uD654\uBA74\uC5D0\uC11C \uC218\uB7C9\uC744 \uBCF4\uC815\uD574 \uC8FC\uC138\uC694.")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: _UI.styles.label
    }, "\uCD5C\uADFC \uBCC0\uACBD \uC774\uB825"), (state.inventoryEvents || []).filter(e => e.batchId === i.id).slice(0, 5).map(e => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      key: e.id,
      style: _UI.styles.muted
    }, new Date(e.at).toLocaleString('ko-KR'), " \xB7 ", e.kind === 'create' ? '등록' : e.kind === 'use' ? '사용' : e.kind === 'delete' ? '삭제' : '수정', e.kind === 'use' && !state.usages.some(u => u.id === e.id) ? ' (취소됨)' : '', e.before ? ` · ${e.before.quantity} → ${e.after?.quantity ?? 0}${i.unit}` : '', e.before?.storageMethod !== e.after?.storageMethod ? ` · 보관 ${_inventoryFields.STORAGE_METHODS.find(o => o.value === e.before?.storageMethod)?.label || '미입력'} → ${_inventoryFields.STORAGE_METHODS.find(o => o.value === e.after?.storageMethod)?.label || '없음'}` : '', e.before?.openedAt !== e.after?.openedAt ? ` · 개봉 ${e.after?.openedAt || '미확인'}` : '')), state.meals.flatMap(m => (m.changes || []).filter(c => c.batchId === i.id).map(c => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      key: m.id + c.batchId,
      style: _UI.styles.muted
    }, new Date(m.createdAt).toLocaleString('ko-KR'), " \xB7 \uC870\uB9AC ", c.quantity, c.unit, " \uC0AC\uC6A9"))).slice(0, 5));
  }), !items.length && /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uC7AC\uACE0\uAC00 \uC5C6\uC5B4\uC694."), /*#__PURE__*/_react.default.createElement(_ReferenceNotice.default, null));
}
},
"module3/components/UI.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Button = Button;
exports.Card = Card;
exports.Field = Field;
exports.Page = Page;
exports.styles = void 0;
var _theme = __load("src/theme.js");
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _AppProvider = __load("module3/state/AppProvider.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Page({
  title,
  subtitle,
  children
}) {
  const {
    error
  } = (0, _AppProvider.useApp)();
  return /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    style: styles.page,
    contentContainerStyle: styles.content,
    keyboardShouldPersistTaps: "handled"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), subtitle && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.muted
  }, subtitle), error && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.error
  }, error), children);
}
function Card({
  children
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.card
  }, children);
}
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    accessibilityRole: "button",
    disabled: disabled,
    onPress: onPress,
    style: [styles.button, secondary && styles.secondary, disabled && {
      opacity: 0.4
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: secondary ? '#17664b' : 'white',
      fontWeight: '700'
    }
  }, title));
}
function Field({
  label,
  ...props
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      gap: 6
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, _extends({
    accessibilityLabel: label,
    style: styles.input,
    placeholderTextColor: "#87928c"
  }, props)));
}
const styles = exports.styles = _reactNative.StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  content: {
    padding: _theme.spacing.screenX,
    gap: 16,
    paddingBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: _theme.colors.textPrimary
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#19382c'
  },
  muted: {
    color: '#617269',
    lineHeight: 22
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e0e8df'
  },
  button: {
    backgroundColor: _theme.colors.green,
    padding: 17,
    borderRadius: 28,
    alignItems: 'center'
  },
  secondary: {
    backgroundColor: _theme.colors.heroBg
  },
  input: {
    backgroundColor: _theme.colors.cardBg,
    padding: 17,
    borderRadius: 20,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  error: {
    color: '#b93838',
    lineHeight: 22
  }
});
},
"src/theme.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.spacing = exports.radius = exports.mapColors = exports.fonts = exports.emergencyColors = exports.colors = void 0;
// 디자인 토큰. 색상은 스크린샷에서 추정한 값이므로
// Figma Inspect 값과 다르면 이 파일만 수정하면 전체에 반영됩니다.

const colors = exports.colors = {
  background: '#FFFFFF',
  textPrimary: '#1F3A30',
  textSecondary: '#7B817E',
  placeholder: '#A3A9A5',
  green: '#2F8A5B',
  greenLight: '#5CC79A',
  heroBg: '#EEF6F1',
  badgeBg: '#DFF0E6',
  cardBg: '#F5F6F4',
  divider: '#E6E8E5',
  progressTrack: '#DCEBE1',
  warnBg: '#FCEBE1',
  warnText: '#C0623A',
  tabActiveBg: '#E1F3E9',
  tabInactive: '#5F6B66',
  white: '#FFFFFF',
  // 할 일 화면용
  checkboxBorder: '#C5D0CB',
  overdueBg: '#FBF1EC',
  overdueBorder: '#DDA08E',
  inputBorder: '#E3E7E4'
};
const fonts = exports.fonts = {
  regular: 'NotoSansKR_400Regular',
  medium: 'NotoSansKR_500Medium',
  bold: 'NotoSansKR_700Bold'
};
const spacing = exports.spacing = {
  screenX: 24,
  gap: 12
};
const radius = exports.radius = {
  card: 24,
  icon: 14,
  pill: 999
};
// 비상매뉴얼 / 자취생존맵 화면용 색상. Figma PNG 에서 픽셀 값을 직접 읽어 온 값입니다.
// (위의 colors 는 스크린샷 추정값이라 이 화면과 팔레트가 다릅니다.)
const emergencyColors = exports.emergencyColors = {
  text: '#203346',
  textSecondary: '#74818B',
  danger: '#C34242',
  dangerBg: '#FFF5F4',
  dangerBorder: '#F2DAD7',
  surface: '#F7F9F9',
  border: '#E5EAEA',
  accent: '#087F79'
};

// 자취생존맵의 예시 지도 색상 (PNG 픽셀 값). 실제 지도 SDK 로 바꾸면 필요 없어집니다.
const mapColors = exports.mapColors = {
  street: '#F0F0EA',
  block: '#E3E5DE',
  crossStreet: '#FFFFFF',
  road: '#FFF9E9',
  roadBorder: '#E3DDD0',
  park: '#D4E6D7',
  parkBorder: '#BBD6C4',
  areaLabel: '#A5ADA5',
  label: '#919B94',
  parkLabel: '#789783',
  userDot: '#3F83CE',
  userHalo: 'rgba(63,131,206,0.18)'
};
},
"module3/components/Choices.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Choices;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _UI = __load("module3/components/UI.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function Choices({
  label,
  options,
  value,
  onChange,
  multiple = false
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      gap: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    }
  }, options.map(o => {
    const chosen = multiple ? value.includes(o.value) : value === o.value;
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      key: String(o.value),
      accessibilityRole: multiple ? 'checkbox' : 'radio',
      accessibilityLabel: `${label}: ${o.label}`,
      accessibilityState: {
        checked: chosen
      },
      onPress: () => onChange(multiple ? chosen ? value.filter(x => x !== o.value) : [...value, o.value] : o.value),
      style: {
        padding: 12,
        minHeight: 44,
        borderRadius: 15,
        backgroundColor: chosen ? '#217451' : '#e8f2eb'
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: chosen ? 'white' : '#17664b'
      }
    }, o.label));
  })));
}
},
"module3/components/ReferenceNotice.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ReferenceNotice;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _UI = __load("module3/components/UI.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function ReferenceNotice({
  dateType
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, dateType === 'package' ? '표시 소비기한은 제품 포장에 적힌 날짜예요.' : dateType === 'reference' ? '보관 참고일은 사용자가 직접 설정한 참고 날짜예요.' : '표시 소비기한은 제품 포장 날짜, 보관 참고일은 직접 설정한 참고 날짜예요.', " D-Day\uB9CC\uC73C\uB85C \uC2DD\uD488\uC758 \uC548\uC804\uC131\uC744 \uD310\uB2E8\uD558\uC9C0 \uC54A\uC544\uC694. \uAE30\uD55C \uACBD\uACFC \uC2DC \uC790\uB3D9 \uD3D0\uAE30\uD558\uC9C0 \uC54A\uC73C\uBA70 \uBCF4\uAD00 \uBC29\uBC95\uC744 \uBC14\uAFD4\uB3C4 \uB0A0\uC9DC\uB294 \uC790\uB3D9 \uC5F0\uC7A5\uB418\uC9C0 \uC54A\uC544\uC694.");
}
},
"module3/components/UndoCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = UndoCard;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _UI = __load("module3/components/UI.js");
var _AppProvider = __load("module3/state/AppProvider.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function UndoCard() {
  const {
    state,
    undoLatest
  } = (0, _AppProvider.useApp)();
  const [busy, setBusy] = (0, _react.useState)(false);
  const lock = (0, _react.useRef)(false);
  if (!state.undo) return null;
  async function undo() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await undoLatest(state.undo.id);
    } catch {} finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, state.undo.label, " \xB7 ", state.undo.kind === 'meal' ? '식사 차감' : state.undo.kind === 'use' ? '사용' : '폐기', " \uC644\uB8CC"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uB418\uB3CC\uB9AC\uBA74 \uC7AC\uACE0\xB7\uAE08\uC561\uC744 \uBCF5\uAD6C\uD558\uACE0 \uD574\uB2F9 \uAE30\uB85D\uC744 \uCDE8\uC18C\uD574\uC694. \uB2E4\uC74C \uC7AC\uACE0 \uBCC0\uACBD \uC804\uAE4C\uC9C0\uB9CC \uAC00\uB2A5\uD574\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: busy ? '복구 중…' : '되돌리기',
    disabled: busy,
    onPress: undo
  }));
}
},
"module3/hooks/useDayClock.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useDayClock = useDayClock;
var _react = __load("react");
var _reactNative = __load("react-native");
var _inventory = __load("module3/domain/inventory.mjs");
function useDayClock() {
  const [clock, setClock] = (0, _react.useState)(() => ({
    today: (0, _inventory.dayKey)(),
    zone: new Date().getTimezoneOffset()
  }));
  (0, _react.useEffect)(() => {
    const refresh = () => {
      const today = (0, _inventory.dayKey)(),
        zone = new Date().getTimezoneOffset();
      setClock(old => old.today === today && old.zone === zone ? old : {
        today,
        zone
      });
    };
    const timer = setInterval(refresh, 15000),
      sub = _reactNative.AppState.addEventListener('change', status => {
        if (status === 'active') refresh();
      });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  return clock;
}
},
"module3/app/(tabs)/recipe.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Recipe;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _useDayClock = __load("module3/hooks/useDayClock.js");
var _ReferenceNotice = _interopRequireDefault(__load("module3/components/ReferenceNotice.js"));
var _AppProvider = __load("module3/state/AppProvider.js");
var _seed = __load("module3/data/seed.js");
var _recipeSearch = __load("module3/domain/recipeSearch.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Recipe() {
  const {
    state
  } = (0, _AppProvider.useApp)();
  const clock = (0, _useDayClock.useDayClock)();
  const [query, setQuery] = (0, _react.useState)(''),
    [maxMinutes, setMaxMinutes] = (0, _react.useState)(0),
    [readyOnly, setReadyOnly] = (0, _react.useState)(false),
    [sort, setSort] = (0, _react.useState)('recommended'),
    [day, setDay] = (0, _react.useState)('');
  (0, _router.useFocusEffect)(_react.default.useCallback(() => {
    setDay(new Date().toDateString());
  }, []));
  const result = (0, _react.useMemo)(() => (0, _recipeSearch.searchRecipes)(_seed.recipes, state.inventory, {
    query,
    maxMinutes,
    readyOnly,
    sort,
    conditions: state.conditions
  }), [state.inventory, query, maxMinutes, readyOnly, sort, day, state.conditions, clock.today, clock.zone]);
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uB808\uC2DC\uD53C \uAC80\uC0C9",
    subtitle: "\uC571\uC5D0 \uB4F1\uB85D\uB41C \uC608\uC2DC \uB808\uC2DC\uD53C\uB97C \uAC80\uC0C9\uD574\uC694. \uCD94\uCC9C \uC21C\uC11C\uB294 \uC7AC\uACE0\uC640 \uB0A0\uC9DC\uB97C \uAE30\uC900\uC73C\uB85C \uC815\uD574\uC694."
  }, /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uC870\uB9AC \uB3C4\uAD6C \xB7 \uC608\uC0B0 \xB7 \uCCB4\uB825 \xB7 \uC81C\uC678 \uC7AC\uB8CC \uC124\uC815",
    onPress: () => _router.router.push("/recipe/conditions")
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC800\uC7A5\uB41C \uC870\uB9AC \uC870\uAC74\uACFC \uC544\uB798 \uAC80\uC0C9 \uD544\uD130\uB97C \uD568\uAED8 \uC801\uC6A9\uD574\uC694. \uACB0\uACFC\uAC00 \uC5C6\uC73C\uBA74 \uC124\uC815\uC5D0\uC11C \uC870\uAC74\uC744 \uBCC0\uACBD\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC694\uB9AC \uC774\uB984 \uB610\uB294 \uC7AC\uB8CC",
    value: query,
    onChangeText: setQuery,
    placeholder: "\uC608: \uBCF6\uC74C\uBC25, \uACC4\uB780, \uB450\uBD80 \uAE40\uCE58",
    returnKeyType: "search"
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, [0, 10, 15, 30].map(n => /*#__PURE__*/_react.default.createElement(_UI.Button, {
    key: n,
    secondary: maxMinutes !== n,
    title: n ? `${n}분 이내` : '시간 전체',
    onPress: () => setMaxMinutes(n)
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uD604\uC7AC \uC7AC\uACE0\uB85C \uAC00\uB2A5\uD55C \uC694\uB9AC\uB9CC"), /*#__PURE__*/_react.default.createElement(_reactNative.Switch, {
    accessibilityLabel: "\uD604\uC7AC \uC7AC\uACE0\uB85C \uAC00\uB2A5\uD55C \uC694\uB9AC\uB9CC",
    value: readyOnly,
    onValueChange: setReadyOnly
  })), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: sort === 'recommended' ? '정렬: 재고 추천순 (눌러서 빠른순)' : '정렬: 조리시간순 (눌러서 추천순)',
    onPress: () => setSort(s => s === 'recommended' ? 'quick' : 'recommended')
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uB9E4\uC77C \uB808\uC2DC\uD53C \uC54C\uB9BC \uC124\uC815",
    onPress: () => _router.router.push('/recipe/reminders')
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uAC80\uC0C9 \uACB0\uACFC ", result.length, "\uAC1C"), result.map(r => /*#__PURE__*/_react.default.createElement(_UI.Card, {
    key: r.id
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, r.name), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, r.minutes, "\uBD84 \xB7 1\uC778\uBD84 \xB7 ", r.missing.length ? `부족한 재료 ${r.missing.length}종` : '재료 준비 완료'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, r.ingredients.map(i => i.name).join(' · ')), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "\uB808\uC2DC\uD53C \uBCF4\uAE30",
    onPress: () => _router.router.push(`/recipe/${r.id}`)
  }))), !result.length && /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uB808\uC2DC\uD53C\uAC00 \uC5C6\uC5B4\uC694. \uAC80\uC0C9\uC5B4 \uB610\uB294 \uC7AC\uACE0 \uD544\uD130\uB97C \uBC14\uAFD4 \uBCF4\uC138\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uAC80\uC0C9 \uC870\uAC74 \uCD08\uAE30\uD654",
    onPress: () => {
      setQuery('');
      setMaxMinutes(0);
      setReadyOnly(false);
      setSort('recommended');
    }
  })), /*#__PURE__*/_react.default.createElement(_ReferenceNotice.default, null));
}
},
"module3/domain/recipeSearch.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.searchRecipes = searchRecipes;
var _nonAi = __load("module3/domain/nonAi.mjs");
var _inventory = __load("module3/domain/inventory.mjs");
const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/계란/g, '달걀').replace(/\s+/g, '');
// 모든 검색어가 이름 또는 재료에 포함되어야 합니다. 검색 결과도 기존 상세/조리 흐름을 사용합니다.
function searchRecipes(recipes, inventory, {
  query = '',
  maxMinutes = 0,
  readyOnly = false,
  sort = 'recommended',
  conditions = null
} = {}) {
  const tokens = query.trim().split(/\s+/).filter(Boolean).map(normalize);
  const found = (0, _inventory.rankRecipes)(inventory, recipes).filter(r => {
    const haystack = normalize([r.name, ...(r.aliases || []), ...r.ingredients.map(i => i.name)].join(' '));
    return (!conditions || (0, _nonAi.matchesConditions)(r, conditions)) && tokens.every(t => haystack.includes(t)) && (!maxMinutes || r.minutes <= Number(maxMinutes)) && (!readyOnly || !r.missing.length);
  });
  return sort === 'quick' ? found.sort((a, b) => a.minutes - b.minutes || b.score - a.score) : found;
}
},
"module3/app/(tabs)/meal.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Meal;
var _router = __load("integration/router.js");
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _UI = __load("module3/components/UI.js");
var _UndoCard = _interopRequireDefault(__load("module3/components/UndoCard.js"));
var _AppProvider = __load("module3/state/AppProvider.js");
var _transactions = __load("module3/domain/transactions.mjs");
var _nonAi = __load("module3/domain/nonAi.mjs");
var _inventory = __load("module3/domain/inventory.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Meal() {
  const {
    state
  } = (0, _AppProvider.useApp)();
  const [month, setMonth] = (0, _react.useState)((0, _inventory.dayKey)().slice(0, 7));
  let waste = null,
    error = '';
  try {
    waste = (0, _nonAi.monthlyWaste)(state.discards, month);
  } catch (e) {
    error = e.message;
  }
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC2DD\uC0AC \uAE30\uB85D",
    subtitle: "\uD655\uC778\uD55C \uC2E4\uC81C \uC0AC\uC6A9\uB7C9\uC73C\uB85C \uAE30\uB85D\uD588\uC5B4\uC694."
  }, /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uB0C9\uC7A5\uACE0\uB85C \uB3CC\uC544\uAC00\uAE30",
    onPress: () => _router.router.toFridge()
  }), /*#__PURE__*/_react.default.createElement(_UndoCard.default, null), /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uC6D4\uBCC4 \uD3D0\uAE30 \uB0B4\uC5ED"), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC9D1\uACC4 \uC6D4 (YYYY-MM)",
    value: month,
    onChangeText: setMonth
  }), error ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, error) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uD655\uC778\uB41C \uD3D0\uAE30 \uBE44\uC6A9 ", (0, _transactions.money)(waste.total), " \xB7 \uAE08\uC561 \uBBF8\uC785\uB825 ", waste.unknown, "\uAC74"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uAE30\uAE30 \uC2DC\uAC04\uB300 \uAE30\uC900 \xB7 \uC2E0\uADDC \uC9C0\uCD9C\uB85C \uB354\uD558\uC9C0 \uC54A\uC544\uC694. \uCDE8\uC18C\uD55C \uD3D0\uAE30\uB294 \uC81C\uC678\uB3FC\uC694."), waste.rows.map(d => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: d.id
  }, d.name, " ", d.quantity, d.unit, " \xB7 ", (0, _transactions.money)(d.cost), " \xB7 ", d.reason || "사유 미입력")))), state.meals.length ? state.meals.map(m => /*#__PURE__*/_react.default.createElement(_UI.Card, {
    key: m.id
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, m.name), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, new Date(m.createdAt).toLocaleString('ko-KR')), m.usage?.map(i => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: `${i.name}-${i.unit}`
  }, i.name, " ", i.quantity, i.unit)), m.changes?.map(c => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: c.batchId,
    style: _UI.styles.muted
  }, c.name, " \uC0AC\uC6A9 \uAE08\uC561: ", (0, _transactions.money)(c.cost))))) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC544\uC9C1 \uC2DD\uC0AC \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694."));
}
},
"module3/app/(tabs)/shopping.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Shopping;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _AppProvider = __load("module3/state/AppProvider.js");
var _nonAi = __load("module3/domain/nonAi.mjs");
var _transactions = __load("module3/domain/transactions.mjs");
var _shopping = __load("module3/domain/shopping.mjs");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Shopping() {
  const {
    state,
    addShopping,
    toggleShopping,
    deleteShopping,
    editShopping,
    removeShoppingRecipe
  } = (0, _AppProvider.useApp)();
  const [price, setPrice] = (0, _react.useState)('');
  const [name, setName] = (0, _react.useState)(''),
    [q, setQ] = (0, _react.useState)('1'),
    [unit, setUnit] = (0, _react.useState)('개'),
    [editing, setEditing] = (0, _react.useState)(null),
    [error, setError] = (0, _react.useState)(''),
    [busy, setBusy] = (0, _react.useState)(false);
  const lock = (0, _react.useRef)(false);
  async function run(action) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e.message || '처리하지 못했어요. 다시 시도해 주세요.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function reset() {
    setName('');
    setPrice('');
    setQ('1');
    setUnit('개');
    setEditing(null);
  }
  async function save() {
    await run(async () => {
      const item = (0, _shopping.shoppingItem)({
        name,
        quantity: q,
        unit,
        estimatedUnitPrice: price
      });
      if (editing) await editShopping(editing, item);else await addShopping([item]);
      reset();
    });
  }
  const items = [...state.shopping].sort((a, b) => Number(a.done) - Number(b.done));
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC7A5\uBCF4\uAE30 \uBAA9\uB85D",
    subtitle: "\uC0C1\uD488\uACFC \uAC00\uACA9\uC740 \uAD6C\uB9E4\uCC98\uC5D0\uC11C \uD655\uC778\uD574 \uC8FC\uC138\uC694. \uAD6C\uB9E4\uD55C \uD488\uBAA9\uC740 \uB0A0\uC9DC\uC640 \uBCF4\uAD00 \uC815\uBCF4\uB97C \uD655\uC778\uD55C \uB4A4 \uC7AC\uACE0\uB85C \uB4F1\uB85D\uD574\uC694."
  }, /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, editing ? '품목 수정' : '품목 추가'), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC7AC\uB8CC\uBA85",
    value: name,
    onChangeText: setName
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC218\uB7C9",
    value: q,
    onChangeText: setQ,
    keyboardType: "decimal-pad"
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uB2E8\uC704",
    value: unit,
    onChangeText: setUnit
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "1\uB2E8\uC704\uB2F9 \uC608\uC0C1 \uAC00\uACA9 (\uC6D0, \uC120\uD0DD)",
    value: price,
    onChangeText: setPrice,
    keyboardType: "number-pad"
  }), (0, _nonAi.stockMatches)(state.inventory, {
    name
  }).map(i => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: i.id,
    style: _UI.styles.error
  }, "\uC774\uBBF8 \uBCF4\uC720: ", i.name, " ", i.quantity, i.unit, " \xB7 \uAC1C\uBD09 ", i.openedAt || "미확인", ". \uB0A0\uC9DC\uC640 \uC794\uB7C9\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.")), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: busy,
    title: editing ? '수정 저장' : '목록에 추가',
    onPress: save
  }), editing && /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: "\uC218\uC815 \uCDE8\uC18C",
    onPress: reset
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uAC19\uC740 \uC774\uB984\xB7\uB2E8\uC704\uC758 \uBBF8\uAD6C\uB9E4 \uD488\uBAA9\uC740 \uC911\uBCF5 \uCD94\uAC00\uD558\uC9C0 \uC54A\uACE0 \uC9C1\uC811 \uCD94\uAC00\uB294 \uB354 \uD070 \uC218\uB7C9\uC744 \uC720\uC9C0\uD558\uACE0, \uC11C\uB85C \uB2E4\uB978 \uC694\uB9AC\uC758 \uBD80\uC871 \uC218\uB7C9\uC740 \uD569\uC0B0\uD574\uC694. \uAC19\uC740 \uC694\uB9AC\uB97C \uB2E4\uC2DC \uCD94\uAC00\uD558\uBA74 \uD574\uB2F9 \uD544\uC694\uB7C9\uC744 \uAC31\uC2E0\uD574\uC694.")), !!error && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.error
  }, error), /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uBBF8\uAD6C\uB9E4 \uC608\uC0C1 \uBE44\uC6A9(\uC785\uB825\uB41C \uAC00\uACA9\uB9CC): ", (0, _transactions.money)(items.filter(i => !i.done && i.estimatedUnitPrice != null).reduce((n, i) => n + Math.round(i.estimatedUnitPrice * i.quantity), 0))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uAC00\uACA9 \uBBF8\uC785\uB825 ", items.filter(i => !i.done && i.estimatedUnitPrice == null).length, "\uAC74 \xB7 \uC2E4\uC81C \uC9C0\uCD9C\uC5D0\uB294 \uD569\uC0B0\uD558\uC9C0 \uC54A\uC544\uC694.")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uC0B4 \uAC83 ", items.filter(i => !i.done).length, "\uAC1C \xB7 \uAD6C\uB9E4 \uC644\uB8CC ", items.filter(i => i.done).length, "\uAC1C"), items.map(i => /*#__PURE__*/_react.default.createElement(_UI.Card, {
    key: i.id
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [_UI.styles.label, i.done && {
      textDecorationLine: 'line-through',
      opacity: 0.5
    }]
  }, i.name, " ", i.quantity, i.unit), (0, _shopping.shoppingSources)(i).map(source => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: source.key,
    style: _UI.styles.muted
  }, source.name, " \xB7 ", source.quantity, i.unit)), !i.done && (0, _shopping.shoppingSources)(i).filter(s => s.type === 'recipe').map(s => /*#__PURE__*/_react.default.createElement(_UI.Button, {
    key: s.key,
    secondary: true,
    disabled: busy,
    title: `${s.name} 필요 재료 제외`,
    onPress: () => run(async () => {
      await removeShoppingRecipe(s.recipeId);
      reset();
    })
  })), !i.done && (0, _shopping.shoppingSources)(i).some(s => s.type === 'recipe') && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC81C\uC678\uD558\uBA74 \uC774 \uC694\uB9AC\uC758 \uBBF8\uAD6C\uB9E4 \uC7AC\uB8CC\uAC00 \uBAA9\uB85D \uC804\uCCB4\uC5D0\uC11C \uBE60\uC838\uC694. \uB2E4\uB978 \uC694\uB9AC\uC640 \uC9C1\uC811 \uCD94\uAC00\uD55C \uC218\uB7C9\uC740 \uC720\uC9C0\uB3FC\uC694. \uC5EC\uB7EC \uC694\uB9AC\uC758 \uBD80\uC871\uB7C9 \uD569\uACC4\uC774\uBA70 \uACF5\uD1B5 \uC7AC\uACE0\uB97C \uC608\uC57D\uD558\uC9C0\uB294 \uC54A\uC544\uC694."), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC608\uC0C1 \uBE44\uC6A9: ", i.estimatedUnitPrice == null ? '가격 미입력' : (0, _transactions.money)(Math.round(i.estimatedUnitPrice * i.quantity))), !i.done && (0, _nonAi.stockMatches)(state.inventory, i).map(stock => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: stock.id
  }, "\uBCF4\uC720 \uC7AC\uACE0 ", stock.quantity, stock.unit, " \xB7 \uAC1C\uBD09 ", stock.openedAt || '미확인')), !i.done && /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: "\uCFE0\uD321\uC5D0\uC11C \uC0C1\uD488 \uAC80\uC0C9",
    onPress: () => run(() => _reactNative.Linking.openURL((0, _shopping.purchaseUrl)(i.name)))
  }), !i.inventoryId && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: i.done ? '구매 체크 해제' : '구매 완료',
    onPress: () => run(() => toggleShopping(i.id))
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: "\uC218\uB7C9 / \uD488\uBAA9 \uC218\uC815",
    onPress: () => {
      setEditing(i.id);
      setName(i.name);
      setQ(String(i.quantity));
      setUnit(i.unit);
      setPrice(i.estimatedUnitPrice == null ? "" : String(i.estimatedUnitPrice));
    }
  })), i.done && !i.inventoryId && /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: busy,
    title: "\uAD6C\uB9E4\uD55C \uD488\uBAA9 \uC7AC\uACE0 \uB4F1\uB85D",
    onPress: () => _router.router.push({
      pathname: '/inventory/new',
      params: {
        shoppingId: i.id
      }
    })
  }), !!i.inventoryId && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC7AC\uACE0 \uB4F1\uB85D \uC644\uB8CC"), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: "\uBAA9\uB85D\uC5D0\uC11C \uC0AD\uC81C",
    onPress: () => run(async () => {
      await deleteShopping(i.id);
      if (editing === i.id) reset();
    })
  }))), !items.length && /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC7A5\uBCF4\uAE30 \uBAA9\uB85D\uC774 \uBE44\uC5B4 \uC788\uC5B4\uC694. \uB808\uC2DC\uD53C \uC0C1\uC138\uC5D0\uC11C \uBD80\uC871\uD55C \uC7AC\uB8CC\uB97C \uCD94\uAC00\uD560 \uC218\uB3C4 \uC788\uC5B4\uC694."));
}
},
"module3/app/inventory/new.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = New;
var _react = _interopRequireDefault(__load("react"));
var _router = __load("integration/router.js");
var _reactNative = __load("react-native");
var _InventoryForm = _interopRequireDefault(__load("module3/components/InventoryForm.js"));
var _UI = __load("module3/components/UI.js");
var _AppProvider = __load("module3/state/AppProvider.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function New() {
  const {
      shoppingId
    } = (0, _router.useLocalSearchParams)(),
    {
      state
    } = (0, _AppProvider.useApp)();
  const shopping = state.shopping.find(i => i.id === shoppingId);
  if (shoppingId && (!shopping || shopping.inventoryId)) return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC7AC\uACE0 \uB4F1\uB85D"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC774\uBBF8 \uB4F1\uB85D\uD588\uAC70\uB098 \uC0AD\uC81C\uB41C \uC7A5\uBCF4\uAE30 \uD488\uBAA9\uC774\uC5D0\uC694."));
  return /*#__PURE__*/_react.default.createElement(_InventoryForm.default, {
    shopping: shopping
  });
}
},
"module3/components/InventoryForm.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = InventoryForm;
var _IngredientSuggestions = _interopRequireDefault(__load("module3/components/IngredientSuggestions.js"));
var _foodUnits = __load("module3/domain/foodUnits.mjs");
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _AppProvider = __load("module3/state/AppProvider.js");
var _ReferenceNotice = _interopRequireDefault(__load("module3/components/ReferenceNotice.js"));
var _inventoryFields = __load("module3/domain/inventoryFields.mjs");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function Choices({
  label,
  options,
  value,
  onChange
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      gap: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: formStyles.choices
  }, options.map(option => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: option.value,
    accessibilityRole: "radio",
    accessibilityLabel: `${label}: ${option.label}`,
    accessibilityState: {
      checked: value === option.value
    },
    onPress: () => onChange(option.value),
    style: [formStyles.choice, value === option.value && formStyles.selected]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: value === option.value ? 'white' : '#19382c'
    }
  }, value === option.value ? '● ' : '○ ', option.label)))));
}
function InventoryForm({
  item,
  shopping
}) {
  const {
    saveItem,
    deleteItem,
    registerShopping
  } = (0, _AppProvider.useApp)();
  const [draft, setDraft] = (0, _react.useState)(() => (0, _inventoryFields.inventoryDraft)(item || (shopping ? {
    name: shopping.name,
    quantity: shopping.quantity,
    unit: shopping.unit
  } : undefined)));
  const [error, setError] = (0, _react.useState)('');
  const lock = (0, _react.useRef)(false);
  const [busy, setBusy] = (0, _react.useState)(false);
  const [confirm, setConfirm] = (0, _react.useState)(false);
  const manualUnit = (0, _react.useRef)(!!item || !!shopping);
  const change = key => value => {
    if (key === 'unit') manualUnit.current = true;
    setDraft(current => ({
      ...current,
      [key]: value,
      ...(key === 'name' && !manualUnit.current && draft.category !== 'household' && (0, _foodUnits.foodUnit)(value) ? {
        unit: (0, _foodUnits.foodUnit)(value).unit
      } : {})
    }));
    setError('');
    setConfirm(false);
  };
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const record = (0, _inventoryFields.inventoryRecord)(draft, item?.id || (0, _AppProvider.newId)(), item);
      if (shopping) await registerShopping(shopping.id, record);else await saveItem(record);
      _router.router.back();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const dateLabel = draft.dateType === 'reference' ? '보관 참고일' : '소비기한';
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: item ? '재고 수정' : '새 재료 등록'
  }, item && (!item.purchasedAt || !item.storageMethod || !item.dateType) && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC774\uC804\uC5D0 \uB4F1\uB85D\uD55C \uC7AC\uACE0\uC608\uC694. \uAD6C\uB9E4\uC77C, \uBCF4\uAD00 \uBC29\uBC95, \uB0A0\uC9DC \uC720\uD615\uC744 \uD655\uC778\uD574\uC11C \uC785\uB825\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/_react.default.createElement(Choices, {
    label: "\uBD84\uB958",
    options: [{
      value: "food",
      label: "식재료"
    }, {
      value: "household",
      label: "생필품"
    }],
    value: draft.category,
    onChange: change("category")
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC7AC\uB8CC\uBA85 (\uC608: \uB2EC\uAC40)",
    value: draft.name,
    onChangeText: change('name')
  }), draft.category !== 'household' && /*#__PURE__*/_react.default.createElement(_IngredientSuggestions.default, {
    value: draft.name,
    onSelect: i => change('name')(i.name)
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC218\uB7C9",
    keyboardType: "decimal-pad",
    value: draft.quantity,
    onChangeText: change('quantity')
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uB2E8\uC704 (\uAC1C / g / \uACF5\uAE30 / \uBAA8)",
    value: draft.unit,
    onChangeText: change('unit')
  }), (0, _foodUnits.foodUnit)(draft.name) && draft.unit !== (0, _foodUnits.foodUnit)(draft.name).unit && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uB808\uC2DC\uD53C \uAE30\uC900\uC740 ", (0, _foodUnits.foodUnit)(draft.name).unit, "\uC608\uC694. \uB2E8\uC704 \uBCC0\uACBD \uC2DC \uC218\uB7C9\uC744 \uC9C1\uC811 \uD655\uC778\uD558\uC138\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: `${(0, _foodUnits.foodUnit)(draft.name).unit} 단위로 변경`,
    onPress: () => change('unit')((0, _foodUnits.foodUnit)(draft.name).unit)
  })), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uD604\uC7AC \uC218\uB7C9\uC5D0 \uD574\uB2F9\uD558\uB294 \uAD6C\uB9E4 \uAE08\uC561 (\uC6D0, \uC120\uD0DD)",
    keyboardType: "number-pad",
    value: draft.remainingCost,
    onChangeText: change('remainingCost'),
    placeholder: "\uBAA8\uB974\uBA74 \uBE44\uC6CC \uB450\uC138\uC694"
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC218\uB7C9\uC744 \uC218\uC815\uD558\uBA74 \uD574\uB2F9 \uC218\uB7C9\uC758 \uAE08\uC561\uB3C4 \uD568\uAED8 \uD655\uC778\uD574 \uC8FC\uC138\uC694. \uC0AC\uC6A9\xB7\uD3D0\uAE30\uD55C \uBE44\uC728\uB9CC\uD07C \uC904\uC5B4\uB4E4\uBA70 \uAC00\uACC4\uBD80 \uACB0\uC81C\uC561\uC740 \uBC14\uB00C\uC9C0 \uC54A\uC544\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uAD6C\uB9E4\uC77C (YYYY-MM-DD)",
    placeholder: "\uC608: 2026-10-08",
    maxLength: 10,
    autoCorrect: false,
    value: draft.purchasedAt,
    onChangeText: change('purchasedAt')
  }), /*#__PURE__*/_react.default.createElement(Choices, {
    label: "\uBCF4\uAD00 \uBC29\uBC95",
    options: _inventoryFields.STORAGE_METHODS,
    value: draft.storageMethod,
    onChange: change('storageMethod')
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uAC1C\uBD09\uC77C (\uC120\uD0DD, YYYY-MM-DD)",
    value: draft.openedAt,
    onChangeText: change("openedAt"),
    maxLength: 10
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uAC1C\uBD09\uC77C\uC774 \uBE44\uC5B4 \uC788\uC73C\uBA74 \uAC1C\uBD09 \uC5EC\uBD80 \uBBF8\uD655\uC778\uC774\uC5D0\uC694. \uB0C9\uB3D9\xB7\uAC1C\uBD09 \uC2DC \uB0A0\uC9DC\uAC00 \uC790\uB3D9 \uC5F0\uC7A5\uB418\uC9C0 \uC54A\uC544\uC694."), draft.category === "household" && /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC794\uB7C9 \uD655\uC778 \uC8FC\uAE30 (\uC77C)",
    keyboardType: "number-pad",
    value: draft.reviewDays,
    onChangeText: change("reviewDays")
  }), /*#__PURE__*/_react.default.createElement(Choices, {
    label: "\uB0A0\uC9DC \uC720\uD615",
    options: _inventoryFields.DATE_TYPES,
    value: draft.dateType,
    onChange: change('dateType')
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: `${dateLabel} (YYYY-MM-DD)`,
    maxLength: 10,
    autoCorrect: false,
    value: draft.expiresAt,
    onChangeText: change('expiresAt')
  }), /*#__PURE__*/_react.default.createElement(_ReferenceNotice.default, {
    dateType: draft.dateType
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uAC80\uC99D\uB41C \uBCF4\uAD00 \uC790\uB8CC\uAC00 \uC5F0\uACB0\uB418\uAE30 \uC804\uAE4C\uC9C0 \uC790\uB3D9 \uC18C\uC9C4\uC77C \uCD94\uC815\uC740 \uC81C\uACF5\uD558\uC9C0 \uC54A\uC544\uC694. \uC81C\uD488 \uD45C\uC2DC \uB610\uB294 \uC9C1\uC811 \uD655\uC778\uD55C \uCC38\uACE0\uC77C\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694."), error ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityRole: "alert",
    style: _UI.styles.error
  }, error) : null, /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: busy ? "저장 중…" : "저장",
    disabled: busy,
    onPress: save
  }), item && /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uC2E4\uC81C \uC0AC\uC6A9\uB7C9 \uC785\uB825",
    onPress: () => _router.router.push(`/inventory/use/${item.id}`)
  }), item && /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uC77C\uBD80 \uC218\uB7C9 \uD3D0\uAE30\uD558\uAE30",
    disabled: busy,
    onPress: () => _router.router.replace(`/inventory/discard/${item.id}`)
  }), item && /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: busy,
    secondary: true,
    title: confirm ? '정말 삭제하기' : '재고 삭제',
    onPress: async () => {
      if (lock.current) return;
      if (!confirm) {
        setConfirm(true);
        return;
      }
      lock.current = true;
      setBusy(true);
      try {
        await deleteItem(item.id);
        _router.router.back();
      } catch (e) {
        setError(e.message);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    }
  }));
}
const formStyles = _reactNative.StyleSheet.create({
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  choice: {
    minHeight: 44,
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccd8cd',
    backgroundColor: 'white'
  },
  selected: {
    backgroundColor: '#217451',
    borderColor: '#217451'
  }
});
},
"module3/components/IngredientSuggestions.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = IngredientSuggestions;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _ingredientCatalog = __load("module3/domain/ingredientCatalog.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function IngredientSuggestions({
  value,
  onSelect
}) {
  const rows = (0, _ingredientCatalog.suggestIngredients)(value);
  if (!rows.length) return null;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      marginVertical: 10,
      gap: 6
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: '#66766e'
    }
  }, "\uC2DD\uC7AC\uB8CC \uC120\uD0DD \xB7 \uB2E8\uC704\uB294 \uC218\uB7C9\uACFC \uD568\uAED8 \uD655\uC778\uD574 \uC8FC\uC138\uC694"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    }
  }, rows.map(i => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: i.id,
    accessibilityRole: "button",
    accessibilityLabel: `${i.name}, 기본 단위 ${i.unit}`,
    onPress: () => onSelect(i),
    style: {
      padding: 12,
      minHeight: 44,
      borderRadius: 16,
      backgroundColor: '#e4f3eb'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: '#217451'
    }
  }, i.name, " \xB7 ", i.unit)))));
}
},
"module3/app/inventory/[id].js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Edit;
var _react = _interopRequireDefault(__load("react"));
var _router = __load("integration/router.js");
var _reactNative = __load("react-native");
var _AppProvider = __load("module3/state/AppProvider.js");
var _InventoryForm = _interopRequireDefault(__load("module3/components/InventoryForm.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function Edit() {
  const {
    id
  } = (0, _router.useLocalSearchParams)();
  const {
    state
  } = (0, _AppProvider.useApp)();
  const item = state.inventory.find(i => i.id === id);
  return item ? /*#__PURE__*/_react.default.createElement(_InventoryForm.default, {
    item: item
  }) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC7AC\uACE0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694.");
}
},
"module3/app/inventory/use/[id].js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Use;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _AppProvider = __load("module3/state/AppProvider.js");
var _UI = __load("module3/components/UI.js");
var _UndoCard = _interopRequireDefault(__load("module3/components/UndoCard.js"));
var _transactions = __load("module3/domain/transactions.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Use() {
  const {
      id
    } = (0, _router.useLocalSearchParams)(),
    {
      state,
      useItem
    } = (0, _AppProvider.useApp)(),
    item = state.inventory.find(i => i.id === id);
  const [amount, setAmount] = (0, _react.useState)(''),
    [done, setDone] = (0, _react.useState)(false),
    [error, setError] = (0, _react.useState)(''),
    [busy, setBusy] = (0, _react.useState)(false),
    tx = (0, _react.useRef)((0, _AppProvider.newId)()),
    lock = (0, _react.useRef)(false);
  if (done) return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC0AC\uC6A9 \uAE30\uB85D"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, state.usages.some(u => u.id === tx.current) ? '사용량을 저장했어요.' : '사용이 취소됐어요.'), /*#__PURE__*/_react.default.createElement(_UndoCard.default, null));
  if (!item) return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC7AC\uACE0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694."
  });
  let preview = null;
  try {
    preview = (0, _transactions.removeFromBatch)(item, amount);
  } catch {}
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: `${item.name} 사용`,
    subtitle: "\uC2E4\uC81C \uC0AC\uC6A9\uD55C \uC218\uB7C9\uB9CC \uC785\uB825\uD574 \uC8FC\uC138\uC694."
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uD604\uC7AC ", item.quantity, item.unit), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: `사용량 (${item.unit})`,
    keyboardType: "decimal-pad",
    value: amount,
    onChangeText: setAmount
  }), preview && /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uB0A8\uC744 \uC218\uB7C9 ", preview.item.quantity, item.unit), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC0AC\uC6A9 \uAE08\uC561 ", (0, _transactions.money)(preview.cost))), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "\uD655\uC778 \uD6C4 \uCC28\uAC10",
    disabled: !preview || busy,
    onPress: async () => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        await useItem(id, amount, tx.current);
        setDone(true);
      } catch (e) {
        setError(e.message);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    }
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, error));
}
},
"module3/app/inventory/discard/[id].js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Discard;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _ReferenceNotice = _interopRequireDefault(__load("module3/components/ReferenceNotice.js"));
var _UndoCard = _interopRequireDefault(__load("module3/components/UndoCard.js"));
var _AppProvider = __load("module3/state/AppProvider.js");
var _transactions = __load("module3/domain/transactions.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Discard() {
  const {
      id
    } = (0, _router.useLocalSearchParams)(),
    {
      state,
      discardItem
    } = (0, _AppProvider.useApp)();
  const item = state.inventory.find(i => i.id === id);
  const [amount, setAmount] = (0, _react.useState)(''),
    [reason, setReason] = (0, _react.useState)(''),
    [busy, setBusy] = (0, _react.useState)(false),
    [done, setDone] = (0, _react.useState)(false),
    [error, setError] = (0, _react.useState)('');
  const lock = (0, _react.useRef)(false),
    tx = (0, _react.useRef)((0, _AppProvider.newId)());
  let preview = null,
    problem = '';
  if (item && amount) {
    try {
      preview = (0, _transactions.removeFromBatch)(item, (0, _transactions.quantity)(amount));
    } catch (e) {
      problem = e.message;
    }
  }
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await discardItem(id, amount, reason.trim(), tx.current);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (done) return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uD3D0\uAE30 \uCC98\uB9AC"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, state.discards.some(d => d.id === tx.current) ? '폐기량과 금액을 반영했어요.' : '폐기가 취소되고 재고가 복구되었어요.'), /*#__PURE__*/_react.default.createElement(_UndoCard.default, null), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "\uC7AC\uACE0 \uBAA9\uB85D",
    onPress: () => _router.router.replace('/(tabs)/inventory')
  }));
  if (!item) return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC7AC\uACE0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694."
  });
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: `${item.name} 폐기`
  }, /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uD604\uC7AC ", item.quantity, item.unit, " \xB7 \uC794\uC5EC \uAD6C\uB9E4 \uAE08\uC561 ", (0, _transactions.money)(item.remainingCost))), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    editable: !busy,
    label: `폐기 수량 (${item.unit})`,
    value: amount,
    onChangeText: setAmount,
    keyboardType: "decimal-pad"
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    editable: !busy,
    label: "\uD3D0\uAE30 \uC0AC\uC720 (\uC120\uD0DD)",
    value: reason,
    onChangeText: setReason,
    maxLength: 200
  }), preview && /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uD655\uC778 \uD6C4 \uCC98\uB9AC\uD560 \uB0B4\uC6A9"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uD3D0\uAE30 \uAE08\uC561: ", (0, _transactions.money)(preview.cost)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uB0A8\uB294 \uC7AC\uACE0: ", preview.item.quantity, item.unit), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uB0A8\uB294 \uAD6C\uB9E4 \uAE08\uC561: ", (0, _transactions.money)(preview.item.remainingCost)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC6D0 \uB2E8\uC704\uB85C \uBC18\uC62C\uB9BC\uD558\uBA70 \uC804\uCCB4 \uD3D0\uAE30 \uC2DC \uC794\uC5EC \uAE08\uC561\uC744 \uBAA8\uB450 \uBC18\uC601\uD574\uC694. \uAC00\uACC4\uBD80 \uACB0\uC81C \uAE30\uB85D\uC740 \uBCC0\uACBD\uB418\uC9C0 \uC54A\uC544\uC694.")), !!(problem || error) && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.error
  }, problem || error), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: busy ? '저장 중…' : '확인 후 폐기',
    disabled: busy || !preview,
    onPress: submit
  }), /*#__PURE__*/_react.default.createElement(_ReferenceNotice.default, null));
}
},
"module3/app/inventory/history.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = History;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _AppProvider = __load("module3/state/AppProvider.js");
var _UI = __load("module3/components/UI.js");
var _inventoryFields = __load("module3/domain/inventoryFields.mjs");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const labels = {
  create: '등록',
  edit: '수정·확인',
  delete: '삭제',
  use: '사용',
  undo: '되돌리기'
};
const storage = value => _inventoryFields.STORAGE_METHODS.find(s => s.value === value)?.label || '미입력';
function History() {
  const {
    state
  } = (0, _AppProvider.useApp)();
  const rows = [...state.inventoryEvents.map(e => ({
    ...e,
    type: 'event'
  })), ...state.meals.map(m => ({
    ...m,
    at: m.createdAt,
    type: 'meal'
  })), ...state.discards.map(d => ({
    ...d,
    at: d.createdAt,
    type: 'discard'
  }))].sort((a, b) => b.at.localeCompare(a.at));
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC7AC\uACE0 \uBCC0\uACBD \uC774\uB825",
    subtitle: "\uB4F1\uB85D\xB7\uC218\uC815\xB7\uC0AC\uC6A9\xB7\uD3D0\uAE30\xB7\uCDE8\uC18C \uC774\uB825\uC744 \uBCF4\uC5EC\uC918\uC694. \uC0AD\uC81C\uD558\uAC70\uB098 \uC18C\uC9C4\uD55C \uC7AC\uACE0\uC758 \uC774\uB825\uB3C4 \uB0A8\uC544\uC694."
  }, !rows.length && /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uAE30\uB85D\uB41C \uBCC0\uACBD\uC774 \uC5C6\uC5B4\uC694. \uC774 \uAE30\uB2A5 \uB3C4\uC785 \uC804 \uBCC0\uACBD \uC774\uB825\uC740 \uBCF5\uC6D0\uD558\uC9C0 \uC54A\uC544\uC694."), rows.map(e => /*#__PURE__*/_react.default.createElement(_UI.Card, {
    key: e.type + e.id
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, e.type === 'event' ? `${labels[e.kind] || e.kind} · ${e.after?.name || e.before?.name || '최근 작업'}` : e.type === 'meal' ? `조리 · ${e.name}` : `폐기 · ${e.name}`), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, new Date(e.at).toLocaleString('ko-KR')), e.type === 'event' && e.before && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC218\uB7C9 ", e.before.quantity, " \u2192 ", e.after?.quantity ?? 0, " ", e.after?.unit || e.before.unit), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uBCF4\uAD00 ", storage(e.before.storageMethod), " \u2192 ", e.after ? storage(e.after.storageMethod) : '삭제'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uB0A0\uC9DC ", e.before.expiresAt || '미입력', " \u2192 ", e.after?.expiresAt || '없음'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uAC1C\uBD09\uC77C ", e.before.openedAt || '미확인', " \u2192 ", e.after?.openedAt || '미확인')), e.kind === 'use' && !state.usages.some(u => u.id === e.id) && /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uCDE8\uC18C\uB41C \uC0AC\uC6A9 \uAE30\uB85D"), e.type === 'meal' && e.usage.map((u, i) => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: i
  }, u.name, " ", u.quantity, u.unit)), e.type === 'discard' && /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, e.quantity, e.unit, " \xB7 ", e.reason || '사유 미입력'))));
}
},
"module3/app/inventory/alerts.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Alerts;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _AppProvider = __load("module3/state/AppProvider.js");
var _UI = __load("module3/components/UI.js");
var _Choices = _interopRequireDefault(__load("module3/components/Choices.js"));
var _nonAi = __load("module3/domain/nonAi.mjs");
var _inventoryNotifications = __load("module3/services/inventoryNotifications.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Alerts() {
  const {
      state,
      saveAlertSettings
    } = (0, _AppProvider.useApp)(),
    [draft, setDraft] = (0, _react.useState)(() => ({
      ...state.alertSettings
    })),
    [message, setMessage] = (0, _react.useState)(''),
    [busy, setBusy] = (0, _react.useState)(false),
    lock = (0, _react.useRef)(false);
  const set = k => v => setDraft(d => ({
    ...d,
    [k]: v
  }));
  let planned = [];
  try {
    planned = (0, _nonAi.inventoryAlertPlan)(state.inventory, draft);
  } catch {}
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC7AC\uACE0 \uC784\uBC15 \uC54C\uB9BC",
    subtitle: "\uAE30\uBCF8\uC740 3\uC77C \uC804\xB71\uC77C \uC804 \uC624\uC804 9\uC2DC\uC608\uC694. \uD604\uC7AC \uAE30\uAE30 \uC2DC\uAC04\uB300\uB97C \uC0AC\uC6A9\uD574\uC694."
  }, !_inventoryNotifications.supported && /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC6F9\uC5D0\uC11C\uB294 \uC608\uC57D\uB418\uC9C0 \uC54A\uC544\uC694. Android/iOS \uC571\uC5D0\uC11C \uC124\uC815\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: !_inventoryNotifications.supported || busy,
    title: "60\uCD08 \uD6C4 \uD14C\uC2A4\uD2B8 \uC54C\uB9BC",
    onPress: async () => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        await (0, _inventoryNotifications.scheduleInventoryTest)();
        setMessage('60초 후 테스트 알림을 예약했어요. 홈으로 나가서 화면을 잠가 보세요.');
      } catch (e) {
        setMessage(e.message);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    }
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: !_inventoryNotifications.supported || busy,
    title: "\uD14C\uC2A4\uD2B8 \uC54C\uB9BC \uCDE8\uC18C",
    onPress: async () => {
      try {
        await (0, _inventoryNotifications.cancelInventoryTest)();
        setMessage('테스트 알림을 취소했어요.');
      } catch (e) {
        setMessage(e.message);
      }
    }
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC571\uC744 \uB2EB\uAC70\uB098 \uD654\uBA74\uC744 \uC7A0\uAC00\uB3C4 \uC608\uC57D\uB41C \uC54C\uB9BC\uC744 \uBC1B\uC744 \uC218 \uC788\uC5B4\uC694. \uAE30\uAE30\uC758 \uC54C\uB9BC \uAD8C\uD55C\xB7\uC9D1\uC911 \uBAA8\uB4DC\xB7\uBC30\uD130\uB9AC \uC124\uC815\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC7AC\uACE0 \uC54C\uB9BC \uC0AC\uC6A9"), /*#__PURE__*/_react.default.createElement(_reactNative.Switch, {
    accessibilityLabel: "\uC7AC\uACE0 \uC54C\uB9BC \uC0AC\uC6A9",
    value: draft.enabled,
    onValueChange: set('enabled'),
    disabled: !_inventoryNotifications.supported
  }), /*#__PURE__*/_react.default.createElement(_Choices.default, {
    multiple: true,
    label: "\uC54C\uB9BC \uB0A0\uC9DC",
    value: draft.days,
    onChange: set('days'),
    options: [{
      value: 7,
      label: '7일 전'
    }, {
      value: 3,
      label: '3일 전'
    }, {
      value: 1,
      label: '1일 전'
    }, {
      value: 0,
      label: '당일'
    }]
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC2DC (0~23)",
    value: String(draft.hour),
    onChangeText: set('hour'),
    keyboardType: "number-pad"
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uBD84 (0~59)",
    value: String(draft.minute),
    onChangeText: set('minute'),
    keyboardType: "number-pad"
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: busy,
    title: "\uC800\uC7A5 / \uC608\uC57D \uB2E4\uC2DC \uD655\uC778",
    onPress: async () => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        const valid = (0, _nonAi.alertSettings)(draft);
        if (valid.enabled) await (0, _inventoryNotifications.requestInventoryPermission)();
        await saveAlertSettings(valid);
        setMessage('설정을 저장했어요.');
        const result = await (0, _inventoryNotifications.syncInventoryNotifications)(state.inventory, valid);
        setMessage(result.unsupported ? '설정은 저장했지만 웹 알림은 지원하지 않아요.' : result.permissionDenied ? '설정 저장 완료. 알림 권한을 확인해 주세요.' : `예약 ${result.count}건 · 한도 초과 미예약 ${result.omitted}건`);
      } catch (e) {
        setMessage(e.message);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    }
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityLiveRegion: "polite"
  }, message), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uD604\uC7AC \uC870\uAC74\uC758 \uC608\uC815 \uC54C\uB9BC ", planned.length, "\uAC74"), planned.slice(0, 10).map(p => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: p.key
  }, p.title, " \xB7 ", new Date(p.at).toLocaleString('ko-KR'))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uB0A0\uC9DC \uC218\uC815\xB7\uC804\uB7C9 \uC0AC\uC6A9\xB7\uC0AD\uC81C\xB7\uB418\uB3CC\uB9AC\uAE30 \uD6C4 \uC608\uC57D\uC744 \uAC31\uC2E0\uD574\uC694. \uC9C0\uB09C \uC2DC\uAC01\uC758 \uC54C\uB9BC\uC740 \uB2E4\uC2DC \uBCF4\uB0B4\uC9C0 \uC54A\uC544\uC694. \uC2DC\uAC04\uB300 \uBCC0\uACBD\uC740 \uC571 \uBCF5\uADC0 \uC2DC \uBC18\uC601\uB3FC\uC694. \uAE30\uAE30 \uC124\uC815\uC5D0 \uB530\uB77C \uC218\uC2E0\uC774 \uC9C0\uC5F0\uB420 \uC218 \uC788\uC5B4\uC694."));
}
},
"module3/app/recipe/[id].js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Detail;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _ReferenceNotice = _interopRequireDefault(__load("module3/components/ReferenceNotice.js"));
var _UndoCard = _interopRequireDefault(__load("module3/components/UndoCard.js"));
var _AppProvider = __load("module3/state/AppProvider.js");
var _inventory = __load("module3/domain/inventory.mjs");
var _transactions = __load("module3/domain/transactions.mjs");
var _nonAi = __load("module3/domain/nonAi.mjs");
var _seed = __load("module3/data/seed.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Detail() {
  const {
    id,
    startCooking,
    searchMode
  } = (0, _router.useLocalSearchParams)();
  const r = _seed.recipes.find(x => x.id === id);
  const {
    state,
    recordMeal,
    addMissing
  } = (0, _AppProvider.useApp)();
  const [step, setStep] = (0, _react.useState)(startCooking ? 'cooking' : 'detail'),
    [usage, setUsage] = (0, _react.useState)(() => r?.ingredients.map(i => ({
      ...i,
      quantity: String(i.quantity)
    })) || []);
  const [message, setMessage] = (0, _react.useState)(''),
    [busy, setBusy] = (0, _react.useState)(false);
  const lock = (0, _react.useRef)(false),
    transactionId = (0, _react.useRef)(startCooking ? (0, _AppProvider.newId)() : null);
  if (!r) return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uB808\uC2DC\uD53C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694."
  });
  if (!searchMode && !(0, _nonAi.matchesConditions)(r, state.conditions)) return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC870\uB9AC \uC870\uAC74\uC5D0 \uB9DE\uC9C0 \uC54A\uB294 \uB808\uC2DC\uD53C\uC608\uC694"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uB3C4\uAD6C\xB7\uC2DC\uAC04\xB7\uC81C\uC678 \uC7AC\uB8CC\xB7\uC608\uC0B0 \uC870\uAC74\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "\uC870\uB9AC \uC870\uAC74 \uD655\uC778",
    onPress: () => _router.router.push('/recipe/conditions')
  }));
  const missing = (0, _inventory.shortages)(state.inventory, r);
  let preview = null,
    problem = '';
  if (step === 'cooking') {
    try {
      preview = (0, _transactions.planMeal)(state.inventory, usage);
    } catch (e) {
      problem = e.message;
    }
  }
  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await recordMeal(r, usage, transactionId.current);
      setStep('done');
    } catch (e) {
      setMessage(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function add() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await addMissing(r);
      setMessage('장보기 목록에 추가했어요. 장보기 탭에서 상품을 검색할 수 있어요.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: r.name,
    subtitle: `${r.minutes}분 · 기준 1인분 · 앱에 등록된 예시 레시피`
  }, step === 'detail' && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uC774 \uB808\uC2DC\uD53C \uC54C\uB9BC \uC608\uC57D",
    onPress: () => _router.router.push({
      pathname: '/recipe/reminders',
      params: {
        recipeId: r.id
      }
    })
  }), /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uD544\uC694\uD55C \uC7AC\uB8CC"), r.ingredients.map(i => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: i.name
  }, i.name, " ", i.quantity, i.unit))), missing.length > 0 && /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uBD80\uC871\uD55C \uC7AC\uB8CC"), missing.map(i => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: i.name
  }, i.name, " ", i.quantity, i.unit)), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: "\uC7A5\uBCF4\uAE30 \uBAA9\uB85D\uC5D0 \uCD94\uAC00",
    onPress: add
  })), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: busy,
    title: "\uC694\uB9AC \uC2DC\uC791\uD558\uAE30",
    onPress: () => {
      transactionId.current = (0, _AppProvider.newId)();
      setMessage('');
      setStep('cooking');
    }
  })), step !== 'done' && /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uC870\uB9AC \uC21C\uC11C"), r.steps.map((s, i) => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: s
  }, i + 1, ". ", s))), step === 'cooking' && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uC2E4\uC81C\uB85C \uC0AC\uC6A9\uD55C \uC591\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC740 \uC7AC\uB8CC\uB294 0\uC73C\uB85C \uC785\uB825\uD558\uC138\uC694. \uB2E8\uC704\uB294 \uBCC0\uACBD\uB418\uC9C0 \uC54A\uC73C\uBA70 \uAE30\uD55C\uC774 \uC9C0\uB09C \uC7AC\uACE0\uB294 \uC870\uB9AC \uCC28\uAC10\uC5D0\uC11C \uC81C\uC678\uB3FC\uC694."), usage.map((i, index) => /*#__PURE__*/_react.default.createElement(_UI.Card, {
    key: `${i.name}-${i.unit}`
  }, /*#__PURE__*/_react.default.createElement(_UI.Field, {
    editable: !busy,
    label: `${i.name} (${i.unit})`,
    keyboardType: "decimal-pad",
    value: i.quantity,
    onChangeText: value => setUsage(rows => rows.map((row, n) => n === index ? {
      ...row,
      quantity: value
    } : row))
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uCC28\uAC10 \uAC00\uB2A5: ", (0, _inventory.available)(state.inventory, i), i.unit))), problem ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.error
  }, problem) : /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uCC28\uAC10 \uC608\uC815"), preview.changes.map(c => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: c.batchId
  }, c.name, " ", c.quantity, c.unit, " \xB7 ", (0, _transactions.money)(c.cost)))), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: busy || !!problem,
    title: busy ? '저장 중…' : '조리 완료 · 확인 후 차감',
    onPress: confirm
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: "\uC694\uB9AC \uCDE8\uC18C (\uCC28\uAC10 \uC5C6\uC74C)",
    onPress: () => {
      setStep('detail');
      setMessage('');
    }
  })), step === 'done' && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, state.meals.some(m => m.id === transactionId.current) ? '식사 기록과 재고 차감을 저장했어요.' : '식사 차감이 취소되었어요.'), /*#__PURE__*/_react.default.createElement(_UndoCard.default, null), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "\uB0C9\uC7A5\uACE0\uB85C \uB3CC\uC544\uAC00\uAE30",
    onPress: () => _router.router.toFridge()
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uC2DD\uC0AC \uAE30\uB85D \uBCF4\uAE30",
    onPress: () => _router.router.replace('/(tabs)/meal')
  })), message ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, message) : null, /*#__PURE__*/_react.default.createElement(_ReferenceNotice.default, null));
}
},
"module3/app/recipe/conditions.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Conditions;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _AppProvider = __load("module3/state/AppProvider.js");
var _UI = __load("module3/components/UI.js");
var _Choices = _interopRequireDefault(__load("module3/components/Choices.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Conditions() {
  const {
      state,
      saveConditions
    } = (0, _AppProvider.useApp)(),
    [draft, setDraft] = (0, _react.useState)(() => ({
      ...state.conditions
    })),
    [message, setMessage] = (0, _react.useState)(''),
    [busy, setBusy] = (0, _react.useState)(false),
    lock = (0, _react.useRef)(false);
  const set = k => v => {
    setDraft(d => ({
      ...d,
      [k]: v
    }));
    setMessage('');
  };
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uC870\uB9AC\xB7\uC2DD\uC0AC \uC870\uAC74",
    subtitle: "\uC800\uC7A5\uD55C \uC870\uAC74\uC740 \uB2E4\uC74C \uB808\uC2DC\uD53C \uAC80\uC0C9\uC5D0\uB3C4 \uC801\uC6A9\uB3FC\uC694."
  }, /*#__PURE__*/_react.default.createElement(_Choices.default, {
    multiple: true,
    label: "\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uB3C4\uAD6C",
    options: [{
      value: 'pan',
      label: '팬'
    }, {
      value: 'pot',
      label: '냄비'
    }, {
      value: 'microwave',
      label: '전자레인지'
    }],
    value: draft.tools,
    onChange: set('tools')
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uCD5C\uB300 \uC870\uB9AC\uC2DC\uAC04 (\uBD84, 0\uC740 \uC81C\uD55C \uC5C6\uC74C)",
    keyboardType: "number-pad",
    value: String(draft.maxMinutes),
    onChangeText: set('maxMinutes')
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC774\uBC88 \uC2DD\uC0AC \uC608\uC0B0 (\uC6D0, \uC120\uD0DD)",
    keyboardType: "number-pad",
    value: draft.budget == null ? '' : String(draft.budget),
    onChangeText: set('budget')
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uBE44\uC6A9 \uC815\uBCF4\uAC00 \uC5C6\uB294 \uC608\uC2DC \uC694\uB9AC\uB294 \uC608\uC0B0 \uC870\uAC74\uC744 \uB9CC\uC871\uD55C\uB2E4\uACE0 \uD310\uB2E8\uD558\uC9C0 \uC54A\uC544 \uC81C\uC678\uB3FC\uC694. \uC608\uC0B0\uC744 \uBE44\uC6B0\uBA74 \uBE44\uC6A9 \uC870\uAC74 \uC5C6\uC774 \uBCFC \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/_react.default.createElement(_Choices.default, {
    label: "\uCCB4\uB825",
    value: draft.energy,
    onChange: set('energy'),
    options: [{
      value: 'normal',
      label: '보통'
    }, {
      value: 'low',
      label: '방전 · 간편 조리'
    }]
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uBC29\uC804\uBAA8\uB4DC\uB294 15\uBD84 \uC774\uB0B4\xB7\uC124\uAC70\uC9C0\uAC00 \uC801\uC740 \uC608\uC2DC \uBA54\uB274\uB9CC \uBCF4\uC5EC\uC918\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC81C\uC678 \uC7AC\uB8CC (\uC27C\uD45C\uB85C \uAD6C\uBD84)",
    value: draft.excluded,
    onChangeText: set('excluded'),
    placeholder: "\uC608: \uB2EC\uAC40, \uAE40\uCE58"
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uB4F1\uB85D\uB41C \uC7AC\uB8CC\uBA85\uC744 \uAE30\uC900\uC73C\uB85C \uC81C\uC678\uD574\uC694. \uC54C\uB808\uB974\uAE30\uAC00 \uC788\uB2E4\uBA74 \uC81C\uD488 \uC131\uBD84\uB3C4 \uC9C1\uC811 \uD655\uC778\uD574 \uC8FC\uC138\uC694."), [['onePan', '원팬 요리만'], ['minCleanup', '설거지 최소']].map(([key, label]) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: key,
    style: {
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, label), /*#__PURE__*/_react.default.createElement(_reactNative.Switch, {
    accessibilityLabel: label,
    value: draft[key],
    onValueChange: set(key)
  }))), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "\uC870\uAC74 \uC800\uC7A5",
    disabled: busy,
    onPress: async () => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        await saveConditions(draft);
        setMessage('저장했어요. 다음 추천과 검색에 적용돼요.');
      } catch (e) {
        setMessage(e.message);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    }
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityLiveRegion: "polite"
  }, message));
}
},
"module3/app/recipe/reminders.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Reminders;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _seed = __load("module3/data/seed.js");
var _recipeNotifications = __load("module3/services/recipeNotifications.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function Reminders() {
  const [demo, setDemo] = (0, _react.useState)('');
  const timer = (0, _react.useRef)(null);
  (0, _react.useEffect)(() => () => clearTimeout(timer.current), []);
  const {
      recipeId
    } = (0, _router.useLocalSearchParams)(),
    recipe = _seed.recipes.find(r => r.id === recipeId);
  const [hour, setHour] = (0, _react.useState)('18'),
    [minute, setMinute] = (0, _react.useState)('0'),
    [items, setItems] = (0, _react.useState)([]),
    [message, setMessage] = (0, _react.useState)(''),
    [error, setError] = (0, _react.useState)(''),
    [busy, setBusy] = (0, _react.useState)(false);
  const lock = (0, _react.useRef)(false);
  const reload = (0, _react.useCallback)(async () => setItems(await (0, _recipeNotifications.listReminders)()), []);
  (0, _router.useFocusEffect)((0, _react.useCallback)(() => {
    reload().catch(e => setError(e.message));
  }, [reload]));
  async function run(action) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await action();
      await reload();
      setMessage(result || '알림을 취소했어요.');
    } catch (e) {
      setError(e.message || '알림을 처리하지 못했어요.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return /*#__PURE__*/_react.default.createElement(_UI.Page, {
    title: "\uB808\uC2DC\uD53C \uC54C\uB9BC",
    subtitle: "Snack \uD1B5\uD569\uBCF8\uC740 \uD654\uBA74 \uC54C\uB9BC\uC744 \uC2DC\uC5F0\uD574\uC694. \uC2E4\uC81C \uC2DC\uC2A4\uD15C \uC54C\uB9BC\uC740 \uBCC4\uB3C4 \uC571 \uBE4C\uB4DC\uC5D0\uC11C \uC5F0\uACB0\uD574 \uC8FC\uC138\uC694."
  }, /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "Snack \uD654\uBA74 \uC54C\uB9BC \uC2DC\uC5F0"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, "\uC2DC\uC2A4\uD15C \uD478\uC2DC\uAC00 \uC544\uB2CC \uD654\uBA74 \uC548 \uC54C\uB9BC\uC774\uC5D0\uC694."), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    title: "3\uCD08 \uB4A4 \uB370\uBAA8 \uC54C\uB9BC",
    onPress: () => {
      clearTimeout(timer.current);
      setDemo('알림 대기 중…');
      timer.current = setTimeout(() => setDemo('🔔 냉장고 재료로 한 끼를 준비해 보세요!'), 3000);
    }
  }), !!demo && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityLiveRegion: "polite"
  }, demo)), !_recipeNotifications.notificationsSupported ? /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC774 Snack \uD1B5\uD569\uBCF8\uC5D0\uC11C\uB294 \uC2DC\uC2A4\uD15C \uC54C\uB9BC\uC744 \uC608\uC57D\uD558\uC9C0 \uC54A\uC544\uC694. \uC544\uB798 \uC124\uC815\uC740 \uC2E4\uC81C \uC571 \uC5F0\uACB0 \uC2DC \uC0AC\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694.")) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_UI.Card, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, recipe ? `${recipe.name} · 한 번 알림` : '매일 레시피 확인 알림'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, recipe ? '오늘 시간이 지났으면 내일로 예약해요.' : '선택한 시각에 매일 레시피 화면을 열도록 안내해요.'), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uC2DC\uAC04 (0~23)",
    value: hour,
    onChangeText: setHour,
    keyboardType: "number-pad",
    maxLength: 2
  }), /*#__PURE__*/_react.default.createElement(_UI.Field, {
    label: "\uBD84 (0~59)",
    value: minute,
    onChangeText: setMinute,
    keyboardType: "number-pad",
    maxLength: 2
  }), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    disabled: busy,
    title: "\uC54C\uB9BC \uC608\uC57D / \uC2DC\uAC04 \uBCC0\uACBD",
    onPress: () => run(() => (0, _recipeNotifications.scheduleRecipeReminder)({
      recipe,
      hour,
      minute,
      daily: !recipe
    }))
  })), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uD734\uB300\uD3F0 \uC54C\uB9BC \uC124\uC815 \uC5F4\uAE30",
    onPress: () => _reactNative.Linking.openSettings().catch(() => setError('휴대폰 설정 앱에서 알림을 허용해 주세요.'))
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.label
  }, "\uC608\uC57D\uD55C \uC54C\uB9BC ", items.length, "\uAC1C"), items.map(n => /*#__PURE__*/_react.default.createElement(_UI.Card, {
    key: n.identifier
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, n.content.title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.muted
  }, n.content.data.label), /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    disabled: busy,
    title: "\uC54C\uB9BC \uCDE8\uC18C",
    onPress: () => run(() => (0, _recipeNotifications.cancelReminder)(n.identifier))
  }))), !items.length && /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC608\uC57D\uD55C \uC54C\uB9BC\uC774 \uC5C6\uC5B4\uC694.")), !!message && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityLiveRegion: "polite"
  }, message), !!error && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _UI.styles.error
  }, error));
}
},
"module3/services/recipeNotifications.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scheduleRecipeReminder = exports.observeReminders = exports.notificationsSupported = exports.listReminders = exports.clearReminderResponse = exports.cancelReminder = void 0;
const notificationsSupported = exports.notificationsSupported = false;
const listReminders = async () => [];
exports.listReminders = listReminders;
const cancelReminder = async () => {};
exports.cancelReminder = cancelReminder;
const scheduleRecipeReminder = async () => {
  throw new Error('예약 알림은 Android/iOS 앱에서 사용할 수 있어요.');
};
exports.scheduleRecipeReminder = scheduleRecipeReminder;
const observeReminders = () => () => {};
exports.observeReminders = observeReminders;
const clearReminderResponse = async () => {};
exports.clearReminderResponse = clearReminderResponse;
},
"src/navigation/TabNavigator.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TabNavigator;
var _react = _interopRequireDefault(__load("react"));
var _bottomTabs = __load("@react-navigation/bottom-tabs");
var _TabBar = _interopRequireDefault(__load("src/components/TabBar.js"));
var _HomeScreen = _interopRequireDefault(__load("src/screens/HomeScreen.js"));
var _SpendingScreen = _interopRequireDefault(__load("src/screens/SpendingScreen.js"));
var _FridgeScreen = _interopRequireDefault(__load("src/screens/FridgeScreen.js"));
var _LifeInfoScreen = _interopRequireDefault(__load("src/screens/LifeInfoScreen.js"));
var _EmergencyScreen = _interopRequireDefault(__load("src/screens/EmergencyScreen.js"));
var _SurvivalMapScreen = _interopRequireDefault(__load("src/screens/SurvivalMapScreen.js"));
var _MoreScreen = _interopRequireDefault(__load("src/screens/MoreScreen.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const Tab = (0, _bottomTabs.createBottomTabNavigator)();

// 탭 5개와, 탭 바는 보이지만 탭 버튼은 없는 하위 화면
function TabNavigator() {
  return /*#__PURE__*/_react.default.createElement(Tab.Navigator, {
    initialRouteName: "Home",
    backBehavior: "history",
    tabBar: props => /*#__PURE__*/_react.default.createElement(_TabBar.default, props),
    screenOptions: {
      headerShown: false
    }
  }, /*#__PURE__*/_react.default.createElement(Tab.Screen, {
    name: "Home",
    component: _HomeScreen.default
  }), /*#__PURE__*/_react.default.createElement(Tab.Screen, {
    name: "Spending",
    component: _SpendingScreen.default
  }), /*#__PURE__*/_react.default.createElement(Tab.Screen, {
    name: "Fridge",
    component: _FridgeScreen.default
  }), /*#__PURE__*/_react.default.createElement(Tab.Screen, {
    name: "LifeInfo",
    component: _LifeInfoScreen.default
  }), /*#__PURE__*/_react.default.createElement(Tab.Screen, {
    name: "More",
    component: _MoreScreen.default
  }), /*#__PURE__*/_react.default.createElement(Tab.Screen, {
    name: "Emergency",
    component: _EmergencyScreen.default
  }), /*#__PURE__*/_react.default.createElement(Tab.Screen, {
    name: "SurvivalMap",
    component: _SurvivalMapScreen.default
  }));
}
},
"src/components/TabBar.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TAB_BAR_HEIGHT = void 0;
exports.default = TabBar;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 라우트 이름 -> 라벨/아이콘 (탭을 바꿀 때 여기만 수정)
const TAB_CONFIG = {
  Home: {
    label: '홈',
    Icon: _vectorIcons.Ionicons,
    name: 'home'
  },
  Spending: {
    label: '소비',
    Icon: _vectorIcons.MaterialCommunityIcons,
    name: 'receipt-text-outline'
  },
  Fridge: {
    label: '냉장고',
    Icon: _vectorIcons.MaterialCommunityIcons,
    name: 'fridge-outline'
  },
  LifeInfo: {
    label: '생활정보',
    Icon: _vectorIcons.MaterialCommunityIcons,
    name: 'message-text-outline'
  },
  More: {
    label: '더보기',
    Icon: _vectorIcons.MaterialCommunityIcons,
    name: 'dots-horizontal'
  }
};

// 탭 버튼이 없는 화면 -> 활성으로 표시할 탭 (예: 비상매뉴얼은 생활정보 탭)
const PARENT_TAB = {
  Emergency: 'LifeInfo',
  SurvivalMap: 'LifeInfo'
};

// react-navigation 의 tabBar prop 으로 전달되는 커스텀 탭 바
function TabBar({
  state,
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const currentName = state.routes[state.index].name;
  const activeTab = PARENT_TAB[currentName] ?? currentName;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.wrapper, {
      bottom: Math.max(insets.bottom, 12)
    }],
    pointerEvents: "box-none"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.bar
  }, state.routes.map(route => {
    const config = TAB_CONFIG[route.name];
    if (!config) return null;
    const focused = route.name === activeTab;
    const {
      Icon
    } = config;
    const iconName = focused ? config.name : config.nameOff || config.name;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true
      });
      // 하위 화면(비상매뉴얼)에서 부모 탭을 누르면 탭의 첫 화면으로 돌아갑니다.
      if (route.name !== currentName && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      key: route.key,
      onPress: onPress,
      accessibilityRole: "button",
      accessibilityState: {
        selected: focused
      },
      accessibilityLabel: config.label,
      style: styles.tabSlot
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.tab, focused && styles.tabActive]
    }, /*#__PURE__*/_react.default.createElement(Icon, {
      name: iconName,
      size: 28,
      color: focused ? _theme.colors.greenLight : _theme.colors.tabInactive
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.label, focused && styles.labelActive]
    }, config.label)));
  })));
}

// 떠 있는 탭 바의 높이 (스크롤 영역 하단 여백 계산용)
const TAB_BAR_HEIGHT = exports.TAB_BAR_HEIGHT = 68;
const styles = _reactNative.StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    backgroundColor: _theme.colors.white,
    borderRadius: 34,
    shadowColor: '#1F3A30',
    shadowOffset: {
      width: 0,
      height: 6
    },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tab: {
    width: 70,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabActive: {
    backgroundColor: _theme.colors.tabActiveBg
  },
  label: {
    marginTop: 2,
    fontFamily: _theme.fonts.regular,
    fontSize: 11,
    color: _theme.colors.tabInactive
  },
  labelActive: {
    color: _theme.colors.greenLight
  }
});
},
"src/screens/HomeScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HomeScreen;
var _useDayClock = __load("module3/hooks/useDayClock.js");
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _HeroCard = _interopRequireDefault(__load("src/components/HeroCard.js"));
var _SummaryCard = _interopRequireWildcard(__load("src/components/SummaryCard.js"));
var _TaskRow = _interopRequireDefault(__load("src/components/TaskRow.js"));
var _TabBar = __load("src/components/TabBar.js");
var _ScreenHeader = _interopRequireDefault(__load("src/components/ScreenHeader.js"));
var _home = __load("src/data/home/home.js");
var _spending = __load("src/data/spending/spending.js");
var _fridge = __load("src/data/fridge/fridge.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _homeSummary = __load("src/utils/homeSummary.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function HomeScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    hero,
    spending,
    fridge,
    tasks
  } = _home.homeData;
  const {
    transactions,
    fridgeItems,
    todos,
    routines
  } = (0, _AppDataContext.useAppData)();

  // 홈의 숫자는 저장소 데이터로 계산합니다 (다른 탭에서 바꾸면 홈에 바로 반영).
  (0, _useDayClock.useDayClock)();
  const now = new Date();
  const baseDate = (0, _format.toDateString)(now);
  const summary = (0, _react.useMemo)(() => ({
    spending: (0, _homeSummary.getSpendingSummary)(transactions, _spending.spendingData.budget, new Date()),
    fridge: (0, _homeSummary.getFridgeSummary)(fridgeItems, baseDate, _fridge.fridgeData.urgentWithinDays),
    tasks: (0, _homeSummary.getTaskSummaries)(routines, todos, baseDate)
  }), [transactions, fridgeItems, todos, routines, baseDate]);
  const {
    fridge: fridgeSummary,
    spending: spendingSummary
  } = summary;
  const first = fridgeSummary.first;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: _TabBar.TAB_BAR_HEIGHT + insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_ScreenHeader.default, {
    title: "\uD648",
    rightText: (0, _format.formatKoreanDate)(now)
  }), /*#__PURE__*/_react.default.createElement(_HeroCard.default, {
    label: hero.label,
    badge: hero.badge,
    title: hero.title,
    description: `${(0, _homeSummary.getHeroLine)(first)}\n${hero.closing}`
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cardRow
  }, /*#__PURE__*/_react.default.createElement(_SummaryCard.default, {
    title: spending.title,
    onPress: () => navigation.navigate('Spending')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.label
  }, spendingSummary.month, "\uC6D4 \uB0A8\uC740 \uC608\uC0B0"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: _SummaryCard.summaryStyles.bigRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.bigText
  }, (0, _format.formatNumber)(spendingSummary.remaining)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.unit
  }, "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.spendingSub
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.sub
  }, "\uC9C0\uCD9C ", (0, _format.formatNumber)(spendingSummary.spent), "\uC6D0"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.sub
  }, "\uC608\uC0B0 ", (0, _format.formatNumber)(spendingSummary.budget), "\uC6D0"))), /*#__PURE__*/_react.default.createElement(_SummaryCard.default, {
    title: fridge.title,
    onPress: () => navigation.navigate('Fridge')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.label
  }, "\uBCF4\uAD00 \uC911\uC778 \uC2DD\uC7AC\uB8CC ", fridgeSummary.total, "\uAC1C"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: _SummaryCard.summaryStyles.bigRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.bigText
  }, fridge.headline, " "), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [_SummaryCard.summaryStyles.bigText, styles.greenText]
  }, fridgeSummary.urgentCount, "\uAC1C")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.fridgeSub
  }, first ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [_SummaryCard.summaryStyles.sub, styles.fridgeName],
    numberOfLines: 1
  }, first.label), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.tag, first.urgent ? styles.warnTag : styles.calmTag]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.tagText, first.urgent ? styles.warnTagText : styles.calmTagText]
  }, first.tag))) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: _SummaryCard.summaryStyles.sub
  }, fridge.emptyText)))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, "\uC624\uB298 \uCC59\uAE38 \uC77C"), /*#__PURE__*/_react.default.createElement(_reactNative.View, null, tasks.map((task, i) => /*#__PURE__*/_react.default.createElement(_TaskRow.default, {
    key: task.id,
    title: task.title,
    status: summary.tasks[task.id].status,
    summary: summary.tasks[task.id].summary,
    isLast: i === tasks.length - 1,
    onPress: () => navigation.navigate(task.route)
  })))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  cardRow: {
    flexDirection: 'row',
    gap: _theme.spacing.gap,
    marginTop: 20
  },
  spendingSub: {
    marginTop: 8
  },
  fridgeSub: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  greenText: {
    color: _theme.colors.green
  },
  fridgeName: {
    flex: 1,
    marginRight: 6
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  tagText: {
    fontFamily: _theme.fonts.medium,
    fontWeight: '500',
    fontSize: 12
  },
  // 임박한 식재료: 주황색 / 아직 여유 있는 식재료: 회색
  warnTag: {
    backgroundColor: _theme.colors.warnBg
  },
  warnTagText: {
    color: _theme.colors.warnText
  },
  calmTag: {
    backgroundColor: _theme.colors.divider
  },
  calmTagText: {
    color: _theme.colors.textSecondary
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 6,
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 20,
    color: _theme.colors.textPrimary
  }
});
},
"src/components/HeroCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HeroCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function HeroCard({
  label,
  badge,
  title,
  description
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.card
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.header
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.badge
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.badgeText
  }, badge))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.description
  }, description));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    backgroundColor: _theme.colors.heroBg,
    borderRadius: _theme.radius.card,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 26
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontFamily: _theme.fonts.bold,
    fontSize: 15,
    color: _theme.colors.green
  },
  badge: {
    backgroundColor: _theme.colors.badgeBg,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: -4
  },
  badgeText: {
    fontFamily: _theme.fonts.medium,
    fontSize: 12,
    color: _theme.colors.green
  },
  title: {
    marginTop: 22,
    fontFamily: _theme.fonts.bold,
    fontSize: 25,
    lineHeight: 37,
    color: _theme.colors.textPrimary
  },
  description: {
    marginTop: 18,
    fontFamily: _theme.fonts.regular,
    fontSize: 14.5,
    lineHeight: 23,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/SummaryCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SummaryCard;
exports.summaryStyles = void 0;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 홈의 "소비" / "냉장고" 요약 카드 틀 (내용은 children, 이동은 onPress)
function SummaryCard({
  title,
  onPress,
  children
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    style: ({
      pressed
    }) => [styles.card, pressed && styles.pressed],
    accessibilityRole: "button",
    accessibilityLabel: title
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.header
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 20,
    color: _theme.colors.textSecondary
  })), children);
}
const summaryStyles = exports.summaryStyles = _reactNative.StyleSheet.create({
  label: {
    marginTop: 14,
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    color: _theme.colors.textSecondary
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4
  },
  bigText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 27,
    lineHeight: 40,
    color: _theme.colors.textPrimary
  },
  unit: {
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    color: _theme.colors.textPrimary
  },
  sub: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: _theme.colors.textSecondary
  }
});
const styles = _reactNative.StyleSheet.create({
  card: {
    flex: 1,
    height: 176,
    backgroundColor: _theme.colors.cardBg,
    borderRadius: _theme.radius.card,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18
  },
  pressed: {
    opacity: 0.85
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    color: _theme.colors.textPrimary
  }
});
},
"src/components/TaskRow.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TaskRow;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// "오늘 챙길 일" 목록의 한 줄 (루틴, 할 일 등)
function TaskRow({
  title,
  status,
  summary,
  onPress,
  isLast
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    style: ({
      pressed
    }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed],
    accessibilityRole: "button"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.iconBox
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "calendar-check-outline",
    size: 26,
    color: _theme.colors.green
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.titleRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.status
  }, status)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.summary,
    numberOfLines: 1
  }, summary)), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 20,
    color: _theme.colors.textSecondary
  }));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16
  },
  divider: {
    borderBottomWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderBottomColor: _theme.colors.divider
  },
  pressed: {
    opacity: 0.7
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: _theme.radius.icon,
    backgroundColor: _theme.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  texts: {
    flex: 1,
    marginLeft: 16
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  status: {
    marginLeft: 10,
    fontFamily: _theme.fonts.medium,
    fontSize: 13,
    color: _theme.colors.green
  },
  summary: {
    marginTop: 3,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/ScreenHeader.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ScreenHeader;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 탭 화면 상단 제목 영역. rightText(오른쪽 회색 글씨), right(임의 요소, rightText 보다 우선), subtitle(아래 한 줄 설명)
function ScreenHeader({
  title,
  rightText,
  right,
  subtitle
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.wrapper
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.row
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), right ?? (rightText ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.rightText
  }, rightText) : null)), subtitle ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subtitle
  }, subtitle) : null);
}
const styles = _reactNative.StyleSheet.create({
  wrapper: {
    marginBottom: 24
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 28,
    color: _theme.colors.textPrimary
  },
  rightText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14.5,
    color: _theme.colors.textSecondary
  },
  subtitle: {
    marginTop: 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  }
});
},
"src/data/home/home.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.homeData = void 0;
// 홈 화면 문구. 홈의 숫자는 utils/homeSummary.js 가 저장소 데이터로 계산하므로 여기에 적지 않습니다.

// tasks[].route: 눌렀을 때 이동할 화면 이름 (RootNavigator 에 등록된 이름)

const homeData = exports.homeData = {
  hero: {
    label: '오늘의 한마디',
    badge: 'AI 리포트',
    title: '나를 챙기는 한 끼로,\n이번 주를 시작해요.',
    // 자동 생성되는 첫 줄 아래에 붙는 문장
    closing: '작은 돌봄 하나면 충분한 시작이에요.'
  },
  spending: {
    title: '소비'
  },
  fridge: {
    title: '냉장고',
    headline: '기한 임박',
    emptyText: '보관 중인 식재료가 없어요'
  },
  tasks: [{
    id: 'routine',
    route: 'Routine',
    title: '루틴'
  }, {
    id: 'todo',
    route: 'Todo',
    title: '할 일'
  }]
};
},
"src/utils/homeSummary.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFridgeSummary = getFridgeSummary;
exports.getHeroLine = getHeroLine;
exports.getSpendingSummary = getSpendingSummary;
exports.getTaskSummaries = getTaskSummaries;
var _format = __load("src/utils/format.js");
var _recipes = __load("src/utils/recipes.js");
// 홈 화면의 요약 값을 저장소 데이터로 계산합니다.

// 이번 달 소비 요약 (소비 탭과 같은 기준): { month, spent, budget, remaining }
function getSpendingSummary(transactions, budget, now) {
  const monthKey = `${now.getFullYear()}-${(0, _format.pad)(now.getMonth() + 1)}`;
  const spent = transactions.filter(t => t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
  return {
    month: now.getMonth() + 1,
    spent,
    budget,
    remaining: budget - spent
  };
}

// 냉장고 요약: { total, urgentCount, first }. first 는 유통기한이 가장 빠른 식재료 (없으면 null)
function getFridgeSummary(fridgeItems, baseDate, urgentWithinDays) {
  const entries = (0, _recipes.getFridgeEntries)(fridgeItems, baseDate, urgentWithinDays);
  const first = entries[0];
  return {
    total: entries.length,
    urgentCount: entries.filter(e => e.urgent).length,
    first: first ? {
      name: first.name,
      label: first.detail ? `${first.name} ${first.detail}` : first.name,
      // 예: "우유 1L"
      tag: (0, _recipes.badgeDueLabel)(first.daysLeft),
      urgent: first.urgent,
      daysLeft: first.daysLeft
    } : null
  };
}

// "오늘의 한마디" 첫 줄: 가장 먼저 상하는 식재료 안내
function getHeroLine(first) {
  if (!first) return '냉장고에 식재료를 추가해 보세요.';
  if (first.daysLeft < 0) return `기한이 지난 ${first.name}부터 확인해 보세요.`;
  if (first.daysLeft === 0) return `오늘까지인 ${first.name}부터 챙겨보세요.`;
  return `${first.daysLeft}일 남은 ${first.name}부터 챙겨보세요.`;
}

// "오늘 챙길 일"의 루틴/할 일 줄에 보여줄 상태와 요약 글자
function getTaskSummaries(routines, todos, baseDate) {
  // 루틴: 아직 안 한 것 (이른 시간 순)
  const pendingRoutines = routines.filter(r => !r.doneToday).sort((a, b) => a.time.localeCompare(b.time));
  const doneRoutines = routines.length - pendingRoutines.length;

  // 할 일: 아직 안 한 것 (마감 빠른 순, 기한 없는 것은 맨 뒤)
  const pendingTodos = todos.filter(t => !t.done).map(t => ({
    ...t,
    daysLeft: t.due ? (0, _format.daysBetween)(baseDate, t.due) : Infinity
  })).sort((a, b) => a.daysLeft - b.daysLeft);
  const titles = list => list.slice(0, 2).map(x => x.title).join(' · ');
  return {
    routine: {
      status: routines.length ? `${doneRoutines} / ${routines.length} 완료` : '루틴 없음',
      summary: !routines.length ? '생활 루틴을 추가해 보세요.' : pendingRoutines.length ? `${titles(pendingRoutines)} 남음` : '오늘 루틴을 모두 마쳤어요.'
    },
    todo: {
      status: pendingTodos.length ? `${pendingTodos.length}개 남음` : todos.length ? '모두 완료' : '할 일 없음',
      summary: pendingTodos.length ? titles(pendingTodos) : todos.length ? '남은 할 일이 없어요.' : '할 일을 추가해 보세요.'
    }
  };
}
},
"src/utils/recipes.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.analyzeRecipe = analyzeRecipe;
exports.badgeDueLabel = void 0;
exports.getFridgeEntries = getFridgeEntries;
exports.shortDueLabel = void 0;
var _format = __load("src/utils/format.js");
// 식재료에 남은 일수(daysLeft)와 임박 여부(urgent)를 붙이고 유통기한 빠른 순으로 정렬 (냉장고 화면과 같은 기준)
function getFridgeEntries(items, baseDate, urgentWithinDays) {
  return items.map(item => {
    const expiry = item.expiry ?? (0, _format.addDays)(baseDate, item.daysFromToday);
    const daysLeft = (0, _format.daysBetween)(baseDate, expiry);
    return {
      ...item,
      expiry,
      daysLeft,
      urgent: daysLeft <= urgentWithinDays
    };
  }).sort((a, b) => a.daysLeft - b.daysLeft);
}

// 한쪽 이름이 다른 쪽을 포함하면 같은 재료로 봅니다 ("우유" ↔ "서울우유 1L")
const isSameIngredient = (fridgeName, ingredientName) => fridgeName.includes(ingredientName) || ingredientName.includes(fridgeName);

// 레시피 재료를 냉장고와 맞춰 봅니다. entries 는 getFridgeEntries 의 결과
// 반환: { ingredients(fridgeItem 포함), owned, missing, urgent }
function analyzeRecipe(recipe, entries) {
  const ingredients = recipe.ingredients.map(ing => ({
    ...ing,
    fridgeItem: entries.find(e => isSameIngredient(e.name, ing.name)) ?? null
  }));
  return {
    ingredients,
    owned: ingredients.filter(i => i.fridgeItem),
    missing: ingredients.filter(i => !i.fridgeItem),
    urgent: ingredients.filter(i => i.fridgeItem?.urgent)
  };
}

// 배너 칩용: "1일 지남" / "오늘까지" / "1일"
const shortDueLabel = daysLeft => daysLeft < 0 ? `${-daysLeft}일 지남` : daysLeft === 0 ? '오늘까지' : `${daysLeft}일`;

// 카드 배지용 (냉장고, 레시피, 홈 공용): "1일 지남" / "오늘까지" / "2일 남음"
exports.shortDueLabel = shortDueLabel;
const badgeDueLabel = daysLeft => daysLeft < 0 ? `${-daysLeft}일 지남` : daysLeft === 0 ? '오늘까지' : `${daysLeft}일 남음`;
exports.badgeDueLabel = badgeDueLabel;
},
"src/screens/SpendingScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SpendingScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _ScreenHeader = _interopRequireDefault(__load("src/components/ScreenHeader.js"));
var _BudgetCard = _interopRequireDefault(__load("src/components/BudgetCard.js"));
var _SoftButton = _interopRequireDefault(__load("src/components/SoftButton.js"));
var _TransactionRow = _interopRequireDefault(__load("src/components/TransactionRow.js"));
var _Fab = _interopRequireDefault(__load("src/components/Fab.js"));
var _AddSpendingSheet = _interopRequireDefault(__load("src/components/AddSpendingSheet.js"));
var _TabBar = __load("src/components/TabBar.js");
var _spending = __load("src/data/spending/spending.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// 최근 지출 내역에 보여줄 최대 개수 (나머지는 "전체보기"에서 봅니다)
const RECENT_LIMIT = 10;
function SpendingScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    budget,
    addOptions
  } = _spending.spendingData;
  const {
    transactions
  } = (0, _AppDataContext.useAppData)();
  // 처음에는 오늘이 속한 달을 보여줍니다.
  const [period, setPeriod] = (0, _react.useState)(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  });
  const [addVisible, setAddVisible] = (0, _react.useState)(false);

  // "소비 추가" 시트에서 항목을 고르면 시트를 먼저 닫고, 닫히는 애니메이션이 끝난 뒤(handleSheetClosed) 화면을 이동합니다.
  const pendingOption = (0, _react.useRef)(null);
  const handleSelectAddOption = id => {
    pendingOption.current = id;
    setAddVisible(false);
  };
  const handleSheetClosed = () => {
    const id = pendingOption.current;
    pendingOption.current = null;
    if (id === 'manual') {
      navigation.navigate('ManualEntry');
    }
    if (id === 'gallery') {
      // TODO: 앨범에서 사진을 고르는 기능(expo-image-picker 등)을 붙이고, 인식 결과를 navigate('ReceiptResult', { receipt }) 로 넘기세요.
      // 지금은 샘플 결과 화면을 바로 보여줍니다.
      navigation.navigate('ReceiptResult');
    }
    if (id === 'receipt') {
      // TODO: 카메라 화면이 완성되면 'ReceiptCamera' 로 이동하고, 인식 결과를 navigate('ReceiptResult', { receipt }) 로 넘기세요.
      // (형식: src/data/spending/receipt.js) 지금은 카메라가 없어서 샘플 결과 화면을 바로 보여줍니다.
      navigation.navigate('ReceiptResult');
    }
  };

  // 선택한 달의 지출 내역 (날짜 최신순)과 그 달의 지출 합계
  const monthKey = `${period.year}-${(0, _format.pad)(period.month)}`;
  const {
    monthTransactions,
    spent
  } = (0, _react.useMemo)(() => {
    const list = transactions.filter(t => t.date.startsWith(monthKey)).sort(_format.compareDateDesc); // 같은 날짜면 나중에 추가한 것이 위
    return {
      monthTransactions: list,
      spent: list.reduce((sum, t) => sum + t.amount, 0)
    };
  }, [transactions, monthKey]);

  // 월 이동
  const moveMonth = delta => {
    setPeriod(({
      year,
      month
    }) => {
      const index = year * 12 + (month - 1) + delta;
      return {
        year: Math.floor(index / 12),
        month: index % 12 + 1
      };
    });
  };
  const monthSelector = /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.monthSelector
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => moveMonth(-1),
    hitSlop: 12,
    accessibilityLabel: "\uC774\uC804 \uB2EC"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-back",
    size: 20,
    color: _theme.colors.textSecondary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.monthText
  }, period.year, "\uB144 ", period.month, "\uC6D4"), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => moveMonth(1),
    hitSlop: 12,
    accessibilityLabel: "\uB2E4\uC74C \uB2EC"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 20,
    color: _theme.colors.textSecondary
  })));
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: _TabBar.TAB_BAR_HEIGHT + insets.bottom + 120,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_ScreenHeader.default, {
    title: "\uC18C\uBE44",
    right: monthSelector
  }), /*#__PURE__*/_react.default.createElement(_BudgetCard.default, {
    budget: budget,
    spent: spent
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, "\uCD5C\uADFC \uC9C0\uCD9C \uB0B4\uC5ED"), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    style: styles.viewAll,
    hitSlop: 8,
    accessibilityRole: "button",
    onPress: () => navigation.navigate('SpendingAll')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.viewAllText
  }, "\uC804\uCCB4\uBCF4\uAE30"), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 16,
    color: _theme.colors.textSecondary
  }))), /*#__PURE__*/_react.default.createElement(_SoftButton.default, {
    label: "\uC18C\uBE44 \uBD84\uC11D \uBCF4\uAE30",
    icon: "camera-outline",
    onPress: () => navigation.navigate('SpendingAnalysis')
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.list
  }, monthTransactions.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.empty
  }, "\uC774 \uB2EC\uC5D0\uB294 \uC9C0\uCD9C \uB0B4\uC5ED\uC774 \uC5C6\uC5B4\uC694.") : monthTransactions.slice(0, RECENT_LIMIT).map(t => /*#__PURE__*/_react.default.createElement(_TransactionRow.default, _extends({
    key: t.id
  }, t, {
    date: (0, _format.formatMonthDay)(t.date),
    onPress: () => navigation.navigate('SpendingDetail', {
      id: t.id
    })
  }))))), /*#__PURE__*/_react.default.createElement(_Fab.default, {
    accessibilityLabel: "\uC9C0\uCD9C \uCD94\uAC00",
    onPress: () => setAddVisible(true)
  }), /*#__PURE__*/_react.default.createElement(_AddSpendingSheet.default, {
    visible: addVisible,
    onClose: () => setAddVisible(false),
    onClosed: handleSheetClosed,
    options: addOptions,
    onSelect: handleSelectAddOption
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  monthText: {
    marginHorizontal: 14,
    fontFamily: _theme.fonts.medium,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewAllText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  list: {
    marginTop: 10
  },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/BudgetCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = BudgetCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
var _format = __load("src/utils/format.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 소비 화면 상단의 "이번 달 남은 예산" 카드 (진행 바 포함)
function BudgetCard({
  budget,
  spent
}) {
  const remaining = budget - spent;
  // 예산이 0 이하이면 쓴 돈이 있을 때만 100% 로 보여 줍니다.
  const usedPercent = budget > 0 ? Math.min(100, Math.max(0, Math.round(spent / budget * 100))) : spent > 0 ? 100 : 0;
  const leftPercent = 100 - usedPercent;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.card
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, "\uC774\uBC88 \uB2EC \uB0A8\uC740 \uC608\uC0B0"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.bigRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.bigText
  }, (0, _format.formatNumber)(remaining)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.bigUnit
  }, "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.progressLabels
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.progressText
  }, "\uC608\uC0B0\uC758 ", usedPercent, "%\uB97C \uC0AC\uC6A9\uD588\uC5B4\uC694"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.leftText
  }, leftPercent, "% \uB0A8\uC74C")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.track
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.fill, {
      width: `${usedPercent}%`
    }]
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.divider
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.bottomRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subLabel
  }, "\uC774\uBC88 \uB2EC \uC9C0\uCD9C\uAE08"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.spentValue
  }, (0, _format.formatNumber)(spent), "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.right
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subLabel
  }, "\uC774\uBC88 \uB2EC \uC608\uC0B0"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.budgetValue
  }, (0, _format.formatNumber)(budget), "\uC6D0"))));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    backgroundColor: _theme.colors.heroBg,
    borderRadius: _theme.radius.card,
    paddingHorizontal: 24,
    paddingVertical: 22
  },
  label: {
    fontFamily: _theme.fonts.bold,
    fontSize: 15,
    color: _theme.colors.green
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2
  },
  bigText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 38,
    lineHeight: 52,
    color: _theme.colors.textPrimary
  },
  bigUnit: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  progressLabels: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13.5,
    color: _theme.colors.textSecondary
  },
  leftText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 13.5,
    color: _theme.colors.green
  },
  track: {
    marginTop: 8,
    height: 7,
    borderRadius: 4,
    backgroundColor: _theme.colors.progressTrack,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: _theme.colors.greenLight
  },
  divider: {
    marginTop: 16,
    height: _reactNative.StyleSheet.hairlineWidth * 2,
    backgroundColor: _theme.colors.divider
  },
  bottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  right: {
    alignItems: 'flex-end'
  },
  subLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13.5,
    color: _theme.colors.textSecondary
  },
  spentValue: {
    marginTop: 2,
    fontFamily: _theme.fonts.bold,
    fontSize: 21,
    color: _theme.colors.textPrimary
  },
  budgetValue: {
    marginTop: 2,
    fontFamily: _theme.fonts.regular,
    fontSize: 21,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/SoftButton.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SoftButton;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 연한 초록 배경의 가로 전체 버튼 ("소비 분석 보기", "AI 레시피 추천")
function SoftButton({
  label,
  icon,
  onPress
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.button, pressed && styles.pressed]
  }, icon ? /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: icon,
    size: 24,
    color: _theme.colors.green
  }) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label));
}
const styles = _reactNative.StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 22,
    backgroundColor: _theme.colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.8
  },
  label: {
    marginLeft: 10,
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.green
  }
});
},
"src/components/TransactionRow.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TransactionRow;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
var _format = __load("src/utils/format.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 최근 지출 내역의 한 줄
function TransactionRow({
  title,
  date,
  category,
  amount,
  icon,
  onPress
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.row, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: icon
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sub
  }, date, " \xB7 ", category)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.amount
  }, (0, _format.formatNumber)(amount), "\uC6D0"));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  pressed: {
    opacity: 0.7
  },
  texts: {
    flex: 1,
    marginLeft: 16
  },
  title: {
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  sub: {
    marginTop: 1,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  amount: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  }
});
},
"src/components/IconBox.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = IconBox;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 목록 왼쪽의 둥근 사각형 아이콘 박스
function IconBox({
  name,
  size = 42,
  iconColor = _theme.colors.textSecondary,
  backgroundColor = _theme.colors.cardBg,
  borderRadius = _theme.radius.icon
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.box, {
      width: size,
      height: size,
      borderRadius,
      backgroundColor
    }]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: name,
    size: Math.round(size * 0.57),
    color: iconColor
  }));
}
const styles = _reactNative.StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
},
"src/components/Fab.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Fab;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _TabBar = __load("src/components/TabBar.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 탭 바 위에 떠 있는 "추가" 버튼. hasTabBar=false 면 탭 바가 없는 화면용 위치에 놓입니다.
function Fab({
  onPress,
  accessibilityLabel = '추가',
  hasTabBar = true
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const bottom = hasTabBar ? Math.max(insets.bottom, 12) + _TabBar.TAB_BAR_HEIGHT + 34 : insets.bottom + 18;
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    accessibilityLabel: accessibilityLabel,
    style: ({
      pressed
    }) => [styles.fab, {
      bottom
    }, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "add",
    size: 32,
    color: _theme.colors.white
  }));
}
const styles = _reactNative.StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: _theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F3A30',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6
  },
  pressed: {
    opacity: 0.85
  }
});
},
"src/components/AddSpendingSheet.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AddSpendingSheet;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _BottomSheet = _interopRequireDefault(__load("src/components/BottomSheet.js"));
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// "소비 추가" 시트 (영수증 촬영 / 직접 입력). options: [{ id, title, description, icon }]
// onSelect(id): 고른 항목의 id. 화면 이동은 부모에서 연결합니다.
function AddSpendingSheet({
  visible,
  onClose,
  onClosed,
  options,
  onSelect
}) {
  return /*#__PURE__*/_react.default.createElement(_BottomSheet.default, {
    visible: visible,
    onClose: onClose,
    onClosed: onClosed,
    title: "\uC18C\uBE44 \uCD94\uAC00"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.list
  }, options.map(option => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: option.id,
    onPress: () => onSelect(option.id),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.card, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: option.icon,
    size: 46,
    borderRadius: 16,
    iconColor: _theme.colors.green,
    backgroundColor: _theme.colors.tabActiveBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, option.title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.description
  }, option.description)), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 20,
    color: _theme.colors.tabInactive
  })))));
}
const styles = _reactNative.StyleSheet.create({
  list: {
    gap: 12
  },
  card: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: _theme.colors.cardBg,
    borderRadius: _theme.radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  pressed: {
    opacity: 0.75
  },
  texts: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  description: {
    marginTop: 2,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/BottomSheet.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = BottomSheet;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _theme = __load("src/theme.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
const SCREEN_HEIGHT = _reactNative.Dimensions.get('window').height;
const OVERLAY_COLOR = 'rgba(31, 46, 40, 0.4)';

// 아래에서 올라오는 시트 (핸들 + 제목 + 닫기 버튼 + 내용).
// onClose: 배경이나 X 를 눌렀을 때, onClosed: 닫힘 애니메이션이 끝난 뒤 (닫은 뒤 화면을 이동할 때 사용)
// 닫히는 애니메이션을 보여주려고 mounted 상태를 따로 둡니다.
function BottomSheet({
  visible,
  onClose,
  onClosed,
  title,
  children
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const [mounted, setMounted] = (0, _react.useState)(visible);
  const progress = (0, _react.useRef)(new _reactNative.Animated.Value(0)).current;
  const wasOpenRef = (0, _react.useRef)(false);
  const onClosedRef = (0, _react.useRef)(onClosed);
  onClosedRef.current = onClosed;
  (0, _react.useEffect)(() => {
    if (visible) {
      wasOpenRef.current = true;
      setMounted(true);
      _reactNative.Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: _reactNative.Easing.out(_reactNative.Easing.cubic),
        useNativeDriver: true
      }).start();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      _reactNative.Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: _reactNative.Easing.in(_reactNative.Easing.cubic),
        useNativeDriver: true
      }).start(({
        finished
      }) => {
        if (finished) {
          setMounted(false);
          if (onClosedRef.current) onClosedRef.current();
        }
      });
    }
  }, [visible, progress]);
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0]
  });
  return /*#__PURE__*/_react.default.createElement(_reactNative.Modal, {
    transparent: true,
    visible: mounted,
    animationType: "none",
    statusBarTranslucent: true,
    onRequestClose: onClose
  }, /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.root,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
    style: [_reactNative.StyleSheet.absoluteFill, styles.overlay, {
      opacity: progress
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    style: _reactNative.StyleSheet.absoluteFill,
    onPress: onClose,
    accessibilityLabel: "\uB2EB\uAE30"
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
    style: [styles.sheet, {
      paddingBottom: insets.bottom + 36,
      transform: [{
        translateY
      }]
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.handle
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.header
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onClose,
    hitSlop: 12,
    accessibilityLabel: "\uB2EB\uAE30",
    accessibilityRole: "button"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "close",
    size: 30,
    color: _theme.colors.tabInactive
  }))), children)));
}
const styles = _reactNative.StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  overlay: {
    backgroundColor: OVERLAY_COLOR
  },
  sheet: {
    backgroundColor: _theme.colors.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 12
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDE3DF'
  },
  header: {
    marginTop: 18,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 24,
    color: _theme.colors.textPrimary
  }
});
},
"src/screens/FridgeScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FridgeScreen;
var _ActionMenu = _interopRequireDefault(__load("src/components/ActionMenu.js"));
var _router = __load("integration/router.js");
var _useDayClock = __load("module3/hooks/useDayClock.js");
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _ScreenHeader = _interopRequireDefault(__load("src/components/ScreenHeader.js"));
var _SoftButton = _interopRequireDefault(__load("src/components/SoftButton.js"));
var _Chip = _interopRequireDefault(__load("src/components/Chip.js"));
var _FridgeItemRow = _interopRequireDefault(__load("src/components/FridgeItemRow.js"));
var _Fab = _interopRequireDefault(__load("src/components/Fab.js"));
var _TabBar = __load("src/components/TabBar.js");
var _fridge = __load("src/data/fridge/fridge.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function FridgeScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    urgentWithinDays
  } = _fridge.fridgeData;
  const {
    fridgeItems: items
  } = (0, _AppDataContext.useAppData)();
  (0, _useDayClock.useDayClock)();
  const now = new Date();
  const baseDate = (0, _format.toDateString)(now); // 기준일 = 오늘
  const [filter, setFilter] = (0, _react.useState)('all'); // 'all' | 'urgent'

  // 유통기한 빠른 순으로 정렬하고, 남은 일수/임박 여부를 계산합니다.
  const enriched = (0, _react.useMemo)(() => items.map(item => {
    const expiry = item.expiry || null;
    const daysLeft = expiry ? (0, _format.daysBetween)(baseDate, expiry) : Infinity;
    return {
      ...item,
      expiry,
      daysLeft,
      urgent: daysLeft <= urgentWithinDays
    };
  }).sort((a, b) => a.daysLeft - b.daysLeft), [items, baseDate, urgentWithinDays]);
  const urgentCount = enriched.filter(i => i.urgent).length;
  const visible = filter === 'urgent' ? enriched.filter(i => i.urgent) : enriched;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: _TabBar.TAB_BAR_HEIGHT + insets.bottom + 120,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_ScreenHeader.default, {
    title: "\uB0C9\uC7A5\uACE0",
    rightText: (0, _format.formatKoreanDate)(now),
    subtitle: "\uC6B0\uB9AC \uC9D1 \uC2DD\uC7AC\uB8CC, \uAE30\uD55C \uC804\uC5D0 \uCC59\uACA8\uC694."
  }), /*#__PURE__*/_react.default.createElement(_SoftButton.default, {
    label: "\uB808\uC2DC\uD53C \uAC80\uC0C9 \xB7 \uCD94\uCC9C",
    icon: "fridge-outline",
    onPress: () => navigation.navigate('RecipeList', {
      searchMode: true
    })
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      marginTop: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.sectionTitle, {
      marginTop: 0
    }]
  }, "\uBCF4\uAD00 \uC911\uC778 \uC2DD\uC7AC\uB8CC"), "        ", /*#__PURE__*/_react.default.createElement(_ActionMenu.default, {
    label: "\uB0C9\uC7A5\uACE0 \uAD00\uB9AC",
    items: [['음식 검색', () => navigation.navigate('RecipeList', {
      searchMode: true
    })], ['재고 관리 · 사용/폐기', () => _router.router.push('/inventory/manage')], ['장보기 목록', () => _router.router.push('/(tabs)/shopping')], ['식사 · 폐기 기록', () => _router.router.push('/(tabs)/meal')], ['날짜 알림', () => _router.router.push('/inventory/alerts')]]
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.chipRow
  }, /*#__PURE__*/_react.default.createElement(_Chip.default, {
    label: "\uC804\uCCB4",
    count: enriched.length,
    selected: filter === 'all',
    onPress: () => setFilter('all')
  }), /*#__PURE__*/_react.default.createElement(_Chip.default, {
    label: "\uC720\uD1B5\uAE30\uD55C \uC784\uBC15",
    count: urgentCount,
    selected: filter === 'urgent',
    onPress: () => setFilter('urgent')
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.metaRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.metaText
  }, "\uC784\uBC15\uC740 ", urgentWithinDays, "\uC77C \uC774\uB0B4 \xB7 \uC720\uD1B5\uAE30\uD55C \uBE60\uB978 \uC21C"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.metaText
  }, (0, _format.formatDotDate)(baseDate), " \uAE30\uC900")), /*#__PURE__*/_react.default.createElement(_reactNative.View, null, visible.map((item, i) => /*#__PURE__*/_react.default.createElement(_FridgeItemRow.default, _extends({
    key: item.id
  }, item, {
    isLast: i === visible.length - 1,
    onPress: () => navigation.navigate('FridgeAdd', {
      id: item.id
    })
  }))))), /*#__PURE__*/_react.default.createElement(_Fab.default, {
    accessibilityLabel: "\uC2DD\uC7AC\uB8CC \uCD94\uAC00",
    onPress: () => navigation.navigate('FridgeAdd')
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  sectionTitle: {
    marginTop: 32,
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  chipRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8
  },
  metaRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metaText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 12.5,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/ActionMenu.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ActionMenu;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function ActionMenu({
  label = '더보기',
  items
}) {
  const [open, setOpen] = (0, _react.useState)(false);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.anchor
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    accessibilityRole: "button",
    accessibilityLabel: label,
    hitSlop: 8,
    onPress: () => setOpen(true),
    style: styles.trigger
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "dots-horizontal",
    size: 26,
    color: _theme.colors.textSecondary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Modal, {
    visible: open,
    transparent: true,
    animationType: "fade",
    onRequestClose: () => setOpen(false)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.overlay
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    accessibilityRole: "button",
    accessibilityLabel: "\uBA54\uB274 \uB2EB\uAE30",
    style: _reactNative.StyleSheet.absoluteFill,
    onPress: () => setOpen(false)
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    accessibilityViewIsModal: true,
    style: styles.sheet
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, label), items.map(([title, action]) => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: title,
    accessibilityRole: "button",
    style: styles.row,
    onPress: () => {
      setOpen(false);
      action();
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.text
  }, title), /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "chevron-right",
    size: 22,
    color: _theme.colors.textSecondary
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    accessibilityRole: "button",
    onPress: () => setOpen(false),
    style: styles.close
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.text
  }, "\uB2EB\uAE30"))))));
}
const styles = _reactNative.StyleSheet.create({
  anchor: {
    alignItems: 'flex-end',
    height: 32,
    minWidth: 44
  },
  trigger: {
    height: 32,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.28)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: _theme.colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: _theme.spacing.screenX,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center'
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 20,
    color: _theme.colors.textPrimary,
    marginBottom: 16
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: _theme.colors.divider
  },
  text: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  close: {
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: _theme.colors.cardBg
  }
});
},
"src/components/Chip.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Chip;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 필터 칩 (예: "전체 6", "유통기한 임박 3")
function Chip({
  label,
  count,
  selected,
  onPress
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    accessibilityState: {
      selected
    },
    style: [styles.chip, selected && styles.chipSelected]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.label, selected && styles.labelSelected]
  }, label, count !== undefined ? `  ${count}` : ''));
}
const styles = _reactNative.StyleSheet.create({
  chip: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: _theme.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipSelected: {
    backgroundColor: _theme.colors.tabActiveBg
  },
  label: {
    fontFamily: _theme.fonts.medium,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  labelSelected: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  }
});
},
"src/components/FridgeItemRow.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FridgeItemRow;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
var _format = __load("src/utils/format.js");
var _recipes = __load("src/utils/recipes.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 냉장고 식재료 목록의 한 줄. daysLeft: 유통기한까지 남은 일수, urgent: 임박 여부
function FridgeItemRow({
  dateType,
  name,
  quantity,
  expiry,
  icon,
  daysLeft,
  urgent,
  isLast,
  onPress
}) {
  const badgeLabel = Number.isFinite(daysLeft) ? (0, _recipes.badgeDueLabel)(daysLeft) : '날짜 미입력';
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: icon
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.name
  }, name), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.quantity
  }, quantity)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.right
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.badge, urgent ? styles.badgeUrgent : styles.badgeNormal]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.badgeText, urgent ? styles.badgeTextUrgent : styles.badgeTextNormal]
  }, badgeLabel)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.date
  }, dateType === 'package' ? '표시기한' : '참고일', " ", expiry ? (0, _format.formatDotDate)(expiry) : '미입력')));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16
  },
  divider: {
    borderBottomWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderBottomColor: _theme.colors.divider
  },
  pressed: {
    opacity: 0.7
  },
  texts: {
    flex: 1,
    marginLeft: 16
  },
  name: {
    fontFamily: _theme.fonts.medium,
    fontWeight: '500',
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  quantity: {
    marginTop: 1,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  right: {
    alignItems: 'flex-end'
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeUrgent: {
    backgroundColor: _theme.colors.warnBg
  },
  badgeNormal: {
    backgroundColor: _theme.colors.cardBg
  },
  badgeText: {
    fontFamily: _theme.fonts.medium,
    fontWeight: '500',
    fontSize: 13
  },
  badgeTextUrgent: {
    color: _theme.colors.warnText
  },
  badgeTextNormal: {
    color: _theme.colors.textSecondary
  },
  date: {
    marginTop: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 12.5,
    color: _theme.colors.textSecondary
  }
});
},
"src/screens/LifeInfoScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = LifeInfoScreen;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _ScreenHeader = _interopRequireDefault(__load("src/components/ScreenHeader.js"));
var _FeatureCard = _interopRequireDefault(__load("src/components/FeatureCard.js"));
var _SectionTitle = _interopRequireDefault(__load("src/components/SectionTitle.js"));
var _MenuRow = _interopRequireDefault(__load("src/components/MenuRow.js"));
var _TabBar = __load("src/components/TabBar.js");
var _lifeInfo = __load("src/data/lifeInfo/lifeInfo.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function LifeInfoScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    subtitle,
    aiManager,
    survivalMap,
    sectionTitle,
    menus
  } = _lifeInfo.lifeInfoData;

  // 메뉴를 눌렀을 때 이동. 아직 화면이 없는 메뉴는 비워 둡니다.
  const handleMenuPress = id => {
    if (id === 'todo') navigation.navigate('Todo');
    if (id === 'routine') navigation.navigate('Routine');
    if (id === 'emergency') navigation.navigate('Emergency');
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: _TabBar.TAB_BAR_HEIGHT + insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_ScreenHeader.default, {
    title: "\uC0DD\uD65C\uC815\uBCF4",
    subtitle: subtitle
  }), /*#__PURE__*/_react.default.createElement(_FeatureCard.default, _extends({
    variant: "mint"
  }, aiManager, {
    onPress: () => navigation.navigate('AiManager')
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cardGap
  }), /*#__PURE__*/_react.default.createElement(_FeatureCard.default, _extends({
    variant: "gray"
  }, survivalMap, {
    onPress: () => navigation.navigate('SurvivalMap')
  })), /*#__PURE__*/_react.default.createElement(_SectionTitle.default, {
    style: styles.sectionTitle
  }, sectionTitle), /*#__PURE__*/_react.default.createElement(_reactNative.View, null, menus.map(menu => /*#__PURE__*/_react.default.createElement(_MenuRow.default, _extends({
    key: menu.id
  }, menu, {
    vertical: 25,
    onPress: () => handleMenuPress(menu.id)
  }))))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  cardGap: {
    height: 16
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12
  }
});
},
"src/components/FeatureCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FeatureCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 생활정보의 큰 기능 카드. variant "mint": 초록 카드 + 가로 전체 버튼 / "gray": 회색 카드 + 텍스트 링크
function FeatureCard({
  variant = 'mint',
  title,
  description,
  icon,
  actionLabel,
  onPress
}) {
  const isMint = variant === 'mint';
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.card, isMint ? styles.cardMint : styles.cardGray]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.top
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.description
  }, description)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.iconWrap
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: icon,
    size: 57,
    borderRadius: 20,
    iconColor: _theme.colors.green,
    backgroundColor: isMint ? _theme.colors.badgeBg : _theme.colors.white
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [isMint ? styles.button : styles.link, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.actionText
  }, actionLabel), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-forward",
    size: 20,
    color: _theme.colors.green,
    style: styles.arrow
  })));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    borderRadius: _theme.radius.card,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22
  },
  cardMint: {
    backgroundColor: _theme.colors.heroBg
  },
  cardGray: {
    backgroundColor: _theme.colors.cardBg
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  texts: {
    flex: 1
  },
  iconWrap: {
    marginTop: 8,
    marginLeft: 12
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    color: _theme.colors.textPrimary
  },
  description: {
    marginTop: 8,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: _theme.colors.textSecondary
  },
  button: {
    marginTop: 18,
    height: 44,
    borderRadius: 22,
    backgroundColor: _theme.colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  link: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.75
  },
  actionText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    color: _theme.colors.green
  },
  arrow: {
    marginLeft: 8
  }
});
},
"src/components/SectionTitle.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SectionTitle;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 화면 안의 섹션 제목 (예: "계정 관리", "앱 이용 안내")
function SectionTitle({
  children,
  style
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.title, style]
  }, children);
}
const styles = _reactNative.StyleSheet.create({
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  }
});
},
"src/components/MenuRow.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MenuRow;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 아이콘 + 제목 + 설명 + 화살표 메뉴 한 줄 (생활정보, 더보기 공통). vertical: 위아래 여백, showDivider: 아래 구분선
function MenuRow({
  icon,
  title,
  description,
  onPress,
  vertical = 20,
  showDivider = true
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.row, {
      paddingVertical: vertical
    }, showDivider && styles.divider, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: icon,
    iconColor: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.description
  }, description)), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 20,
    color: _theme.colors.textSecondary
  }));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  divider: {
    borderBottomWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderBottomColor: _theme.colors.divider
  },
  pressed: {
    opacity: 0.7
  },
  texts: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  description: {
    marginTop: 3,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/data/lifeInfo/lifeInfo.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lifeInfoData = void 0;
// 생활정보 화면 문구/메뉴. icon 은 MaterialCommunityIcons 이름입니다.

const lifeInfoData = exports.lifeInfoData = {
  subtitle: '혼자 사는 일상, 필요한 도움을 한곳에서.',
  aiManager: {
    title: 'AI 자취 매니저',
    description: '혼자 살며 궁금한 일,\n편하게 물어보세요.',
    icon: 'forum-outline',
    actionLabel: '매니저에게 물어보기'
  },
  survivalMap: {
    title: '자취생존맵',
    description: '생활에 필요한 주변 장소를\n지도에서 찾아보세요.',
    icon: 'map-marker-outline',
    actionLabel: '지도 보러 가기'
  },
  sectionTitle: '더 편안한 일상을 위해',
  menus: [{
    id: 'todo',
    title: '할 일 기록',
    description: '오늘 할 일을 빠르게 기록하고 관리해요.',
    icon: 'calendar-check-outline'
  }, {
    id: 'routine',
    title: '생활 루틴 설정',
    description: '청소·빨래 등 나만의 생활 주기를 정해요.',
    icon: 'calendar-check-outline'
  }, {
    id: 'emergency',
    title: '비상 매뉴얼 확인',
    description: '갑작스러운 상황, 대처 방법을 확인해요.',
    icon: 'shield-check-outline'
  }]
};
},
"src/screens/EmergencyScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = EmergencyScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _SituationCard = _interopRequireDefault(__load("src/components/SituationCard.js"));
var _SearchBar = _interopRequireDefault(__load("src/components/SearchBar.js"));
var _AiAskCard = _interopRequireDefault(__load("src/components/AiAskCard.js"));
var _BackButton = _interopRequireDefault(__load("src/components/BackButton.js"));
var _TabBar = __load("src/components/TabBar.js");
var _emergency = __load("src/data/lifeInfo/emergency.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 이 화면은 PNG 기준 좌우 여백이 20 입니다. (theme.spacing.screenX 는 24)
const SCREEN_X = 20;
const GRID_GAP = 9;

// 제목 또는 검색용 단어에 검색어가 들어 있으면 통과
const matches = (item, query) => item.title.includes(query) || (item.keywords ?? []).some(k => k.includes(query));

// [a, b, c, d] -> [[a, b], [c, d]]
const toRows = items => {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
};

// 생활정보 > 비상 매뉴얼 확인
function EmergencyScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const [query, setQuery] = (0, _react.useState)('');
  const {
    eyebrow,
    title,
    searchPlaceholder,
    question,
    groups,
    aiAsk,
    prepare
  } = _emergency.emergencyData;
  const trimmed = query.trim();
  // 생활 문제(위)와 긴급·안전(아래 "미리 대비하기")을 나눠서, 검색어에 맞는 항목만 남깁니다.
  const {
    lifeGroup,
    safetyGroup
  } = (0, _react.useMemo)(() => {
    const filter = id => {
      const group = groups.find(g => g.id === id);
      return {
        ...group,
        items: trimmed ? group.items.filter(item => matches(item, trimmed)) : group.items
      };
    };
    return {
      lifeGroup: filter('life'),
      safetyGroup: filter('safety')
    };
  }, [groups, trimmed]);

  // 뒤로 가기 (이전 기록이 없으면 생활정보 탭으로 이동)
  const handleBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LifeInfo');

  // 상황별 대처 화면으로 이동. id 는 data/lifeInfo/emergencyGuides.js 의 키와 같아야 합니다.
  const openDetail = ({
    id,
    title: detailTitle,
    tone
  }) => navigation.navigate('EmergencyDetail', {
    id,
    title: detailTitle,
    tone
  });
  const renderRows = group => toRows(group.items).map((row, rowIndex) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: rowIndex,
    style: [styles.gridRow, rowIndex > 0 && styles.gridRowNext]
  }, row.map(item => /*#__PURE__*/_react.default.createElement(_SituationCard.default, {
    key: item.id,
    title: item.title,
    icon: item.icon,
    family: item.family,
    tone: group.tone,
    onPress: () => openDetail({
      id: item.id,
      title: item.title,
      tone: group.tone
    })
  })), row.length === 1 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.spacer
  }) : null));
  const renderGroup = group => /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.groupTitle, group.tone === 'accent' && styles.groupTitleAccent]
  }, group.title), renderRows(group));
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled",
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: _TabBar.TAB_BAR_HEIGHT + insets.bottom + 40,
      paddingHorizontal: SCREEN_X
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerRow
  }, /*#__PURE__*/_react.default.createElement(_BackButton.default, {
    onPress: handleBack,
    color: _theme.emergencyColors.text,
    style: styles.backButton
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.eyebrow
  }, eyebrow), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.searchWrap
  }, /*#__PURE__*/_react.default.createElement(_SearchBar.default, {
    value: query,
    onChangeText: setQuery,
    placeholder: searchPlaceholder
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.question
  }, question), lifeGroup.items.length > 0 ? renderGroup(lifeGroup) : null, lifeGroup.items.length === 0 && safetyGroup.items.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.empty
  }, "'", trimmed, "'\uC5D0 \uB9DE\uB294 \uC0C1\uD669\uC774 \uC5C6\uC5B4\uC694.") : null, /*#__PURE__*/_react.default.createElement(_AiAskCard.default, {
    style: styles.aiCard,
    label: aiAsk.label,
    onPress: () => navigation.navigate('EmergencyAi')
  }), safetyGroup.items.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.prepareBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.prepareTitle
  }, prepare.title), renderRows(safetyGroup)) : null));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  headerRow: {
    flexDirection: 'row'
  },
  // 제목 줄(eyebrow 16 + 제목 34 의 가운데)에 화살표 높이를 맞춥니다.
  backButton: {
    marginTop: 19,
    marginRight: 6
  },
  headerTexts: {
    flex: 1
  },
  eyebrow: {
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: _theme.emergencyColors.textSecondary
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: _theme.emergencyColors.text
  },
  searchWrap: {
    marginTop: 16
  },
  question: {
    marginTop: 16,
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: _theme.emergencyColors.text
  },
  groupTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.text
  },
  groupTitleAccent: {
    color: _theme.emergencyColors.accent
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP
  },
  gridRowNext: {
    marginTop: GRID_GAP
  },
  spacer: {
    flex: 1
  },
  empty: {
    marginTop: 28,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.emergencyColors.textSecondary
  },
  aiCard: {
    marginTop: 18
  },
  // 긴급·안전 항목을 "미리 대비하기" 상자로 묶어 하단에 둡니다.
  prepareBox: {
    marginTop: 28,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#F1F4F4'
  },
  prepareTitle: {
    marginBottom: 14,
    paddingHorizontal: 4,
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    lineHeight: 26,
    color: _theme.emergencyColors.text
  }
});
},
"src/components/SituationCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SituationCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 비상매뉴얼 상황 선택 카드. tone "default": 흰 배경 + 진한 아이콘(긴급·안전) / "accent": 회색 배경 + 초록 아이콘(생활 문제)
function SituationCard({
  title,
  icon,
  family,
  tone = 'default',
  onPress
}) {
  const Icon = family === 'ion' ? _vectorIcons.Ionicons : _vectorIcons.MaterialCommunityIcons;
  const isAccent = tone === 'accent';
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    accessibilityLabel: title,
    style: ({
      pressed
    }) => [styles.card, isAccent ? styles.cardAccent : styles.cardDefault, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(Icon, {
    name: icon,
    size: 22,
    color: isAccent ? _theme.emergencyColors.accent : _theme.emergencyColors.text
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title,
    numberOfLines: 1
  }, title));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    flex: 1,
    height: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: _theme.emergencyColors.border,
    paddingTop: 11,
    paddingBottom: 13,
    paddingHorizontal: 14,
    justifyContent: 'space-between'
  },
  cardDefault: {
    backgroundColor: _theme.colors.white
  },
  cardAccent: {
    backgroundColor: _theme.emergencyColors.surface
  },
  pressed: {
    opacity: 0.8
  },
  title: {
    fontFamily: _theme.fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.text
  }
});
},
"src/components/SearchBar.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SearchBar;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 돋보기 아이콘이 있는 검색 입력창 (비상매뉴얼 화면).
function SearchBar({
  value,
  onChangeText,
  placeholder
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.box
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "magnify",
    size: 20,
    color: _theme.emergencyColors.textSecondary
  }), /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    value: value,
    onChangeText: onChangeText,
    placeholder: placeholder,
    placeholderTextColor: _theme.emergencyColors.textSecondary,
    style: styles.input,
    returnKeyType: "search",
    clearButtonMode: "while-editing",
    autoCorrect: false,
    accessibilityLabel: "\uC0C1\uD669 \uAC80\uC0C9"
  }));
}
const styles = _reactNative.StyleSheet.create({
  box: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: _theme.emergencyColors.border,
    backgroundColor: _theme.emergencyColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12
  },
  input: {
    flex: 1,
    height: 48,
    padding: 0,
    marginLeft: 10,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.emergencyColors.text
  }
});
},
"src/components/AiAskCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AiAskCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 비상매뉴얼 하단의 "AI에게 물어보기" 카드 (연한 초록 배경 + 반짝이 아이콘 + 화살표)
function AiAskCard({
  label,
  onPress,
  style
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    accessibilityLabel: label,
    style: ({
      pressed
    }) => [styles.card, style, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: "creation",
    size: 52,
    borderRadius: 18,
    iconColor: _theme.colors.green,
    backgroundColor: _theme.colors.badgeBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-forward",
    size: 22,
    color: _theme.colors.green
  }));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: _theme.radius.card,
    backgroundColor: _theme.colors.heroBg,
    padding: 20
  },
  pressed: {
    opacity: 0.8
  },
  label: {
    flex: 1,
    marginLeft: 14,
    fontFamily: _theme.fonts.bold,
    fontSize: 19,
    color: _theme.colors.textPrimary
  }
});
},
"src/components/BackButton.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = BackButton;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 제목 옆의 작은 "뒤로 가기" 버튼 (제목 줄이 없는 화면용. 제목 줄이 있으면 BackHeader)
function BackButton({
  onPress,
  color = _theme.colors.textPrimary,
  style
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uB4A4\uB85C \uAC00\uAE30",
    style: ({
      pressed
    }) => [styles.button, pressed && styles.pressed, style]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-back",
    size: 28,
    color: color
  }));
}
const styles = _reactNative.StyleSheet.create({
  button: {
    marginLeft: -4 // 아이콘 안쪽 여백만큼 당겨 왼쪽 여백과 맞춤
  },
  pressed: {
    opacity: 0.6
  }
});
},
"src/data/lifeInfo/emergency.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.emergencyData = void 0;
// 비상매뉴얼 문구와 메뉴. icon 은 MaterialCommunityIcons 이름 (family: 'ion' 이면 Ionicons).
// keywords 는 검색용 임시 단어입니다. 매뉴얼 내용이 정해지면 바꾸세요.

const emergencyData = exports.emergencyData = {
  eyebrow: '생활정보',
  title: '비상매뉴얼',
  searchPlaceholder: '누수, 정전 등 상황을 검색하세요',
  question: '어떤 상황인가요?',
  groups: [{
    id: 'safety',
    title: '긴급·안전',
    tone: 'default',
    items: [{
      id: 'fire',
      title: '화재·연기',
      icon: 'flame-outline',
      family: 'ion',
      keywords: ['불', '연기', '소화기', '대피']
    }, {
      id: 'crime',
      title: '범죄·신변 위협',
      icon: 'shield-alert-outline',
      keywords: ['스토킹', '침입', '도둑', '신고']
    }, {
      id: 'disaster',
      title: '지진·재난',
      icon: 'alert-outline',
      keywords: ['태풍', '홍수', '대피']
    }, {
      id: 'patient',
      title: '응급환자·부상',
      icon: 'heart-pulse',
      keywords: ['구급', '다침', '화상', '심폐소생']
    }]
  }, {
    id: 'life',
    title: '생활 문제',
    tone: 'accent',
    items: [{
      id: 'leak',
      title: '누수·단수',
      icon: 'water-outline',
      keywords: ['물', '수도', '배관']
    }, {
      id: 'power',
      title: '정전·차단기',
      icon: 'flash-outline',
      keywords: ['전기', '두꺼비집', '누전']
    }, {
      id: 'pest',
      title: '벌레·해충',
      icon: 'bug-outline',
      keywords: ['바퀴벌레', '모기', '쥐']
    }, {
      id: 'lost',
      title: '분실·도난 후 조치',
      icon: 'key-outline',
      keywords: ['열쇠', '카드', '지갑', '휴대폰']
    }]
  }],
  // 긴급·안전(id: safety) 항목은 하단 "미리 대비하기" 상자에 보여줍니다.
  prepare: {
    title: '재난 시 행동요령\n미리 확인해서 대비하기'
  },
  aiAsk: {
    label: 'AI에게 물어보기'
  }
};
},
"src/screens/SurvivalMapScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SurvivalMapScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _SearchBar = _interopRequireDefault(__load("src/components/SearchBar.js"));
var _CategoryTabs = _interopRequireDefault(__load("src/components/CategoryTabs.js"));
var _BackButton = _interopRequireDefault(__load("src/components/BackButton.js"));
var _MapCanvas = _interopRequireDefault(__load("src/components/MapCanvas.js"));
var _MapPin = _interopRequireWildcard(__load("src/components/MapPin.js"));
var _PlaceSheet = _interopRequireWildcard(__load("src/components/PlaceSheet.js"));
var _TabBar = __load("src/components/TabBar.js");
var _survivalMap = __load("src/data/lifeInfo/survivalMap.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 이 화면은 PNG 기준 좌우 여백이 20 입니다. (theme.spacing.screenX 는 24)
const SCREEN_X = 20;
const SHEET_SIDE = 16;
const SHEET_BOTTOM = 16;

// 생활정보 > 자취생존맵
function SurvivalMapScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    eyebrow,
    title,
    location,
    searchPlaceholder,
    userLocation,
    categories,
    places
  } = _survivalMap.survivalMapData;
  const [categoryId, setCategoryId] = (0, _react.useState)(categories[0].id);
  const [selectedId, setSelectedId] = (0, _react.useState)(null);
  const [query, setQuery] = (0, _react.useState)('');
  const category = categories.find(cat => cat.id === categoryId);
  const trimmed = query.trim();
  const visiblePlaces = (places[categoryId] ?? []).filter(place => !trimmed || place.name.includes(trimmed));
  // 선택된 장소가 없거나 검색으로 사라졌으면 첫 번째 장소를 선택
  const selected = visiblePlaces.find(place => place.id === selectedId) ?? visiblePlaces[0] ?? null;

  // 지도 영역 아래쪽은 탭 바 뒤의 연한 회색 띠 (PNG 와 동일)
  const bottomBand = _TabBar.TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 10;
  const handleSelectCategory = id => {
    setCategoryId(id);
    setSelectedId(null);
  };

  // 뒤로 가기 (이전 기록이 없으면 생활정보 탭으로 이동)
  const handleBack = () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LifeInfo');

  // 길찾기: 카카오맵 검색 링크로 연결합니다. (앱 안 길찾기가 정해지면 교체)
  const handleDirections = place => {
    const keyword = encodeURIComponent(place.address || place.name);
    _reactNative.Linking.openURL(`https://map.kakao.com/link/search/${keyword}`).catch(() => _reactNative.Alert.alert('지도를 열 수 없어요', '잠시 후 다시 시도해 주세요.'));
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingTop: insets.top + 14,
      paddingHorizontal: SCREEN_X
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerRow
  }, /*#__PURE__*/_react.default.createElement(_BackButton.default, {
    onPress: handleBack,
    color: _theme.emergencyColors.text,
    style: styles.backButton
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.eyebrow
  }, eyebrow), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.titleRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    style: styles.chip,
    accessibilityRole: "button",
    accessibilityLabel: location
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "map-marker-outline",
    size: 18,
    color: _theme.emergencyColors.accent
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.chipText
  }, location), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-down",
    size: 18,
    color: _theme.emergencyColors.textSecondary
  }))))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.searchWrap
  }, /*#__PURE__*/_react.default.createElement(_SearchBar.default, {
    value: query,
    onChangeText: setQuery,
    placeholder: searchPlaceholder
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tabsWrap
  }, /*#__PURE__*/_react.default.createElement(_CategoryTabs.default, {
    categories: categories,
    selectedId: categoryId,
    onSelect: handleSelectCategory
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.mapArea, {
      marginBottom: bottomBand
    }]
  }, /*#__PURE__*/_react.default.createElement(_MapCanvas.default, {
    style: _reactNative.StyleSheet.absoluteFill
  }, /*#__PURE__*/_react.default.createElement(_MapPin.UserDot, {
    x: userLocation.x,
    y: userLocation.y
  }), visiblePlaces.filter(place => place.id !== selected?.id).map(place => /*#__PURE__*/_react.default.createElement(_MapPin.default, {
    key: place.id,
    x: place.x,
    y: place.y,
    icon: category.icon,
    label: place.name,
    onPress: () => setSelectedId(place.id)
  })), selected ? /*#__PURE__*/_react.default.createElement(_MapPin.default, {
    x: selected.x,
    y: selected.y,
    icon: category.icon,
    label: selected.name,
    selected: true,
    onPress: () => setSelectedId(selected.id)
  }) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    style: styles.locate,
    accessibilityRole: "button",
    accessibilityLabel: "\uD604\uC7AC \uC704\uCE58\uB85C \uC774\uB3D9"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "crosshairs-gps",
    size: 24,
    color: _theme.emergencyColors.text
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.scale,
    pointerEvents: "none"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.scaleBar
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.scaleText
  }, "100m")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.attribution,
    pointerEvents: "none"
  }, "\uC608\uC2DC \uC9C0\uB3C4 \xB7 \uC7A5\uC18C \uC815\uBCF4"), /*#__PURE__*/_react.default.createElement(_PlaceSheet.default, {
    style: styles.sheet,
    title: `주변 ${category.label} 보기`,
    categoryLabel: category.label,
    place: selected,
    emptyText: trimmed ? `'${trimmed}'에 맞는 장소가 없어요.` : `이 주변 ${category.label} 정보를 준비 중이에요.`,
    onDirections: handleDirections
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.band, {
      height: bottomBand
    }],
    pointerEvents: "none"
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  headerRow: {
    flexDirection: 'row'
  },
  // 제목 줄(eyebrow 16 + 제목 34 의 가운데)에 화살표 높이를 맞춥니다.
  backButton: {
    marginTop: 19,
    marginRight: 6
  },
  headerTexts: {
    flex: 1
  },
  eyebrow: {
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: _theme.emergencyColors.textSecondary
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: _theme.emergencyColors.text
  },
  chip: {
    height: 24,
    marginTop: -2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  chipText: {
    marginLeft: 4,
    marginRight: 4,
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.text
  },
  searchWrap: {
    marginTop: 18
  },
  tabsWrap: {
    marginTop: 16
  },
  mapArea: {
    flex: 1,
    marginTop: 14
  },
  locate: {
    position: 'absolute',
    top: 16,
    right: SCREEN_X,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: _theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2D3A',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  scale: {
    position: 'absolute',
    left: SCREEN_X,
    bottom: SHEET_BOTTOM + _PlaceSheet.PLACE_SHEET_MIN_HEIGHT + 6,
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  scaleBar: {
    width: 32,
    height: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: _theme.emergencyColors.textSecondary
  },
  scaleText: {
    marginLeft: 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: _theme.emergencyColors.textSecondary
  },
  attribution: {
    position: 'absolute',
    right: SCREEN_X,
    bottom: SHEET_BOTTOM + _PlaceSheet.PLACE_SHEET_MIN_HEIGHT + 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: _theme.emergencyColors.textSecondary
  },
  sheet: {
    position: 'absolute',
    left: SHEET_SIDE,
    right: SHEET_SIDE,
    bottom: SHEET_BOTTOM
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: _theme.emergencyColors.surface
  }
});
},
"src/components/CategoryTabs.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CategoryTabs;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 자취생존맵 상단의 카테고리 선택 (선택된 항목은 연한 초록 배경 + 초록 아이콘/글씨).
function CategoryTabs({
  categories,
  selectedId,
  onSelect
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.row
  }, categories.map(cat => {
    const active = cat.id === selectedId;
    const color = active ? _theme.emergencyColors.accent : _theme.emergencyColors.textSecondary;
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      key: cat.id,
      onPress: () => onSelect(cat.id),
      accessibilityRole: "button",
      accessibilityState: {
        selected: active
      },
      accessibilityLabel: cat.label,
      style: [styles.item, active && styles.itemActive]
    }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
      name: cat.icon,
      size: 24,
      color: color
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.label, {
        color
      }, active && styles.labelActive]
    }, cat.label));
  }));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8
  },
  item: {
    flex: 1,
    height: 66,
    borderRadius: 12,
    paddingTop: 10,
    alignItems: 'center'
  },
  itemActive: {
    backgroundColor: '#E5F4F0'
  },
  label: {
    marginTop: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16
  },
  labelActive: {
    fontFamily: _theme.fonts.bold
  }
});
},
"src/components/MapCanvas.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MapCanvas;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 예시 지도 (그림). 실제 지도 SDK 를 붙이기 전까지 디자인을 보여 주는 용도입니다.
// 좌표는 디자인 프레임(가로 400 x 세로 552) 기준이고, 프레임이 지도 영역 가운데에 오도록 놓습니다. children(핀 등)도 같은 좌표계입니다.
const FRAME_W = 400;
const FRAME_H = 552;
const BLOCK_W = 66.5;
const BLOCK_H = 69;
const COL_PITCH = 82.5;
const ROW_PITCH = 76;
const BLOCK_X0 = 4.5;
const BLOCK_Y0 = 47;
const STREET_Y0 = 40;
const STREET_H = 7;
const ROAD_CENTER = {
  x: 200,
  y: 277
};
const ROAD_ANGLE = 55;
const ROAD_LENGTH = 1400;
const ROAD_WIDTH = 28;
const range = (from, to) => Array.from({
  length: to - from + 1
}, (_, i) => from + i);
const COLS = range(-2, 6);
const ROWS = range(-2, 9);

// 한 번만 계산해 두는 블록/가로 도로 목록
const BLOCKS = ROWS.flatMap(r => COLS.map(c => ({
  key: `${r}:${c}`,
  left: BLOCK_X0 + COL_PITCH * c,
  top: BLOCK_Y0 + ROW_PITCH * r
})));
const STREETS = ROWS.map(r => ({
  key: String(r),
  top: STREET_Y0 + ROW_PITCH * r
}));
function RotatedLabel({
  cx,
  cy,
  angle,
  children
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.rotatedWrap, {
      left: cx - 50,
      top: cy - 9,
      transform: [{
        rotate: `${angle}deg`
      }]
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.labelText
  }, children));
}
function MapCanvas({
  children,
  style
}) {
  const [size, setSize] = (0, _react.useState)(null);
  const onLayout = e => {
    const {
      width,
      height
    } = e.nativeEvent.layout;
    setSize({
      width,
      height
    });
  };
  const origin = size ? {
    left: (size.width - FRAME_W) / 2,
    top: (size.height - FRAME_H) / 2
  } : null;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.container, style],
    onLayout: onLayout
  }, origin ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.frame, origin],
    pointerEvents: "box-none"
  }, STREETS.map(s => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: s.key,
    style: [styles.crossStreet, {
      top: s.top
    }]
  })), BLOCKS.map(b => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: b.key,
    style: [styles.block, {
      left: b.left,
      top: b.top
    }]
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.road, {
      transform: [{
        rotate: `${ROAD_ANGLE}deg`
      }]
    }]
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.road, {
      transform: [{
        rotate: `${-ROAD_ANGLE}deg`
      }]
    }]
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.park
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.areaLabel
  }, "\uC11C\uAD50\uB3D9"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.label, styles.parkLabel]
  }, "\uC11C\uAD50\uADFC\uB9B0\uACF5\uC6D0"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.label, {
      left: 294.5,
      top: 285
    }]
  }, "\uD64D\uC775\uB300\uD559\uAD50"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.label, {
      left: 19.5,
      top: 327
    }]
  }, "\uC11C\uAD50\uB3D9 \uC8FC\uBBFC\uC13C\uD130"), /*#__PURE__*/_react.default.createElement(RotatedLabel, {
    cx: 280,
    cy: 137.5,
    angle: 58
  }, "\uD64D\uC775\uB85C"), /*#__PURE__*/_react.default.createElement(RotatedLabel, {
    cx: 83.5,
    cy: 249.5,
    angle: -25
  }, "\uC794\uB2E4\uB9AC\uB85C"), children) : null);
}
const styles = _reactNative.StyleSheet.create({
  container: {
    backgroundColor: _theme.mapColors.street,
    overflow: 'hidden'
  },
  frame: {
    position: 'absolute',
    width: FRAME_W,
    height: FRAME_H
  },
  crossStreet: {
    position: 'absolute',
    left: -400,
    width: 1200,
    height: STREET_H,
    backgroundColor: _theme.mapColors.crossStreet
  },
  block: {
    position: 'absolute',
    width: BLOCK_W,
    height: BLOCK_H,
    borderRadius: 2,
    backgroundColor: _theme.mapColors.block
  },
  road: {
    position: 'absolute',
    left: ROAD_CENTER.x - ROAD_LENGTH / 2,
    top: ROAD_CENTER.y - ROAD_WIDTH / 2,
    width: ROAD_LENGTH,
    height: ROAD_WIDTH,
    backgroundColor: _theme.mapColors.road,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: _theme.mapColors.roadBorder
  },
  park: {
    position: 'absolute',
    left: 12,
    top: 30.5,
    width: 100,
    height: 115,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: _theme.mapColors.parkBorder,
    backgroundColor: _theme.mapColors.park
  },
  areaLabel: {
    position: 'absolute',
    left: 231.5,
    top: 37,
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 3,
    color: _theme.mapColors.areaLabel
  },
  labelText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: _theme.mapColors.label
  },
  label: {
    position: 'absolute',
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: _theme.mapColors.label
  },
  parkLabel: {
    left: 35.5,
    top: 80,
    color: _theme.mapColors.parkLabel
  },
  rotatedWrap: {
    position: 'absolute',
    width: 100,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
},
"src/components/MapPin.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserDot = UserDot;
exports.default = MapPin;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 지도 위 장소 핀 (x, y 는 핀 중심 좌표). 기본: 흰 원 + 초록 테두리 / selected: 초록 물방울 + 이름 말풍선
function MapPin({
  x,
  y,
  icon = 'silverware-fork-knife',
  label,
  selected,
  onPress
}) {
  if (!selected) {
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      onPress: onPress,
      hitSlop: 8,
      accessibilityRole: "button",
      accessibilityLabel: label,
      style: [styles.pin, {
        left: x - 16,
        top: y - 16
      }]
    }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
      name: icon,
      size: 20,
      color: _theme.emergencyColors.accent
    }));
  }
  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.bubbleWrap, {
      left: x - 100,
      top: y - 60
    }],
    pointerEvents: "none"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.bubble
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.bubbleText
  }, label))), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    accessibilityLabel: `${label} (선택됨)`,
    style: [styles.head, {
      left: x - 22,
      top: y - 22
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headInner
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: icon,
    size: 24,
    color: _theme.colors.white
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tail
  })));
}

// 내 위치 (파란 점 + 반투명 원)
function UserDot({
  x,
  y
}) {
  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.halo, {
      left: x - 32,
      top: y - 32
    }],
    pointerEvents: "none"
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.dotRing, {
      left: x - 9,
      top: y - 9
    }],
    pointerEvents: "none"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.dot
  })));
}
const shadow = {
  shadowColor: '#1F2D3A',
  shadowOffset: {
    width: 0,
    height: 2
  },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 3
};
const styles = _reactNative.StyleSheet.create({
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: _theme.emergencyColors.accent,
    backgroundColor: _theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  head: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: _theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow
  },
  headInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: _theme.emergencyColors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tail: {
    position: 'absolute',
    left: 16,
    top: 41,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: _theme.emergencyColors.accent
  },
  bubbleWrap: {
    position: 'absolute',
    width: 200,
    alignItems: 'center'
  },
  bubble: {
    height: 33,
    borderRadius: 16.5,
    paddingHorizontal: 14,
    backgroundColor: _theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow
  },
  bubbleText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.accent
  },
  halo: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: _theme.mapColors.userHalo
  },
  dotRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: _theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: _theme.mapColors.userDot
  }
});
},
"src/components/PlaceSheet.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PLACE_SHEET_MIN_HEIGHT = void 0;
exports.default = PlaceSheet;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const PLACE_SHEET_MIN_HEIGHT = exports.PLACE_SHEET_MIN_HEIGHT = 138;

// 자취생존맵 하단의 선택된 장소 카드 (place 가 없으면 emptyText 를 보여 줍니다).
function PlaceSheet({
  title,
  place,
  categoryLabel,
  emptyText,
  onPressHeader,
  onDirections,
  style
}) {
  const meta = place ? [categoryLabel, place.distance].filter(Boolean).join(' · ') : '';
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.card, style]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPressHeader,
    accessibilityRole: "button",
    accessibilityLabel: title,
    style: styles.header
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "format-list-bulleted",
    size: 18,
    color: _theme.emergencyColors.textSecondary
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.headerText
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.flex
  }), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-up",
    size: 20,
    color: _theme.emergencyColors.textSecondary
  })), place ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.row
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.name,
    numberOfLines: 1
  }, place.name), meta ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.meta
  }, meta) : null, place.address ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.address,
    numberOfLines: 1
  }, place.address) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => onDirections(place),
    accessibilityRole: "button",
    accessibilityLabel: `${place.name} 길찾기`,
    style: ({
      pressed
    }) => [styles.button, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "navigate-outline",
    size: 22,
    color: _theme.colors.white
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.buttonText
  }, "\uAE38\uCC3E\uAE30"))) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.empty
  }, emptyText));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    minHeight: PLACE_SHEET_MIN_HEIGHT,
    borderRadius: 20,
    backgroundColor: _theme.colors.white,
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 18,
    shadowColor: '#1F2D3A',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6
  },
  flex: {
    flex: 1
  },
  header: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerText: {
    marginLeft: 4,
    fontFamily: _theme.fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: _theme.emergencyColors.textSecondary
  },
  row: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  texts: {
    flex: 1,
    marginRight: 12
  },
  name: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: _theme.emergencyColors.text
  },
  meta: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.textSecondary
  },
  address: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: _theme.emergencyColors.textSecondary
  },
  button: {
    width: 68,
    height: 64,
    borderRadius: 12,
    backgroundColor: _theme.emergencyColors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.85
  },
  buttonText: {
    marginTop: 2,
    fontFamily: _theme.fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: _theme.colors.white
  },
  empty: {
    marginTop: 18,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.textSecondary
  }
});
},
"src/data/lifeInfo/survivalMap.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.survivalMapData = void 0;
// 자취생존맵 문구와 장소 데이터.
// x, y 는 디자인 프레임(가로 400 x 지도 높이 552) 기준 좌표입니다. 지도 SDK 를 붙이면 위도/경도로 바꾸세요.
// 이름이 정해지지 않은 장소는 '예시' 로 표시했습니다.

const survivalMapData = exports.survivalMapData = {
  eyebrow: '생활정보',
  title: '자취생존맵',
  location: '서교동 · 내 주변',
  searchPlaceholder: '동네나 장소를 검색해 보세요',
  userLocation: {
    x: 147,
    y: 319
  },
  categories: [{
    id: 'food',
    label: '음식점',
    icon: 'silverware-fork-knife'
  }, {
    id: 'mart',
    label: '마트',
    icon: 'cart-outline'
  }, {
    id: 'hospital',
    label: '병원',
    icon: 'hospital-building'
  }, {
    id: 'laundry',
    label: '세탁소',
    icon: 'tshirt-crew-outline'
  }, {
    id: 'pharmacy',
    label: '약국',
    icon: 'pill'
  }],
  // 카테고리 id -> 장소 목록. 디자인에는 음식점만 있어서 나머지는 비어 있습니다.
  places: {
    food: [{
      id: 'seogyo-hankki',
      name: '서교한끼',
      distance: '240m',
      address: '서울 마포구 잔다리로 24',
      x: 244,
      y: 228
    }, {
      id: 'food-sample-1',
      name: '음식점 예시 1',
      distance: '',
      address: '',
      x: 175,
      y: 99
    }, {
      id: 'food-sample-2',
      name: '음식점 예시 2',
      distance: '',
      address: '',
      x: 70,
      y: 208
    }, {
      id: 'food-sample-3',
      name: '음식점 예시 3',
      distance: '',
      address: '',
      x: 341,
      y: 350
    }],
    mart: [],
    hospital: [],
    laundry: [],
    pharmacy: []
  }
};
},
"src/screens/MoreScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MoreScreen;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _ScreenHeader = _interopRequireDefault(__load("src/components/ScreenHeader.js"));
var _SectionTitle = _interopRequireDefault(__load("src/components/SectionTitle.js"));
var _MenuRow = _interopRequireDefault(__load("src/components/MenuRow.js"));
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _TabBar = __load("src/components/TabBar.js");
var _more = __load("src/data/more/more.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// 메뉴 id -> 이동할 화면 이름
const MENU_ROUTES = {
  profile: 'Profile',
  settings: 'Settings',
  help: 'Help'
};
function MoreScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    subtitle,
    accountSection,
    accountMenus,
    logoutLabel,
    lifeData,
    appSection,
    appMenus
  } = _more.moreData;
  const openMenu = id => {
    const screen = MENU_ROUTES[id];
    if (screen) navigation.navigate(screen);
  };

  // TODO: 인증을 붙이면 확인 후 실제 로그아웃 처리를 연결하세요.
  const handleLogout = () => {
    _reactNative.Alert.alert('로그아웃할까요?', '', [{
      text: '취소',
      style: 'cancel'
    }, {
      text: '로그아웃',
      style: 'destructive',
      onPress: () => {}
    }]);
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: _TabBar.TAB_BAR_HEIGHT + insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_ScreenHeader.default, {
    title: "\uB354\uBCF4\uAE30",
    subtitle: subtitle
  }), /*#__PURE__*/_react.default.createElement(_SectionTitle.default, {
    style: styles.sectionTitle
  }, accountSection), accountMenus.map(menu => /*#__PURE__*/_react.default.createElement(_MenuRow.default, _extends({
    key: menu.id
  }, menu, {
    onPress: () => openMenu(menu.id)
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: handleLogout,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.logoutRow, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.logoutText
  }, logoutLabel), /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "logout",
    size: 20,
    color: _theme.colors.textSecondary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => {},
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.lifeCard, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: lifeData.icon,
    size: 44,
    iconColor: _theme.colors.green,
    backgroundColor: _theme.colors.badgeBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.lifeTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.lifeTitle
  }, lifeData.title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.lifeDescription
  }, lifeData.description)), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 20,
    color: _theme.colors.green
  })), /*#__PURE__*/_react.default.createElement(_SectionTitle.default, {
    style: [styles.sectionTitle, styles.sectionAfterCard]
  }, appSection), appMenus.map(menu => /*#__PURE__*/_react.default.createElement(_MenuRow.default, _extends({
    key: menu.id
  }, menu, {
    onPress: () => openMenu(menu.id)
  })))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 12
  },
  sectionAfterCard: {
    marginTop: 30
  },
  pressed: {
    opacity: 0.75
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // 아이콘 박스(42) + 간격(16) 만큼 들여써서 위 메뉴의 글자와 줄을 맞춥니다.
    paddingLeft: 58,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 20
  },
  logoutText: {
    marginRight: 8,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  lifeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: _theme.colors.heroBg,
    borderRadius: _theme.radius.card,
    paddingHorizontal: 22,
    paddingVertical: 24
  },
  lifeTexts: {
    flex: 1,
    marginLeft: 16
  },
  lifeTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  lifeDescription: {
    marginTop: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.colors.textSecondary
  }
});
},
"src/data/more/more.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.moreData = void 0;
// 더보기 화면 문구/메뉴. icon 은 MaterialCommunityIcons 이름입니다.

const moreData = exports.moreData = {
  subtitle: '내 계정과 생활 정보를 한곳에서 관리해요.',
  accountSection: '계정 관리',
  accountMenus: [{
    id: 'profile',
    title: '개인정보 관리',
    description: '계정의 개인정보를 확인하고 수정해요.',
    icon: 'account-outline'
  }],
  logoutLabel: '로그아웃',
  lifeData: {
    title: '생활 데이터 수정',
    description: '생활 기본 정보를\n확인하고 수정해요.',
    icon: 'tune-variant'
  },
  appSection: '앱 이용 안내',
  appMenus: [{
    id: 'settings',
    title: '앱 설정',
    description: '알림과 앱 이용 환경을 설정해요.',
    icon: 'cog-outline'
  }, {
    id: 'help',
    title: '도움말',
    description: '이용 방법을 확인하고 문의해요.',
    icon: 'help-circle-outline'
  }]
};
},
"src/screens/ManualEntryScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ManualEntryScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _FormField = _interopRequireDefault(__load("src/components/FormField.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _DatePickerSheet = _interopRequireDefault(__load("src/components/DatePickerSheet.js"));
var _PurchaseItemCard = _interopRequireDefault(__load("src/components/PurchaseItemCard.js"));
var _AddItemButton = _interopRequireDefault(__load("src/components/AddItemButton.js"));
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _purchaseItems = __load("src/utils/purchaseItems.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function ManualEntryScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    addTransaction,
    addFridgeItem
  } = (0, _AppDataContext.useAppData)();
  const scrollRef = (0, _react.useRef)(null);
  const nextKey = (0, _react.useRef)(2); // 품목 카드를 구분하는 번호 (첫 카드는 1)

  const [storeName, setStoreName] = (0, _react.useState)('');
  const [date, setDate] = (0, _react.useState)(new Date());
  const [items, setItems] = (0, _react.useState)([(0, _purchaseItems.createEmptyItem)(1)]);
  // 열려 있는 날짜 시트가 다루는 칸: null(닫힘) | 'purchase'(구매일) | 품목 key(그 품목의 유통기한)
  const [dateTarget, setDateTarget] = (0, _react.useState)(null);
  const dateStr = (0, _format.toDateString)(date);
  const total = (0, _purchaseItems.sumItems)(items);
  const fridgeCount = (0, _purchaseItems.countFridgeItems)(items);
  const updateItem = (key, patch) => {
    // 식품을 처음 체크하면 유통기한을 구매일 + 14일로 미리 채워 줍니다.
    setItems(prev => prev.map(it => it.key === key ? (0, _purchaseItems.applyItemPatch)(it, patch, dateStr) : it));
  };
  const addItem = () => {
    setItems(prev => [...prev, (0, _purchaseItems.createEmptyItem)(nextKey.current++)]);
    (0, _purchaseItems.scrollToEndSoon)(scrollRef);
  };
  const removeItem = key => setItems(prev => prev.filter(it => it.key !== key));
  const openDateSheet = target => {
    _reactNative.Keyboard.dismiss();
    setDateTarget(target);
  };

  // 날짜 시트가 지금 다루는 값
  const sheet = dateTarget === 'purchase' || dateTarget === null ? {
    value: date,
    onChange: setDate,
    minimumDate: undefined,
    maximumDate: new Date()
  } : {
    value: (0, _format.fromDateString)(items.find(it => it.key === dateTarget)?.expiry ?? dateStr),
    onChange: picked => updateItem(dateTarget, {
      expiry: (0, _format.toDateString)(picked)
    }),
    minimumDate: date,
    maximumDate: undefined
  };
  const handleSave = () => {
    if (!storeName.trim()) {
      _reactNative.Alert.alert('입력을 확인해 주세요', '산 곳의 이름을 입력해 주세요.');
      return;
    }
    const itemsError = (0, _purchaseItems.validateItems)(items, dateStr);
    if (itemsError) {
      _reactNative.Alert.alert('입력을 확인해 주세요', itemsError);
      return;
    }

    // 소비 내역 한 줄 + 구매 품목을 저장합니다 (형식: data/spending/spending.js 의 items).
    // 지금은 AppDataContext(메모리)에 저장됩니다. Firebase 연결은 그 파일에서 바꾸세요.
    addTransaction({
      title: storeName.trim(),
      amount: total,
      date: dateStr,
      source: 'manual',
      items: (0, _purchaseItems.toSavedItems)(items, (it, index) => `m${index + 1}`)
    });

    // 식품으로 체크한 품목은 냉장고에도 담습니다.
    (0, _purchaseItems.addCheckedItemsToFridge)(items, dateStr, addFridgeItem);
    navigation.goBack();
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.container,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    ref: scrollRef,
    keyboardShouldPersistTaps: "handled",
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingHorizontal: _theme.spacing.screenX,
      paddingBottom: 24
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.titleRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => navigation.goBack(),
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uB4A4\uB85C \uAC00\uAE30"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-back",
    size: 28,
    color: _theme.colors.textPrimary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, "\uC9C1\uC811 \uC785\uB825")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subtitle
  }, "\uC0B0 \uACF3\uACFC \uAD6C\uB9E4 \uD488\uBAA9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: "\uC774\uB984",
    value: storeName,
    onChangeText: setStoreName,
    placeholder: "\uC608: \uC774\uB9C8\uD2B8, \uC2A4\uD0C0\uBC85\uC2A4, \uC628\uB77C\uC778 \uC8FC\uBB38",
    maxLength: 30,
    marginTop: 18
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: "\uAD6C\uB9E4\uC77C",
    value: (0, _format.formatDotDate)(dateStr),
    placeholder: "\uB0A0\uC9DC \uC120\uD0DD",
    rightIcon: "calendar-month-outline",
    onPress: () => openDateSheet('purchase'),
    marginTop: 18
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, "\uAD6C\uB9E4 \uD488\uBAA9"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionHint
  }, "\uC2DD\uD488\uC740 \uCCB4\uD06C\uD558\uBA74 \uB0C9\uC7A5\uACE0\uC5D0 \uB2F4\uACA8\uC694")), items.map(item => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: item.key,
    style: styles.cardGap
  }, /*#__PURE__*/_react.default.createElement(_PurchaseItemCard.default, {
    item: item,
    canRemove: items.length > 1,
    onChange: patch => updateItem(item.key, patch),
    onRemove: () => removeItem(item.key),
    onPressExpiry: () => openDateSheet(item.key)
  }))), /*#__PURE__*/_react.default.createElement(_AddItemButton.default, {
    label: "\uD488\uBAA9 \uCD94\uAC00",
    onPress: addItem
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.footer, {
      paddingBottom: insets.bottom + 14
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.totalRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalLabel
  }, "\uCD1D \uC9C0\uCD9C"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalAmount
  }, (0, _format.formatNumber)(total), "\uC6D0")), /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: fridgeCount > 0 ? `추가하고 냉장고에 ${fridgeCount}개 담기` : '추가하기',
    onPress: handleSave
  })), /*#__PURE__*/_react.default.createElement(_DatePickerSheet.default, {
    visible: dateTarget !== null,
    value: sheet.value,
    minimumDate: sheet.minimumDate,
    maximumDate: sheet.maximumDate,
    onChange: sheet.onChange,
    onClose: () => setDateTarget(null)
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    marginLeft: 8,
    fontFamily: _theme.fonts.bold,
    fontSize: 24,
    color: _theme.colors.textPrimary
  },
  subtitle: {
    marginTop: 14,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  sectionHint: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  cardGap: {
    marginBottom: 12
  },
  footer: {
    paddingTop: 14,
    paddingHorizontal: _theme.spacing.screenX,
    backgroundColor: _theme.colors.background,
    borderTopWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderTopColor: _theme.colors.divider
  },
  totalRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  totalLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  totalAmount: {
    fontFamily: _theme.fonts.bold,
    fontSize: 24,
    color: _theme.colors.textPrimary
  }
});
},
"src/components/FormField.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FormField;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 라벨 + 입력 상자. onPress 를 주면 눌러서 값을 고르는 칸(예: 날짜)이 되고, 이때 value 는 보여줄 글자입니다.
// suffix(오른쪽 글자), rightIcon(MaterialCommunityIcons 이름), hint(아래 안내), editable(false 면 읽기 전용), marginTop(기본 28)
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  suffix,
  rightIcon,
  onPress,
  hint,
  editable = true,
  marginTop = 28
}) {
  const box = /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.box
  }, onPress ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.text, !value && styles.placeholderText],
    numberOfLines: 1
  }, value || placeholder) : /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    style: [styles.input, !editable && styles.inputDisabled],
    editable: editable,
    value: value,
    onChangeText: onChangeText,
    placeholder: placeholder,
    placeholderTextColor: _theme.colors.placeholder,
    keyboardType: keyboardType,
    maxLength: maxLength,
    accessibilityLabel: label
  }), suffix ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.suffix
  }, suffix) : null, rightIcon ? /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: rightIcon,
    size: 26,
    color: _theme.colors.tabInactive
  }) : null);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.wrapper, {
      marginTop
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), onPress ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    accessibilityLabel: label
  }, box) : box, hint ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.hint
  }, hint) : null);
}
const styles = _reactNative.StyleSheet.create({
  wrapper: {
    marginTop: 28
  },
  label: {
    marginBottom: 10,
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  box: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: _theme.colors.cardBg,
    borderRadius: 20,
    paddingHorizontal: 18
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  inputDisabled: {
    color: _theme.colors.textSecondary
  },
  text: {
    flex: 1,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  placeholderText: {
    color: _theme.colors.placeholder
  },
  suffix: {
    marginLeft: 8,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  hint: {
    marginTop: 8,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/PrimaryButton.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PrimaryButton;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 진한 초록색 가로 전체 버튼 ("저장하기", "선택 완료" 등)
function PrimaryButton({
  label,
  onPress,
  style
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.button, pressed && styles.pressed, style]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label));
}
const styles = _reactNative.StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: _theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.85
  },
  label: {
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.white
  }
});
},
"src/components/DatePickerSheet.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DatePickerSheet;
var _react = _interopRequireDefault(__load("react"));
var _BottomSheet = _interopRequireDefault(__load("src/components/BottomSheet.js"));
var _CalendarPicker = _interopRequireDefault(__load("src/components/CalendarPicker.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _reactNative = __load("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 날짜를 고르는 하단 시트 (CalendarPicker 사용). onChange(date): 날짜를 누를 때마다, onClose: "선택 완료"/닫을 때
function DatePickerSheet({
  visible,
  value,
  minimumDate,
  maximumDate,
  onChange,
  onClose
}) {
  return /*#__PURE__*/_react.default.createElement(_BottomSheet.default, {
    visible: visible,
    onClose: onClose,
    title: "\uB0A0\uC9DC \uC120\uD0DD"
  }, /*#__PURE__*/_react.default.createElement(_CalendarPicker.default, {
    value: value,
    onChange: onChange,
    minimumDate: minimumDate,
    maximumDate: maximumDate
  }), /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: "\uC120\uD0DD \uC644\uB8CC",
    onPress: onClose,
    style: styles.button
  }));
}
const styles = _reactNative.StyleSheet.create({
  button: {
    marginTop: 16
  }
});
},
"src/components/CalendarPicker.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CalendarPicker;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
var _format = __load("src/utils/format.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 직접 그린 월 달력 (기기와 상관없이 똑같이 보임). onChange(date): 날짜를 눌렀을 때
// minimumDate / maximumDate: 선택 가능한 범위 (범위 밖은 흐리게 표시)
function CalendarPicker({
  value,
  onChange,
  minimumDate,
  maximumDate
}) {
  const [view, setView] = (0, _react.useState)({
    year: value.getFullYear(),
    month: value.getMonth()
  }); // month: 0~11

  const selectedStr = (0, _format.toDateString)(value);
  const todayStr = (0, _format.toDateString)(new Date());
  const minStr = minimumDate ? (0, _format.toDateString)(minimumDate) : null;
  const maxStr = maximumDate ? (0, _format.toDateString)(maximumDate) : null;
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  // 앞쪽 빈칸 + 날짜들 + 뒤쪽 빈칸(7의 배수로 맞춤)
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({
    length: daysInMonth
  }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const dateStrOf = day => `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const moveMonth = delta => {
    setView(({
      year,
      month
    }) => {
      const index = year * 12 + month + delta;
      return {
        year: Math.floor(index / 12),
        month: index % 12
      };
    });
  };

  // 이전/다음 달에 선택 가능한 날짜가 하나도 없으면 화살표를 막습니다.
  const prevDisabled = minStr ? `${view.year}-${String(view.month + 1).padStart(2, '0')}-01` <= minStr : false;
  const nextDisabled = maxStr ? dateStrOf(daysInMonth) >= maxStr : false;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.header
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => moveMonth(-1),
    disabled: prevDisabled,
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uC774\uC804 \uB2EC"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-back",
    size: 24,
    color: prevDisabled ? _theme.colors.checkboxBorder : _theme.colors.textPrimary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.monthTitle
  }, view.year, "\uB144 ", view.month + 1, "\uC6D4"), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => moveMonth(1),
    disabled: nextDisabled,
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uB2E4\uC74C \uB2EC"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-forward",
    size: 24,
    color: nextDisabled ? _theme.colors.checkboxBorder : _theme.colors.textPrimary
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.week
  }, WEEKDAYS.map(w => /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    key: w,
    style: styles.weekday
  }, w))), weeks.map((week, wi) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: wi,
    style: styles.week
  }, week.map((day, di) => {
    if (!day) return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: di,
      style: styles.cell
    });
    const str = dateStrOf(day);
    const disabled = minStr && str < minStr || maxStr && str > maxStr;
    const selected = str === selectedStr;
    const isToday = str === todayStr;
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: di,
      style: styles.cell
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      disabled: disabled,
      onPress: () => onChange(new Date(view.year, view.month, day)),
      accessibilityRole: "button",
      accessibilityState: {
        selected,
        disabled: !!disabled
      },
      accessibilityLabel: `${view.month + 1}월 ${day}일`,
      style: [styles.day, selected && styles.daySelected]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.dayText, isToday && styles.dayToday, selected && styles.dayTextSelected, disabled && styles.dayDisabled]
    }, day)));
  }))));
}
const CELL_HEIGHT = 46;
const styles = _reactNative.StyleSheet.create({
  container: {
    width: '100%'
  },
  header: {
    marginBottom: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  monthTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  week: {
    flexDirection: 'row'
  },
  weekday: {
    flex: 1,
    height: 32,
    textAlign: 'center',
    fontFamily: _theme.fonts.medium,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  daySelected: {
    backgroundColor: _theme.colors.green
  },
  dayText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  dayToday: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  },
  dayTextSelected: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.white
  },
  dayDisabled: {
    color: _theme.colors.checkboxBorder
  }
});
},
"src/components/PurchaseItemCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PurchaseItemCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
var _format = __load("src/utils/format.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

// 구매 품목 카드 한 장. 줄 1: 품목명(+삭제) / 줄 2: 수량 · 가격 · 식품 체크 / 줄 3(식품일 때만): 유통기한
// item: { name, quantity, price, inFridge, expiry }, canRemove: 품목이 2개 이상일 때만 삭제 버튼,
// onChange(patch): 바뀐 값만 전달, onPressExpiry: 유통기한 칸을 눌렀을 때 (날짜 시트용),
// showFridge: false 면 식품 체크와 유통기한 줄을 숨김 (이미 저장된 지출을 고칠 때)
function PurchaseItemCard({
  item,
  canRemove,
  onChange,
  onRemove,
  onPressExpiry,
  showFridge = true
}) {
  const {
    name,
    quantity,
    price,
    inFridge,
    expiry
  } = item;
  const handlePrice = text => onChange({
    price: text.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 8)
  });
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.card
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.nameRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.box, styles.nameBox]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    style: styles.input,
    value: name,
    onChangeText: text => onChange({
      name: text
    }),
    placeholder: "\uD488\uBAA9\uBA85 (\uC608: \uC6B0\uC720 1L)",
    placeholderTextColor: _theme.colors.placeholder,
    maxLength: 30,
    accessibilityLabel: "\uD488\uBAA9\uBA85"
  })), canRemove ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onRemove,
    hitSlop: 10,
    accessibilityRole: "button",
    accessibilityLabel: "\uD488\uBAA9 \uC0AD\uC81C",
    style: styles.removeButton
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "close",
    size: 26,
    color: _theme.colors.textSecondary
  })) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.optionRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.box, styles.stepper]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => onChange({
      quantity: Math.max(MIN_QUANTITY, quantity - 1)
    }),
    hitSlop: 8,
    accessibilityRole: "button",
    accessibilityLabel: "\uC218\uB7C9 \uC904\uC774\uAE30"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "minus",
    size: 22,
    color: _theme.colors.textSecondary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.quantity
  }, quantity), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => onChange({
      quantity: Math.min(MAX_QUANTITY, quantity + 1)
    }),
    hitSlop: 8,
    accessibilityRole: "button",
    accessibilityLabel: "\uC218\uB7C9 \uB298\uB9AC\uAE30"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "plus",
    size: 22,
    color: _theme.colors.green
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.box, styles.priceBox]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    style: [styles.input, styles.priceInput, !price && styles.priceEmpty],
    value: price ? (0, _format.formatNumber)(price) : '',
    onChangeText: handlePrice,
    placeholder: "\uAC00\uACA9",
    placeholderTextColor: _theme.colors.placeholder,
    keyboardType: "number-pad",
    accessibilityLabel: "1\uAC1C \uAC00\uACA9"
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.won
  }, "\uC6D0")), showFridge ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => onChange({
      inFridge: !inFridge
    }),
    accessibilityRole: "checkbox",
    accessibilityState: {
      checked: inFridge
    },
    accessibilityLabel: "\uC2DD\uD488 (\uCCB4\uD06C\uD558\uBA74 \uB0C9\uC7A5\uACE0\uC5D0 \uB2F4\uACA8\uC694)",
    style: [styles.box, styles.foodChip, inFridge && styles.foodChipOn]
  }, inFridge ? /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "checkmark",
    size: 22,
    color: _theme.colors.green
  }) : /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "fridge-outline",
    size: 22,
    color: _theme.colors.textSecondary
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.foodText, inFridge && styles.foodTextOn]
  }, "\uC2DD\uD488")) : null), showFridge && inFridge ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.expiryRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.expiryLabel
  }, "\uC720\uD1B5\uAE30\uD55C"), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPressExpiry,
    accessibilityRole: "button",
    accessibilityLabel: "\uC720\uD1B5\uAE30\uD55C \uC120\uD0DD",
    style: [styles.box, styles.expiryBox]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.expiryText, !expiry && styles.expiryPlaceholder]
  }, expiry ? (0, _format.formatDotDate)(expiry) : '날짜 선택'), /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "calendar-month-outline",
    size: 24,
    color: _theme.colors.green
  }))) : null);
}
const styles = _reactNative.StyleSheet.create({
  card: {
    backgroundColor: _theme.colors.cardBg,
    borderRadius: 24,
    padding: 14
  },
  // 흰 바탕 + 연한 테두리의 둥근 입력 상자 (카드 안의 모든 칸에 공통)
  box: {
    height: 47,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.white,
    flexDirection: 'row',
    alignItems: 'center'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  nameBox: {
    flex: 1,
    paddingHorizontal: 14
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  removeButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8
  },
  stepper: {
    width: 102,
    paddingHorizontal: 10,
    justifyContent: 'space-between'
  },
  quantity: {
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  priceBox: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 8
  },
  priceInput: {
    textAlign: 'right'
  },
  priceEmpty: {
    textAlign: 'left'
  },
  won: {
    marginLeft: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  foodChip: {
    width: 76,
    justifyContent: 'center',
    gap: 3
  },
  foodChipOn: {
    borderWidth: 1.5,
    borderColor: _theme.colors.green,
    backgroundColor: _theme.colors.tabActiveBg
  },
  foodText: {
    fontFamily: _theme.fonts.medium,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  foodTextOn: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  },
  expiryRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  expiryLabel: {
    width: 80,
    fontFamily: _theme.fonts.medium,
    fontSize: 15,
    color: _theme.colors.green
  },
  expiryBox: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: _theme.colors.green
  },
  expiryText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  expiryPlaceholder: {
    color: _theme.colors.placeholder
  }
});
},
"src/components/AddItemButton.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AddItemButton;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// "+ 품목 추가" 버튼 (여러 화면 공통)
function AddItemButton({
  label,
  onPress,
  style
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.button, pressed && styles.pressed, style]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "plus",
    size: 24,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label));
}
const styles = _reactNative.StyleSheet.create({
  button: {
    height: 46,
    borderRadius: 23,
    backgroundColor: _theme.colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressed: {
    opacity: 0.75
  },
  label: {
    marginLeft: 8,
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.green
  }
});
},
"src/utils/purchaseItems.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateItems = exports.validateItemFields = exports.toSavedItems = exports.sumItems = exports.scrollToEndSoon = exports.createEmptyItem = exports.countItems = exports.countFridgeItems = exports.applyItemPatch = exports.addCheckedItemsToFridge = exports.FRIDGE_UNIT = exports.DEFAULT_EXPIRY_DAYS = void 0;
var _format = __load("src/utils/format.js");
// 직접 입력 / 영수증 결과 / 지출 상세 화면이 함께 쓰는 "구매 품목" 계산 모음.
// 품목(item): { key, name, quantity(숫자), price("2800" 처럼 숫자만 담은 글자), inFridge, expiry("YYYY-MM-DD" | null) }

// 식품 품목의 유통기한 기본값 (구매일로부터 며칠 뒤)
const DEFAULT_EXPIRY_DAYS = exports.DEFAULT_EXPIRY_DAYS = 14;
// 냉장고에 담을 때 쓰는 수량 단위 ("개"로 고정)
const FRIDGE_UNIT = exports.FRIDGE_UNIT = '개';
const createEmptyItem = key => ({
  key,
  name: '',
  quantity: 1,
  price: '',
  inFridge: false,
  expiry: null
});

// 품목에 바뀐 값(patch)을 적용합니다. 식품을 처음 체크하면 유통기한을 기본값으로 채웁니다.
exports.createEmptyItem = createEmptyItem;
const applyItemPatch = (item, patch, purchaseDate) => {
  const next = {
    ...item,
    ...patch
  };
  if (patch.inFridge && !next.expiry) next.expiry = (0, _format.addDays)(purchaseDate, DEFAULT_EXPIRY_DAYS);
  return next;
};

// 품목 합계 금액 (가격 x 수량). 잘못된 값은 0 으로 칩니다.
exports.applyItemPatch = applyItemPatch;
const sumItems = items => items.reduce((sum, it) => sum + (0, _format.parseAmount)(it.price) * (Number(it.quantity) || 0), 0);
exports.sumItems = sumItems;
const countItems = items => items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
exports.countItems = countItems;
const countFridgeItems = items => items.filter(it => it.inFridge).length;

// 이름/가격 입력 확인. 문제가 있으면 안내 글을, 괜찮으면 null 을 돌려줍니다.
exports.countFridgeItems = countFridgeItems;
const validateItemFields = items => items.some(it => !it.name.trim() || (0, _format.parseAmount)(it.price) === 0) ? '모든 품목의 이름과 가격을 입력해 주세요.' : null;

// 이름/가격 + 유통기한(구매일과 같거나 이후) 입력 확인
exports.validateItemFields = validateItemFields;
const validateItems = (items, purchaseDate) => {
  const fieldError = validateItemFields(items);
  if (fieldError) return fieldError;
  if (items.some(it => it.inFridge && it.expiry < purchaseDate)) {
    return '유통기한은 구매일과 같거나 이후여야 해요.';
  }
  return null;
};

// 화면의 품목 -> 저장할 품목 (id 는 기본이 key, getId 로 바꿀 수 있음)
exports.validateItems = validateItems;
const toSavedItems = (items, getId = it => it.key) => items.map((it, index) => ({
  id: getId(it, index),
  name: it.name.trim(),
  unitPrice: (0, _format.parseAmount)(it.price),
  quantity: it.quantity,
  inFridge: it.inFridge
}));
exports.toSavedItems = toSavedItems;
const addCheckedItemsToFridge = (items, purchaseDate, addFridgeItem) => {
  items.filter(it => it.inFridge).forEach(it => addFridgeItem({
    name: it.name.trim(),
    quantity: it.quantity,
    unit: FRIDGE_UNIT,
    purchaseDate,
    expiry: it.expiry
  }));
};

// 품목 추가 직후 맨 아래로 스크롤 (새 카드가 그려진 뒤 움직이도록 잠깐 대기)
exports.addCheckedItemsToFridge = addCheckedItemsToFridge;
const scrollToEndSoon = scrollRef => {
  setTimeout(() => scrollRef.current?.scrollToEnd({
    animated: true
  }), 80);
};
exports.scrollToEndSoon = scrollToEndSoon;
},
"src/screens/FridgeAddScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FridgeAddScreen;
var _IngredientSuggestions = _interopRequireDefault(__load("module3/components/IngredientSuggestions.js"));
var _foodUnits = __load("module3/domain/foodUnits.mjs");
var _AppProvider = __load("module3/state/AppProvider.js");
var _inventoryFields = __load("module3/domain/inventoryFields.mjs");
var _router = __load("integration/router.js");
var _ReferenceNotice = _interopRequireDefault(__load("module3/components/ReferenceNotice.js"));
var _ActionMenu = _interopRequireDefault(__load("src/components/ActionMenu.js"));
var _Chip = _interopRequireDefault(__load("src/components/Chip.js"));
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _FormField = _interopRequireDefault(__load("src/components/FormField.js"));
var _QuantityField = _interopRequireDefault(__load("src/components/QuantityField.js"));
var _UnitPickerSheet = _interopRequireDefault(__load("src/components/UnitPickerSheet.js"));
var _DatePickerSheet = _interopRequireDefault(__load("src/components/DatePickerSheet.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _fridge = __load("src/data/fridge/fridge.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// "1개 · 1L" 같은 예전 형식의 글자에서 수량 숫자와 단위를 뽑아냅니다. (amount / unit 이 없는 항목용)
function parseQuantity(text = '') {
  const m = String(text).match(/^\s*(\d+(?:\.\d+)?)\s*([^\s·]+)?/);
  return {
    amount: m ? m[1] : '',
    unit: m?.[2] ?? null
  };
}

// 식재료 추가 / 수정 화면. navigate('FridgeAdd') 는 추가, navigate('FridgeAdd', { id }) 는 그 식재료를 불러와 수정합니다 (삭제 버튼도 보임).
function FridgeAddScreen({
  navigation,
  route
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    unitOptions
  } = _fridge.fridgeData;
  const {
    state,
    saveItem,
    deleteItem
  } = (0, _AppProvider.useApp)();
  const lock = (0, _react.useRef)(false);
  const [busy, setBusy] = (0, _react.useState)(false);
  const [error, setError] = (0, _react.useState)('');
  const [confirmDelete, setConfirmDelete] = (0, _react.useState)(false);
  const editId = route.params?.id;
  const isEdit = !!editId;
  const existing = isEdit ? state.inventory.find(i => i.id === editId) : undefined;
  const parsed = existing ? parseQuantity(existing.quantity) : null;
  const [manualUnit, setManualUnit] = (0, _react.useState)(!!existing);
  const [name, setName] = (0, _react.useState)(existing?.name ?? '');
  const [quantity, setQuantity] = (0, _react.useState)(existing ? String(existing.quantity) : '' // 숫자와 소수점만 저장합니다.
  );
  const [unit, setUnit] = (0, _react.useState)(existing ? existing.unit ?? parsed.unit : null);
  const [purchaseDate, setPurchaseDate] = (0, _react.useState)(existing?.purchasedAt ? (0, _format.fromDateString)(existing.purchasedAt) : null // 선택 전에는 null (칸에 YYYY.MM.DD 표시)
  );
  // 더미 데이터는 expiry 대신 "오늘로부터 며칠 뒤(daysFromToday)"만 있어서 날짜로 바꿔 줍니다.
  const [expiryDate, setExpiryDate] = (0, _react.useState)(existing?.expiresAt ? (0, _format.fromDateString)(existing.expiresAt) : null);
  const [storageMethod, setStorageMethod] = (0, _react.useState)(existing?.storageMethod || '');
  const [dateType, setDateType] = (0, _react.useState)(existing?.dateType || '');
  const [remainingCost, setRemainingCost] = (0, _react.useState)(existing?.remainingCost == null ? '' : String(existing.remainingCost));
  const [extra, setExtra] = (0, _react.useState)(false);
  const [unitSheetVisible, setUnitSheetVisible] = (0, _react.useState)(false);
  const [dateSheetVisible, setDateSheetVisible] = (0, _react.useState)(false);
  const [activeTarget, setActiveTarget] = (0, _react.useState)('purchase'); // 날짜 시트가 다루는 칸: 'purchase' | 'expiry'

  const handleQuantityChange = text => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const [integer, ...rest] = cleaned.split('.');
    setQuantity(rest.length ? `${integer}.${rest.join('')}` : integer);
  };

  // 칸마다 값/저장 함수/선택 범위가 다릅니다 (구매일은 오늘까지, 유통기한은 구매일 이후만).
  const getDateConfig = target => target === 'purchase' ? {
    value: purchaseDate,
    setValue: setPurchaseDate,
    minimumDate: undefined,
    maximumDate: new Date()
  } : {
    value: expiryDate,
    setValue: setExpiryDate,
    minimumDate: purchaseDate ?? undefined,
    maximumDate: undefined
  };
  const openDatePicker = target => {
    _reactNative.Keyboard.dismiss();
    const {
      value,
      setValue
    } = getDateConfig(target);
    // 아직 고른 날짜가 없으면 시트에 보이는 날짜(오늘)를 먼저 채워 둡니다.
    if (!value) setValue(new Date());
    setActiveTarget(target);
    setDateSheetVisible(true);
  };
  const openUnitSheet = () => {
    _reactNative.Keyboard.dismiss();
    setUnitSheetVisible(true);
  };
  const handleSelectUnit = selected => {
    setManualUnit(true);
    setUnit(selected);
    setUnitSheetVisible(false);
  };
  const handleSave = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const draft = {
        ...(0, _inventoryFields.inventoryDraft)(existing),
        name,
        quantity,
        unit: unit || '',
        purchasedAt: purchaseDate ? (0, _format.toDateString)(purchaseDate) : '',
        expiresAt: expiryDate ? (0, _format.toDateString)(expiryDate) : '',
        storageMethod,
        dateType,
        remainingCost
      };
      await saveItem((0, _inventoryFields.inventoryRecord)(draft, editId || (0, _AppProvider.newId)(), existing));
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const handleDelete = async () => {
    if (lock.current) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await deleteItem(editId);
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const sheet = getDateConfig(activeTarget);
  return /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.container,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    keyboardShouldPersistTaps: "handled",
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingHorizontal: _theme.spacing.screenX,
      paddingBottom: 24
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.titleRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => navigation.goBack(),
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uB4A4\uB85C \uAC00\uAE30"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-back",
    size: 28,
    color: _theme.colors.textPrimary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, isEdit ? '식재료 수정' : '식재료 추가'), isEdit ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: handleDelete,
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uC2DD\uC7AC\uB8CC \uC0AD\uC81C",
    style: styles.deleteButton
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "trash-outline",
    size: 24,
    color: _theme.colors.textSecondary
  })) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subtitle
  }, isEdit ? '식재료 정보를 수정해 주세요.' : '냉장고에 보관할 식재료 정보를 입력해 주세요.'), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: "\uC2DD\uC7AC\uB8CC \uC774\uB984",
    value: name,
    onChangeText: value => {
      setName(value);
      if (!manualUnit) setUnit((0, _foodUnits.foodUnit)(value)?.unit || null);
    },
    placeholder: "\uC608: \uC6B0\uC720, \uB2EC\uAC40, \uB450\uBD80",
    maxLength: 30
  }), /*#__PURE__*/_react.default.createElement(_IngredientSuggestions.default, {
    value: name,
    onSelect: i => {
      setName(i.name);
      if (!manualUnit) setUnit(i.unit);
    }
  }), /*#__PURE__*/_react.default.createElement(_QuantityField.default, {
    label: "\uC218\uB7C9",
    value: quantity,
    onChangeText: handleQuantityChange,
    placeholder: "\uC218\uB7C9 \uC785\uB825",
    unit: unit,
    onPressUnit: openUnitSheet,
    hint: "\uC608: \uB2EC\uAC40 6\uAC1C \xB7 \uC2DC\uAE08\uCE58 1\uBD09 \xB7 \uB450\uBD80 1\uBAA8"
  }), (0, _foodUnits.foodUnit)(name) && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      marginTop: 12,
      gap: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: _theme.colors.textSecondary
    }
  }, "\uB808\uC2DC\uD53C \uAE30\uC900: ", (0, _foodUnits.foodUnit)(name).name, " \xB7 ", (0, _foodUnits.foodUnit)(name).unit, unit !== (0, _foodUnits.foodUnit)(name).unit ? ' / 현재 단위와 달라 재고 비교가 안 될 수 있어요.' : ''), unit !== (0, _foodUnits.foodUnit)(name).unit && /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    accessibilityRole: "button",
    onPress: () => {
      setUnit((0, _foodUnits.foodUnit)(name).unit);
      setManualUnit(true);
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: _theme.colors.green,
      fontWeight: '700'
    }
  }, "\uC218\uB7C9\uC744 \uD655\uC778\uD558\uACE0 ", (0, _foodUnits.foodUnit)(name).unit, " \uB2E8\uC704\uB85C \uBCC0\uACBD")), unit !== (0, _foodUnits.foodUnit)(name).unit && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: _theme.colors.textSecondary
    }
  }, "\uAC1C\xB7\uBD09\xB7\uBCD1\uC744 \uACF5\uAE30\xB7g\xB7ml\uB85C \uC790\uB3D9 \uD658\uC0B0\uD558\uC9C0 \uC54A\uC544\uC694. \uB2E8\uC704\uB97C \uBC14\uAFB8\uBA74 \uC218\uB7C9\uB3C4 \uC9C1\uC811 \uD655\uC778\uD574 \uC8FC\uC138\uC694.")), (unit === 'kg' || unit === 'L') && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      marginTop: 10,
      color: _theme.colors.textSecondary
    }
  }, "\uC800\uC7A5 \uC2DC ", quantity || '0', unit, " \u2192 ", Number(quantity || 0) * 1000, unit === 'kg' ? 'g' : 'ml', "\uB85C \uB9DE\uCDB0\uC694. \uAD6C\uB9E4 \uAE08\uC561\uC740 \uADF8\uB300\uB85C \uC720\uC9C0\uB3FC\uC694."), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: "\uAD6C\uB9E4\uC77C",
    value: purchaseDate ? (0, _format.formatDotDate)((0, _format.toDateString)(purchaseDate)) : '',
    placeholder: "YYYY.MM.DD",
    rightIcon: "calendar-month-outline",
    onPress: () => openDatePicker('purchase'),
    hint: "\uAD6C\uB9E4\uD55C \uB0A0\uC9DC\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694. \uC608: 2026.11.02"
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: dateType === 'reference' ? '보관 참고일' : '소비기한',
    value: expiryDate ? (0, _format.formatDotDate)((0, _format.toDateString)(expiryDate)) : '',
    placeholder: "YYYY.MM.DD",
    rightIcon: "calendar-month-outline",
    onPress: () => openDatePicker('expiry'),
    hint: dateType === 'reference' ? '직접 확인한 참고일이며 식품의 안전을 보장하지 않아요.' : '포장에 표시된 날짜를 입력해 주세요.'
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.subtitle, {
      marginTop: 0,
      marginBottom: 10,
      fontWeight: '700'
    }]
  }, "\uBCF4\uAD00 \uBC29\uBC95"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      gap: 8
    }
  }, _inventoryFields.STORAGE_METHODS.map(x => /*#__PURE__*/_react.default.createElement(_Chip.default, {
    key: x.value,
    label: x.label,
    selected: storageMethod === x.value,
    onPress: () => setStorageMethod(x.value)
  })))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.subtitle, {
      marginTop: 0,
      marginBottom: 10,
      fontWeight: '700'
    }]
  }, "\uB0A0\uC9DC \uC720\uD615"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, _inventoryFields.DATE_TYPES.map(x => /*#__PURE__*/_react.default.createElement(_Chip.default, {
    key: x.value,
    label: x.value === 'package' ? '포장 표시일' : '보관 참고일',
    selected: dateType === x.value,
    onPress: () => setDateType(x.value)
  })))), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    accessibilityRole: "button",
    onPress: () => setExtra(!extra),
    style: {
      paddingVertical: 22
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: _theme.colors.green
    }
  }, "\uAD6C\uB9E4 \uAE08\uC561 ", extra ? '접기 −' : '입력 +')), extra && /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: "\uD604\uC7AC \uC218\uB7C9\uC758 \uAD6C\uB9E4 \uAE08\uC561 (\uC6D0)",
    value: remainingCost,
    onChangeText: setRemainingCost,
    keyboardType: "number-pad",
    marginTop: 0,
    placeholder: "\uBAA8\uB974\uBA74 \uBE44\uC6CC \uB450\uC138\uC694",
    hint: "\uBD80\uBD84 \uC0AC\uC6A9\xB7\uD3D0\uAE30 \uC2DC \uC218\uB7C9 \uBE44\uC728\uC5D0 \uB530\uB77C \uACC4\uC0B0\uD574\uC694."
  }), isEdit && /*#__PURE__*/_react.default.createElement(_ActionMenu.default, {
    label: "\uC0AC\uC6A9 \xB7 \uD3D0\uAE30 \xB7 \uC774\uB825",
    items: [['실제 사용량 입력', () => _router.router.push(`/inventory/use/${editId}`)], ['일부 수량 폐기', () => _router.router.push(`/inventory/discard/${editId}`)], ['상세 관리 · 개봉일', () => _router.router.push(`/inventory/${editId}`)], ['재고 변경 이력', () => _router.router.push('/inventory/history')]]
  }), confirmDelete && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingVertical: 12,
      gap: 12
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uC774 \uC2DD\uC7AC\uB8CC\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694?"), /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: "\uC0AD\uC81C \uD655\uC778",
    onPress: handleDelete
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => setConfirmDelete(false)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, "\uCDE8\uC18C"))), !!error && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityRole: "alert",
    style: {
      color: '#B33525',
      paddingVertical: 16
    }
  }, error)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.footer, {
      paddingBottom: insets.bottom + 14
    }]
  }, /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: busy ? '저장 중…' : isEdit ? '수정 완료' : '추가하기',
    onPress: handleSave
  })), /*#__PURE__*/_react.default.createElement(_UnitPickerSheet.default, {
    visible: unitSheetVisible,
    options: unitOptions,
    value: unit,
    onSelect: handleSelectUnit,
    onClose: () => setUnitSheetVisible(false)
  }), /*#__PURE__*/_react.default.createElement(_DatePickerSheet.default, {
    visible: dateSheetVisible,
    value: sheet.value ?? new Date(),
    minimumDate: sheet.minimumDate,
    maximumDate: sheet.maximumDate,
    onChange: sheet.setValue,
    onClose: () => setDateSheetVisible(false)
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 24,
    color: _theme.colors.textPrimary
  },
  deleteButton: {
    padding: 4
  },
  subtitle: {
    marginTop: 14,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: _theme.spacing.screenX,
    backgroundColor: _theme.colors.background
  }
});
},
"src/components/QuantityField.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = QuantityField;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 라벨 + [수량 입력][단위 선택 버튼] 한 줄 + 안내 문구. onPressUnit: 단위 선택 시트를 여는 용도
function QuantityField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  unitPlaceholder = '단위 선택',
  onPressUnit,
  hint
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.wrapper
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.row
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.inputBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    style: styles.input,
    value: value,
    onChangeText: onChangeText,
    placeholder: placeholder,
    placeholderTextColor: _theme.colors.placeholder,
    keyboardType: "decimal-pad",
    maxLength: 6,
    accessibilityLabel: label
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPressUnit,
    accessibilityRole: "button",
    accessibilityLabel: "\uB2E8\uC704 \uC120\uD0DD",
    style: ({
      pressed
    }) => [styles.unitButton, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.unitText,
    numberOfLines: 1
  }, unit || unitPlaceholder), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "chevron-down",
    size: 22,
    color: _theme.colors.green
  }))), hint ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.hint
  }, hint) : null);
}
const styles = _reactNative.StyleSheet.create({
  wrapper: {
    marginTop: 28
  },
  label: {
    marginBottom: 10,
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  inputBox: {
    flex: 1,
    height: 58,
    justifyContent: 'center',
    backgroundColor: _theme.colors.cardBg,
    borderRadius: 20,
    paddingHorizontal: 18
  },
  input: {
    height: '100%',
    paddingVertical: 0,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  unitButton: {
    width: 128,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: _theme.colors.tabActiveBg,
    borderRadius: 20,
    paddingHorizontal: 18
  },
  pressed: {
    opacity: 0.85
  },
  unitText: {
    flexShrink: 1,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.green
  },
  hint: {
    marginTop: 8,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/UnitPickerSheet.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = UnitPickerSheet;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _BottomSheet = _interopRequireDefault(__load("src/components/BottomSheet.js"));
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 단위(개, 봉, g ...)를 고르는 하단 시트. onSelect(unit) 후 시트를 닫는 것은 부모가 합니다.
function UnitPickerSheet({
  visible,
  options,
  value,
  onSelect,
  onClose
}) {
  return /*#__PURE__*/_react.default.createElement(_BottomSheet.default, {
    visible: visible,
    onClose: onClose,
    title: "\uB2E8\uC704 \uC120\uD0DD"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.grid
  }, options.map(unit => {
    const selected = unit === value;
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      key: unit,
      onPress: () => onSelect(unit),
      accessibilityRole: "button",
      accessibilityState: {
        selected
      },
      style: ({
        pressed
      }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pressed]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.pillText, selected && styles.pillTextSelected]
    }, unit));
  })));
}
const styles = _reactNative.StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  pill: {
    minWidth: 72,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: _theme.colors.cardBg
  },
  pillSelected: {
    backgroundColor: _theme.colors.green
  },
  pressed: {
    opacity: 0.85
  },
  pillText: {
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  pillTextSelected: {
    color: _theme.colors.white
  }
});
},
"src/screens/RecipeListScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = RecipeListScreen;
var _ActionMenu = _interopRequireDefault(__load("src/components/ActionMenu.js"));
var _AppProvider = __load("module3/state/AppProvider.js");
var _seed = __load("module3/data/seed.js");
var _recipeSearch = __load("module3/domain/recipeSearch.mjs");
var _recipes = __load("integration/recipes.mjs");
var _router = __load("integration/router.js");
var _useDayClock = __load("module3/hooks/useDayClock.js");
var _SearchBar = _interopRequireDefault(__load("src/components/SearchBar.js"));
var _SoftButton = _interopRequireDefault(__load("src/components/SoftButton.js"));
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _recipes2 = __load("src/data/fridge/recipes.js");
var _fridge = __load("src/data/fridge/fridge.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _recipes3 = __load("src/utils/recipes.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 냉장고 > AI 레시피 추천 (목록)
function RecipeListScreen({
  navigation,
  route
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const t = _recipes2.recipeData.texts;
  const {
    fridgeItems
  } = (0, _AppDataContext.useAppData)();
  const {
    state
  } = (0, _AppProvider.useApp)();
  const [query, setQuery] = (0, _react.useState)('');
  const [searchVisible, setSearchVisible] = (0, _react.useState)(true);
  const searchMode = route.params?.searchMode !== false;
  (0, _useDayClock.useDayClock)();
  const baseDate = (0, _format.toDateString)(new Date()); // 기준일 = 오늘

  const entries = (0, _react.useMemo)(() => (0, _recipes3.getFridgeEntries)(fridgeItems, baseDate, _fridge.fridgeData.urgentWithinDays), [fridgeItems, baseDate]);
  // 유통기한이 가장 급한 재료 3개 (배너 칩)
  const urgentChips = entries.filter(e => e.urgent).slice(0, 3);
  // 추천 순서는 그대로 두고, 냉장고에 재료가 하나라도 있는 레시피만 보여줍니다.
  const cards = (0, _recipeSearch.searchRecipes)(_seed.recipes, state.inventory, {
    query,
    conditions: searchMode ? null : state.conditions
  }).map(recipe => (0, _recipes.presentRecipe)(recipe, state.inventory));
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerWrap
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: searchMode ? '음식 검색' : t.listTitle,
    icon: "arrow-back",
    onBack: () => navigation.goBack()
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subtitle
  }, "\uB4F1\uB85D\uB41C \uC694\uB9AC\uB97C \uAC80\uC0C9\uD558\uACE0 \uC7AC\uB8CC\xB7\uB3C4\uAD6C\uB97C \uD655\uC778\uD558\uC138\uC694."), /*#__PURE__*/_react.default.createElement(_ActionMenu.default, {
    label: "\uB808\uC2DC\uD53C \uBA54\uB274",
    items: [['조리 조건 · 제외 재료', () => _router.router.push('/recipe/conditions')], ['레시피 알림 시연', () => _router.router.push('/recipe/reminders')]]
  }), searchVisible && /*#__PURE__*/_react.default.createElement(_SearchBar.default, {
    value: query,
    onChangeText: setQuery,
    placeholder: "\uC694\uB9AC \uC774\uB984 \uB610\uB294 \uC7AC\uB8CC \uAC80\uC0C9"
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.banner
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.bannerHead
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "star-four-points-outline",
    size: 22,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.bannerText
  }, urgentChips.length > 0 ? t.bannerUrgent : t.bannerNormal)), urgentChips.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.chipRow
  }, urgentChips.map(e => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: e.id,
    style: styles.urgentChip
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.urgentChipText
  }, e.name, " \xB7 ", (0, _recipes3.shortDueLabel)(e.daysLeft))))) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, t.sectionTitle), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.countText
  }, t.count(cards.length))), cards.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.empty
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.emptyTitle
  }, t.empty), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.emptyHint
  }, t.emptyHint)) : cards.map(({
    recipe,
    owned,
    missing,
    urgent
  }) => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: recipe.id,
    onPress: () => navigation.navigate('RecipeDetail', {
      id: recipe.id,
      searchMode
    }),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.card, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cardTop
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: recipe.icon,
    size: 52,
    borderRadius: 16,
    iconColor: _theme.colors.green,
    backgroundColor: _theme.colors.heroBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cardTitleBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.cardTitle,
    numberOfLines: 1
  }, recipe.title), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.metaRow
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "clock-outline",
    size: 18,
    color: _theme.colors.textSecondary
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.metaText
  }, recipe.minutes, "\uBD84 \xB7 ", recipe.difficulty))), urgent.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.badge
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.badgeText
  }, urgent.length >= 2 ? t.urgentBadge(urgent.length) : (0, _recipes3.badgeDueLabel)(urgent[0].fridgeItem.daysLeft))) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.ingredientRow, styles.firstRow]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.rowLabel
  }, t.haveLabel), owned.map(ing => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: ing.name,
    style: styles.haveChip
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.haveChipText
  }, ing.name)))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.ingredientRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.rowLabel
  }, t.needLabel), missing.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.allHave
  }, t.allHave) : missing.map(ing => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: ing.name,
    style: styles.missingChip
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.missingChipText
  }, ing.name))))))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  headerWrap: {
    marginBottom: -12 // BackHeader 아래 기본 여백(24)을 줄여 부제목이 제목 가까이 붙도록
  },
  subtitle: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  banner: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: _theme.colors.heroBg
  },
  bannerHead: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bannerText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 17,
    color: _theme.colors.green
  },
  chipRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  urgentChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: _theme.colors.white
  },
  urgentChipText: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 18,
    color: _theme.colors.green
  },
  sectionRow: {
    marginTop: 21,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 22,
    color: _theme.colors.textPrimary
  },
  countText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  card: {
    marginBottom: 13,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.white
  },
  pressed: {
    opacity: 0.85
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardTitleBox: {
    flex: 1,
    marginLeft: 16
  },
  cardTitle: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaText: {
    marginLeft: 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: _theme.colors.warnBg
  },
  badgeText: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 14,
    color: _theme.colors.warnText
  },
  ingredientRow: {
    marginTop: 7,
    minHeight: 25,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8
  },
  firstRow: {
    marginTop: 12
  },
  rowLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  haveChip: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: _theme.colors.tabActiveBg
  },
  haveChipText: {
    fontFamily: _theme.fonts.medium,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 19,
    color: _theme.colors.green
  },
  missingChip: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: _theme.colors.cardBg
  },
  missingChipText: {
    fontFamily: _theme.fonts.medium,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 19,
    color: _theme.colors.textSecondary
  },
  allHave: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 16,
    color: _theme.colors.green
  },
  empty: {
    paddingVertical: 56,
    alignItems: 'center'
  },
  emptyTitle: {
    fontFamily: _theme.fonts.medium,
    fontWeight: '500',
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  emptyHint: {
    marginTop: 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"integration/recipes.mjs":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.presentRecipe = presentRecipe;
var _inventory = __load("module3/domain/inventory.mjs");
function presentRecipe(recipe, inventory) {
  const ingredients = recipe.ingredients.map(i => {
    const stock = inventory.find(s => s.name === i.name && s.unit === i.unit && (0, _inventory.daysLeft)(s.expiresAt) >= 0);
    const held = (0, _inventory.available)(inventory, i);
    return {
      ...i,
      held,
      shortage: Math.max(0, Math.round((i.quantity - held) * 1000000) / 1000000),
      unitMismatch: inventory.some(s => s.name === i.name && s.unit !== i.unit && s.quantity > 0),
      amount: `${i.quantity}${i.unit}`,
      fridgeItem: (0, _inventory.available)(inventory, i) >= i.quantity ? {
        ...stock,
        daysLeft: stock ? (0, _inventory.daysLeft)(stock.expiresAt) : Infinity
      } : null
    };
  });
  return {
    recipe: {
      ...recipe,
      title: recipe.name,
      servings: 1,
      difficulty: '간단',
      icon: 'chef-hat'
    },
    ingredients,
    owned: ingredients.filter(i => i.fridgeItem),
    missing: ingredients.filter(i => !i.fridgeItem),
    urgent: ingredients.filter(i => i.fridgeItem && i.fridgeItem.daysLeft <= 3)
  };
}
},
"src/components/BackHeader.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = BackHeader;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 스택 화면 상단의 "뒤로 가기 + 제목" 줄. 선택 props: subtitle(제목 아래 설명), color(글자/아이콘 색), right(오른쪽 끝 요소)
function BackHeader({
  title,
  subtitle,
  onBack,
  color = _theme.colors.textPrimary,
  right,
  icon = 'chevron-back' // Ionicons 이름
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.wrapper
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.row
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onBack,
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uB4A4\uB85C \uAC00\uAE30"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: icon,
    size: 28,
    color: color
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.title, {
      color
    }],
    numberOfLines: 1
  }, title), right ?? null), subtitle ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subtitle
  }, subtitle) : null);
}
const styles = _reactNative.StyleSheet.create({
  wrapper: {
    marginBottom: 24
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontFamily: _theme.fonts.bold,
    fontSize: 24
  },
  subtitle: {
    marginTop: 6,
    marginLeft: 36,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  }
});
},
"src/data/fridge/recipes.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recipeData = void 0;
// AI 레시피 추천 화면 데이터와 문구. AI API 를 연결하면 recipes 를 그 결과로 교체하세요.
// - recipes 는 추천 순서 그대로 보여주되, 냉장고에 재료가 하나도 없는 레시피는 뺍니다.
// - ingredients[].name 은 냉장고 식재료 이름과 맞춰 보고, amount 는 필요한 분량(글자)입니다.
// - icon: MaterialCommunityIcons 이름

const recipeData = exports.recipeData = {
  texts: {
    listTitle: 'AI 레시피 추천',
    listSubtitle: '냉장고 속 재료로 만들 수 있는 요리예요.',
    bannerUrgent: '기한이 임박한 재료를 먼저 활용했어요',
    bannerNormal: '냉장고 속 재료로 만들 수 있는 요리를 골랐어요',
    sectionTitle: '추천 레시피',
    count: n => `${n}개`,
    haveLabel: '있는 재료',
    needLabel: '필요한 재료',
    allHave: '모두 있어요',
    urgentBadge: n => `임박 재료 ${n}개`,
    empty: '아직 만들 수 있는 요리가 없어요.',
    emptyHint: '식재료를 추가하면 요리를 추천해 드려요.',
    // 상세
    detailTitle: '레시피',
    ingredientsTitle: '재료',
    haveCount: (total, have) => `${total}개 중 ${have}개 보유`,
    missingBadge: '없음',
    stepsTitle: '조리 순서',
    cookDone: '요리 완료 · 사용한 재료 빼기',
    confirmTitle: '사용한 재료를 뺄까요?',
    confirmMessage: names => `${names}을(를) 냉장고에서 빼요.`,
    confirmAction: '빼기',
    cancel: '취소',
    nothingToRemove: '냉장고에서 뺄 재료가 없어요.',
    notFound: '레시피를 찾을 수 없어요.'
  },
  recipes: [{
    id: 'rcp1',
    title: '두부 시금치 된장국',
    minutes: 15,
    difficulty: '쉬움',
    servings: 1,
    icon: 'silverware-fork-knife',
    ingredients: [{
      name: '두부',
      amount: '1/2모'
    }, {
      name: '시금치',
      amount: '1줌'
    }, {
      name: '된장',
      amount: '1큰술'
    }],
    steps: ['물 400ml에 된장 1큰술을 풀어 끓여요.', '두부는 깍둑썰기, 시금치는 먹기 좋게 잘라요.', '국물이 끓으면 두부를 넣고 3분, 시금치를 넣고 1분 더 끓여요.']
  }, {
    id: 'rcp2',
    title: '달걀 당근 볶음밥',
    minutes: 20,
    difficulty: '쉬움',
    servings: 1,
    icon: 'silverware-fork-knife',
    ingredients: [{
      name: '달걀',
      amount: '2개'
    }, {
      name: '당근',
      amount: '1/2개'
    }],
    steps: ['당근은 잘게 다지고, 달걀은 소금을 약간 넣어 풀어요.', '팬에 기름을 두르고 당근을 2분 볶아요.', '달걀을 넣어 스크램블한 뒤 밥 한 공기를 넣고 2분 더 볶아요.']
  }, {
    id: 'rcp3',
    title: '사과 우유 스무디',
    minutes: 5,
    difficulty: '아주 쉬움',
    servings: 1,
    icon: 'coffee-outline',
    ingredients: [{
      name: '우유',
      amount: '200ml'
    }, {
      name: '사과',
      amount: '1/2개'
    }],
    steps: ['사과는 씨를 빼고 한입 크기로 썰어요.', '믹서에 사과와 우유 200ml를 넣어요.', '곱게 갈아 컵에 담으면 완성이에요.']
  }]
};
},
"src/screens/RecipeDetailScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = RecipeDetailScreen;
var _AppProvider = __load("module3/state/AppProvider.js");
var _seed = __load("module3/data/seed.js");
var _recipes = __load("integration/recipes.mjs");
var _router = __load("integration/router.js");
var _UI = __load("module3/components/UI.js");
var _useDayClock = __load("module3/hooks/useDayClock.js");
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _recipes2 = __load("src/data/fridge/recipes.js");
var _fridge = __load("src/data/fridge/fridge.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _recipes3 = __load("src/utils/recipes.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 냉장고 > AI 레시피 추천 > 레시피 상세. params: { id }
function RecipeDetailScreen({
  navigation,
  route
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const t = _recipes2.recipeData.texts;
  const {
    fridgeItems
  } = (0, _AppDataContext.useAppData)();
  const {
    state,
    addMissing
  } = (0, _AppProvider.useApp)();
  const [message, setMessage] = (0, _react.useState)('');
  (0, _useDayClock.useDayClock)();
  const baseDate = (0, _format.toDateString)(new Date());
  const canonical = _seed.recipes.find(r => r.id === route.params?.id);
  const recipe = canonical ? (0, _recipes.presentRecipe)(canonical, state.inventory).recipe : null;
  const entries = (0, _react.useMemo)(() => (0, _recipes3.getFridgeEntries)(fridgeItems, baseDate, _fridge.fridgeData.urgentWithinDays), [fridgeItems, baseDate]);
  const analysis = recipe ? (0, _recipes.presentRecipe)(canonical, state.inventory) : null;
  const missingTools = (canonical?.tools || []).filter(t => !(state.conditions?.tools || []).includes(t));
  const toolNames = {
    pot: '냄비',
    pan: '프라이팬',
    microwave: '전자레인지'
  };
  const handleCookDone = () => {
    if (analysis.missing.length || missingTools.length) return;
    _router.router.push({
      pathname: `/recipe/${recipe.id}`,
      params: {
        startCooking: true,
        searchMode: route.params?.searchMode
      }
    });
  };
  if (!recipe) {
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.container, {
        paddingTop: insets.top + 14,
        paddingHorizontal: _theme.spacing.screenX
      }]
    }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
      title: t.detailTitle,
      icon: "arrow-back",
      onBack: () => navigation.goBack()
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.notFound
    }, t.notFound));
  }
  const {
    ingredients,
    owned
  } = analysis;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: 24,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: t.detailTitle,
    icon: "arrow-back",
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.banner
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.recipeTitle
  }, recipe.title), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.metaRow
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "timer-outline",
    size: 16,
    color: _theme.colors.textSecondary
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.metaText, styles.metaFirst]
  }, recipe.minutes, "\uBD84"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.metaText
  }, "\uB09C\uC774\uB3C4 ", recipe.difficulty), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.metaText
  }, recipe.servings, "\uC778\uBD84"))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.sectionTitle, {
      marginTop: 22
    }]
  }, "\uD544\uC694\uD55C \uB3C4\uAD6C"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.metaText, {
      marginTop: 10
    }]
  }, recipe.tools.map(t => toolNames[t] || t).join(' · ')), !!missingTools.length && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: _theme.colors.warnText,
      marginTop: 8
    }
  }, "\uBCF4\uC720 \uB3C4\uAD6C \uC124\uC815\uC5D0 \uC5C6\uC74C: ", missingTools.map(t => toolNames[t] || t).join(', ')), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: _theme.colors.textSecondary,
      marginTop: 8
    }
  }, "\uC7AC\uACE0\uB294 \uB3D9\uC77C\uD55C \uC7AC\uB8CC\uBA85\xB7\uB2E8\uC704\uC640 \uB0A0\uC9DC\uB97C \uAE30\uC900\uC73C\uB85C \uBE44\uAD50\uD574\uC694. \uBCF4\uAD00 \uCC38\uACE0\uC77C\uC740 \uC548\uC804\uC744 \uBCF4\uC7A5\uD558\uC9C0 \uC54A\uC544\uC694."), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, t.ingredientsTitle), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.haveCount
  }, t.haveCount(ingredients.length, owned.length))), ingredients.map(ing => {
    const has = Boolean(ing.fridgeItem);
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: ing.name,
      style: [styles.ingredientRow, {
        height: 'auto',
        minHeight: 72,
        flexWrap: 'wrap',
        paddingVertical: 10
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.circle, has ? styles.circleHave : styles.circleMissing]
    }, has ? /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
      name: "checkmark",
      size: 14,
      color: _theme.colors.green
    }) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.ingredientName, !has && styles.ingredientMissing]
    }, ing.name), !has ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.missingBadge
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.missingBadgeText
    }, t.missingBadge)) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.amount
    }, ing.amount), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        width: '100%',
        paddingTop: 8,
        fontSize: 13,
        color: has ? _theme.colors.green : _theme.colors.warnText
      }
    }, "\uD544\uC694 ", ing.quantity, ing.unit, " / \uC0AC\uC6A9 \uAC00\uB2A5 ", ing.held, ing.unit, ing.shortage > 0 ? ` / 부족 ${ing.shortage}${ing.unit}` : ' · 충분해요', ing.unitMismatch ? ' · 다른 단위 재고는 환산하지 않았어요.' : ''));
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.sectionTitle, styles.stepsTitle]
  }, t.stepsTitle), recipe.steps.map((step, index) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: index,
    style: styles.stepRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.stepNumber
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepNumberText
  }, index + 1)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepText
  }, step)))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.footer, {
      paddingBottom: insets.bottom + 14
    }]
  }, !!analysis.missing.length && /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uBD80\uC871 \uC7AC\uB8CC \uC7A5\uBCF4\uAE30 \uCD94\uAC00",
    onPress: () => addMissing(canonical).then(() => setMessage('장보기 목록에 추가했어요.')).catch(e => setMessage(e.message))
  }), !!message && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityLiveRegion: "polite"
  }, message), analysis.missing.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    accessibilityLiveRegion: "polite",
    style: {
      color: _theme.colors.warnText,
      paddingVertical: 12
    }
  }, "\uC7AC\uB8CC\uAC00 \uBD80\uC871\uD574\uC694. \uBD80\uC871\uD55C \uC7AC\uB8CC\uB97C \uC7AC\uACE0\uC5D0 \uB4F1\uB85D\uD55C \uB4A4 \uC694\uB9AC\uB97C \uC2DC\uC791\uD558\uC138\uC694.") : missingTools.length > 0 ? /*#__PURE__*/_react.default.createElement(_UI.Button, {
    secondary: true,
    title: "\uD544\uC694\uD55C \uB3C4\uAD6C \uD655\uC778 \xB7 \uC124\uC815",
    onPress: () => _router.router.push('/recipe/conditions')
  }) : /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: "\uC694\uB9AC \uC2DC\uC791 \xB7 \uC2E4\uC81C \uC0AC\uC6A9\uB7C9 \uD655\uC778",
    onPress: handleCookDone
  }), analysis.missing.length === 0 && missingTools.length === 0 && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: _theme.colors.green,
      paddingTop: 8
    }
  }, "\uC7AC\uB8CC\uAC00 \uCDA9\uBD84\uD574\uC694. \uC870\uB9AC \uC644\uB8CC \uD6C4 \uD655\uC778\uC744 \uB20C\uB7EC\uC57C \uCC28\uAC10\uB3FC\uC694.")));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  notFound: {
    paddingVertical: 48,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  banner: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: _theme.colors.heroBg
  },
  recipeTitle: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 34,
    color: _theme.colors.textPrimary
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaText: {
    marginRight: 14,
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: _theme.colors.textSecondary
  },
  metaFirst: {
    marginLeft: 3
  },
  sectionRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 22,
    color: _theme.colors.textPrimary
  },
  haveCount: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 16,
    color: _theme.colors.green
  },
  ingredientRow: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderBottomColor: _theme.colors.divider
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  circleHave: {
    backgroundColor: _theme.colors.tabActiveBg
  },
  circleMissing: {
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: _theme.colors.checkboxBorder
  },
  ingredientName: {
    marginLeft: 12,
    fontFamily: _theme.fonts.regular,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  ingredientMissing: {
    color: _theme.colors.textSecondary
  },
  missingBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: _theme.colors.warnBg
  },
  missingBadgeText: {
    fontFamily: _theme.fonts.medium,
    fontWeight: '500',
    fontSize: 13,
    color: _theme.colors.warnText
  },
  amount: {
    marginLeft: 'auto',
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textSecondary
  },
  stepsTitle: {
    marginTop: 24,
    marginBottom: 14
  },
  stepRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: _theme.colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepNumberText: {
    fontFamily: _theme.fonts.bold,
    fontWeight: '700',
    fontSize: 15,
    color: _theme.colors.green
  },
  stepText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    lineHeight: 26,
    color: _theme.colors.textPrimary
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: _theme.spacing.screenX,
    backgroundColor: _theme.colors.background
  }
});
},
"src/screens/TodoScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TodoScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _SummaryBanner = _interopRequireDefault(__load("src/components/SummaryBanner.js"));
var _TodoRow = _interopRequireDefault(__load("src/components/TodoRow.js"));
var _AddTodoSheet = _interopRequireDefault(__load("src/components/AddTodoSheet.js"));
var _Fab = _interopRequireDefault(__load("src/components/Fab.js"));
var _todos = __load("src/data/lifeInfo/todos.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 마감 안내 글자와 색상 톤을 정합니다.
function getDueInfo(item) {
  if (item.due === null) {
    return {
      text: item.done ? '기한 없음 · 완료' : '기한 없음',
      tone: 'normal'
    };
  }
  const monthDay = (0, _format.formatKoreanMonthDay)(item.due);
  if (item.done) return {
    text: `${monthDay}까지 · 완료`,
    tone: 'normal'
  };
  if (item.daysLeft < 0) return {
    text: `${monthDay}까지 · ${-item.daysLeft}일 지남`,
    tone: 'overdue'
  };
  if (item.daysLeft === 0) return {
    text: '오늘까지',
    tone: 'today'
  };
  if (item.daysLeft === 1) return {
    text: '내일까지',
    tone: 'normal'
  };
  return {
    text: `${monthDay}까지`,
    tone: 'normal'
  };
}
function TodoScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const now = new Date();
  const baseDate = (0, _format.toDateString)(now); // 기준일 = 오늘

  // 할 일 목록은 공용 저장소(AppDataContext)에 있어 화면을 나갔다 와도 유지되고 홈에도 반영됩니다.
  // TODO: 서버 연결은 store/AppDataContext.js 의 addTodo / toggleTodo 안에서 하세요.
  const {
    todos: items,
    addTodo,
    toggleTodo: toggleDone
  } = (0, _AppDataContext.useAppData)();
  const [addVisible, setAddVisible] = (0, _react.useState)(false);
  const {
    remaining,
    completed
  } = (0, _react.useMemo)(() => {
    const enriched = items.map(item => {
      const due = item.due ?? null; // 마감일이 없으면 null
      const daysLeft = due ? (0, _format.daysBetween)(baseDate, due) : null;
      return {
        ...item,
        due,
        daysLeft
      };
    });
    return {
      // 마감일 가까운 순. 기한 없는 할 일은 맨 아래.
      remaining: enriched.filter(i => !i.done).sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity)),
      completed: enriched.filter(i => i.done)
    };
  }, [items, baseDate]);
  const todayCount = remaining.filter(i => i.daysLeft === 0).length;
  const renderRow = item => {
    const {
      text,
      tone
    } = getDueInfo(item);
    return /*#__PURE__*/_react.default.createElement(_TodoRow.default, {
      key: item.id,
      title: item.title,
      subText: text,
      tone: tone,
      overdue: tone === 'overdue',
      done: item.done,
      onToggle: () => toggleDone(item.id)
    });
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 120,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: "\uD560 \uC77C",
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_SummaryBanner.default, {
    label: (0, _format.formatKoreanDateWithYear)(now),
    title: todayCount > 0 ? `오늘까지 할 일이 ${todayCount}개 있어요` : '오늘까지 할 일이 없어요',
    description: "\uC791\uC740 \uC77C\uB3C4 \uD558\uB098\uC529, \uB05D\uB0B4\uBA74 \uCCB4\uD06C\uD574 \uC8FC\uC138\uC694."
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionLeft
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, "\uB0A8\uC740 \uD560 \uC77C"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.sectionCount, styles.countGreen]
  }, remaining.length)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sortText
  }, _todos.todoData.sortLabel)), remaining.length > 0 ? remaining.map(renderRow) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.emptyText
  }, "\uB0A8\uC740 \uD560 \uC77C\uC774 \uC5C6\uC5B4\uC694."), completed.length > 0 ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.sectionRow, styles.completedHeader]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionLeft
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, "\uC644\uB8CC\uD55C \uD560 \uC77C"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.sectionCount, styles.countGray]
  }, completed.length))), completed.map(renderRow)) : null), /*#__PURE__*/_react.default.createElement(_Fab.default, {
    hasTabBar: false,
    accessibilityLabel: "\uD560 \uC77C \uCD94\uAC00",
    onPress: () => setAddVisible(true)
  }), /*#__PURE__*/_react.default.createElement(_AddTodoSheet.default, {
    visible: addVisible,
    onClose: () => setAddVisible(false),
    onSubmit: addTodo
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  sectionRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  completedHeader: {
    marginTop: 16,
    marginBottom: 0
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: _theme.colors.textPrimary
  },
  sectionCount: {
    marginLeft: 8,
    fontSize: 18
  },
  countGreen: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  },
  countGray: {
    fontFamily: _theme.fonts.regular,
    color: _theme.colors.textSecondary
  },
  sortText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  emptyText: {
    paddingVertical: 28,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/SummaryBanner.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SummaryBanner;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 목록 화면 맨 위의 연한 초록 요약 카드 (할 일, 생활 루틴 공통). label / title / description
function SummaryBanner({
  label,
  title,
  description
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.card
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.description
  }, description));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: _theme.colors.heroBg
  },
  label: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    color: _theme.colors.green
  },
  title: {
    marginTop: 4,
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: _theme.colors.textPrimary
  },
  description: {
    marginTop: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/TodoRow.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TodoRow;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 할 일 목록의 한 줄: 체크박스 + 제목 + 마감 안내.
// subText(제목 아래 글자), extraText(뒤에 " · " 로 붙는 초록 글씨), tone('normal' | 'today' | 'overdue'),
// overdue(기한 지난 할 일 전용 카드 모양), done(완료: 초록 체크 + 취소선), vertical(위아래 여백), onToggle(체크를 눌렀을 때)
function TodoRow({
  title,
  subText,
  extraText,
  vertical,
  tone = 'normal',
  overdue = false,
  done = false,
  onToggle
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.row, overdue ? styles.overdueRow : styles.divider, done && styles.compact, vertical != null && {
      paddingVertical: vertical
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onToggle,
    hitSlop: 12,
    accessibilityRole: "checkbox",
    accessibilityState: {
      checked: done
    },
    accessibilityLabel: title,
    style: [styles.checkbox, overdue && styles.checkboxOverdue, done && styles.checkboxDone]
  }, done ? /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "checkmark",
    size: 18,
    color: _theme.colors.white
  }) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.title, done && styles.titleDone],
    numberOfLines: 2
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.subRow
  }, tone === 'overdue' ? /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "alert-circle-outline",
    size: 18,
    color: _theme.colors.warnText,
    style: styles.subIcon
  }) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.sub, tone === 'today' && styles.subToday, tone === 'overdue' && styles.subOverdue]
  }, subText, extraText ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, null, '  · '), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subExtra
  }, extraText)) : null))));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13
  },
  compact: {
    paddingVertical: 7
  },
  divider: {
    borderBottomWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderBottomColor: _theme.colors.divider
  },
  overdueRow: {
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: _theme.colors.overdueBg
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: _theme.colors.checkboxBorder,
    backgroundColor: _theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxOverdue: {
    borderColor: _theme.colors.overdueBorder
  },
  checkboxDone: {
    borderColor: _theme.colors.green,
    backgroundColor: _theme.colors.green
  },
  texts: {
    flex: 1,
    marginLeft: 14
  },
  title: {
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    color: _theme.colors.textPrimary
  },
  titleDone: {
    color: _theme.colors.placeholder,
    textDecorationLine: 'line-through'
  },
  subRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  subIcon: {
    marginRight: 6
  },
  sub: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.colors.textSecondary
  },
  subToday: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  },
  subExtra: {
    color: _theme.colors.green
  },
  subOverdue: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.warnText
  }
});
},
"src/components/AddTodoSheet.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AddTodoSheet;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _CalendarPicker = _interopRequireDefault(__load("src/components/CalendarPicker.js"));
var _BottomSheet = _interopRequireDefault(__load("src/components/BottomSheet.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _FieldLabel = _interopRequireDefault(__load("src/components/FieldLabel.js"));
var _SheetInput = _interopRequireDefault(__load("src/components/SheetInput.js"));
var _SegmentedControl = _interopRequireDefault(__load("src/components/SegmentedControl.js"));
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 키보드/달력이 열려도 시트가 넘치지 않도록 입력 영역 높이를 제한합니다 (넘치면 스크롤).
const BODY_MAX_HEIGHT = _reactNative.Dimensions.get('window').height * 0.5;
const DUE_OPTIONS = [{
  value: true,
  label: '날짜 선택'
}, {
  value: false,
  label: '기한 없음'
}];

// "할 일 추가" 시트. onSubmit({ title, due }): due 는 "YYYY-MM-DD" (기한 없으면 null)
// 열 때마다 입력값이 초기화됩니다 (마감일은 오늘로 시작).
function AddTodoSheet({
  visible,
  onClose,
  onSubmit
}) {
  const [text, setText] = (0, _react.useState)('');
  const [hasDue, setHasDue] = (0, _react.useState)(true);
  const [date, setDate] = (0, _react.useState)(new Date());
  const [pickerOpen, setPickerOpen] = (0, _react.useState)(false); // 날짜 박스 아래로 펼쳐지는 달력

  (0, _react.useEffect)(() => {
    if (visible) {
      setText('');
      setHasDue(true);
      setDate(new Date());
      setPickerOpen(false);
    }
  }, [visible]);
  const handleChangeDue = value => {
    setHasDue(value);
    if (!value) setPickerOpen(false);
  };
  const handlePressDate = () => {
    _reactNative.Keyboard.dismiss();
    setPickerOpen(open => !open);
  };
  const handleSubmit = () => {
    if (!text.trim()) {
      _reactNative.Alert.alert('입력을 확인해 주세요', '할 일 내용을 입력해 주세요.');
      return;
    }
    onSubmit({
      title: text.trim(),
      due: hasDue ? (0, _format.toDateString)(date) : null
    });
    onClose();
  };
  return /*#__PURE__*/_react.default.createElement(_BottomSheet.default, {
    visible: visible,
    onClose: onClose,
    title: "\uD560 \uC77C \uCD94\uAC00"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    style: styles.body,
    keyboardShouldPersistTaps: "handled",
    showsVerticalScrollIndicator: false,
    bounces: false
  }, /*#__PURE__*/_react.default.createElement(_FieldLabel.default, {
    label: "\uD560 \uC77C \uB0B4\uC6A9",
    tag: "\uD544\uC218",
    required: true
  }), /*#__PURE__*/_react.default.createElement(_SheetInput.default, {
    value: text,
    onChangeText: setText,
    placeholder: "\uC608: \uAD00\uB9AC\uBE44 \uB0A9\uBD80\uD558\uAE30",
    maxLength: 40,
    accessibilityLabel: "\uD560 \uC77C \uB0B4\uC6A9"
  }), /*#__PURE__*/_react.default.createElement(_FieldLabel.default, {
    label: "\uB9C8\uAC10\uC77C",
    tag: "\uC120\uD0DD",
    style: styles.labelSpaced
  }), /*#__PURE__*/_react.default.createElement(_SegmentedControl.default, {
    options: DUE_OPTIONS,
    value: hasDue,
    onChange: handleChangeDue
  }), hasDue ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: handlePressDate,
    accessibilityRole: "button",
    accessibilityLabel: "\uB9C8\uAC10\uC77C \uC120\uD0DD",
    style: ({
      pressed
    }) => [styles.dateBox, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "calendar-month-outline",
    size: 26,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.dateText
  }, (0, _format.formatKoreanDateShort)(date)), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: pickerOpen ? 'chevron-up' : 'chevron-down',
    size: 20,
    color: _theme.colors.textSecondary
  })), pickerOpen ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.picker
  }, /*#__PURE__*/_react.default.createElement(_CalendarPicker.default, {
    value: date,
    minimumDate: new Date(),
    onChange: setDate
  })) : null) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.helper
  }, "\uCD94\uAC00\uD558\uBA74 \uB9C8\uAC10\uC77C \uC21C\uC11C\uC5D0 \uB9DE\uCDB0 \uBAA9\uB85D\uC5D0 \uB2F4\uACA8\uC694."), /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: "\uCD94\uAC00\uD558\uAE30",
    onPress: handleSubmit
  }));
}
const styles = _reactNative.StyleSheet.create({
  body: {
    maxHeight: BODY_MAX_HEIGHT,
    flexGrow: 0
  },
  labelSpaced: {
    marginTop: 20
  },
  dateBox: {
    marginTop: 10,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.white
  },
  pressed: {
    opacity: 0.85
  },
  dateText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  picker: {
    marginTop: 8,
    alignItems: 'center'
  },
  helper: {
    marginTop: 22,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/FieldLabel.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FieldLabel;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 시트 입력 칸 위의 라벨 + 작은 태그 (예: "할 일 내용 필수"). required 면 태그가 초록색, style 은 바깥 여백용
function FieldLabel({
  label,
  tag,
  required = false,
  style
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.row, style]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), tag ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.tag, required && styles.tagRequired]
  }, tag) : null);
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8
  },
  label: {
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  tag: {
    marginLeft: 8,
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    color: _theme.colors.textSecondary
  },
  tagRequired: {
    color: _theme.colors.green
  }
});
},
"src/components/SheetInput.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SheetInput;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// 시트 안에서 쓰는 테두리 있는 글자 입력 칸. TextInput 의 props 를 그대로 사용할 수 있습니다.
function SheetInput({
  style,
  ...props
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, _extends({
    placeholderTextColor: _theme.colors.placeholder,
    returnKeyType: "done"
  }, props, {
    style: [styles.input, style]
  }));
}
const styles = _reactNative.StyleSheet.create({
  input: {
    height: 56,
    paddingHorizontal: 18,
    paddingVertical: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.cardBg,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textPrimary
  }
});
},
"src/components/SegmentedControl.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SegmentedControl;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 둘 중 하나를 고르는 전환 버튼 (예: "오전 / 오후"). options: [{ value, label }], onChange(value)
// showCheck: 선택된 항목 앞에 체크 아이콘 (기본 true)
function SegmentedControl({
  options,
  value,
  onChange,
  showCheck = true
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.segment
  }, options.map(option => {
    const selected = option.value === value;
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      key: String(option.value),
      onPress: () => onChange(option.value),
      accessibilityRole: "button",
      accessibilityState: {
        selected
      },
      style: [styles.button, selected && styles.selected]
    }, selected && showCheck ? /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
      name: "checkmark",
      size: 20,
      color: _theme.colors.green,
      style: styles.check
    }) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.text, selected && styles.textSelected]
    }, option.label));
  }));
}
const styles = _reactNative.StyleSheet.create({
  segment: {
    height: 46,
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: _theme.colors.cardBg
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16
  },
  selected: {
    backgroundColor: _theme.colors.tabActiveBg
  },
  check: {
    marginRight: 6
  },
  text: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  textSelected: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  }
});
},
"src/screens/RoutineScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = RoutineScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _SummaryBanner = _interopRequireDefault(__load("src/components/SummaryBanner.js"));
var _TodoRow = _interopRequireDefault(__load("src/components/TodoRow.js"));
var _AddRoutineSheet = _interopRequireDefault(__load("src/components/AddRoutineSheet.js"));
var _Fab = _interopRequireDefault(__load("src/components/Fab.js"));
var _routines = __load("src/data/lifeInfo/routines.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _time = __load("src/utils/time.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function RoutineScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();

  // 루틴 목록은 공용 저장소(AppDataContext)에 있어 화면을 나갔다 와도 유지되고 홈에도 반영됩니다.
  // TODO: 서버 연결은 store/AppDataContext.js 의 addRoutine / toggleRoutine 안에서 하세요.
  const {
    routines: items,
    addRoutine,
    toggleRoutine: toggleDone
  } = (0, _AppDataContext.useAppData)();
  const [addVisible, setAddVisible] = (0, _react.useState)(false);

  // 이른 시간 순 ("HH:mm" 문자열은 그대로 비교해도 시간 순서가 맞습니다)
  const sorted = (0, _react.useMemo)(() => [...items].sort((a, b) => a.time.localeCompare(b.time)), [items]);
  const doneCount = items.filter(i => i.doneToday).length;
  const summaryTitle = items.length > 0 && doneCount === items.length ? '오늘 루틴을 모두 마쳤어요' : doneCount > 0 ? `오늘은 ${doneCount}개를 완료했어요` : '오늘은 아직 완료한 루틴이 없어요';
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 120,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: "\uC0DD\uD65C \uB8E8\uD2F4 \uC124\uC815",
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_SummaryBanner.default, {
    label: "\uB9E4\uC77C \uBC18\uBCF5\uD558\uB294 \uB098\uC758 \uB8E8\uD2F4",
    title: summaryTitle,
    description: "\uC791\uC740 \uC2B5\uAD00\uB3C4 \uD558\uB098\uC529, \uB9C8\uCE58\uBA74 \uCCB4\uD06C\uD574 \uC8FC\uC138\uC694."
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionLeft
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, "\uB098\uC758 \uB8E8\uD2F4"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionCount
  }, items.length)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sortText
  }, _routines.routineData.sortLabel)), sorted.length > 0 ? sorted.map(item => /*#__PURE__*/_react.default.createElement(_TodoRow.default, {
    key: item.id,
    title: item.title,
    subText: (0, _time.formatRoutineTime)(item.time),
    extraText: item.doneToday ? '오늘 완료' : undefined,
    done: item.doneToday,
    vertical: 17,
    onToggle: () => toggleDone(item.id)
  })) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.emptyText
  }, "\uC544\uC9C1 \uB8E8\uD2F4\uC774 \uC5C6\uC5B4\uC694. + \uBC84\uD2BC\uC73C\uB85C \uCD94\uAC00\uD574 \uBCF4\uC138\uC694.")), /*#__PURE__*/_react.default.createElement(_Fab.default, {
    hasTabBar: false,
    accessibilityLabel: "\uB8E8\uD2F4 \uCD94\uAC00",
    onPress: () => setAddVisible(true)
  }), /*#__PURE__*/_react.default.createElement(_AddRoutineSheet.default, {
    visible: addVisible,
    onClose: () => setAddVisible(false),
    onSubmit: addRoutine
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  sectionRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: _theme.colors.textPrimary
  },
  sectionCount: {
    marginLeft: 8,
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.green
  },
  sortText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  emptyText: {
    paddingVertical: 28,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/AddRoutineSheet.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AddRoutineSheet;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _BottomSheet = _interopRequireDefault(__load("src/components/BottomSheet.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _FieldLabel = _interopRequireDefault(__load("src/components/FieldLabel.js"));
var _SheetInput = _interopRequireDefault(__load("src/components/SheetInput.js"));
var _SegmentedControl = _interopRequireDefault(__load("src/components/SegmentedControl.js"));
var _format = __load("src/utils/format.js");
var _time = __load("src/utils/time.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 키보드/선택 목록이 열려도 시트가 넘치지 않도록 입력 영역 높이를 제한합니다 (넘치면 스크롤).
const BODY_MAX_HEIGHT = _reactNative.Dimensions.get('window').height * 0.5;
const PERIOD_OPTIONS = [{
  value: 'am',
  label: '오전'
}, {
  value: 'pm',
  label: '오후'
}];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; // 5분 단위

// "루틴 추가" 시트. onSubmit({ title, time }): time 은 24시간제 "HH:mm" (예: "19:00")
// 열 때마다 입력값이 초기화됩니다 (오전 08시 00분 시작).
function AddRoutineSheet({
  visible,
  onClose,
  onSubmit
}) {
  const [name, setName] = (0, _react.useState)('');
  const [period, setPeriod] = (0, _react.useState)('am');
  const [hour, setHour] = (0, _react.useState)(8);
  const [minute, setMinute] = (0, _react.useState)(0);
  const [openPicker, setOpenPicker] = (0, _react.useState)(null); // 'hour' | 'minute' | null (펼쳐진 선택 목록)

  (0, _react.useEffect)(() => {
    if (visible) {
      setName('');
      setPeriod('am');
      setHour(8);
      setMinute(0);
      setOpenPicker(null);
    }
  }, [visible]);
  const togglePicker = which => {
    _reactNative.Keyboard.dismiss();
    setOpenPicker(current => current === which ? null : which);
  };
  const handleSubmit = () => {
    if (!name.trim()) {
      _reactNative.Alert.alert('입력을 확인해 주세요', '루틴 이름을 입력해 주세요.');
      return;
    }
    onSubmit({
      title: name.trim(),
      time: (0, _time.to24HourString)(period, hour, minute)
    });
    onClose();
  };
  return /*#__PURE__*/_react.default.createElement(_BottomSheet.default, {
    visible: visible,
    onClose: onClose,
    title: "\uB8E8\uD2F4 \uCD94\uAC00"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    style: styles.body,
    keyboardShouldPersistTaps: "handled",
    showsVerticalScrollIndicator: false,
    bounces: false
  }, /*#__PURE__*/_react.default.createElement(_FieldLabel.default, {
    label: "\uB8E8\uD2F4 \uC774\uB984",
    tag: "\uD544\uC218",
    required: true
  }), /*#__PURE__*/_react.default.createElement(_SheetInput.default, {
    value: name,
    onChangeText: setName,
    placeholder: "\uC608: \uAC00\uBCBC\uC6B4 \uC2A4\uD2B8\uB808\uCE6D",
    maxLength: 30,
    accessibilityLabel: "\uB8E8\uD2F4 \uC774\uB984"
  }), /*#__PURE__*/_react.default.createElement(_FieldLabel.default, {
    label: "\uC2E4\uD589 \uC2DC\uAC04",
    tag: "\uD544\uC218",
    required: true,
    style: styles.labelSpaced
  }), /*#__PURE__*/_react.default.createElement(_SegmentedControl.default, {
    options: PERIOD_OPTIONS,
    value: period,
    onChange: setPeriod
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.timeRow
  }, /*#__PURE__*/_react.default.createElement(TimeSelectBox, {
    value: hour,
    unit: "\uC2DC",
    open: openPicker === 'hour',
    onPress: () => togglePicker('hour')
  }), /*#__PURE__*/_react.default.createElement(TimeSelectBox, {
    value: minute,
    unit: "\uBD84",
    open: openPicker === 'minute',
    onPress: () => togglePicker('minute')
  })), openPicker ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.grid
  }, (openPicker === 'hour' ? HOURS : MINUTES).map(n => {
    const selected = n === (openPicker === 'hour' ? hour : minute);
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      key: n,
      onPress: () => {
        if (openPicker === 'hour') setHour(n);else setMinute(n);
        setOpenPicker(null);
      },
      accessibilityRole: "button",
      accessibilityState: {
        selected
      },
      style: ({
        pressed
      }) => [styles.pill, selected && styles.pillSelected, pressed && styles.pressed]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.pillText, selected && styles.pillTextSelected]
    }, (0, _format.pad)(n)));
  })) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.helper
  }, "\uB9E4\uC77C \uBC18\uBCF5\uB418\uBA70, \uC2DC\uAC04\uC21C\uC73C\uB85C \uBAA9\uB85D\uC5D0 \uB2F4\uACA8\uC694."), /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: "\uCD94\uAC00\uD558\uAE30",
    onPress: handleSubmit
  }));
}

// "08 시 ⌄" 모양의 시간 선택 칸
function TimeSelectBox({
  value,
  unit,
  open,
  onPress
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: onPress,
    accessibilityRole: "button",
    accessibilityLabel: `${unit} 선택`,
    style: ({
      pressed
    }) => [styles.timeBox, open && styles.timeBoxOpen, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.timeValueRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.timeValue
  }, (0, _format.pad)(value)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.timeUnit
  }, unit)), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: open ? 'chevron-up' : 'chevron-down',
    size: 20,
    color: _theme.colors.textSecondary
  }));
}
const styles = _reactNative.StyleSheet.create({
  body: {
    maxHeight: BODY_MAX_HEIGHT,
    flexGrow: 0
  },
  labelSpaced: {
    marginTop: 20
  },
  timeRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 12
  },
  timeBox: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.cardBg
  },
  timeBoxOpen: {
    borderColor: _theme.colors.green
  },
  pressed: {
    opacity: 0.85
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  timeValue: {
    fontFamily: _theme.fonts.medium,
    fontSize: 22,
    color: _theme.colors.textPrimary
  },
  timeUnit: {
    marginLeft: 10,
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8
  },
  pill: {
    width: '23.5%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: _theme.colors.cardBg
  },
  pillSelected: {
    backgroundColor: _theme.colors.green
  },
  pillText: {
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  pillTextSelected: {
    color: _theme.colors.white
  },
  helper: {
    marginTop: 22,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/screens/ReceiptResultScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ReceiptResultScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _FormField = _interopRequireDefault(__load("src/components/FormField.js"));
var _DatePickerSheet = _interopRequireDefault(__load("src/components/DatePickerSheet.js"));
var _PurchaseItemCard = _interopRequireDefault(__load("src/components/PurchaseItemCard.js"));
var _AddItemButton = _interopRequireDefault(__load("src/components/AddItemButton.js"));
var _receipt = __load("src/data/spending/receipt.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _purchaseItems = __load("src/utils/purchaseItems.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 인식 결과(receipt)를 화면에서 고칠 수 있는 형태(draft)로 바꿉니다.
// OCR 결과는 비거나 틀릴 수 있어 기본값으로 채웁니다 (날짜가 없거나 이상하면 오늘, 수량은 1 이상, 가격/총액이 이상하면 빈칸).
// 가격/총액은 숫자만 담은 글자("2800"), 식품 품목의 유통기한은 구매일 + 14일로 채웁니다.
function toDraft(receipt) {
  const date = (0, _format.isValidDateString)(receipt.date) ? receipt.date : (0, _format.toDateString)(new Date());
  return {
    store: receipt.store ?? '',
    date,
    time: receipt.time ?? '',
    total: String((0, _format.parseAmount)(receipt.total) || ''),
    items: (receipt.items ?? []).map((it, index) => ({
      key: it.id ?? `r${index + 1}`,
      name: it.name ?? '',
      quantity: Math.max(1, Math.floor(Number(it.quantity)) || 1),
      price: String((0, _format.parseAmount)(it.unitPrice) || ''),
      inFridge: !!it.inFridge,
      expiry: it.inFridge ? (0, _format.addDays)(date, _purchaseItems.DEFAULT_EXPIRY_DAYS) : null
    }))
  };
}

// 영수증 촬영(OCR) 이후의 "인식 결과" 화면. 카메라 화면이 아직 없어서 route.params.receipt 가 없으면 sampleReceipt 를 보여줍니다.
// 인식이 틀릴 수 있어서 [수정] 으로 상호명 / 구매일 / 총액 / 품목을 직접 고칠 수 있습니다.
function ReceiptResultScreen({
  navigation,
  route
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    addTransaction,
    addFridgeItem
  } = (0, _AppDataContext.useAppData)();
  const t = _receipt.receiptTexts;
  const scrollRef = (0, _react.useRef)(null);
  const nextKey = (0, _react.useRef)(1);
  const [draft, setDraft] = (0, _react.useState)(() => toDraft(route.params?.receipt ?? _receipt.sampleReceipt));
  const [editing, setEditing] = (0, _react.useState)(false);
  const [snapshot, setSnapshot] = (0, _react.useState)(null); // 수정을 시작할 때의 값 (취소하면 되돌립니다)
  // 열려 있는 날짜 시트가 다루는 칸: null(닫힘) | 'purchase'(구매일) | 품목 key(그 품목의 유통기한)
  const [dateTarget, setDateTarget] = (0, _react.useState)(null);
  const {
    store,
    date,
    time,
    items
  } = draft;
  const total = Number(draft.total) || 0;
  // 합계는 품목에서 직접 계산해 서로 어긋나지 않게 합니다.
  const itemCount = (0, _purchaseItems.countItems)(items);
  const itemsTotal = (0, _purchaseItems.sumItems)(items);
  const fridgeCount = (0, _purchaseItems.countFridgeItems)(items);
  const mismatch = total !== itemsTotal;
  const patchDraft = patch => setDraft(prev => ({
    ...prev,
    ...patch
  }));
  const updateItem = (key, patch) => setDraft(prev => ({
    ...prev,
    items: prev.items.map(it => it.key === key ? (0, _purchaseItems.applyItemPatch)(it, patch, prev.date) : it)
  }));
  const addItem = () => {
    const key = `n${nextKey.current++}`;
    setDraft(prev => ({
      ...prev,
      items: [...prev.items, (0, _purchaseItems.createEmptyItem)(key)]
    }));
    (0, _purchaseItems.scrollToEndSoon)(scrollRef);
  };
  const removeItem = key => setDraft(prev => ({
    ...prev,
    items: prev.items.filter(it => it.key !== key)
  }));
  const openDateSheet = target => {
    _reactNative.Keyboard.dismiss();
    setDateTarget(target);
  };
  const startEdit = () => {
    setSnapshot(draft);
    setEditing(true);
  };
  const cancelEdit = () => {
    if (snapshot) setDraft(snapshot);
    setEditing(false);
  };

  // 입력값 확인 (문제가 있으면 안내 글, 없으면 null)
  const validate = () => {
    if (!store.trim()) return '상호명을 입력해 주세요.';
    if (!(total > 0)) return '영수증 총액을 입력해 주세요.';
    if (items.length === 0) return '품목을 한 개 이상 입력해 주세요.';
    return (0, _purchaseItems.validateItems)(items, date);
  };
  const finishEdit = () => {
    const error = validate();
    if (error) {
      _reactNative.Alert.alert('입력을 확인해 주세요', error);
      return;
    }
    _reactNative.Keyboard.dismiss();
    setEditing(false);
  };
  const handleSave = () => {
    const error = validate();
    if (error) {
      _reactNative.Alert.alert('입력을 확인해 주세요', error);
      return;
    }
    // 영수증 한 장을 소비 내역 한 줄로 저장합니다. 세부 품목(items)도 함께 저장되어 지출 상세에 보입니다.
    addTransaction({
      title: store.trim(),
      amount: total,
      date,
      category: '영수증',
      icon: 'receipt-text-outline',
      source: 'receipt',
      items: (0, _purchaseItems.toSavedItems)(items)
    });
    // 식품으로 체크한 품목은 냉장고에도 담습니다.
    (0, _purchaseItems.addCheckedItemsToFridge)(items, date, addFridgeItem);
    navigation.goBack();
  };

  // 날짜 시트가 지금 다루는 값
  const sheet = dateTarget === 'purchase' || dateTarget === null ? {
    value: (0, _format.fromDateString)(date),
    onChange: d => patchDraft({
      date: (0, _format.toDateString)(d)
    }),
    minimumDate: undefined,
    maximumDate: new Date()
  } : {
    value: (0, _format.fromDateString)(items.find(it => it.key === dateTarget)?.expiry ?? date),
    onChange: d => updateItem(dateTarget, {
      expiry: (0, _format.toDateString)(d)
    }),
    minimumDate: (0, _format.fromDateString)(date),
    maximumDate: undefined
  };

  // 총액과 품목 합계가 다를 때 보여주는 안내 (인식이 틀렸을 가능성)
  const mismatchBanner = mismatch ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.warnBox
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "alert-circle-outline",
    size: 20,
    color: _theme.colors.warnText
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.warnTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.warnText
  }, t.mismatch((0, _format.formatNumber)(total), (0, _format.formatNumber)(itemsTotal))), editing ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => patchDraft({
      total: String(itemsTotal)
    }),
    hitSlop: 8,
    accessibilityRole: "button"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.warnAction
  }, t.matchAction)) : null)) : null;
  return /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.container,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    ref: scrollRef,
    keyboardShouldPersistTaps: "handled",
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingHorizontal: _theme.spacing.screenX,
      paddingBottom: 24
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, t.title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subtitle
  }, editing ? t.editSubtitle : t.subtitle), editing ?
  /*#__PURE__*/
  /* 수정 모드: 상호명 / 구매일 / 총액 */
  _react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: t.storeLabel,
    value: store,
    onChangeText: text => patchDraft({
      store: text
    }),
    placeholder: t.storePlaceholder,
    maxLength: 30,
    marginTop: 24
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: t.dateLabel,
    value: (0, _format.formatDotDate)(date),
    placeholder: "\uB0A0\uC9DC \uC120\uD0DD",
    rightIcon: "calendar-month-outline",
    onPress: () => openDateSheet('purchase'),
    marginTop: 18
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: t.totalFieldLabel,
    value: draft.total ? (0, _format.formatNumber)(draft.total) : '',
    onChangeText: text => patchDraft({
      total: text.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 9)
    }),
    placeholder: "\uAE08\uC561 \uC785\uB825",
    keyboardType: "number-pad",
    suffix: "\uC6D0",
    marginTop: 18
  })) :
  /*#__PURE__*/
  /* 보기 모드: 총액 카드 */
  _react.default.createElement(_reactNative.View, {
    style: styles.summaryCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.summaryTop
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalLabel
  }, t.totalLabel), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.badge
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.badgeText
  }, t.badge))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalAmount
  }, (0, _format.formatNumber)(total), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalUnit
  }, "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.summaryDivider
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.store
  }, store), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.dateTime
  }, (0, _format.formatDotDate)(date), time ? ` · ${time}` : '')), mismatchBanner, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionLeft
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, t.itemsTitle), !editing ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionCount
  }, items.length, "\uC885 \xB7 \uCD1D ", itemCount, "\uAC1C") : null), editing ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.editHint
  }, t.editHint) : /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: startEdit,
    accessibilityRole: "button",
    accessibilityLabel: "\uC778\uC2DD \uACB0\uACFC \uC218\uC815",
    style: ({
      pressed
    }) => [styles.editButton, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "pencil-outline",
    size: 18,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.editButtonText
  }, t.editLabel))), editing ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.cards
  }, items.map(item => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: item.key,
    style: styles.cardGap
  }, /*#__PURE__*/_react.default.createElement(_PurchaseItemCard.default, {
    item: item,
    canRemove: items.length > 1,
    onChange: patch => updateItem(item.key, patch),
    onRemove: () => removeItem(item.key),
    onPressExpiry: () => openDateSheet(item.key)
  }))), /*#__PURE__*/_react.default.createElement(_AddItemButton.default, {
    label: t.addItemLabel,
    onPress: addItem
  })) : /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tableHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerText, styles.colName]
  }, t.headerName), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerText, styles.colQty]
  }, t.headerQty), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerText, styles.colSum]
  }, t.headerSum)), items.map(item => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: item.key,
    style: styles.row
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.colName
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.nameLine
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.itemName,
    numberOfLines: 1
  }, item.name), item.inFridge ? /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "fridge-outline",
    size: 17,
    color: _theme.colors.green,
    style: styles.fridgeIcon
  }) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.unitPrice
  }, "\uB2E8\uAC00 ", (0, _format.formatNumber)(item.price), "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.qty, styles.colQty]
  }, item.quantity, "\uAC1C"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.itemSum, styles.colSum]
  }, (0, _format.formatNumber)(Number(item.price) * item.quantity), "\uC6D0")))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.footerRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.footerLabel
  }, "\uCD1D ", itemCount, "\uAC1C \uD569\uACC4"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.footerAmount
  }, (0, _format.formatNumber)(itemsTotal), "\uC6D0"))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.footer, {
      paddingBottom: insets.bottom + 14
    }]
  }, editing ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.footerButtons
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: cancelEdit,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.cancelButton, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.cancelText
  }, t.cancelLabel)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.doneWrap
  }, /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: t.doneLabel,
    onPress: finishEdit
  }))) : /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: fridgeCount > 0 ? t.fridgeSaveLabel(fridgeCount) : t.saveLabel,
    onPress: handleSave
  })), /*#__PURE__*/_react.default.createElement(_DatePickerSheet.default, {
    visible: dateTarget !== null,
    value: sheet.value,
    minimumDate: sheet.minimumDate,
    maximumDate: sheet.maximumDate,
    onChange: sheet.onChange,
    onClose: () => setDateTarget(null)
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  pressed: {
    opacity: 0.75
  },
  title: {
    marginTop: 16,
    fontFamily: _theme.fonts.bold,
    fontSize: 30,
    color: _theme.colors.textPrimary
  },
  subtitle: {
    marginTop: 10,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  summaryCard: {
    marginTop: 30,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    borderRadius: _theme.radius.card,
    backgroundColor: _theme.colors.heroBg
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  totalLabel: {
    fontFamily: _theme.fonts.medium,
    fontSize: 15,
    color: _theme.colors.green
  },
  badge: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: _theme.radius.pill,
    backgroundColor: _theme.colors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 13,
    color: _theme.colors.green
  },
  totalAmount: {
    marginTop: 12,
    fontFamily: _theme.fonts.bold,
    fontSize: 38,
    color: _theme.colors.textPrimary
  },
  totalUnit: {
    fontFamily: _theme.fonts.bold,
    fontSize: 22
  },
  summaryDivider: {
    marginTop: 18,
    height: _reactNative.StyleSheet.hairlineWidth,
    backgroundColor: _theme.colors.divider
  },
  store: {
    marginTop: 18,
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  dateTime: {
    marginTop: 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 14.5,
    color: _theme.colors.textSecondary
  },
  // 총액 ≠ 품목 합계 안내
  warnBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    backgroundColor: _theme.colors.warnBg,
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  warnTexts: {
    flex: 1,
    marginLeft: 10
  },
  warnText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: _theme.colors.warnText
  },
  warnAction: {
    marginTop: 8,
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    color: _theme.colors.warnText,
    textDecorationLine: 'underline'
  },
  sectionHeader: {
    marginTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  sectionCount: {
    marginLeft: 10,
    fontFamily: _theme.fonts.medium,
    fontSize: 15,
    color: _theme.colors.green
  },
  editHint: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  editButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: _theme.radius.pill,
    backgroundColor: _theme.colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center'
  },
  editButtonText: {
    marginLeft: 4,
    fontFamily: _theme.fonts.bold,
    fontSize: 15,
    color: _theme.colors.green
  },
  // 표: 품목(남은 폭) / 수량(고정) / 합계(고정)
  colName: {
    flex: 1
  },
  colQty: {
    width: 64,
    textAlign: 'center'
  },
  colSum: {
    width: 100,
    textAlign: 'right'
  },
  tableHeader: {
    marginTop: 22,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: _theme.colors.divider
  },
  headerText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  row: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: _theme.colors.divider
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemName: {
    flexShrink: 1,
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  fridgeIcon: {
    marginLeft: 6
  },
  unitPrice: {
    marginTop: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  qty: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  itemSum: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  // 수정 모드: 품목 카드
  cards: {
    marginTop: 16
  },
  cardGap: {
    marginBottom: 12
  },
  footerRow: {
    paddingTop: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  footerLabel: {
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  footerAmount: {
    fontFamily: _theme.fonts.bold,
    fontSize: 22,
    color: _theme.colors.textPrimary
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: _theme.spacing.screenX,
    backgroundColor: _theme.colors.background
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cancelButton: {
    width: 96,
    height: 56,
    marginRight: 10,
    borderRadius: 28,
    backgroundColor: _theme.colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.green
  },
  doneWrap: {
    flex: 1
  }
});
},
"src/screens/SpendingAnalysisScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SpendingAnalysisScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _AnalysisSummaryCard = _interopRequireDefault(__load("src/components/AnalysisSummaryCard.js"));
var _SegmentedControl = _interopRequireDefault(__load("src/components/SegmentedControl.js"));
var _DonutChart = _interopRequireDefault(__load("src/components/DonutChart.js"));
var _MonthlyBarChart = _interopRequireDefault(__load("src/components/MonthlyBarChart.js"));
var _spendingAnalysis = __load("src/data/spending/spendingAnalysis.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
const MINUS = '−'; // 숫자 앞 마이너스 기호(−)

// 전월 대비 증감 문구: 0 -> '—', 양수 -> '+90,000원', 음수 -> '−40,000원'
const formatDiff = diff => {
  if (diff == null || diff === 0) return '—';
  return `${diff > 0 ? '+' : MINUS}${(0, _format.formatNumber)(Math.abs(diff))}원`;
};
function SpendingAnalysisScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const [tab, setTab] = (0, _react.useState)('category');
  const {
    period,
    budget,
    spent,
    categories,
    months
  } = _spendingAnalysis.analysisData;
  const t = _spendingAnalysis.analysisTexts;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingHorizontal: _theme.spacing.screenX,
      paddingBottom: insets.bottom + 40
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.titleRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => navigation.goBack(),
    hitSlop: 12,
    accessibilityRole: "button",
    accessibilityLabel: "\uB4A4\uB85C \uAC00\uAE30"
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-back",
    size: 28,
    color: _theme.colors.textPrimary
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, t.title)), /*#__PURE__*/_react.default.createElement(_AnalysisSummaryCard.default, {
    periodLabel: `${period.year}년 ${period.month}월`,
    spentLabel: t.periodSpentLabel,
    spent: spent,
    budgetLabel: t.budgetLabel,
    budget: budget,
    remainingLabel: t.remainingLabel
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tabs
  }, /*#__PURE__*/_react.default.createElement(_SegmentedControl.default, {
    options: t.tabs,
    value: tab,
    onChange: setTab,
    showCheck: false
  })), tab === 'category' ? /*#__PURE__*/_react.default.createElement(CategoryTab, {
    categories: categories
  }) : /*#__PURE__*/_react.default.createElement(MonthTab, {
    months: months,
    year: period.year
  })));
}

// 탭 1: 카테고리별 지출 (도넛 차트 + 목록)
function CategoryTab({
  categories
}) {
  const t = _spendingAnalysis.analysisTexts;
  const sum = categories.reduce((s, c) => s + c.amount, 0);

  // 지출이 하나도 없으면 퍼센트를 나눌 수 없으니 안내 글만 보여 줍니다.
  if (categories.length === 0 || sum <= 0) {
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(SectionHeader, {
      title: t.categoryTitle,
      subtitle: t.categorySubtitle
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyText
    }, t.emptyText));
  }
  const rows = categories.map(c => ({
    ...c,
    percent: Math.round(c.amount / sum * 100)
  }));
  const top = rows.reduce((a, b) => b.amount > a.amount ? b : a, rows[0]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(SectionHeader, {
    title: t.categoryTitle,
    subtitle: t.categorySubtitle
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.donutWrap
  }, /*#__PURE__*/_react.default.createElement(_DonutChart.default, {
    segments: rows.map(r => ({
      value: r.amount,
      color: r.color
    }))
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.donutLabel
  }, t.topLabel), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.donutName
  }, top.name), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.donutPercent
  }, top.percent, "%"))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.list
  }, rows.map(r => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: r.id,
    style: styles.categoryRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.dot, {
      backgroundColor: r.color
    }]
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.categoryName
  }, r.name), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.categoryPercent
  }, r.percent, "%"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.categoryAmount
  }, (0, _format.formatNumber)(r.amount), "\uC6D0")))));
}

// 탭 2: 월별 소비 비교 (막대 차트 + 표)
function MonthTab({
  months,
  year
}) {
  const t = _spendingAnalysis.analysisTexts;
  const rows = months.map((m, i) => ({
    ...m,
    diff: i === 0 ? null : m.amount - months[i - 1].amount
  }));
  const current = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  if (!current) {
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyText
    }, t.emptyText));
  }

  // 지난달과 비교한 제목/설명 (이번 달이 줄었는지, 늘었는지에 따라 문구가 바뀝니다)
  let title = '지난달과 같아요';
  let subtitle = '';
  if (prev && current.diff !== 0) {
    const less = current.diff < 0;
    // 지난달 지출이 0원이면 퍼센트를 계산할 수 없어서 퍼센트 없이 보여 줍니다.
    const percent = prev.amount > 0 ? Math.round(Math.abs(current.diff) / prev.amount * 100) : null;
    title = `지난달보다 ${percent === null ? '' : `${percent}% `}${less ? '줄었어요' : '늘었어요'}`;
    subtitle = `${prev.month}월보다 ${(0, _format.formatNumber)(Math.abs(current.diff))}원 ${less ? '덜' : '더'} 썼어요.`;
  }
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(SectionHeader, {
    title: title,
    subtitle: subtitle
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.unit
  }, t.chartUnit), /*#__PURE__*/_react.default.createElement(_MonthlyBarChart.default, {
    data: months
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tableHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerText, styles.colMonth]
  }, year, "\uB144"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerText, styles.colAmount]
  }, t.tableSpentLabel), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerText, styles.colDiff]
  }, t.tableDiffLabel)), rows.map((r, i) => {
    const isCurrent = i === rows.length - 1;
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: r.month,
      style: [styles.tableRow, isCurrent && styles.currentRow]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.cellMonth, styles.colMonth, isCurrent && styles.currentText]
    }, r.month, "\uC6D4"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.cellAmount, styles.colAmount]
    }, (0, _format.formatNumber)(r.amount), "\uC6D0"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.cellDiff, styles.colDiff, isCurrent && styles.currentText]
    }, formatDiff(r.diff)));
  }));
}

// 제목 + 설명 + 오른쪽 "예시 데이터" 라벨
function SectionHeader({
  title,
  subtitle
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, title), subtitle ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionSubtitle
  }, subtitle) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sampleBadge
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sampleBadgeText
  }, _spendingAnalysis.analysisTexts.sampleBadge)));
}
const styles = _reactNative.StyleSheet.create({
  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    marginLeft: 14,
    fontFamily: _theme.fonts.bold,
    fontSize: 26,
    color: _theme.colors.textPrimary
  },
  tabs: {
    marginTop: 22
  },
  sectionHeader: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  sectionTexts: {
    flex: 1,
    paddingRight: 8
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 21,
    color: _theme.colors.textPrimary
  },
  sectionSubtitle: {
    marginTop: 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  sampleBadge: {
    marginTop: 2,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 8,
    backgroundColor: _theme.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sampleBadgeText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 12.5,
    color: _theme.colors.textSecondary
  },
  // 카테고리 탭
  donutWrap: {
    marginTop: 18,
    alignItems: 'center'
  },
  donutLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    color: _theme.colors.textSecondary
  },
  donutName: {
    marginTop: 2,
    fontFamily: _theme.fonts.bold,
    fontSize: 22,
    color: _theme.colors.textPrimary
  },
  donutPercent: {
    fontFamily: _theme.fonts.bold,
    fontSize: 36,
    lineHeight: 46,
    color: _theme.colors.green
  },
  list: {
    marginTop: 26
  },
  categoryRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: _theme.colors.divider
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  categoryName: {
    flex: 1,
    marginLeft: 12,
    fontFamily: _theme.fonts.regular,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  categoryPercent: {
    width: 64,
    textAlign: 'right',
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  categoryAmount: {
    width: 110,
    textAlign: 'right',
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  // 월별 탭
  unit: {
    marginTop: 18,
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    color: _theme.colors.textSecondary
  },
  colMonth: {
    flex: 1
  },
  colAmount: {
    width: 110,
    textAlign: 'right'
  },
  colDiff: {
    width: 110,
    textAlign: 'right'
  },
  tableHeader: {
    marginTop: 22,
    paddingHorizontal: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  tableRow: {
    height: 46,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  currentRow: {
    marginTop: 4,
    height: 44,
    borderRadius: 14,
    backgroundColor: _theme.colors.heroBg
  },
  cellMonth: {
    fontFamily: _theme.fonts.medium,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  cellAmount: {
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  cellDiff: {
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  currentText: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  }
});
},
"src/components/AnalysisSummaryCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AnalysisSummaryCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
var _format = __load("src/utils/format.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 소비 분석 상단의 지출금 / 예산 / 남은 예산 카드
function AnalysisSummaryCard({
  periodLabel,
  // 예: '2026년 10월'
  spentLabel,
  spent,
  budgetLabel,
  budget,
  remainingLabel
}) {
  const remaining = budget - spent;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.card
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.topRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.period
  }, periodLabel), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.spentLabel
  }, spentLabel)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.bigRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.bigText
  }, (0, _format.formatNumber)(spent)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.bigUnit
  }, "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.divider
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.bottomRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subLabel
  }, budgetLabel), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.budgetValue
  }, (0, _format.formatNumber)(budget), "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.right
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.subLabel
  }, remainingLabel), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.remainingValue
  }, (0, _format.formatNumber)(remaining), "\uC6D0"))));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    marginTop: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderRadius: _theme.radius.card,
    backgroundColor: _theme.colors.heroBg
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  period: {
    fontFamily: _theme.fonts.medium,
    fontSize: 15,
    color: _theme.colors.green
  },
  spentLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4
  },
  bigText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 38,
    lineHeight: 52,
    color: _theme.colors.textPrimary
  },
  bigUnit: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  divider: {
    marginTop: 10,
    height: _reactNative.StyleSheet.hairlineWidth * 2,
    backgroundColor: _theme.colors.divider
  },
  bottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  right: {
    alignItems: 'flex-end'
  },
  subLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  budgetValue: {
    marginTop: 2,
    fontFamily: _theme.fonts.medium,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  remainingValue: {
    marginTop: 2,
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.green
  }
});
},
"src/components/DonutChart.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DonutChart;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 도넛 차트 (12시 방향에서 시계 방향). react-native-svg 없이 작은 조각 View 를 원 둘레에 놓아 그립니다.
// segments: [{ value, color }] (value 는 금액이어도 됨), size: 지름, thickness: 고리 두께, children: 가운데 내용
const STEPS = 240; // 원을 나누는 조각 수 (많을수록 매끄럽지만 View 가 늘어남)

function DonutChart({
  segments,
  size = 190,
  thickness = 27,
  children
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const center = size / 2;
  const midRadius = (size - thickness) / 2; // 고리 두께의 한가운데까지의 반지름
  const outerRadius = size / 2;
  const tickWidth = 2 * Math.PI * outerRadius / STEPS + 0.8; // 바깥쪽 틈이 안 생기게 살짝 겹침

  // 각 조각이 어느 구간(segment)에 속하는지 정해서 색을 입힙니다.
  const ticks = [];
  for (let i = 0; i < STEPS; i++) {
    const fraction = (i + 0.5) / STEPS; // 0 ~ 1 (12시 방향이 0, 시계 방향)
    let acc = 0;
    let color = segments.length ? segments[segments.length - 1].color : 'transparent';
    for (const s of segments) {
      acc += total > 0 ? s.value / total : 0;
      if (fraction <= acc) {
        color = s.color;
        break;
      }
    }
    const angle = fraction * 2 * Math.PI;
    const x = center + midRadius * Math.sin(angle);
    const y = center - midRadius * Math.cos(angle);
    ticks.push(/*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: i,
      style: {
        position: 'absolute',
        left: x - tickWidth / 2,
        top: y - thickness / 2,
        width: tickWidth,
        height: thickness,
        backgroundColor: color,
        transform: [{
          rotate: `${angle}rad`
        }]
      }
    }));
  }
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      width: size,
      height: size
    }
  }, ticks, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.center,
    pointerEvents: "none"
  }, children));
}
const styles = _reactNative.StyleSheet.create({
  center: {
    ..._reactNative.StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
},
"src/components/MonthlyBarChart.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MonthlyBarChart;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const PLOT_HEIGHT = 140; // 0 ~ 최댓값 눈금까지의 높이
const TOP_SPACE = 26; // 막대 위 숫자가 들어갈 여백
const AXIS_WIDTH = 56; // 왼쪽 눈금 숫자 영역 (디자인 기준)

// 월별 막대 차트 (단위: 만원, 마지막 항목 강조). data: [{ month: 7, amount: 720000 }], tickStep: 눈금 간격 (기본 40)
function MonthlyBarChart({
  data,
  tickStep = 40
}) {
  const values = data.map(d => d.amount / 10000);
  const axisMax = Math.max(tickStep, Math.ceil(Math.max(...values) / tickStep) * tickStep);
  const ticks = [];
  for (let v = 0; v <= axisMax; v += tickStep) ticks.push(v);
  const lastIndex = data.length - 1;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.wrapper
  }, ticks.map(v => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: v,
    style: [styles.gridRow, {
      bottom: 30 + v / axisMax * PLOT_HEIGHT - 8
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.tick
  }, v), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.gridLine
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.plot
  }, data.map((d, i) => {
    const value = values[i];
    const active = i === lastIndex;
    const height = value / axisMax * PLOT_HEIGHT;
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: d.month,
      style: styles.column
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.barArea
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.valueText, active && styles.activeValue, {
        bottom: height + 4
      }]
    }, Number(value.toFixed(2))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.bar, active && styles.activeBar, {
        height
      }]
    })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.monthText, active && styles.activeMonth]
    }, d.month, "\uC6D4"));
  })));
}
const styles = _reactNative.StyleSheet.create({
  wrapper: {
    height: TOP_SPACE + PLOT_HEIGHT + 30
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  tick: {
    width: AXIS_WIDTH,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.placeholder
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: _theme.colors.divider
  },
  plot: {
    position: 'absolute',
    left: AXIS_WIDTH,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row'
  },
  column: {
    flex: 1,
    alignItems: 'center'
  },
  barArea: {
    width: '100%',
    height: TOP_SPACE + PLOT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  bar: {
    width: 32,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: _theme.colors.progressTrack
  },
  activeBar: {
    backgroundColor: _theme.colors.greenLight
  },
  valueText: {
    position: 'absolute',
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  activeValue: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  },
  monthText: {
    height: 30,
    paddingTop: 9,
    fontFamily: _theme.fonts.regular,
    fontSize: 15.5,
    color: _theme.colors.textSecondary
  },
  activeMonth: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  }
});
},
"src/data/spending/spendingAnalysis.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.analysisTexts = exports.analysisData = void 0;
// 소비 분석 더미 데이터 (화면에 "예시 데이터" 라벨이 붙은 고정 값).
// 비율과 전월 대비 증감은 화면에서 금액으로 계산하므로 금액만 둡니다.

const analysisData = exports.analysisData = {
  period: {
    year: 2026,
    month: 10
  },
  budget: 1000000,
  spent: 654500,
  // 카테고리별 지출. color 는 도넛 차트/목록 점 색상입니다.
  categories: [{
    id: 'grocery',
    name: '식료품',
    amount: 261800,
    color: '#65C695'
  }, {
    id: 'meal',
    name: '식비',
    amount: 196350,
    color: '#9ECCB6'
  }, {
    id: 'cafe',
    name: '카페·간식',
    amount: 130900,
    color: '#C2D9A8'
  }, {
    id: 'living',
    name: '생활용품',
    amount: 65450,
    color: '#D9DED7'
  }],
  // 월별 지출. 마지막 항목이 "이번 달" 입니다.
  months: [{
    month: 7,
    amount: 720000
  }, {
    month: 8,
    amount: 680000
  }, {
    month: 9,
    amount: 770000
  }, {
    month: 10,
    amount: 654500
  }]
};
const analysisTexts = exports.analysisTexts = {
  title: '소비 분석',
  periodSpentLabel: '이번 달 지출금',
  budgetLabel: '이번 달 예산',
  remainingLabel: '남은 예산',
  tabs: [{
    value: 'category',
    label: '카테고리별 지출'
  }, {
    value: 'month',
    label: '월별 소비 비교'
  }],
  sampleBadge: '예시 데이터',
  categoryTitle: '어디에 가장 많이 썼을까요?',
  categorySubtitle: '이번 달 지출을 카테고리별로 나눠봤어요.',
  topLabel: '가장 많이 쓴 곳',
  emptyText: '아직 분석할 지출이 없어요.',
  chartUnit: '단위: 만원',
  tableSpentLabel: '지출금',
  tableDiffLabel: '전월 대비'
};
},
"src/screens/SpendingDetailScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SpendingDetailScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _FormField = _interopRequireDefault(__load("src/components/FormField.js"));
var _DatePickerSheet = _interopRequireDefault(__load("src/components/DatePickerSheet.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _PurchaseItemCard = _interopRequireDefault(__load("src/components/PurchaseItemCard.js"));
var _AddItemButton = _interopRequireDefault(__load("src/components/AddItemButton.js"));
var _PurchasedItemRow = _interopRequireDefault(__load("src/components/PurchasedItemRow.js"));
var _spendingDetail = __load("src/data/spending/spendingDetail.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _purchaseItems = __load("src/utils/purchaseItems.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 저장된 지출을 화면에서 고칠 수 있는 형태(draft)로 바꿉니다. (가격 / 총액은 숫자만 담은 글자)
// linked: 총액이 품목 합계와 같아서 "품목을 고치면 총액도 같이 바뀌는" 상태
function toDraft(tx) {
  const items = (tx.items ?? []).map(it => ({
    key: it.id,
    name: it.name,
    quantity: it.quantity,
    price: String(it.unitPrice),
    inFridge: !!it.inFridge
  }));
  return {
    title: tx.title,
    date: tx.date,
    amount: String(tx.amount),
    linked: items.length > 0 && tx.amount === (0, _purchaseItems.sumItems)(items),
    items
  };
}

// 소비 > 지출 상세 (구매한 품목). params: { id }. [수정] 으로 이름 / 구매일 / 총 지출 / 품목을 고치고, 휴지통으로 삭제합니다.
function SpendingDetailScreen({
  navigation,
  route
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    transactions,
    updateTransaction,
    removeTransaction
  } = (0, _AppDataContext.useAppData)();
  const scrollRef = (0, _react.useRef)(null);
  const nextKey = (0, _react.useRef)(1);

  // 삭제 직후 화면이 닫히는 동안에도 내용이 사라져 보이지 않도록 마지막 값을 기억해 둡니다.
  const found = transactions.find(x => x.id === route.params?.id);
  const lastTransaction = (0, _react.useRef)(found);
  if (found) lastTransaction.current = found;
  const transaction = found ?? lastTransaction.current;
  const [editing, setEditing] = (0, _react.useState)(false);
  const [draft, setDraft] = (0, _react.useState)(null);
  const [dateSheetVisible, setDateSheetVisible] = (0, _react.useState)(false);
  if (!transaction) {
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.container
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        paddingTop: insets.top + 14,
        paddingHorizontal: _theme.spacing.screenX
      }
    }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
      title: _spendingDetail.spendingDetailTexts.title,
      icon: "arrow-back",
      onBack: () => navigation.goBack()
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.empty
    }, _spendingDetail.spendingDetailTexts.notFound)));
  }
  const {
    id,
    title,
    category,
    amount,
    date,
    source,
    items = []
  } = transaction;

  // ---------- 수정 ----------
  const startEdit = () => {
    setDraft(toDraft(transaction));
    setEditing(true);
  };
  const cancelEdit = () => {
    _reactNative.Keyboard.dismiss();
    setEditing(false);
  };

  // 수정 중 계산값: 품목 합계와 (연동 중이면 합계를 따르는) 총액
  const draftItems = draft?.items ?? [];
  const draftItemsTotal = (0, _purchaseItems.sumItems)(draftItems);
  const draftTotal = draft ? draft.linked ? draftItemsTotal : Number(draft.amount) || 0 : 0;
  const showMismatch = editing && draftItems.length > 0 && !draft.linked && draftTotal !== draftItemsTotal;
  const patchDraft = patch => setDraft(prev => ({
    ...prev,
    ...patch
  }));
  const updateItem = (key, patch) => setDraft(prev => ({
    ...prev,
    items: prev.items.map(it => it.key === key ? {
      ...it,
      ...patch
    } : it)
  }));
  const addItem = () => {
    const key = `n${nextKey.current++}`;
    setDraft(prev => ({
      ...prev,
      items: [...prev.items, {
        key,
        name: '',
        quantity: 1,
        price: '',
        inFridge: false
      }]
    }));
    (0, _purchaseItems.scrollToEndSoon)(scrollRef);
  };
  const removeItem = key => setDraft(prev => ({
    ...prev,
    items: prev.items.filter(it => it.key !== key)
  }));
  const saveEdit = () => {
    if (!draft.title.trim()) {
      _reactNative.Alert.alert('입력을 확인해 주세요', '이름을 입력해 주세요.');
      return;
    }
    if (!(draftTotal > 0)) {
      _reactNative.Alert.alert('입력을 확인해 주세요', '총 지출 금액을 입력해 주세요.');
      return;
    }
    const itemsError = (0, _purchaseItems.validateItemFields)(draftItems);
    if (itemsError) {
      _reactNative.Alert.alert('입력을 확인해 주세요', itemsError);
      return;
    }
    // 이름 / 날짜 / 총액 / 품목만 바꾸고, 카테고리·아이콘·출처는 그대로 둡니다.
    updateTransaction(id, {
      title: draft.title.trim(),
      amount: draftTotal,
      date: draft.date,
      items: (0, _purchaseItems.toSavedItems)(draftItems)
    });
    _reactNative.Keyboard.dismiss();
    setEditing(false);
  };

  // ---------- 삭제 ----------
  const handleDelete = () => {
    _reactNative.Alert.alert(_spendingDetail.spendingDetailTexts.deleteTitle, _spendingDetail.spendingDetailTexts.deleteMessage(title), [{
      text: '취소',
      style: 'cancel'
    }, {
      text: '삭제',
      style: 'destructive',
      onPress: () => {
        removeTransaction(id);
        navigation.goBack();
      }
    }]);
  };

  // ---------- 화면 ----------
  const headerActions = /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.actions
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: startEdit,
    accessibilityRole: "button",
    accessibilityLabel: "\uC9C0\uCD9C \uC218\uC815",
    style: ({
      pressed
    }) => [styles.editButton, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "pencil-outline",
    size: 18,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.editButtonText
  }, _spendingDetail.spendingDetailTexts.editLabel)), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: handleDelete,
    hitSlop: 10,
    accessibilityRole: "button",
    accessibilityLabel: "\uC9C0\uCD9C \uC0AD\uC81C",
    style: styles.deleteButton
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "trash-outline",
    size: 24,
    color: _theme.colors.textSecondary
  })));
  const header = /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: editing ? _spendingDetail.spendingDetailTexts.editTitle : _spendingDetail.spendingDetailTexts.title,
    icon: "arrow-back",
    onBack: editing ? cancelEdit : () => navigation.goBack(),
    right: editing ? null : headerActions
  });
  const [y, m, d] = date.split('-').map(Number);
  const fridgeCount = (0, _purchaseItems.countFridgeItems)(items);
  // 영수증으로 기록한 지출은 "영수증 · 식료품" 처럼 보여줍니다. (카테고리가 "영수증"이면 한 번만)
  const label = source === 'receipt' ? category && category !== _spendingDetail.spendingDetailTexts.receiptLabel ? `${_spendingDetail.spendingDetailTexts.receiptLabel} · ${category}` : _spendingDetail.spendingDetailTexts.receiptLabel : category;
  return /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.container,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    ref: scrollRef,
    keyboardShouldPersistTaps: "handled",
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, header, editing ? /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: _spendingDetail.spendingDetailTexts.nameLabel,
    value: draft.title,
    onChangeText: text => patchDraft({
      title: text
    }),
    placeholder: _spendingDetail.spendingDetailTexts.namePlaceholder,
    maxLength: 30,
    marginTop: 0
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: _spendingDetail.spendingDetailTexts.dateLabel,
    value: (0, _format.formatDotDate)(draft.date),
    placeholder: "\uB0A0\uC9DC \uC120\uD0DD",
    rightIcon: "calendar-month-outline",
    onPress: () => {
      _reactNative.Keyboard.dismiss();
      setDateSheetVisible(true);
    },
    marginTop: 18
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: _spendingDetail.spendingDetailTexts.totalLabel,
    value: draftTotal ? (0, _format.formatNumber)(draftTotal) : '',
    onChangeText: text => patchDraft({
      amount: text.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 9),
      linked: false
    }),
    placeholder: "\uAE08\uC561 \uC785\uB825",
    keyboardType: "number-pad",
    suffix: "\uC6D0",
    marginTop: 18
  }), showMismatch ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.warnBox
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "alert-circle-outline",
    size: 20,
    color: _theme.colors.warnText
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.warnTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.warnText
  }, _spendingDetail.spendingDetailTexts.mismatch((0, _format.formatNumber)(draftTotal), (0, _format.formatNumber)(draftItemsTotal))), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => patchDraft({
      linked: true
    }),
    hitSlop: 8,
    accessibilityRole: "button"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.warnAction
  }, _spendingDetail.spendingDetailTexts.matchAction)))) : null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, _spendingDetail.spendingDetailTexts.itemsTitle)), draftItems.map(item => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: item.key,
    style: styles.cardGap
  }, /*#__PURE__*/_react.default.createElement(_PurchaseItemCard.default, {
    item: item,
    showFridge: false,
    canRemove: true,
    onChange: patch => updateItem(item.key, patch),
    onRemove: () => removeItem(item.key)
  }))), /*#__PURE__*/_react.default.createElement(_AddItemButton.default, {
    label: _spendingDetail.spendingDetailTexts.addItemLabel,
    onPress: addItem
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.fridgeNote
  }, _spendingDetail.spendingDetailTexts.editFridgeNote)) : /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.summaryCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.store
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.date
  }, (0, _format.formatKoreanDateShort)(new Date(y, m - 1, d))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.divider
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.totalRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalLabel
  }, _spendingDetail.spendingDetailTexts.totalLabel), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalAmount
  }, (0, _format.formatNumber)(amount), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.totalUnit
  }, "\uC6D0")))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionHeader
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, _spendingDetail.spendingDetailTexts.itemsTitle, items.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionCount
  }, `  ${items.length}`) : null), fridgeCount > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.fridgeBadge
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "fridge-outline",
    size: 20,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.fridgeBadgeText
  }, _spendingDetail.spendingDetailTexts.fridgeBadge(fridgeCount))) : null), items.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.emptyBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.emptyTitle
  }, _spendingDetail.spendingDetailTexts.emptyItems), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.emptyHint
  }, _spendingDetail.spendingDetailTexts.emptyItemsHint)) : items.map(item => /*#__PURE__*/_react.default.createElement(_PurchasedItemRow.default, {
    key: item.id,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    inFridge: item.inFridge
  })), fridgeCount > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.notice
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "fridge-outline",
    size: 20,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.noticeText
  }, _spendingDetail.spendingDetailTexts.fridgeNotice)) : null)), editing ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.footer, {
      paddingBottom: insets.bottom + 14
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: cancelEdit,
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.cancelButton, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.cancelText
  }, _spendingDetail.spendingDetailTexts.cancelLabel)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.doneWrap
  }, /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: _spendingDetail.spendingDetailTexts.doneLabel,
    onPress: saveEdit
  }))) : null, /*#__PURE__*/_react.default.createElement(_DatePickerSheet.default, {
    visible: dateSheetVisible,
    value: (0, _format.fromDateString)(draft?.date ?? date),
    maximumDate: new Date(),
    onChange: picked => patchDraft({
      date: (0, _format.toDateString)(picked)
    }),
    onClose: () => setDateSheetVisible(false)
  }));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  pressed: {
    opacity: 0.75
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  editButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: _theme.radius.pill,
    backgroundColor: _theme.colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center'
  },
  editButtonText: {
    marginLeft: 4,
    fontFamily: _theme.fonts.bold,
    fontSize: 15,
    color: _theme.colors.green
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4
  },
  summaryCard: {
    borderRadius: 32,
    backgroundColor: _theme.colors.heroBg,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24
  },
  label: {
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: _theme.colors.green
  },
  store: {
    marginTop: 4,
    fontFamily: _theme.fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: _theme.colors.textPrimary
  },
  date: {
    marginTop: 6,
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  },
  divider: {
    height: _reactNative.StyleSheet.hairlineWidth * 2,
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: _theme.colors.progressTrack
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  totalLabel: {
    marginBottom: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 17,
    color: _theme.colors.textSecondary
  },
  totalAmount: {
    fontFamily: _theme.fonts.bold,
    fontSize: 34,
    lineHeight: 44,
    color: _theme.colors.textPrimary
  },
  totalUnit: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 22,
    color: _theme.colors.textPrimary
  },
  sectionCount: {
    fontFamily: _theme.fonts.bold,
    fontSize: 22,
    color: _theme.colors.green
  },
  fridgeBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fridgeBadgeText: {
    marginLeft: 6,
    fontFamily: _theme.fonts.medium,
    fontSize: 15,
    color: _theme.colors.green
  },
  notice: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: _theme.colors.cardBg,
    paddingVertical: 18,
    paddingHorizontal: 18
  },
  noticeText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  emptyBox: {
    marginTop: 8,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: _theme.colors.cardBg,
    paddingVertical: 32,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontFamily: _theme.fonts.medium,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  emptyHint: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  // 수정 모드
  warnBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    backgroundColor: _theme.colors.warnBg,
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  warnTexts: {
    flex: 1,
    marginLeft: 10
  },
  warnText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: _theme.colors.warnText
  },
  warnAction: {
    marginTop: 8,
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    color: _theme.colors.warnText,
    textDecorationLine: 'underline'
  },
  cardGap: {
    marginBottom: 12
  },
  fridgeNote: {
    marginTop: 14,
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: _theme.colors.textSecondary
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: _theme.spacing.screenX,
    backgroundColor: _theme.colors.background,
    borderTopWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderTopColor: _theme.colors.divider
  },
  cancelButton: {
    width: 96,
    height: 56,
    marginRight: 10,
    borderRadius: 28,
    backgroundColor: _theme.colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.green
  },
  doneWrap: {
    flex: 1
  }
});
},
"src/components/PurchasedItemRow.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PurchasedItemRow;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
var _format = __load("src/utils/format.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 지출 상세의 구매 품목 한 줄 (inFridge 면 초록 냉장고 아이콘, 아니면 회색 가방)
function PurchasedItemRow({
  name,
  unitPrice,
  quantity,
  inFridge
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.row
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: inFridge ? 'fridge-outline' : 'bag-personal-outline',
    iconColor: inFridge ? _theme.colors.green : _theme.colors.textSecondary,
    backgroundColor: inFridge ? _theme.colors.tabActiveBg : _theme.colors.cardBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.name,
    numberOfLines: 1
  }, name), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sub
  }, (0, _format.formatNumber)(unitPrice), "\uC6D0 \xD7 ", quantity)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sum
  }, (0, _format.formatNumber)(unitPrice * quantity), "\uC6D0"));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  texts: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8
  },
  name: {
    fontFamily: _theme.fonts.medium,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  sub: {
    marginTop: 1,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  sum: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  }
});
},
"src/data/spending/spendingDetail.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.spendingDetailTexts = void 0;
// 지출 상세 화면 문구.
// 구매 품목 데이터는 소비 내역(transaction)의 items 에 들어 있습니다. (data/spending/spending.js 참고)

const spendingDetailTexts = exports.spendingDetailTexts = {
  title: '지출 상세',
  totalLabel: '총 지출',
  itemsTitle: '구매한 품목',
  fridgeBadge: count => `냉장고에 ${count}개 담김`,
  fridgeNotice: '냉장고에 담은 식품은 냉장고 탭에서 볼 수 있어요.',
  emptyItems: '기록된 품목이 없어요.',
  emptyItemsHint: '영수증으로 기록하면 구매 품목도 함께 저장돼요.',
  notFound: '지출 내역을 찾을 수 없어요.',
  receiptLabel: '영수증',
  editLabel: '수정',
  editTitle: '지출 수정',
  doneLabel: '수정 완료',
  cancelLabel: '취소',
  nameLabel: '이름',
  namePlaceholder: '예: 이마트, 스타벅스, 온라인 주문',
  dateLabel: '구매일',
  addItemLabel: '품목 추가',
  editFridgeNote: '냉장고에 담긴 식재료는 여기서 바뀌지 않아요. 냉장고 탭에서 수정해 주세요.',
  mismatch: (total, itemsTotal) => `총 지출(${total}원)과 품목 합계(${itemsTotal}원)가 달라요.`,
  matchAction: '품목 합계로 맞추기',
  deleteTitle: '지출 내역을 삭제할까요?',
  deleteMessage: title => `'${title}' 내역이 삭제되고 이번 달 지출 합계에서도 빠져요. 냉장고에 담은 식재료는 그대로 남아요.`
};
},
"src/screens/SpendingAllScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SpendingAllScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _TransactionRow = _interopRequireDefault(__load("src/components/TransactionRow.js"));
var _spendingAll = __load("src/data/spending/spendingAll.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// "2026-10" -> "2026년 10월"
const formatMonthLabel = monthKey => {
  const [y, m] = monthKey.split('-').map(Number);
  return `${y}년 ${m}월`;
};

// 소비 > 전체보기. 모든 지출을 달별로 묶어 최신순으로 보여 주고, 누르면 지출 상세로 이동합니다.
function SpendingAllScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    transactions
  } = (0, _AppDataContext.useAppData)();
  const {
    groups,
    total
  } = (0, _react.useMemo)(() => {
    // 날짜 최신순 (같은 날짜면 나중에 추가한 것이 위 - 소비 화면과 같은 규칙)
    const sorted = [...transactions].sort(_format.compareDateDesc);
    const byMonth = new Map();
    sorted.forEach(tx => {
      const key = tx.date.slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, {
        key,
        list: [],
        sum: 0
      });
      const group = byMonth.get(key);
      group.list.push(tx);
      group.sum += tx.amount;
    });
    return {
      groups: [...byMonth.values()],
      total: sorted.reduce((sum, tx) => sum + tx.amount, 0)
    };
  }, [transactions]);
  const subtitle = transactions.length > 0 ? `총 ${transactions.length}${_spendingAll.spendingAllTexts.countUnit} · ${_spendingAll.spendingAllTexts.sumLabel} ${(0, _format.formatNumber)(total)}원` : undefined;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 24,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: _spendingAll.spendingAllTexts.title,
    subtitle: subtitle,
    onBack: () => navigation.goBack()
  }), groups.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.empty
  }, _spendingAll.spendingAllTexts.emptyText) : groups.map((group, index) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: group.key
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.monthHeader, index > 0 && styles.monthHeaderNext]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.monthLabel
  }, formatMonthLabel(group.key)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.monthSum
  }, (0, _format.formatNumber)(group.sum), "\uC6D0")), group.list.map(tx => /*#__PURE__*/_react.default.createElement(_TransactionRow.default, _extends({
    key: tx.id
  }, tx, {
    date: (0, _format.formatMonthDay)(tx.date),
    onPress: () => navigation.navigate('SpendingDetail', {
      id: tx.id
    })
  })))))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  monthHeader: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  monthHeaderNext: {
    marginTop: 22
  },
  monthLabel: {
    fontFamily: _theme.fonts.bold,
    fontSize: 18,
    color: _theme.colors.textPrimary
  },
  monthSum: {
    fontFamily: _theme.fonts.medium,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  }
});
},
"src/data/spending/spendingAll.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.spendingAllTexts = void 0;
// 소비 > 전체보기 화면 문구.
const spendingAllTexts = exports.spendingAllTexts = {
  title: '전체 지출 내역',
  countUnit: '건',
  sumLabel: '합계',
  emptyText: '아직 지출 내역이 없어요.'
};
},
"src/screens/EmergencyDetailScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = EmergencyDetailScreen;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _emergencyGuides = __load("src/data/lifeInfo/emergencyGuides.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 비상매뉴얼 > 상황별 대처. params: { id, title, tone } (id 를 모르면 "일반 대처"(general) 안내를 보여 줍니다)
const SCREEN_X = 20;
function EmergencyDetailScreen({
  navigation,
  route
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    id,
    title,
    tone
  } = route.params ?? {};
  const guide = _emergencyGuides.emergencyGuides[id] ?? _emergencyGuides.emergencyGuides.general;
  const isAccent = tone === 'accent';
  const handleCall = ({
    number,
    label
  }) => {
    _reactNative.Alert.alert(`${number}에 전화할까요?`, label, [{
      text: '취소',
      style: 'cancel'
    }, {
      text: '전화 걸기',
      onPress: () => _reactNative.Linking.openURL(`tel:${number}`)
    }]);
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 40,
      paddingHorizontal: SCREEN_X
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: title ?? '상황별 대처',
    color: _theme.emergencyColors.text,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.summary
  }, guide.summary), guide.call ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => handleCall(guide.call),
    accessibilityRole: "button",
    accessibilityLabel: `${guide.call.number} ${guide.call.label} 전화 걸기`,
    style: ({
      pressed
    }) => [styles.callCard, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.callTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.callLabel
  }, guide.call.label), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.callNumber
  }, guide.call.number)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.callIcon
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.MaterialCommunityIcons, {
    name: "phone",
    size: 24,
    color: _theme.colors.white
  }))) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, "\uC774\uB807\uAC8C \uD574 \uBCF4\uC138\uC694"), guide.steps.map((step, index) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: step.title,
    style: styles.stepRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.stepBadge, isAccent && styles.stepBadgeAccent]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepNumber
  }, index + 1)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.stepTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepTitle
  }, step.title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepBody
  }, step.body)))), guide.donts?.length ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.dontCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.dontTitle
  }, "\uC774\uAC74 \uD53C\uD574 \uC8FC\uC138\uC694"), guide.donts.map(text => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: text,
    style: styles.dontRow
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "close-circle",
    size: 18,
    color: _theme.emergencyColors.danger
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.dontText
  }, text)))) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.footer
  }, _emergencyGuides.guideFooterNote)));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  pressed: {
    opacity: 0.85
  },
  summary: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: _theme.emergencyColors.textSecondary
  },
  callCard: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: _theme.emergencyColors.dangerBorder,
    backgroundColor: _theme.emergencyColors.dangerBg,
    paddingVertical: 14,
    paddingHorizontal: 18
  },
  callTexts: {
    flex: 1
  },
  callLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: _theme.emergencyColors.textSecondary
  },
  callNumber: {
    fontFamily: _theme.fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: _theme.emergencyColors.danger
  },
  callIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: _theme.emergencyColors.danger,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.emergencyColors.text
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 18
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: _theme.emergencyColors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  stepBadgeAccent: {
    backgroundColor: _theme.emergencyColors.accent
  },
  stepNumber: {
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    color: _theme.colors.white
  },
  stepTexts: {
    flex: 1,
    marginLeft: 14
  },
  stepTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    color: _theme.emergencyColors.text
  },
  stepBody: {
    marginTop: 2,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: _theme.emergencyColors.textSecondary
  },
  dontCard: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: _theme.emergencyColors.surface,
    borderWidth: 1,
    borderColor: _theme.emergencyColors.border,
    paddingVertical: 16,
    paddingHorizontal: 18
  },
  dontTitle: {
    marginBottom: 10,
    fontFamily: _theme.fonts.bold,
    fontSize: 15,
    color: _theme.emergencyColors.danger
  },
  dontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  dontText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.text
  },
  footer: {
    marginTop: 22,
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: _theme.emergencyColors.textSecondary
  }
});
},
"src/data/lifeInfo/emergencyGuides.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.guideFooterNote = exports.emergencyGuides = void 0;
// 상황별 대처 안내. emergency.js 의 item.id 와 같은 id 를 씁니다.
// call: 먼저 걸 번호(없으면 null), steps: 따라 할 행동, donts: 하지 말아야 할 행동
// 일반적인 안전 수칙 초안이므로 배포 전에 팀에서 검수하세요.

const emergencyGuides = exports.emergencyGuides = {
  fire: {
    summary: '불길보다 연기가 더 위험해요. 먼저 몸을 피하는 게 우선이에요.',
    call: {
      number: '119',
      label: '화재 신고'
    },
    steps: [{
      title: '크게 알리고 대피하기',
      body: '"불이야!"라고 외쳐 주변에 알리고, 바로 밖으로 나가요.'
    }, {
      title: '낮은 자세로 이동하기',
      body: '젖은 수건으로 코와 입을 막고, 연기를 피해 몸을 낮춰요.'
    }, {
      title: '문은 손잡이부터 확인하기',
      body: '손잡이가 뜨거우면 열지 말고 다른 길을 찾아요.'
    }, {
      title: '엘리베이터 대신 계단 이용하기',
      body: '대피 후에는 119에 정확한 주소를 알려 주세요.'
    }, {
      title: '초기 불이라면 소화기 사용하기',
      body: '안전핀을 뽑고, 불 아래쪽을 향해 빗자루로 쓸듯이 뿌려요.'
    }],
    donts: ['엘리베이터 타기', '짐을 챙기러 다시 들어가기', '연기 속에서 서서 이동하기']
  },
  crime: {
    summary: '나를 지키는 게 먼저예요. 직접 맞서지 말고 안전한 곳으로 이동해요.',
    call: {
      number: '112',
      label: '범죄·위협 신고'
    },
    steps: [{
      title: '안전한 곳으로 이동하기',
      body: '사람이 많고 밝은 곳, 편의점이나 가게 안으로 들어가요.'
    }, {
      title: '112에 신고하기',
      body: '말하기 어려우면 112 문자 신고를 이용할 수 있어요.'
    }, {
      title: '문을 잠그고 열어 주지 않기',
      body: '집 안에 있다면 현관을 잠그고, 경찰이 올 때까지 열지 않아요.'
    }, {
      title: '증거 남기기',
      body: '문자, 통화 기록, 사진, 영상을 지우지 말고 보관해요.'
    }],
    donts: ['직접 맞서거나 따라가기', '증거가 될 기록 삭제하기']
  },
  disaster: {
    summary: '흔들리는 동안에는 머리를 보호하고, 멈춘 뒤에 침착하게 대피해요.',
    call: {
      number: '119',
      label: '구조·구급'
    },
    steps: [{
      title: '머리와 몸 보호하기',
      body: '튼튼한 탁자 아래로 들어가 머리를 감싸요.'
    }, {
      title: '흔들림이 멈추면 가스·전기 차단하기',
      body: '불씨가 남지 않게 밸브와 차단기를 내려요.'
    }, {
      title: '계단으로 대피하기',
      body: '엘리베이터는 쓰지 않고, 건물과 유리창에서 떨어진 넓은 곳으로 가요.'
    }, {
      title: '재난 문자와 안내 방송 확인하기',
      body: '태풍·홍수는 저지대와 지하를 피해 높은 곳으로 이동해요.'
    }],
    donts: ['엘리베이터 이용하기', '건물 벽이나 유리창 옆에 머물기']
  },
  patient: {
    summary: '의식과 호흡부터 확인하고, 바로 119에 도움을 요청해요.',
    call: {
      number: '119',
      label: '응급 구조·구급'
    },
    steps: [{
      title: '119에 신고하기',
      body: '위치와 상태를 알리고, 안내에 따라 움직여요.'
    }, {
      title: '의식과 호흡 확인하기',
      body: '어깨를 두드리며 불러 보고, 숨을 쉬는지 살펴요.'
    }, {
      title: '호흡이 없으면 심폐소생술 시작하기',
      body: '가슴 가운데를 강하고 빠르게 누르고, 자동심장충격기(AED)를 요청해요.'
    }, {
      title: '화상은 흐르는 찬물로 식히기',
      body: '옷 위로 10분 이상 식히고, 물집은 터뜨리지 않아요.'
    }],
    donts: ['환자를 함부로 옮기기', '화상 부위에 얼음 직접 대기']
  },
  leak: {
    summary: '물을 먼저 멈추고, 전기 근처라면 차단기부터 내려요.',
    call: null,
    steps: [{
      title: '물이 새는 곳 확인하기',
      body: '수도꼭지, 배관, 천장 중 어디인지 먼저 살펴요.'
    }, {
      title: '밸브 잠그기',
      body: '해당 수도 밸브나 집 전체 수도 밸브를 잠가요.'
    }, {
      title: '전기 근처라면 차단기 내리기',
      body: '물이 콘센트나 전선 가까이에 있으면 가장 먼저 내려요.'
    }, {
      title: '관리실·집주인에게 알리기',
      body: '아랫집 피해를 막기 위해 바로 연락해요.'
    }, {
      title: '사진과 영상으로 기록하기',
      body: '수리 책임을 가릴 때 필요해요. 그다음 물기를 닦아요.'
    }],
    donts: ['젖은 손으로 전기 만지기', '피해 상황 기록 없이 바로 치우기']
  },
  power: {
    summary: '우리 집만 나갔는지, 건물 전체인지부터 확인해요.',
    call: {
      number: '123',
      label: '한국전력 고객센터'
    },
    steps: [{
      title: '주변 상황 확인하기',
      body: '복도 불이나 이웃집도 꺼졌는지 보고, 건물 전체면 관리실에 문의해요.'
    }, {
      title: '가전 플러그 뽑기',
      body: '다시 켜질 때 생기는 과전류를 막을 수 있어요.'
    }, {
      title: '차단기 확인하기',
      body: '내려간 차단기를 올려 보세요.'
    }, {
      title: '또 내려가면 사용 중단하기',
      body: '누전일 수 있어요. 관리실이나 전기 업체에 점검을 요청해요.'
    }],
    donts: ['젖은 손으로 차단기 만지기', '계속 내려가는 차단기를 반복해서 올리기']
  },
  pest: {
    summary: '먹이와 틈새를 줄이는 게 가장 효과적이에요.',
    call: null,
    steps: [{
      title: '먹이 없애기',
      body: '음식물 쓰레기는 바로 버리고, 식재료는 밀폐해서 보관해요.'
    }, {
      title: '물기와 틈새 정리하기',
      body: '싱크대와 배수구 주변을 말리고 틈은 막아요.'
    }, {
      title: '트랩이나 젤 미끼 두기',
      body: '이동 경로인 구석과 싱크대 아래에 놓아요.'
    }, {
      title: '심하면 관리실에 알리기',
      body: '건물 전체 방역이 필요한 경우가 많아요.'
    }],
    donts: ['음식물을 밖에 두기', '분무형 살충제를 음식 근처에 뿌리기']
  },
  lost: {
    summary: '빨리 막을수록 피해가 줄어요. 가장 위험한 것부터 정지해요.',
    call: null,
    steps: [{
      title: '카드는 카드사에 분실 신고하기',
      body: '앱이나 고객센터에서 바로 사용을 정지해요.'
    }, {
      title: '휴대폰은 위치 찾기와 잠금 사용하기',
      body: '통신사 일시정지도 요청하고, 주요 계정 비밀번호를 바꿔요.'
    }, {
      title: '열쇠를 잃어버렸다면 도어락 점검하기',
      body: '비밀번호를 바꾸거나 열쇠를 교체하고, 집주인에게 알려요.'
    }, {
      title: '도난이면 112 또는 경찰서에 신고하기',
      body: '신고 후 받은 확인서는 재발급과 보상에 쓰여요.'
    }],
    donts: ['신고 없이 며칠 두고 보기', '같은 비밀번호를 그대로 쓰기']
  },
  general: {
    summary: '어떤 상황이든 안전 확인이 먼저예요. 아래 순서를 기억해 두세요.',
    call: {
      number: '119',
      label: '위급하면 먼저 신고'
    },
    steps: [{
      title: '나와 주변의 안전 확인하기',
      body: '위험하면 먼저 그 자리를 벗어나요.'
    }, {
      title: '위급하면 119·112에 신고하기',
      body: '정확한 주소와 상황을 침착하게 말해요.'
    }, {
      title: '관리실이나 집주인에게 알리기',
      body: '건물 설비 문제는 혼자 해결하려 하지 않아도 돼요.'
    }, {
      title: '사진과 기록 남기기',
      body: '나중에 수리, 보험, 신고에 도움이 돼요.'
    }],
    donts: ['혼자 무리해서 해결하려 하기']
  }
};
const guideFooterNote = exports.guideFooterNote = '일반적인 안전 수칙이에요. 상황이 위급하면 안내를 기다리지 말고 먼저 119·112에 신고하세요.';
},
"src/screens/AiManagerScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AiManagerScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _AiSayCard = _interopRequireDefault(__load("src/components/AiSayCard.js"));
var _aiManager = __load("src/data/lifeInfo/aiManager.js");
var _spending = __load("src/data/spending/spending.js");
var _fridge = __load("src/data/fridge/fridge.js");
var _reports = __load("src/data/lifeInfo/reports.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _reportSummary = __load("src/utils/reportSummary.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 생활정보 > AI 자취 매니저 (채팅 화면)
function AiManagerScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    title,
    notice,
    greeting,
    inputPlaceholder,
    suggestionsLabel,
    suggestions,
    reportButtons
  } = _aiManager.aiManagerData;
  const {
    transactions,
    fridgeItems
  } = (0, _AppDataContext.useAppData)();
  // 상단 "AI 한마디": 소비·냉장고 데이터를 요약한 한두 문장 (utils/reportSummary.js)
  const report = (0, _react.useMemo)(() => {
    const now = new Date();
    return (0, _reportSummary.getMonthlyReport)({
      transactions,
      fridgeItems,
      budget: _spending.spendingData.budget,
      now,
      baseDate: (0, _format.toDateString)(now),
      urgentWithinDays: _fridge.fridgeData.urgentWithinDays
    });
  }, [transactions, fridgeItems]);
  const [messages, setMessages] = (0, _react.useState)([{
    id: 'greeting',
    from: 'ai',
    text: greeting
  }]);
  const [input, setInput] = (0, _react.useState)('');
  const [typing, setTyping] = (0, _react.useState)(false);
  const scrollRef = (0, _react.useRef)(null);
  const timerRef = (0, _react.useRef)(null);
  const nextId = (0, _react.useRef)(1);
  (0, _react.useEffect)(() => () => clearTimeout(timerRef.current), []);
  const send = raw => {
    const text = raw.trim();
    if (!text || typing) return;
    setMessages(prev => [...prev, {
      id: `u${nextId.current++}`,
      from: 'user',
      text
    }]);
    setInput('');
    setTyping(true);
    // 생각하는 것처럼 보이도록 잠깐 기다렸다가 답합니다.
    timerRef.current = setTimeout(() => {
      const reply = (0, _aiManager.getReply)(text);
      setMessages(prev => [...prev, {
        id: `a${nextId.current++}`,
        from: 'ai',
        ...reply
      }]);
      setTyping(false);
    }, 700);
  };
  const handleAction = action => {
    if (action.tab) navigation.navigate('Tabs', {
      screen: action.tab
    });else navigation.navigate(action.screen, action.params);
  };
  const canSend = input.trim().length > 0 && !typing;
  const onlyGreeting = messages.length === 1;
  return /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.container,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.header, {
      paddingTop: insets.top + 14
    }]
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: title,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.notice
  }, notice)), /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    ref: scrollRef,
    style: styles.list,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled",
    contentContainerStyle: styles.listContent,
    onContentSizeChange: () => {
      if (messages.length > 1 || typing) scrollRef.current?.scrollToEnd({
        animated: true
      });
    }
  }, /*#__PURE__*/_react.default.createElement(_AiSayCard.default, {
    label: _reports.reportTexts.detail.aiLabel,
    text: report.comment,
    style: styles.sayCard
  }), messages.map(m => m.from === 'user' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: m.id,
    style: styles.userRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.userBubble
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.userText
  }, m.text))) : /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: m.id,
    style: styles.aiRow
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: "forum-outline",
    size: 36,
    borderRadius: 12,
    iconColor: _theme.colors.green,
    backgroundColor: _theme.colors.badgeBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.aiCol
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.aiBubble
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.aiText
  }, m.text)), m.action ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => handleAction(m.action),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.actionChip, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.actionText
  }, m.action.label), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-forward",
    size: 16,
    color: _theme.colors.green
  })) : null))), typing ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.aiRow
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: "forum-outline",
    size: 36,
    borderRadius: 12,
    iconColor: _theme.colors.green,
    backgroundColor: _theme.colors.badgeBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.aiBubble, styles.aiCol]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.typingText
  }, "\uB2F5\uBCC0\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC5B4\uC694\u2026"))) : null, onlyGreeting ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.suggestions
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.suggestionsLabel
  }, suggestionsLabel), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.chipWrap
  }, suggestions.map(s => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: s,
    onPress: () => send(s),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.suggestChip, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.suggestText
  }, s))))) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.reportRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => navigation.navigate('ReportDetail'),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.reportButton, styles.reportPrimary, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "document-text-outline",
    size: 18,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.reportText
  }, reportButtons.detail)), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => navigation.navigate('ReportList'),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.reportButton, styles.reportSecondary, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "time-outline",
    size: 18,
    color: _theme.colors.green
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.reportText
  }, reportButtons.past))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.inputBar, {
      paddingBottom: Math.max(insets.bottom, 12)
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.inputBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    value: input,
    onChangeText: setInput,
    placeholder: inputPlaceholder,
    placeholderTextColor: _theme.colors.placeholder,
    style: styles.input,
    returnKeyType: "send",
    onSubmitEditing: () => send(input),
    accessibilityLabel: "\uB9E4\uB2C8\uC800\uC5D0\uAC8C \uBCF4\uB0BC \uC9C8\uBB38"
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => send(input),
    disabled: !canSend,
    accessibilityRole: "button",
    accessibilityLabel: "\uBCF4\uB0B4\uAE30",
    style: [styles.sendButton, !canSend && styles.sendDisabled]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-up",
    size: 24,
    color: _theme.colors.white
  }))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  header: {
    paddingHorizontal: _theme.spacing.screenX,
    paddingBottom: 4
  },
  notice: {
    marginTop: -12,
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: _theme.colors.textSecondary
  },
  pressed: {
    opacity: 0.75
  },
  list: {
    flex: 1
  },
  sayCard: {
    marginBottom: 18
  },
  reportRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: _theme.spacing.screenX,
    paddingTop: 10
  },
  reportButton: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 23
  },
  reportPrimary: {
    backgroundColor: _theme.colors.tabActiveBg
  },
  reportSecondary: {
    borderWidth: 1.5,
    borderColor: _theme.colors.badgeBg,
    backgroundColor: _theme.colors.white
  },
  reportText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 14.5,
    color: _theme.colors.green
  },
  listContent: {
    paddingHorizontal: _theme.spacing.screenX,
    paddingTop: 16,
    paddingBottom: 16
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  aiCol: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start'
  },
  aiBubble: {
    maxWidth: '92%',
    backgroundColor: _theme.colors.cardBg,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  aiText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: _theme.colors.textPrimary
  },
  typingText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  actionChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: _theme.colors.tabActiveBg
  },
  actionText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    color: _theme.colors.green
  },
  userRow: {
    alignItems: 'flex-end',
    marginBottom: 14
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: _theme.colors.green,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  userText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: _theme.colors.white
  },
  suggestions: {
    marginTop: 10
  },
  suggestionsLabel: {
    marginBottom: 10,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  suggestChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.white
  },
  suggestText: {
    fontFamily: _theme.fonts.medium,
    fontSize: 14,
    color: _theme.colors.textPrimary
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: _theme.spacing.screenX,
    paddingTop: 10,
    borderTopWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderTopColor: _theme.colors.divider,
    backgroundColor: _theme.colors.white
  },
  inputBox: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: _theme.colors.cardBg,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  input: {
    padding: 0,
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  sendButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 25,
    backgroundColor: _theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendDisabled: {
    backgroundColor: _theme.colors.checkboxBorder
  }
});
},
"src/components/AiSayCard.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AiSayCard;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// "AI 한마디" 카드 (연한 초록 배경 + 반짝이 아이콘 + 라벨 + 글). AI 자취 매니저 상단과 리포트 상세에서 같이 씁니다.
function AiSayCard({
  label,
  text,
  style
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.card, style]
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: "creation",
    size: 30,
    borderRadius: 10,
    iconColor: _theme.colors.green,
    backgroundColor: _theme.colors.badgeBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.label
  }, label), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.text
  }, text)));
}
const styles = _reactNative.StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: _theme.radius.card,
    backgroundColor: _theme.colors.heroBg,
    padding: 16
  },
  texts: {
    flex: 1,
    marginLeft: 10
  },
  label: {
    fontFamily: _theme.fonts.bold,
    fontSize: 12,
    color: _theme.colors.green
  },
  text: {
    marginTop: 2,
    fontFamily: _theme.fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: _theme.colors.textPrimary
  }
});
},
"src/data/lifeInfo/aiManager.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.aiManagerData = void 0;
exports.getReply = getReply;
// AI 자취 매니저 문구와 임시 답변. 키워드가 들어 있으면 미리 적어 둔 답을 돌려주는 "가짜 AI"입니다.
// TODO: 실제 AI API 는 AiManagerScreen 의 getReply 를 서버 호출로 바꾸세요.
// action: 답변 아래 바로가기 버튼 { label, screen, params }. tab 이 있으면 하단 탭 화면으로 이동합니다.

const aiManagerData = exports.aiManagerData = {
  title: 'AI 자취 매니저',
  notice: 'AI 답변은 참고용이에요. 위급한 상황은 119·112로 먼저 연락하세요.',
  greeting: '안녕하세요! 혼자 살면서 궁금했던 일, 편하게 물어보세요.',
  inputPlaceholder: '궁금한 점을 입력하세요',
  suggestionsLabel: '이런 걸 물어볼 수 있어요',
  suggestions: ['천장에서 물이 새요', '유통기한 지난 음식은요?', '이번 달 소비 점검해줘', '청소 주기 알려줘'],
  // 하단 리포트 버튼 (리포트 내용은 data/lifeInfo/reports.js, utils/reportSummary.js)
  reportButtons: {
    detail: '리포트 상세보기',
    past: '지난 리포트 보기'
  },
  fallback: {
    text: '아직 잘 모르는 질문이에요. 누수, 정전, 냉장고, 소비, 청소처럼 생활 이야기를 물어봐 주세요.',
    action: null
  },
  replies: [{
    keywords: ['누수', '물이 새', '천장', '단수'],
    text: '먼저 수도 밸브를 잠그고, 전선 근처에 물이 있다면 차단기를 내려 주세요. 그다음 집주인이나 관리실에 알리고 사진으로 기록해 두면 좋아요.',
    action: {
      label: '누수·단수 대처 보기',
      screen: 'EmergencyDetail',
      params: {
        id: 'leak',
        title: '누수·단수',
        tone: 'accent'
      }
    }
  }, {
    keywords: ['정전', '차단기', '전기'],
    text: '우리 집만 꺼졌는지 건물 전체인지부터 확인해 보세요. 차단기가 계속 내려가면 누전일 수 있으니 사용을 멈추고 점검을 요청하세요.',
    action: {
      label: '정전·차단기 대처 보기',
      screen: 'EmergencyDetail',
      params: {
        id: 'power',
        title: '정전·차단기',
        tone: 'accent'
      }
    }
  }, {
    keywords: ['화재', '불이', '연기'],
    text: '연기가 보이면 먼저 대피하고 119에 신고하세요. 엘리베이터는 타지 마세요.',
    action: {
      label: '화재·연기 대처 보기',
      screen: 'EmergencyDetail',
      params: {
        id: 'fire',
        title: '화재·연기',
        tone: 'default'
      }
    }
  }, {
    keywords: ['유통기한', '냉장고', '식재료', '상한', '상했'],
    text: '냉장고 탭에서 기한이 임박한 식재료를 한눈에 볼 수 있어요. 기한이 지난 음식은 아깝더라도 먹지 않는 게 안전해요.',
    action: {
      label: '냉장고 보러 가기',
      tab: 'Fridge'
    }
  }, {
    keywords: ['소비', '지출', '예산', '돈', '가계부'],
    text: '소비 탭에서 이번 달 지출과 남은 예산을 확인할 수 있어요. 지출 분석에서 어떤 항목에 많이 썼는지도 볼 수 있어요.',
    action: {
      label: '소비 보러 가기',
      tab: 'Spending'
    }
  }, {
    keywords: ['청소', '빨래', '루틴', '습관'],
    text: '청소와 빨래처럼 반복되는 일은 루틴으로 만들어 두면 잊지 않아요. 시간을 정해서 매일 체크해 보세요.',
    action: {
      label: '생활 루틴 설정하기',
      screen: 'Routine'
    }
  }, {
    keywords: ['할 일', '해야', '일정'],
    text: '할 일에 마감일을 적어 두면 급한 순서대로 정리돼요. 오늘 할 일부터 하나씩 추가해 보세요.',
    action: {
      label: '할 일 기록하기',
      screen: 'Todo'
    }
  }, {
    keywords: ['도난', '분실', '잃어', '지갑', '열쇠'],
    text: '카드는 카드사에 바로 정지 요청하고, 도난이면 112에 신고하세요. 열쇠를 잃어버렸다면 도어락 비밀번호나 열쇠 교체도 알아보세요.',
    action: {
      label: '분실·도난 대처 보기',
      screen: 'EmergencyDetail',
      params: {
        id: 'lost',
        title: '분실·도난 후 조치',
        tone: 'accent'
      }
    }
  }]
};

// 입력에 키워드가 들어 있는 첫 번째 답변 찾기
function getReply(text) {
  const found = aiManagerData.replies.find(r => r.keywords.some(k => text.includes(k)));
  return found ?? aiManagerData.fallback;
}
},
"src/data/lifeInfo/reports.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reportTexts = exports.pastReports = void 0;
// AI 리포트 화면의 문구와 "지난 리포트" 더미 데이터.
// - monthsAgo: 몇 달 전 리포트인지 (실제 월은 화면에서 오늘 기준으로 계산). 실제 데이터에는 year / month 를 쓰세요.
// - categories: [{ name, percent }], fridge: { total, urgent, expired }
// TODO: 지난 리포트는 서버에 저장된 월별 리포트를 불러와 snapshot 모양으로 넘기세요. (이번 달 리포트는 utils/reportSummary.js 가 계산합니다.)

const reportTexts = exports.reportTexts = {
  detail: {
    aiLabel: 'AI 한마디',
    spendingTitle: '소비',
    fridgeTitle: '냉장고',
    tipsTitle: 'AI 제안',
    noSpendingText: '아직 지출 기록이 없어요.',
    fridgeLabels: {
      total: '보관 중',
      urgent: '임박',
      expired: '기한 지남'
    }
  },
  list: {
    title: '지난 리포트',
    subtitle: '월별로 쌓인 리포트를 다시 볼 수 있어요',
    chartTitle: '월별 예산 사용률',
    listTitle: '리포트 목록',
    emptyText: '아직 지난 리포트가 없어요.'
  }
};
const pastReports = exports.pastReports = [{
  id: 'r1',
  monthsAgo: 1,
  spent: 590000,
  budget: 1000000,
  categories: [{
    name: '식료품',
    percent: 41
  }, {
    name: '식비',
    percent: 27
  }, {
    name: '생활용품',
    percent: 14
  }],
  fridge: {
    total: 11,
    urgent: 1,
    expired: 0
  },
  comment: '장보기를 계획적으로 했어요. 이 흐름을 유지해 보세요.',
  tips: ['식료품 비중이 높지만 예산 안에서 잘 관리했어요.', '냉장고를 꾸준히 확인하는 습관을 이어 가세요.']
}, {
  id: 'r2',
  monthsAgo: 2,
  spent: 660000,
  budget: 1000000,
  categories: [{
    name: '식비',
    percent: 38
  }, {
    name: '식료품',
    percent: 30
  }, {
    name: '카페·간식',
    percent: 16
  }],
  fridge: {
    total: 9,
    urgent: 3,
    expired: 2
  },
  comment: '외식이 늘고 기한이 지난 식재료도 있었어요.',
  tips: ['외식 횟수를 조금 줄여 보세요.', '기한이 지난 식재료는 바로 정리하세요.']
}, {
  id: 'r3',
  monthsAgo: 3,
  spent: 520000,
  budget: 1000000,
  categories: [{
    name: '식료품',
    percent: 45
  }, {
    name: '생활용품',
    percent: 25
  }, {
    name: '식비',
    percent: 18
  }],
  fridge: {
    total: 12,
    urgent: 2,
    expired: 0
  },
  comment: '고정 지출이 안정적이었어요.',
  tips: ['지금처럼 소비와 냉장고를 꾸준히 기록해 보세요.']
}, {
  id: 'r4',
  monthsAgo: 4,
  spent: 600000,
  budget: 1000000,
  categories: [{
    name: '카페·간식',
    percent: 33
  }, {
    name: '식료품',
    percent: 32
  }, {
    name: '식비',
    percent: 20
  }],
  fridge: {
    total: 10,
    urgent: 3,
    expired: 1
  },
  comment: '더운 날씨로 음료·간식 지출이 늘었어요.',
  tips: ['카페·간식 지출이 큰 편이에요. 이번 달은 횟수를 정해 보세요.']
}];
},
"src/utils/reportSummary.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildPastReport = buildPastReport;
exports.getBudgetTag = getBudgetTag;
exports.getMonthlyReport = getMonthlyReport;
var _format = __load("src/utils/format.js");
var _recipes = __load("src/utils/recipes.js");
var _homeSummary = __load("src/utils/homeSummary.js");
// AI 리포트(AI 한마디, 리포트 상세)에 쓰는 값을 저장소 데이터로 계산합니다.
// TODO: AI 한마디(comment)와 AI 제안(tips)은 지금 규칙으로 만든 문장입니다. 실제 AI 응답으로 바꾸려면 이 파일의 buildComment / buildTips 를 교체하세요.

const sum = list => list.reduce((total, t) => total + t.amount, 0);

// 예산 사용률 -> 태그: { label, warn }
function getBudgetTag(percent) {
  if (percent > 100) return {
    label: '예산 초과',
    warn: true
  };
  if (percent > 70) return {
    label: '예산 근접',
    warn: true
  };
  return {
    label: '예산 지킴',
    warn: false
  };
}
function buildComment({
  month,
  spent,
  budget,
  usedPercent,
  first
}) {
  let spendingLine;
  if (spent === 0) spendingLine = `${month}월 지출 기록이 아직 없어요.`;else if (spent > budget) spendingLine = `이번 달 예산을 ${(0, _format.formatNumber)(spent - budget)}원 넘겼어요.`;else spendingLine = `이번 달 예산의 ${usedPercent}%를 썼고, ${(0, _format.formatNumber)(budget - spent)}원이 남았어요.`;
  return `${spendingLine} ${(0, _homeSummary.getHeroLine)(first)}`;
}
function buildTips({
  spent,
  usedPercent,
  categories,
  urgentNames,
  expiredNames
}) {
  const tips = [];
  if (expiredNames.length) tips.push(`기한이 지난 식재료(${expiredNames.join(', ')})는 확인하고 정리하세요.`);
  if (urgentNames.length) tips.push(`기한이 임박한 식재료(${urgentNames.join(', ')})부터 먼저 드세요.`);
  const top = categories[0];
  if (spent > 0 && top && top.percent >= 40) {
    tips.push(`${top.name} 지출이 ${top.percent}%로 가장 커요. 이번 주 지출을 한 번 점검해 보세요.`);
  }
  if (usedPercent >= 80) tips.push(`예산의 ${usedPercent}%를 썼어요. 남은 기간 지출을 조금 줄여 보세요.`);
  if (!tips.length) tips.push('지금처럼 소비와 냉장고를 꾸준히 기록해 보세요.');
  return tips.slice(0, 3);
}

// 이번 달 리포트. 반환: { year, month, periodLabel, spent, budget, remaining, usedPercent,
//   prevDiffPercent(지난달 같은 기간 대비 %, 비교할 값이 없으면 null), categories: [{ name, amount, percent }],
//   fridge: { total, urgent, expired }, comment, tips }
function getMonthlyReport({
  transactions,
  fridgeItems,
  budget,
  now,
  baseDate,
  urgentWithinDays
}) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const monthKey = `${year}-${(0, _format.pad)(month)}`;
  const thisMonth = transactions.filter(t => t.date.startsWith(monthKey));
  const spent = sum(thisMonth);
  const usedPercent = budget > 0 ? Math.round(spent / budget * 100) : 0;
  const prev = new Date(year, month - 2, 1);
  const prevKey = `${prev.getFullYear()}-${(0, _format.pad)(prev.getMonth() + 1)}`;
  const prevSpent = sum(transactions.filter(t => t.date.startsWith(prevKey) && Number(t.date.slice(8, 10)) <= day));
  const prevDiffPercent = prevSpent > 0 ? Math.round((spent - prevSpent) / prevSpent * 100) : null;
  const byCategory = {};
  thisMonth.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  });
  const categories = Object.entries(byCategory).map(([name, amount]) => ({
    name,
    amount,
    percent: Math.round(amount / spent * 100)
  })).sort((a, b) => b.amount - a.amount).slice(0, 3);
  const entries = (0, _recipes.getFridgeEntries)(fridgeItems, baseDate, urgentWithinDays);
  const expired = entries.filter(e => e.daysLeft < 0);
  const urgent = entries.filter(e => e.urgent && e.daysLeft >= 0);
  const names = list => list.slice(0, 3).map(e => e.name);
  const report = {
    year,
    month,
    periodLabel: `${month}월 1일 ~ ${month}월 ${day}일 기준`,
    spent,
    budget,
    remaining: budget - spent,
    usedPercent,
    prevDiffPercent,
    categories,
    fridge: {
      total: entries.length,
      urgent: urgent.length,
      expired: expired.length
    }
  };
  const first = entries[0] ? {
    name: entries[0].name,
    daysLeft: entries[0].daysLeft
  } : null;
  report.comment = buildComment({
    month,
    spent,
    budget,
    usedPercent,
    first
  });
  report.tips = buildTips({
    spent,
    usedPercent,
    categories,
    urgentNames: names(urgent),
    expiredNames: names(expired)
  });
  return report;
}

// 지난 리포트(더미 snapshot)를 getMonthlyReport 와 같은 모양으로 바꿉니다.
// snapshot.monthsAgo 는 "몇 달 전 리포트인지"입니다 (더미가 언제 봐도 자연스럽도록).
function buildPastReport(snapshot, now) {
  const d = new Date(now.getFullYear(), now.getMonth() - snapshot.monthsAgo, 1);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return {
    id: snapshot.id,
    year,
    month,
    periodLabel: `${month}월 1일 ~ ${month}월 ${lastDay}일`,
    spent: snapshot.spent,
    budget: snapshot.budget,
    remaining: snapshot.budget - snapshot.spent,
    usedPercent: Math.round(snapshot.spent / snapshot.budget * 100),
    prevDiffPercent: null,
    categories: snapshot.categories.map(c => ({
      ...c,
      amount: Math.round(snapshot.spent * c.percent / 100)
    })),
    fridge: snapshot.fridge,
    comment: snapshot.comment,
    tips: snapshot.tips
  };
}
},
"src/screens/EmergencyAiScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = EmergencyAiScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _IconBox = _interopRequireDefault(__load("src/components/IconBox.js"));
var _aiEmergency = __load("src/data/lifeInfo/aiEmergency.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 생활정보 > 비상매뉴얼 > AI 비상 매뉴얼 (AI 자취 매니저와는 별도의 채팅 화면)
function EmergencyAiScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    title,
    notice,
    greeting,
    inputPlaceholder,
    suggestionsLabel,
    suggestions,
    contacts
  } = _aiEmergency.aiEmergencyData;
  const [messages, setMessages] = (0, _react.useState)([{
    id: 'greeting',
    from: 'ai',
    text: greeting,
    steps: []
  }]);
  const [input, setInput] = (0, _react.useState)('');
  const [typing, setTyping] = (0, _react.useState)(false);
  const scrollRef = (0, _react.useRef)(null);
  const timerRef = (0, _react.useRef)(null);
  const nextId = (0, _react.useRef)(1);
  (0, _react.useEffect)(() => () => clearTimeout(timerRef.current), []);
  const send = raw => {
    const text = raw.trim();
    if (!text || typing) return;
    setMessages(prev => [...prev, {
      id: `u${nextId.current++}`,
      from: 'user',
      text
    }]);
    setInput('');
    setTyping(true);
    timerRef.current = setTimeout(() => {
      const reply = (0, _aiEmergency.getEmergencyReply)(text);
      setMessages(prev => [...prev, {
        id: `a${nextId.current++}`,
        from: 'ai',
        ...reply
      }]);
      setTyping(false);
    }, 700);
  };

  // 실수로 눌러 119/112 에 걸리지 않도록 한 번 확인합니다.
  const handleCall = ({
    number,
    label
  }) => {
    _reactNative.Alert.alert(`${number}에 전화할까요?`, label, [{
      text: '취소',
      style: 'cancel'
    }, {
      text: '전화 걸기',
      onPress: () => _reactNative.Linking.openURL(`tel:${number}`)
    }]);
  };
  const canSend = input.trim().length > 0 && !typing;
  const onlyGreeting = messages.length === 1;
  return /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.container,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.header, {
      paddingTop: insets.top + 14
    }]
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: title,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.notice
  }, notice), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.contactRow
  }, contacts.map(contact => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: contact.number,
    onPress: () => handleCall(contact),
    accessibilityRole: "button",
    accessibilityLabel: `${contact.number} ${contact.label} 전화`,
    style: ({
      pressed
    }) => [styles.contactButton, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "call",
    size: 16,
    color: _theme.emergencyColors.danger
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.contactNumber
  }, contact.number), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.contactLabel
  }, contact.label))))), /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    ref: scrollRef,
    style: styles.list,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled",
    contentContainerStyle: styles.listContent,
    onContentSizeChange: () => scrollRef.current?.scrollToEnd({
      animated: true
    })
  }, messages.map(m => m.from === 'user' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: m.id,
    style: styles.userRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.userBubble
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.userText
  }, m.text))) : /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: m.id,
    style: styles.aiRow
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: "shield-alert-outline",
    size: 36,
    borderRadius: 12,
    iconColor: _theme.emergencyColors.accent,
    backgroundColor: _theme.colors.badgeBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.aiCol
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.aiBubble
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.aiText
  }, m.text)), m.call ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => handleCall(m.call),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.callButton, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "call",
    size: 18,
    color: _theme.colors.white
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.callText
  }, m.call.number, " ", m.call.label)) : null, m.steps.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.stepCard
  }, m.steps.map((step, i) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: step.title,
    style: [styles.stepRow, i > 0 && styles.stepRowNext]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.stepNumber
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepNumberText
  }, i + 1)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.stepTexts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepTitle
  }, step.title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.stepBody
  }, step.body))))) : null, m.detail ? /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => navigation.navigate('EmergencyDetail', m.detail),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.detailChip, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.detailText
  }, m.detail.title, " \uC790\uC138\uD788 \uBCF4\uAE30"), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-forward",
    size: 16,
    color: _theme.emergencyColors.accent
  })) : null))), typing ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.aiRow
  }, /*#__PURE__*/_react.default.createElement(_IconBox.default, {
    name: "shield-alert-outline",
    size: 36,
    borderRadius: 12,
    iconColor: _theme.emergencyColors.accent,
    backgroundColor: _theme.colors.badgeBg
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.aiBubble, styles.aiCol]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.typingText
  }, "\uC548\uB0B4\uB97C \uCC3E\uACE0 \uC788\uC5B4\uC694\u2026"))) : null, onlyGreeting ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.suggestions
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.suggestionsLabel
  }, suggestionsLabel), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.chipWrap
  }, suggestions.map(s => /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    key: s,
    onPress: () => send(s),
    accessibilityRole: "button",
    style: ({
      pressed
    }) => [styles.suggestChip, pressed && styles.pressed]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.suggestText
  }, s))))) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.inputBar, {
      paddingBottom: Math.max(insets.bottom, 12)
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.inputBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    value: input,
    onChangeText: setInput,
    placeholder: inputPlaceholder,
    placeholderTextColor: _theme.colors.placeholder,
    style: styles.input,
    returnKeyType: "send",
    onSubmitEditing: () => send(input),
    accessibilityLabel: "\uC0C1\uD669 \uC785\uB825"
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
    onPress: () => send(input),
    disabled: !canSend,
    accessibilityRole: "button",
    accessibilityLabel: "\uBCF4\uB0B4\uAE30",
    style: [styles.sendButton, !canSend && styles.sendDisabled]
  }, /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
    name: "arrow-up",
    size: 24,
    color: _theme.colors.white
  }))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  header: {
    paddingHorizontal: _theme.spacing.screenX,
    paddingBottom: 10
  },
  notice: {
    marginTop: -12,
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: _theme.colors.textSecondary
  },
  contactRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: _theme.emergencyColors.dangerBorder,
    backgroundColor: _theme.emergencyColors.dangerBg
  },
  contactNumber: {
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    color: _theme.emergencyColors.danger
  },
  contactLabel: {
    flexShrink: 1,
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    color: _theme.emergencyColors.text
  },
  pressed: {
    opacity: 0.75
  },
  list: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: _theme.spacing.screenX,
    paddingTop: 16,
    paddingBottom: 16
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  aiCol: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-start'
  },
  aiBubble: {
    maxWidth: '92%',
    backgroundColor: _theme.colors.cardBg,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  aiText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: _theme.colors.textPrimary
  },
  typingText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  callButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: _theme.emergencyColors.danger
  },
  callText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 15,
    color: _theme.colors.white
  },
  stepCard: {
    alignSelf: 'stretch',
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: _theme.emergencyColors.border,
    backgroundColor: _theme.colors.white
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  stepRowNext: {
    marginTop: 14
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: _theme.colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepNumberText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 13,
    color: _theme.emergencyColors.accent
  },
  stepTexts: {
    flex: 1,
    marginLeft: 12
  },
  stepTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: _theme.emergencyColors.text
  },
  stepBody: {
    marginTop: 2,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: _theme.emergencyColors.textSecondary
  },
  detailChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: _theme.colors.tabActiveBg
  },
  detailText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 14,
    color: _theme.emergencyColors.accent
  },
  userRow: {
    alignItems: 'flex-end',
    marginBottom: 14
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: _theme.emergencyColors.accent,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  userText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: _theme.colors.white
  },
  suggestions: {
    marginTop: 10
  },
  suggestionsLabel: {
    marginBottom: 10,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  suggestChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.white
  },
  suggestText: {
    fontFamily: _theme.fonts.medium,
    fontSize: 14,
    color: _theme.colors.textPrimary
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: _theme.spacing.screenX,
    paddingTop: 10,
    borderTopWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderTopColor: _theme.colors.divider,
    backgroundColor: _theme.colors.white
  },
  inputBox: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: _theme.colors.cardBg,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  input: {
    padding: 0,
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  sendButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 25,
    backgroundColor: _theme.emergencyColors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendDisabled: {
    backgroundColor: _theme.colors.checkboxBorder
  }
});
},
"src/data/lifeInfo/aiEmergency.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.aiEmergencyData = void 0;
exports.getEmergencyReply = getEmergencyReply;
var _emergencyGuides = __load("src/data/lifeInfo/emergencyGuides.js");
// AI 비상 매뉴얼 문구와 임시 답변. 키워드가 들어 있으면 emergencyGuides.js 의 안내로 답하는 "가짜 AI"입니다.
// TODO: 실제 AI API 는 EmergencyAiScreen 의 getEmergencyReply 를 서버 호출로 바꾸세요.
//   답변 형식: { text, call: { number, label } | null, steps: [{ title, body }], detail: { id, title, tone } | null }

const aiEmergencyData = exports.aiEmergencyData = {
  title: 'AI 비상 매뉴얼',
  notice: 'AI 답변은 참고용이에요. 위급하면 안내를 기다리지 말고 먼저 신고하세요.',
  greeting: '어떤 상황인가요? 지금 일어난 일을 짧게 적어 주세요.',
  inputPlaceholder: '상황을 입력하세요',
  suggestionsLabel: '이렇게 물어볼 수 있어요',
  suggestions: ['천장에서 물이 새요', '갑자기 정전됐어요', '집에 불이 났어요', '지갑을 잃어버렸어요'],
  contacts: [{
    number: '119',
    label: '화재·구조·구급'
  }, {
    number: '112',
    label: '범죄·위협'
  }],
  stepLimit: 4,
  fallback: {
    text: '어떤 상황인지 잘 모르겠어요. 화재, 누수, 정전, 분실, 다쳤을 때처럼 지금 상황을 조금 더 자세히 적어 주세요. 위급하면 바로 119·112에 연락하세요.',
    call: null,
    steps: [],
    detail: null
  },
  // id 는 emergencyGuides.js / emergency.js 의 id 와 같아야 합니다.
  situations: [{
    id: 'fire',
    title: '화재·연기',
    tone: 'default',
    keywords: ['화재', '불이', '불났', '연기', '소화기']
  }, {
    id: 'crime',
    title: '범죄·신변 위협',
    tone: 'default',
    keywords: ['스토킹', '침입', '도둑', '따라와', '위협', '범죄']
  }, {
    id: 'disaster',
    title: '지진·재난',
    tone: 'default',
    keywords: ['지진', '태풍', '홍수', '재난']
  }, {
    id: 'patient',
    title: '응급환자·부상',
    tone: 'default',
    keywords: ['다쳤', '다침', '쓰러', '화상', '응급', '피가', '아파']
  }, {
    id: 'leak',
    title: '누수·단수',
    tone: 'accent',
    keywords: ['누수', '물이 새', '단수', '천장', '배관']
  }, {
    id: 'power',
    title: '정전·차단기',
    tone: 'accent',
    keywords: ['정전', '차단기', '전기', '누전', '두꺼비집']
  }, {
    id: 'pest',
    title: '벌레·해충',
    tone: 'accent',
    keywords: ['바퀴', '벌레', '모기', '쥐', '해충']
  }, {
    id: 'lost',
    title: '분실·도난 후 조치',
    tone: 'accent',
    keywords: ['분실', '잃어', '도난', '지갑', '열쇠', '휴대폰']
  }]
};

// 입력에 키워드가 들어 있는 첫 번째 상황의 대처 안내로 답을 만듭니다.
function getEmergencyReply(text) {
  const {
    situations,
    stepLimit,
    fallback
  } = aiEmergencyData;
  const found = situations.find(s => s.keywords.some(k => text.includes(k)));
  const guide = found ? _emergencyGuides.emergencyGuides[found.id] : null;
  if (!found || !guide) return fallback;
  return {
    text: guide.summary,
    call: guide.call,
    steps: guide.steps.slice(0, stepLimit),
    detail: {
      id: found.id,
      title: found.title,
      tone: found.tone
    }
  };
}
},
"src/screens/ReportDetailScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ReportDetailScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _AiSayCard = _interopRequireDefault(__load("src/components/AiSayCard.js"));
var _reports = __load("src/data/lifeInfo/reports.js");
var _spending = __load("src/data/spending/spending.js");
var _fridge = __load("src/data/fridge/fridge.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _reportSummary = __load("src/utils/reportSummary.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 생활정보 > AI 자취 매니저 > 리포트 상세. params: { reportId } (없으면 이번 달 리포트)
function ReportDetailScreen({
  navigation,
  route
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const t = _reports.reportTexts.detail;
  const reportId = route.params?.reportId;
  const {
    transactions,
    fridgeItems
  } = (0, _AppDataContext.useAppData)();
  const report = (0, _react.useMemo)(() => {
    const now = new Date();
    const snapshot = reportId ? _reports.pastReports.find(r => r.id === reportId) : null;
    if (snapshot) return (0, _reportSummary.buildPastReport)(snapshot, now);
    return (0, _reportSummary.getMonthlyReport)({
      transactions,
      fridgeItems,
      budget: _spending.spendingData.budget,
      now,
      baseDate: (0, _format.toDateString)(now),
      urgentWithinDays: _fridge.fridgeData.urgentWithinDays
    });
  }, [reportId, transactions, fridgeItems]);
  const {
    spent,
    budget,
    remaining,
    usedPercent,
    prevDiffPercent,
    categories,
    fridge
  } = report;
  const barWidth = `${Math.min(usedPercent, 100)}%`;
  const fridgeStats = [{
    key: 'total',
    value: fridge.total
  }, {
    key: 'urgent',
    value: fridge.urgent,
    warn: fridge.urgent > 0
  }, {
    key: 'expired',
    value: fridge.expired,
    warn: fridge.expired > 0
  }];
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: `${report.month}월 리포트`,
    subtitle: report.periodLabel,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_AiSayCard.default, {
    label: t.aiLabel,
    text: report.comment
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, t.spendingTitle), prevDiffPercent !== null ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.diffText
  }, "\uC9C0\uB09C\uB2EC \uAC19\uC740 \uAE30\uAC04\uBCF4\uB2E4", ' ', /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: prevDiffPercent > 0 ? styles.diffUp : styles.diffDown
  }, prevDiffPercent > 0 ? '+' : '', prevDiffPercent, "%")) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.card
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.muted
  }, "\uC9C0\uCD9C / \uC608\uC0B0 ", (0, _format.formatNumber)(budget), "\uC6D0"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.big
  }, (0, _format.formatNumber)(spent), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.bigUnit
  }, "\uC6D0")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.track
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.fill, {
      width: barWidth
    }, usedPercent > 100 && styles.fillOver]
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.muted
  }, remaining >= 0 ? `남은 예산 ${(0, _format.formatNumber)(remaining)}원 · ${usedPercent}% 사용` : `예산 초과 ${(0, _format.formatNumber)(-remaining)}원 · ${usedPercent}% 사용`), categories.length > 0 ? categories.map(c => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: c.name,
    style: styles.categoryRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.categoryName
  }, c.name), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.categoryTrack
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.categoryFill, {
      width: `${c.percent}%`
    }]
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.categoryPercent
  }, c.percent, "%"))) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.empty
  }, t.noSpendingText)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitleSolo
  }, t.fridgeTitle), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.miniRow
  }, fridgeStats.map(s => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: s.key,
    style: styles.mini
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.muted
  }, t.fridgeLabels[s.key]), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.miniValue, s.warn && styles.miniWarn]
  }, s.value, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.miniUnit
  }, "\uAC1C"))))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitleSolo
  }, t.tipsTitle), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tipsCard
  }, report.tips.map((tip, i) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: tip,
    style: [styles.tipRow, i > 0 && styles.tipRowNext]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tipNumber
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.tipNumberText
  }, i + 1)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.tipText
  }, tip))))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  sectionRow: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  sectionTitleSolo: {
    marginTop: 24,
    marginBottom: 10,
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  diffText: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    color: _theme.colors.textSecondary
  },
  diffUp: {
    fontFamily: _theme.fonts.bold,
    color: _theme.emergencyColors.danger
  },
  diffDown: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.green
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: _theme.colors.cardBg
  },
  muted: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    color: _theme.colors.textSecondary
  },
  big: {
    marginTop: 2,
    fontFamily: _theme.fonts.bold,
    fontSize: 26,
    color: _theme.colors.textPrimary
  },
  bigUnit: {
    fontFamily: _theme.fonts.medium,
    fontSize: 14
  },
  track: {
    height: 8,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 4,
    backgroundColor: _theme.colors.divider,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    backgroundColor: _theme.colors.green
  },
  fillOver: {
    backgroundColor: _theme.colors.warnText
  },
  categoryRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryName: {
    width: 70,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textPrimary
  },
  categoryTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: _theme.colors.divider,
    overflow: 'hidden'
  },
  categoryFill: {
    height: '100%',
    backgroundColor: _theme.colors.greenLight
  },
  categoryPercent: {
    width: 44,
    textAlign: 'right',
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  empty: {
    marginTop: 14,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  },
  miniRow: {
    flexDirection: 'row',
    gap: 10
  },
  mini: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: _theme.colors.cardBg
  },
  miniValue: {
    marginTop: 4,
    fontFamily: _theme.fonts.bold,
    fontSize: 22,
    color: _theme.colors.textPrimary
  },
  miniWarn: {
    color: _theme.colors.warnText
  },
  miniUnit: {
    fontFamily: _theme.fonts.medium,
    fontSize: 13
  },
  tipsCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: _theme.colors.cardBg
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12
  },
  tipRowNext: {
    borderTopWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderTopColor: _theme.colors.divider
  },
  tipNumber: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 11,
    backgroundColor: _theme.colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tipNumberText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 12.5,
    color: _theme.colors.green
  },
  tipText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: _theme.fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: _theme.colors.textPrimary
  }
});
},
"src/screens/ReportListScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ReportListScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _reports = __load("src/data/lifeInfo/reports.js");
var _spending = __load("src/data/spending/spending.js");
var _AppDataContext = __load("src/store/AppDataContext.js");
var _reportSummary = __load("src/utils/reportSummary.js");
var _format = __load("src/utils/format.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
const CHART_HEIGHT = 80;

// 생활정보 > AI 자취 매니저 > 지난 리포트 (월별 예산 사용률 + 리포트 목록). 누르면 리포트 상세로 이동합니다.
function ReportListScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const t = _reports.reportTexts.list;
  const {
    transactions
  } = (0, _AppDataContext.useAppData)();

  // 지난 리포트 (최근 달이 위)
  const reports = (0, _react.useMemo)(() => {
    const now = new Date();
    return _reports.pastReports.map(snapshot => (0, _reportSummary.buildPastReport)(snapshot, now)).sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));
  }, []);

  // 차트: 지난 리포트(오래된 순) + 이번 달
  const bars = (0, _react.useMemo)(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${(0, _format.pad)(now.getMonth() + 1)}`;
    const spent = transactions.filter(x => x.date.startsWith(monthKey)).reduce((s, x) => s + x.amount, 0);
    const current = {
      id: 'current',
      month: now.getMonth() + 1,
      percent: Math.round(spent / _spending.spendingData.budget * 100),
      isCurrent: true
    };
    const past = [...reports].reverse().map(r => ({
      id: r.id,
      month: r.month,
      percent: r.usedPercent
    }));
    return [...past, current];
  }, [reports, transactions]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: t.title,
    subtitle: t.subtitle,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.chartCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.chartHead
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.muted
  }, t.chartTitle), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.muted
  }, "%")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.chartRow
  }, bars.map(b => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: b.id,
    style: styles.barCol
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.barValue, b.isCurrent && styles.barCurrentText]
  }, b.percent), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.bar, b.isCurrent && styles.barCurrent, {
      height: Math.max(4, Math.min(b.percent, 100) / 100 * CHART_HEIGHT)
    }]
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.barLabel, b.isCurrent && styles.barCurrentText]
  }, b.month, "\uC6D4"))))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionTitle
  }, t.listTitle), reports.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.empty
  }, t.emptyText) : null, reports.map(r => {
    const tag = (0, _reportSummary.getBudgetTag)(r.usedPercent);
    return /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      key: r.id,
      onPress: () => navigation.navigate('ReportDetail', {
        reportId: r.id
      }),
      accessibilityRole: "button",
      style: ({
        pressed
      }) => [styles.item, pressed && styles.pressed]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.itemTexts
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.itemTitleRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.itemTitle
    }, r.month, "\uC6D4 \uB9AC\uD3EC\uD2B8"), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.tag, tag.warn && styles.tagWarn]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.tagText, tag.warn && styles.tagTextWarn]
    }, tag.label))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.itemStats
    }, "\uC9C0\uCD9C ", (0, _format.formatNumber)(r.spent), "\uC6D0 \xB7 \uC608\uC0B0\uC758 ", r.usedPercent, "%"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.itemComment,
      numberOfLines: 2
    }, r.comment)), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
      name: "chevron-forward",
      size: 20,
      color: _theme.colors.textSecondary
    }));
  })));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  muted: {
    fontFamily: _theme.fonts.regular,
    fontSize: 13,
    color: _theme.colors.textSecondary
  },
  chartCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: _theme.colors.cardBg
  },
  chartHead: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  chartRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  bar: {
    width: '100%',
    marginVertical: 5,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: _theme.colors.badgeBg
  },
  barCurrent: {
    backgroundColor: _theme.colors.green
  },
  barValue: {
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    color: _theme.colors.textSecondary
  },
  barLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 12,
    color: _theme.colors.textSecondary
  },
  barCurrentText: {
    fontFamily: _theme.fonts.bold,
    color: _theme.colors.textPrimary
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    fontFamily: _theme.fonts.bold,
    fontSize: 20,
    color: _theme.colors.textPrimary
  },
  empty: {
    paddingVertical: 28,
    textAlign: 'center',
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    color: _theme.colors.textSecondary
  },
  item: {
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: _theme.colors.inputBorder,
    backgroundColor: _theme.colors.white
  },
  pressed: {
    opacity: 0.75
  },
  itemTexts: {
    flex: 1,
    marginRight: 8
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  itemTitle: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: _theme.colors.tabActiveBg
  },
  tagWarn: {
    backgroundColor: _theme.colors.warnBg
  },
  tagText: {
    fontFamily: _theme.fonts.bold,
    fontSize: 11.5,
    color: _theme.colors.green
  },
  tagTextWarn: {
    color: _theme.colors.warnText
  },
  itemStats: {
    marginTop: 6,
    fontFamily: _theme.fonts.medium,
    fontSize: 13.5,
    color: _theme.colors.textPrimary
  },
  itemComment: {
    marginTop: 4,
    fontFamily: _theme.fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: _theme.colors.textSecondary
  }
});
},
"src/screens/ProfileScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ProfileScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _FormField = _interopRequireDefault(__load("src/components/FormField.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _AppDataContext = __load("src/store/AppDataContext.js");
var _account = __load("src/data/more/account.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 더보기 > 개인정보 관리
function ProfileScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    profile,
    updateProfile
  } = (0, _AppDataContext.useAppData)();
  const d = _account.profileData;
  const [nickname, setNickname] = (0, _react.useState)(profile.nickname);
  const [region, setRegion] = (0, _react.useState)(profile.region);
  const handleSave = () => {
    if (!nickname.trim()) {
      _reactNative.Alert.alert('입력을 확인해 주세요', '닉네임을 입력해 주세요.');
      return;
    }
    updateProfile({
      nickname: nickname.trim(),
      region: region.trim()
    });
    navigation.goBack();
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    style: styles.container,
    behavior: _reactNative.Platform.OS === 'ios' ? 'padding' : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    keyboardShouldPersistTaps: "handled",
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingHorizontal: _theme.spacing.screenX,
      paddingBottom: 24
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: d.title,
    subtitle: d.subtitle,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: d.nicknameLabel,
    value: nickname,
    onChangeText: setNickname,
    maxLength: 12
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: d.emailLabel,
    value: profile.email,
    editable: false,
    hint: d.emailHint
  }), /*#__PURE__*/_react.default.createElement(_FormField.default, {
    label: d.regionLabel,
    value: region,
    onChangeText: setRegion,
    placeholder: d.regionPlaceholder
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.footer, {
      paddingBottom: Math.max(insets.bottom, 16)
    }]
  }, /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: d.saveLabel,
    onPress: handleSave
  })));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  footer: {
    paddingHorizontal: _theme.spacing.screenX,
    paddingTop: 12
  }
});
},
"src/screens/SettingsScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SettingsScreen;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _SectionTitle = _interopRequireDefault(__load("src/components/SectionTitle.js"));
var _SettingSwitchRow = _interopRequireDefault(__load("src/components/SettingSwitchRow.js"));
var _AppDataContext = __load("src/store/AppDataContext.js");
var _account = __load("src/data/more/account.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 더보기 > 앱 설정
// TODO: 알림 스위치는 값만 저장합니다. 실제 푸시 알림은 expo-notifications 를 붙일 때 연결하세요.
function SettingsScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const {
    settings,
    updateSetting
  } = (0, _AppDataContext.useAppData)();
  const d = _account.settingsData;
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: d.title,
    subtitle: d.subtitle,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_SectionTitle.default, {
    style: styles.sectionTitle
  }, d.notifySection), d.toggles.map((t, index) => /*#__PURE__*/_react.default.createElement(_SettingSwitchRow.default, {
    key: t.key,
    title: t.title,
    description: t.description,
    value: !!settings[t.key],
    onValueChange: v => updateSetting(t.key, v),
    showDivider: index < d.toggles.length - 1
  })), /*#__PURE__*/_react.default.createElement(_SectionTitle.default, {
    style: [styles.sectionTitle, styles.sectionNext]
  }, d.infoSection), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.infoRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.infoLabel
  }, d.versionLabel), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.infoValue
  }, d.version))));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  sectionTitle: {
    marginBottom: 4
  },
  sectionNext: {
    marginTop: 32
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16
  },
  infoLabel: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textPrimary
  },
  infoValue: {
    fontFamily: _theme.fonts.regular,
    fontSize: 16,
    color: _theme.colors.textSecondary
  }
});
},
"src/components/SettingSwitchRow.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SettingSwitchRow;
var _react = _interopRequireDefault(__load("react"));
var _reactNative = __load("react-native");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// 제목 + 설명 + 오른쪽 스위치로 이루어진 설정 한 줄 (앱 설정 화면).
function SettingSwitchRow({
  title,
  description,
  value,
  onValueChange,
  showDivider = true
}) {
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.row, showDivider && styles.divider]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.texts
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.title
  }, title), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.description
  }, description)), /*#__PURE__*/_react.default.createElement(_reactNative.Switch, {
    value: value,
    onValueChange: onValueChange,
    trackColor: {
      false: _theme.colors.divider,
      true: _theme.colors.green
    },
    thumbColor: _theme.colors.white,
    accessibilityLabel: title
  }));
}
const styles = _reactNative.StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18
  },
  divider: {
    borderBottomWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderBottomColor: _theme.colors.divider
  },
  texts: {
    flex: 1,
    marginRight: 16
  },
  title: {
    fontFamily: _theme.fonts.bold,
    fontSize: 17,
    color: _theme.colors.textPrimary
  },
  description: {
    marginTop: 3,
    fontFamily: _theme.fonts.regular,
    fontSize: 14,
    color: _theme.colors.textSecondary
  }
});
},
"src/screens/HelpScreen.js":function(module,exports,__load){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HelpScreen;
var _react = _interopRequireWildcard(__load("react"));
var _reactNative = __load("react-native");
var _vectorIcons = __load("@expo/vector-icons");
var _reactNativeSafeAreaContext = __load("react-native-safe-area-context");
var _BackHeader = _interopRequireDefault(__load("src/components/BackHeader.js"));
var _SectionTitle = _interopRequireDefault(__load("src/components/SectionTitle.js"));
var _SummaryBanner = _interopRequireDefault(__load("src/components/SummaryBanner.js"));
var _PrimaryButton = _interopRequireDefault(__load("src/components/PrimaryButton.js"));
var _account = __load("src/data/more/account.js");
var _theme = __load("src/theme.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var cache;
function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var r, c, a = Object.defineProperty, n = { __proto__: null, default: e }; if (Object(e) !== e) return n; if (cache || "function" != typeof WeakMap || (cache = new WeakMap()), cache) { if (cache.has(e)) return cache.get(e); cache.set(e, n); } for (c in e) "default" !== c && {}.hasOwnProperty.call(e, c) && ((r = a && Object.getOwnPropertyDescriptor(e, c)) && (r.get || r.set) ? a(n, c, r) : n[c] = e[c]); return n; }
// 더보기 > 도움말 (자주 묻는 질문 + 메일 문의)
function HelpScreen({
  navigation
}) {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const d = _account.helpData;
  const [openId, setOpenId] = (0, _react.useState)(null); // 한 번에 하나만 펼쳐집니다.

  const handleContact = () => {
    _reactNative.Linking.openURL(`mailto:${d.contactEmail}`).catch(() => _reactNative.Alert.alert('메일 앱을 열 수 없어요', `${d.contactEmail} 로 문의해 주세요.`));
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: {
      paddingTop: insets.top + 14,
      paddingBottom: insets.bottom + 40,
      paddingHorizontal: _theme.spacing.screenX
    }
  }, /*#__PURE__*/_react.default.createElement(_BackHeader.default, {
    title: d.title,
    subtitle: d.subtitle,
    onBack: () => navigation.goBack()
  }), /*#__PURE__*/_react.default.createElement(_SectionTitle.default, {
    style: styles.sectionTitle
  }, d.faqSection), d.faqs.map(faq => {
    const open = openId === faq.id;
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: faq.id,
      style: styles.faq
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Pressable, {
      onPress: () => setOpenId(open ? null : faq.id),
      accessibilityRole: "button",
      accessibilityState: {
        expanded: open
      },
      style: ({
        pressed
      }) => [styles.question, pressed && styles.pressed]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.questionText
    }, faq.q), /*#__PURE__*/_react.default.createElement(_vectorIcons.Ionicons, {
      name: open ? 'chevron-up' : 'chevron-down',
      size: 20,
      color: _theme.colors.textSecondary
    })), open ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.answer
    }, faq.a) : null);
  }), /*#__PURE__*/_react.default.createElement(_SectionTitle.default, {
    style: [styles.sectionTitle, styles.sectionNext]
  }, d.contactSection), /*#__PURE__*/_react.default.createElement(_SummaryBanner.default, {
    label: "\uAD81\uAE08\uD55C \uC810\uC774 \uB0A8\uC558\uB098\uC694?",
    title: d.contactDescription,
    description: d.contactEmail
  }), /*#__PURE__*/_react.default.createElement(_PrimaryButton.default, {
    label: d.contactLabel,
    onPress: handleContact,
    style: styles.contactButton
  })));
}
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: _theme.colors.background
  },
  sectionTitle: {
    marginBottom: 8
  },
  sectionNext: {
    marginTop: 32,
    marginBottom: 12
  },
  pressed: {
    opacity: 0.7
  },
  faq: {
    borderBottomWidth: _reactNative.StyleSheet.hairlineWidth * 2,
    borderBottomColor: _theme.colors.divider
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18
  },
  questionText: {
    flex: 1,
    marginRight: 12,
    fontFamily: _theme.fonts.bold,
    fontSize: 16,
    lineHeight: 23,
    color: _theme.colors.textPrimary
  },
  answer: {
    paddingBottom: 18,
    fontFamily: _theme.fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: _theme.colors.textSecondary
  },
  contactButton: {
    marginTop: 16
  }
});
}};
const __external={"react":{__esModule:true,default:External0,...External0},"react-native":External1,"@react-native-async-storage/async-storage":{__esModule:true,default:External2,...External2},"expo-notifications":External3,"@react-navigation/native":External4,"@expo-google-fonts/noto-sans-kr":External5,"react-native-safe-area-context":External6,"@react-navigation/native-stack":External7,"@react-navigation/bottom-tabs":External8,"@expo/vector-icons":{Ionicons:IconIonicons,MaterialCommunityIcons:IconMaterialCommunityIcons}},__cache={};
function __load(id){if(__external[id])return __external[id];if(__cache[id])return __cache[id].exports;const m={exports:{}};__cache[id]=m;if(!__modules[id])throw new Error('Missing module: '+id);__modules[id](m,m.exports,__load);return m.exports;}
export default __load("IntegrationApp.js").default;
