import { validDate } from './inventory.mjs';

const units = { g:'g', ml:'ml', piece:'piece', '개':'piece', pack:'pack', '팩':'pack' };
const storage = { refrigerated:'fridge', frozen:'freezer', room:'room' };
const localStorage = { fridge:'refrigerated', freezer:'frozen', room:'room' };
const dates = { package:'label', reference:'estimate', unknown:'unknown' };
const localDates = { label:'package', estimate:'reference', unknown:'unknown' };
const owns = (map, key) => Object.hasOwn(map, key);
const fail = message => { throw new Error(message); };

export function inventoryToServer(items) {
  if (!Array.isArray(items) || items.length > 500) fail('서버 연결은 재료 500개까지 지원해요.');
  const ids = new Set();
  return { items: items.map(item => {
    const label = item.name || '이름 없는 재료';
    if (typeof item.id !== 'string' || !item.id || item.id.length > 64 || ids.has(item.id)) fail(`${label}: 재료 ID를 확인해 주세요.`);
    ids.add(item.id);
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 100) fail('재료명을 확인해 주세요.');
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1000000) fail(`${label}: 서버 수량 범위는 0 초과 100만 이하예요.`);
    if (!owns(units,item.unit)) fail(`${label}: '${item.unit}' 단위는 서버에서 지원하지 않아요. 실제 수량을 확인해 개·g·ml·팩으로 수정해 주세요.`);
    if (!owns(storage,item.storageMethod)) fail(`${label}: 재고 수정에서 보관 방법을 선택해 주세요.`);
    if (!owns(dates,item.dateType)) fail(`${label}: 재고 수정에서 날짜 출처를 선택해 주세요.`);
    const unknown = item.dateType === 'unknown';
    if (unknown ? !!item.expiresAt : !validDate(item.expiresAt)) fail(`${label}: 날짜와 날짜 출처를 함께 확인해 주세요.`);
    return { item_id:item.id, name:item.name.trim(), quantity:item.quantity, unit:units[item.unit], storage:storage[item.storageMethod],
      target_date:unknown?null:item.expiresAt, date_source:dates[item.dateType] };
  }) };
}

export function validateRemote(value) {
  if (!value || !Number.isSafeInteger(value.revision) || value.revision < 1 || !Number.isFinite(Date.parse(value.snapshot?.source_updated_at)) ||
      !Array.isArray(value.snapshot?.data?.items) || value.snapshot.data.items.length > 500) fail('서버 재고 응답 형식이 올바르지 않아요.');
  const ids = new Set();
  for (const item of value.snapshot.data.items) {
    if (!item || typeof item.item_id !== 'string' || !item.item_id || item.item_id.length > 64 || ids.has(item.item_id) ||
        typeof item.name !== 'string' || !item.name.trim() || item.name.length > 100 ||
        !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1000000 ||
        !['g','ml','piece','pack'].includes(item.unit) || !owns(localStorage,item.storage) || !owns(localDates,item.date_source) ||
        (item.date_source === 'unknown' ? item.target_date !== null : !validDate(item.target_date))) fail('서버 재고 품목 형식을 확인해 주세요.');
    ids.add(item.item_id);
  }
  return value;
}

// Compare the server projection only. Object field order and inventory order are irrelevant.
export function sameInventory(a,b) {
  const canonical = data => JSON.stringify((data?.items || []).map(i=>[
    i.item_id,i.name,i.quantity,i.unit,i.storage,i.target_date,i.date_source,
  ]).sort((x,y)=>x[0].localeCompare(y[0])));
  return canonical(a) === canonical(b);
}

