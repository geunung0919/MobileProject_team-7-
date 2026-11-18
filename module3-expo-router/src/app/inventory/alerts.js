import React,{useState,useRef} from 'react';
import {Text,Switch} from 'react-native';
import {useApp} from '../../state/AppProvider';
import {Page,Field,Button} from '../../components/UI';
import Choices from '../../components/Choices';
import {alertSettings,inventoryAlertPlan} from '../../domain/nonAi.mjs';
import {supported,requestInventoryPermission,syncInventoryNotifications} from '../../services/inventoryNotifications';
export default function Alerts(){
 const {state,saveAlertSettings}=useApp(),[draft,setDraft]=useState(()=>({...state.alertSettings})),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),lock=useRef(false);
 const set=k=>v=>setDraft(d=>({...d,[k]:v}));
 let planned=[];try{planned=inventoryAlertPlan(state.inventory,draft);}catch{}
 return <Page title="재고 임박 알림" subtitle="기본은 3일 전·1일 전 오전 9시예요. 현재 기기 시간대를 사용해요.">
 {!supported&&<Text>웹에서는 예약되지 않아요. Android/iOS 앱에서 설정해 주세요.</Text>}
 <Text>재고 알림 사용</Text><Switch accessibilityLabel="재고 알림 사용" value={draft.enabled} onValueChange={set('enabled')} disabled={!supported}/>
 <Choices multiple label="알림 날짜" value={draft.days} onChange={set('days')} options={[{value:7,label:'7일 전'},{value:3,label:'3일 전'},{value:1,label:'1일 전'},{value:0,label:'당일'}]}/>
 <Field label="시 (0~23)" value={String(draft.hour)} onChangeText={set('hour')} keyboardType="number-pad"/>
 <Field label="분 (0~59)" value={String(draft.minute)} onChangeText={set('minute')} keyboardType="number-pad"/>
 <Button disabled={busy} title="저장 / 예약 다시 확인" onPress={async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{const valid=alertSettings(draft);if(valid.enabled)await requestInventoryPermission();await saveAlertSettings(valid);setMessage('설정을 저장했어요.');const result=await syncInventoryNotifications(state.inventory,valid);setMessage(result.unsupported?'설정은 저장했지만 웹 알림은 지원하지 않아요.':result.permissionDenied?'설정 저장 완료. 알림 권한을 확인해 주세요.':`예약 ${result.count}건 · 한도 초과 미예약 ${result.omitted}건`);}catch(e){setMessage(e.message);}finally{lock.current=false;setBusy(false);}}}/>
 <Text accessibilityLiveRegion="polite">{message}</Text><Text>현재 조건의 예정 알림 {planned.length}건</Text>{planned.slice(0,10).map(p=><Text key={p.key}>{p.title} · {new Date(p.at).toLocaleString('ko-KR')}</Text>)}
 <Text>날짜 수정·전량 사용·삭제·되돌리기 후 예약을 갱신해요. 지난 시각의 알림은 다시 보내지 않아요. 시간대 변경은 앱 복귀 시 반영돼요. 기기 설정에 따라 수신이 지연될 수 있어요.</Text>
 </Page>;
}
