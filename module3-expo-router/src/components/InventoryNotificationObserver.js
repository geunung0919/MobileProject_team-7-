import React,{useEffect,useRef,useState} from 'react';
import {AppState,Text,View} from 'react-native';
import {router,useRootNavigationState} from 'expo-router';
import {useApp} from '../state/AppProvider';
import {useDayClock} from '../hooks/useDayClock';
import {syncInventoryNotifications,observeInventoryNotifications} from '../services/inventoryNotifications';
export default function InventoryNotificationObserver(){
 const {state}=useApp(),clock=useDayClock(),navigation=useRootNavigationState();
 const [resume,setResume]=useState(0),[warning,setWarning]=useState(''),handled=useRef(new Set()),latest=useRef(state);latest.current=state;
 useEffect(()=>{const sub=AppState.addEventListener('change',status=>{if(status==='active')setResume(n=>n+1);});return ()=>sub.remove();},[]);
 useEffect(()=>{let active=true;syncInventoryNotifications(state.inventory,state.alertSettings).then(result=>{if(active)setWarning(result.unsupported&&state.alertSettings.enabled?'이 웹 화면에서는 재고 알림이 발송되지 않아요.':result.permissionDenied?'재고 알림 권한이 꺼져 있어요. 설정에서 허용해 주세요.':result.omitted?`예약 한도로 ${result.omitted}건은 아직 예약되지 않았어요. 앱을 다시 열면 갱신해요.`:'');}).catch(()=>{if(active)setWarning('재고는 저장됐지만 알림 예약 갱신에 실패했어요. 알림 설정에서 다시 시도해 주세요.');});return ()=>{active=false;};},[state.inventory,state.alertSettings,clock.today,clock.zone,resume]);
 useEffect(()=>{if(!navigation?.key)return;return observeInventoryNotifications((id,requestId)=>{if(handled.current.has(requestId))return;handled.current.add(requestId);router.push(latest.current.inventory.some(i=>i.id===id)?`/inventory/${encodeURIComponent(id)}`:'/(tabs)/inventory');});},[navigation?.key]);
 return warning?<View style={{padding:10,backgroundColor:'#fff1dc'}}><Text accessibilityLiveRegion="polite">{warning}</Text></View>:null;
}
