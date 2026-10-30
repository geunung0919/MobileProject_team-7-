// 모든 변경은 순서대로 저장하며, 저장 성공 후에만 화면 상태를 바꿉니다.
export function createPersistentStore(initial, persist, publish) {
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
  },
 };
}
