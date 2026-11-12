export const supported=false;
export async function requestInventoryPermission(){throw new Error('재고 예약 알림은 Android/iOS 앱에서 설정해 주세요.');}
export async function syncInventoryNotifications(){return {count:0,omitted:0,unsupported:true};}
export const observeInventoryNotifications=()=>()=>{};

export async function scheduleInventoryTest(){throw new Error('휴대폰에서 테스트해 주세요.');}
export async function cancelInventoryTest(){}
