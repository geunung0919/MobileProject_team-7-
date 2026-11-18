import React,{useCallback,useRef,useState} from 'react';
import {Text,Linking} from 'react-native';
import {useFocusEffect,useLocalSearchParams} from 'expo-router';
import {Page,Card,Field,Button,styles} from '../../components/UI';
import {recipes} from '../../data/seed';
import {notificationsSupported,listReminders,cancelReminder,scheduleRecipeReminder} from '../../services/recipeNotifications';
export default function Reminders(){
 const {recipeId}=useLocalSearchParams(), recipe=recipes.find(r=>r.id===recipeId);
 const [hour,setHour]=useState('18'),[minute,setMinute]=useState('0'),[items,setItems]=useState([]),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);const lock=useRef(false);
 const reload=useCallback(async()=>setItems(await listReminders()),[]);
 useFocusEffect(useCallback(()=>{reload().catch(e=>setError(e.message));},[reload]));
 async function run(action){if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');try{const result=await action();await reload();setMessage(result || '알림을 취소했어요.');}catch(e){setError(e.message || '알림을 처리하지 못했어요.');}finally{lock.current=false;setBusy(false);}}
 return <Page title="레시피 알림" subtitle="휴대폰에 예약하는 알림이에요. 재고는 알림을 열 때 다시 확인해 주세요.">
  {!notificationsSupported?<Card><Text>예약 알림은 Android/iOS 앱에서 사용할 수 있어요. 웹에서는 레시피 검색과 장보기를 이용해 주세요.</Text></Card>:<>
  <Card><Text style={styles.label}>{recipe?`${recipe.name} · 한 번 알림`:'매일 레시피 확인 알림'}</Text><Text style={styles.muted}>{recipe?'오늘 시간이 지났으면 내일로 예약해요.':'선택한 시각에 매일 레시피 화면을 열도록 안내해요.'}</Text><Field label="시간 (0~23)" value={hour} onChangeText={setHour} keyboardType="number-pad" maxLength={2}/><Field label="분 (0~59)" value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2}/><Button disabled={busy} title="알림 예약 / 시간 변경" onPress={()=>run(()=>scheduleRecipeReminder({recipe,hour,minute,daily:!recipe}))}/></Card>
  <Button secondary title="휴대폰 알림 설정 열기" onPress={()=>Linking.openSettings().catch(()=>setError('휴대폰 설정 앱에서 알림을 허용해 주세요.'))}/>
  <Text style={styles.label}>예약한 알림 {items.length}개</Text>{items.map(n=><Card key={n.identifier}><Text>{n.content.title}</Text><Text style={styles.muted}>{n.content.data.label}</Text><Button secondary disabled={busy} title="알림 취소" onPress={()=>run(()=>cancelReminder(n.identifier))}/></Card>)}
  {!items.length&&<Text>예약한 알림이 없어요.</Text>}</>}
  {!!message&&<Text accessibilityLiveRegion="polite">{message}</Text>}{!!error&&<Text style={styles.error}>{error}</Text>}
 </Page>;
}
