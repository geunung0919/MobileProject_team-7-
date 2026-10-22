import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addRoutine,
  createRoutineStore,
  emptyRoutineState,
  makeRoutine,
  parseRoutineState,
  removeRoutine,
  routinesForDate,
  routineStorageKey,
  toggleRoutineComplete,
} from '../src/features/routine/domain/routines.mjs';

const routine = (overrides = {}) => makeRoutine({
  id: overrides.id || 'r1',
  title: overrides.title || '설거지 5분',
  days: overrides.days || [1, 2, 3, 4, 5],
  reminderTime: overrides.reminderTime ?? '21:30',
  energy: overrides.energy || 'low',
});

test('루틴 입력을 검증하고 계정별 저장 키를 만든다', () => {
  assert.match(routineStorageKey('http://localhost:8000', 'demo-a'), /^jachwi\.routine\.v1:/);
  assert.throws(() => makeRoutine({ id: 'x', title: '', days: [1], reminderTime: '', energy: 'normal' }));
  assert.throws(() => makeRoutine({ id: 'x', title: '물 마시기', days: [], reminderTime: '', energy: 'normal' }));
  assert.throws(() => makeRoutine({ id: 'x', title: '물 마시기', days: [1], reminderTime: '25:00', energy: 'normal' }));
});

test('요일과 방전모드에 따라 오늘 루틴을 고른다', () => {
  let state = emptyRoutineState();
  state = addRoutine(state, routine({ id: 'low', energy: 'low' }));
  state = addRoutine(state, routine({ id: 'normal', title: '청소', energy: 'normal', reminderTime: '19:00' }));
  assert.deepEqual(routinesForDate(state, '2026-10-22').map(item => item.id), ['normal', 'low']);
  assert.deepEqual(routinesForDate(state, '2026-10-22', true).map(item => item.id), ['low']);
  assert.equal(routinesForDate(state, '2026-10-25').length, 0);
});

test('오늘 완료를 체크하고 다시 취소할 수 있다', () => {
  let state = addRoutine(emptyRoutineState(), routine());
  state = toggleRoutineComplete(state, 'r1', '2026-10-22');
  assert.deepEqual(state.routines[0].completedDates, ['2026-10-22']);
  state = toggleRoutineComplete(state, 'r1', '2026-10-22');
  assert.deepEqual(state.routines[0].completedDates, []);
});

test('저장소 업데이트는 영속 저장 후 상태를 공개한다', async () => {
  const data = new Map();
  const storage = {
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); },
  };
  const store = createRoutineStore(storage, 'routine-key');
  await store.update(state => addRoutine(state, routine()));
  const saved = parseRoutineState(data.get('routine-key'));
  assert.equal(saved.routines.length, 1);
  await store.update(state => removeRoutine(state, 'r1'));
  assert.equal(store.getState().routines.length, 0);
});
