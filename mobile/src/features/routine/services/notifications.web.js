export const routineNotificationsSupported=false;
export const requestRoutinePermission=async()=>{throw Error('생활 루틴 알림은 Android/iOS 앱에서 켤 수 있어요.');};
export const reconcileRoutineNotifications=async()=>({status:'unsupported',count:0});
export const observeRoutineNotificationResponses=()=>()=>{};
export const clearRoutineResponse=async()=>{};
