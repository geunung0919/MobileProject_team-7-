export const WEEK_DAYS = [
  { value: 1, label: '월' }, { value: 2, label: '화' }, { value: 3, label: '수' },
  { value: 4, label: '목' }, { value: 5, label: '금' }, { value: 6, label: '토' },
  { value: 0, label: '일' },
];

export const emptyRoutineState = () => ({ version: 1, routines: [] });

export function routineStorageKey(origin, userId) {
  if (!origin || typeof userId !== 'string' || !userId) throw new Error('사용자 확인이 필요해요.');
  return `jachwi.routine.v1:${encodeURIComponent(origin)}:${encodeURIComponent(userId)}`;
}

export function validRoutineDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validReminderTime(value) {
  return value === null || value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateRoutine(routine) {
  if (!routine || typeof routine.id !== 'string' || !routine.id ||
      typeof routine.title !== 'string' || !routine.title.trim() || routine.title.trim().length > 60 ||
      !Array.isArray(routine.days) || !routine.days.length ||
      routine.days.some(day => !Number.isInteger(day) || day < 0 || day > 6) ||
      new Set(routine.days).size !== routine.days.length ||
      !validReminderTime(routine.reminderTime) ||
      !['low', 'normal'].includes(routine.energy) ||
      !Array.isArray(routine.completedDates) ||
      routine.completedDates.some(date => !validRoutineDate(date))) {
    throw new Error('루틴 이름, 반복 요일, 알림 시간(HH:MM)을 확인해 주세요.');
  }
}

export function makeRoutine({ id, title, days, reminderTime = '', energy = 'normal' }) {
  const routine = {
    id,
    title: String(title || '').trim(),
    days: [...new Set(days)].sort((a, b) => a - b),
    reminderTime: reminderTime ? reminderTime : null,
    energy,
    completedDates: [],
  };
  validateRoutine(routine);
  return routine;
}

export function parseRoutineState(raw) {
  if (raw === null) return emptyRoutineState();
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Array.isArray(value.routines)) throw new Error('저장된 생활 루틴 형식을 확인할 수 없어요.');
  value.routines.forEach(validateRoutine);
  return value;
}

export function addRoutine(state, routine) {
  validateRoutine(routine);
  if (state.routines.some(item => item.id === routine.id)) throw new Error('같은 루틴 ID가 이미 있어요.');
  return { ...state, routines: [...state.routines, routine] };
}

export function removeRoutine(state, id) {
  if (!state.routines.some(item => item.id === id)) throw new Error('삭제할 루틴을 찾지 못했어요.');
  return { ...state, routines: state.routines.filter(item => item.id !== id) };
}

export function isScheduledOn(routine, date) {
  if (!validRoutineDate(date)) throw new Error('오늘 날짜를 확인할 수 없어요.');
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  return routine.days.includes(day);
}

export function toggleRoutineComplete(state, id, date) {
  if (!validRoutineDate(date)) throw new Error('완료 날짜가 올바르지 않아요.');
  const target = state.routines.find(item => item.id === id);
  if (!target) throw new Error('완료할 루틴을 찾지 못했어요.');
  if (!isScheduledOn(target, date)) throw new Error('오늘 예정된 루틴이 아니에요.');
  const done = target.completedDates.includes(date);
  return {
    ...state,
    routines: state.routines.map(item => item.id !== id ? item : {
      ...item,
      completedDates: done ? item.completedDates.filter(value => value !== date) : [...item.completedDates, date],
    }),
  };
}

export function routinesForDate(state, date, batteryMode = false) {
  return state.routines
    .filter(routine => isScheduledOn(routine, date) && (!batteryMode || routine.energy === 'low'))
    .sort((a, b) => (a.reminderTime || '99:99').localeCompare(b.reminderTime || '99:99') || a.title.localeCompare(b.title, 'ko'));
}

export function repeatLabel(days) {
  if (days.length === 7) return '매일';
  if ([1, 2, 3, 4, 5].every(day => days.includes(day)) && days.length === 5) return '평일';
  if ([0, 6].every(day => days.includes(day)) && days.length === 2) return '주말';
  return WEEK_DAYS.filter(day => days.includes(day.value)).map(day => day.label).join('·');
}

export function createRoutineStore(storage, key) {
  let state = null;
  let loading;
  let queue = Promise.resolve();
  const listeners = new Set();
  const load = () => loading || (loading = storage.getItem(key).then(raw => {
    state = parseRoutineState(raw);
    return state;
  }).catch(error => {
    loading = null;
    throw error;
  }));
  return {
    load,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(fn) {
      const operation = queue.then(async () => {
        await load();
        const next = fn(state);
        await storage.setItem(key, JSON.stringify(next));
        state = next;
        listeners.forEach(listener => listener(state));
        return state;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}