export function inventoryFromServer(data, previous=[]) {
  return data.items.map(item => {
    const old = previous.find(i => i.id === item.item_id);
    const compatible = old && old.name === item.name && units[old.unit] === item.unit;
    return { ...(compatible?old:{}), id:item.item_id, name:item.name, quantity:item.quantity,
      unit:compatible?old.unit:({piece:'개',pack:'팩'}[item.unit] || item.unit),
      storageMethod:localStorage[item.storage], dateType:localDates[item.date_source], expiresAt:item.target_date,
      // The API does not carry prices. A different quantity makes the old remaining valuation obsolete.
      remainingCost:compatible && old.quantity === item.quantity ? (old.remainingCost ?? null) : null,
    };
  });
}

export function validateSyncMetadata(meta) {
  if (meta == null) return;
  if (typeof meta.enabled !== 'boolean' || !Number.isSafeInteger(meta.revision) || meta.revision < 1 ||
      !Array.isArray(meta.base?.items)) fail('저장된 서버 연결 정보가 올바르지 않아요.');
  validateRemote({revision:meta.revision,snapshot:{data:meta.base,source_updated_at:meta.sourceUpdatedAt}});
}
const stamp = state => JSON.stringify(state.inventory);
const conflict = () => { const error=new Error('기기와 서버의 재고가 모두 변경됐어요. 서버 재고 연결 화면에서 비교해 주세요.');error.status=409;return error; };
const revision = remote => remote?.revision ?? 0;
function linked(state,remote,pull=false) {
  return { ...state, ...(pull?{inventory:inventoryFromServer(remote.snapshot.data,state.inventory),undo:null}:{}),
    inventorySync:{enabled:true,revision:remote.revision,base:remote.snapshot.data,sourceUpdatedAt:remote.snapshot.source_updated_at,
      checkedAt:new Date().toISOString()} };
}

// All network operations share the account's durable queue with local inventory edits.
export function createInventorySync(store, api) {
  async function read() {
    try { return validateRemote(await api('me/inventory')); }
    catch(error) { if(error.status===404)return null;throw error; }
  }
  async function write(data, expectedRevision) {
    const remote=validateRemote(await api('me/inventory','PUT',{expected_revision:expectedRevision,data}));
    if (remote.revision !== expectedRevision+1) fail('서버 재고 버전이 요청 결과와 달라요. 다시 조회해 주세요.');
    if (!sameInventory(remote.snapshot.data,data)) fail('서버 저장 결과가 요청한 재고와 달라요. 다시 조회해 주세요.');
    return remote;
  }
  return {
    async inspect() {
      let preview;
      await store.update(async state => { preview={remote:await read(),localInventory:state.inventory,localStamp:stamp(state)};return state; });
      return preview;
    },
    resolve(direction,preview) {
      return store.update(async state => {
        if (!['upload','download'].includes(direction) || !preview || preview.localStamp !== stamp(state)) throw conflict();
        const remote=await read();
        if (revision(remote)!==revision(preview.remote)) throw conflict();
        if (direction==='download') {
          if(!remote)fail('서버에 아직 재고가 없어요. 기기 재고를 먼저 저장해 주세요.');
          return linked(state,remote,true);
        }
        const data=inventoryToServer(state.inventory);
        // An explicit confirmation is a fresh inventory observation; automatic reads are not.
        return linked(state,await write(data,revision(remote)));
      });
    },
    sync() {
      return store.update(async state => {
        const meta=state.inventorySync;
        if(!meta?.enabled)return state;
        const data=inventoryToServer(state.inventory),remote=await read();
        // A successful PUT with a lost response/local disk failure can be acknowledged by GET.
        if(remote && sameInventory(remote.snapshot.data,data)) {
          if(remote.revision===meta.revision && sameInventory(meta.base,data))return state;
          return linked(state,remote);
        }
        if(!remote)throw conflict();
        if(remote.revision!==meta.revision) {
          if(sameInventory(data,meta.base))return linked(state,remote,true);
          throw conflict();
        }
        return linked(state,await write(data,meta.revision));
      });
    },
    pause:()=>store.update(state=>({...state,inventorySync:state.inventorySync?{...state.inventorySync,enabled:false}:null})),
  };
}
