import {useEffect,useRef,useState} from 'react';
import {AppState,Text,View} from 'react-native';
import {useApp} from '../module3/state/AppProvider';
import {syncInventoryNotifications,observeInventoryNotifications,supported} from '../module3/services/inventoryNotifications';
import {router,navigationRef} from './router';
export default function InventoryNotificationObserver(){
 const {state}=useApp();const latest=useRef(state);latest.current=state;
 const [error,setError]=useState('');
 useEffect(()=>{if(!supported)return;let active=true;const refresh=()=>{const s=latest.current;syncInventoryNotifications(s.inventory,s.alertSettings).then(r=>{if(active)setError(r.permissionDenied?'휴대폰 설정에서 알림 권한을 허용해 주세요.':r.omitted?`예약 한도로 ${r.omitted}건이 예약되지 않았어요.`:'');}).catch(e=>{if(active)setError(e.message);});};refresh();const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});return()=>{active=false;sub.remove();};},[state.inventory,state.alertSettings]);
 useEffect(()=>{if(!supported)return;return observeInventoryNotifications(()=>router.toFridge());},[]);
 return error?<View style={{backgroundColor:'#fff2e8',padding:8}}><Text accessibilityRole="alert">알림 예약 확인: {error}</Text></View>:null;
}
