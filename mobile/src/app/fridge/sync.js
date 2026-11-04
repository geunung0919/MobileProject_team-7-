import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Page, Card, Button, styles } from '../../features/fridge/components/UI';
import {STORAGE_METHODS,DATE_TYPES} from '../../features/fridge/domain/inventoryFields.mjs';
import { useApp } from '../../features/fridge/state/AppProvider';
export default function InventorySync() {
 const {state,syncBusy,syncError,inspectInventorySync,resolveInventorySync,syncInventoryNow,pauseInventorySync}=useApp();
 const [preview,setPreview]=useState(null),[choice,setChoice]=useState(null),[message,setMessage]=useState('');
 const inspect=useCallback(async()=>{setChoice(null);setPreview(null);const result=await inspectInventorySync();setPreview(result);},[inspectInventorySync]);
 useFocusEffect(useCallback(()=>{let active=true;setChoice(null);setPreview(null);inspectInventorySync().then(result=>{if(active)setPreview(result);}).catch(()=>{});return()=>{active=false;};},[inspectInventorySync]));
 async function confirm() {
  const direction=choice;setChoice(null);
  await resolveInventorySync(direction,preview);
  setMessage(direction==='upload'?'기기 재고를 서버에 저장하고 자동 연결을 켰어요.':'서버 재고를 기기에 반영하고 자동 연결을 켰어요.');
  await inspect();
 }
 const meta=state.inventorySync;
 return <Page title="서버 재고 연결" subtitle="처음 연결하거나 양쪽 재고가 충돌할 때만 기준을 선택해요. 이후 냉장고 화면에서 변경을 자동 반영해요.">
  <Card><Text style={styles.label}>{meta?.enabled?'자동 연결 켜짐':meta?'연결 일시중지':'아직 연결하지 않았어요'}</Text>
   {!!meta&&<><Text>기기에 저장된 서버 버전: {meta.revision}</Text><Text>서버 원본 갱신: {new Date(meta.sourceUpdatedAt).toLocaleString('ko-KR')}</Text></>}
   <Text style={styles.muted}>공유 항목: 재료명·수량·단위·보관 방법·날짜·날짜 출처. 구매일·금액·식사·폐기·장보기·소비 연결 기록은 기기에만 남아요.</Text>
   <Text style={styles.muted}>서버 단위는 개·g·ml·팩만 지원해요. 공기·모는 임의 환산하지 않아요. 서버에서 수량이 바뀐 품목의 기기 잔여 금액은 미입력으로 바뀌어요.</Text>
  </Card>
  {!!syncError&&<Text accessibilityRole="alert" style={styles.error}>{syncError}</Text>}
  {!!message&&<Text accessibilityLiveRegion="polite">{message}</Text>}
  <Button title={syncBusy?'확인 중…':'기기 / 서버 비교 새로고침'} disabled={syncBusy} onPress={inspect}/>
  {preview&&<>
   <Card><Text style={styles.label}>이 기기: {preview.localInventory.length}개</Text>
    {!preview.localInventory.length&&<Text>빈 냉장고</Text>}
    {preview.localInventory.map(item=><Text key={item.id}>{item.name} {item.quantity}{item.unit} · {STORAGE_METHODS.find(v=>v.value===item.storageMethod)?.label||'보관 미입력'} · {DATE_TYPES.find(v=>v.value===item.dateType)?.label||'출처 미입력'} · {item.expiresAt||'날짜 미확인'}</Text>)}
   </Card>
   <Card><Text style={styles.label}>서버: {preview.remote?`${preview.remote.snapshot.data.items.length}개 · 버전 ${preview.remote.revision}`:'아직 등록되지 않음'}</Text>
    {preview.remote&& !preview.remote.snapshot.data.items.length&&<Text>확인된 빈 냉장고</Text>}
    {preview.remote?.snapshot.data.items.map(item=><Text key={item.item_id}>{item.name} {item.quantity}{({piece:'개',pack:'팩'}[item.unit]||item.unit)} · {({fridge:'냉장',freezer:'냉동',room:'실온'}[item.storage])} · {({label:'포장지 표시',estimate:'보관 참고일',unknown:'날짜 미확인'}[item.date_source])} · {item.target_date||'날짜 미확인'}</Text>)}
   </Card>
   <Button title="이 기기 재고를 서버에 저장" disabled={syncBusy} onPress={()=>setChoice('upload')}/>
   <Button secondary title="서버 재고를 이 기기로 가져오기" disabled={syncBusy||!preview.remote} onPress={()=>setChoice('download')}/>
   {choice&&<Card><Text style={styles.error}>{choice==='upload'?'서버 재고 전체를 위에 표시된 기기 재고로 교체해요. 빈 기기라면 서버도 빈 냉장고가 됩니다.':'기기 재고 전체를 서버 목록으로 교체해요. 기기에만 있는 재료는 목록에서 빠지고 이전 재고 되돌리기는 종료돼요.'}</Text>
    <Text>비교 이후 어느 쪽이 바뀌면 교체를 멈추고 다시 확인해요.</Text>
    <Button title="내용 확인했어요 · 교체 후 자동 연결" disabled={syncBusy} onPress={confirm}/>
    <Button secondary title="취소" disabled={syncBusy} onPress={()=>setChoice(null)}/>
   </Card>}
  </>}
  {meta?.enabled&&<><Button secondary title="지금 자동 동기화 재시도" disabled={syncBusy} onPress={async()=>{await syncInventoryNow();await inspect();setMessage('서버와 비교를 완료했어요.');}}/>
   <Button secondary title="자동 연결 일시중지" disabled={syncBusy} onPress={async()=>{await pauseInventorySync();setChoice(null);setMessage('기기와 서버 재고를 보존하고 자동 연결을 중지했어요.');}}/></>}
  <Text style={styles.muted}>수신 응답이 유실되거나 양쪽이 동시에 변경되면 자동 덮어쓰지 않아요. 새로고침 후 다시 비교해 주세요. 다른 기기에서 동일 지출의 재료를 다시 등록하는 것은 서버에서 중복 차단하지 않아요.</Text>
 </Page>;
}
