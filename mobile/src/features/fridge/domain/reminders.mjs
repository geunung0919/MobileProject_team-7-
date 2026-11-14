export const REMINDER_OWNER='module3.recipe.v1';
export function reminderTime(hour, minute) {
 if(!/^\d{1,2}$/.test(String(hour)) || !/^\d{1,2}$/.test(String(minute))) throw new Error('시간과 분을 숫자로 입력해 주세요.');
 const h=Number(hour),m=Number(minute);
 if(h<0 || h>23 || m<0 || m>59) throw new Error('시간은 0~23, 분은 0~59로 입력해 주세요.');
 return {hour:h,minute:m};
}
export function nextReminderDate(hour, minute, now=new Date()) {
 const time=reminderTime(hour,minute), next=new Date(now);
 next.setHours(time.hour,time.minute,0,0);
 if(next<=now) next.setDate(next.getDate()+1);
 return next;
}
export function recipeNotificationPath(data, recipes, scope) {
 if(scope && data?.scope!==scope) return null;
 if(data?.owner!==REMINDER_OWNER) return null;
 if(data.recipeId && recipes.some(r=>r.id===data.recipeId)) return `/fridge/recipe/${encodeURIComponent(data.recipeId)}`;
 return '/fridge/recipe';
}
// Expo API는 주입하여 예약/취소 오류를 기기 없이 검증할 수 있습니다.
export function createReminderManager(api, scope) {
 const list=async()=> (await api.getAllScheduledNotificationsAsync()).filter(n=>n.content?.data?.owner===REMINDER_OWNER && (scope === undefined || n.content.data.scope === scope));
 return {
  list,
  async schedule(request) {
   const previous=(await list()).filter(n=>n.content.data.key===request.content.data.key);
   const id=await api.scheduleNotificationAsync(request);
   try { for(const n of previous) await api.cancelScheduledNotificationAsync(n.identifier); }
   catch(error) { await api.cancelScheduledNotificationAsync(id); throw error; }
   return id;
  },
  async cancel(id) {
   if((await list()).some(n=>n.identifier===id)) await api.cancelScheduledNotificationAsync(id);
  },
 };
}
