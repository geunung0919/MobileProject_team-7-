import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Button, Card, Field, Page, styles, useTask } from '../components/UI';
import { useSession } from '../state/Session';
import { useRoutines } from '../features/routine/state/RoutineProvider';
import { koreaDate } from '../features/routine/domain/notifications.mjs';
import { WEEK_DAYS,addRoutine,makeRoutine,removeRoutine,recentRoutineHistory,repeatLabel,routinesForDate,toggleRoutineComplete,editRoutine,toggleRoutineReminder } from '../features/routine/domain/routines.mjs';
const EVERY_DAY=[0,1,2,3,4,5,6],WEEKDAYS=[1,2,3,4,5],WEEKEND=[0,6];
const newForm=()=>({title:'',reminderTime:'',energy:'normal',days:EVERY_DAY});
export default function Routine(){
 const {api,routineKey}=useSession();
 if(!api || !routineKey)return <Redirect href="/"/>;
 return <RoutineContent key={routineKey}/>;
}
function RoutineContent(){
 const {busy,error,run}=useTask();
 const {routineState:state,notificationPreferences,notificationInfo,notificationBusy,notificationError,loadError,today,
  updateRoutine,enableRoutineReminders,refreshRoutineNotifications,retryRoutineLoad,routineNotificationsSupported}=useRoutines();
 const [form,setForm]=useState(newForm),[editing,setEditing]=useState(null),[batteryMode,setBatteryMode]=useState(false),[notice,setNotice]=useState('');
 const [showDone,setShowDone]=useState(false),[historyDate,setHistoryDate]=useState(null);
 const change=(key,value)=>setForm(current=>({...current,[key]:value}));
 const sameDays=values=>form.days.length===values.length&&values.every(day=>form.days.includes(day));
 const toggleDay=day=>change('days',form.days.includes(day)?form.days.filter(value=>value!==day):[...form.days,day]);
 const reset=()=>{setForm(newForm());setEditing(null);};
 const save=()=>run(async()=>{
  const input={title:form.title,days:form.days,reminderTime:form.reminderTime.trim(),energy:form.energy};
  if(editing)await updateRoutine(current=>editRoutine(current,editing,input));
  else {
   const item=makeRoutine({...input,id:`routine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`});
   await updateRoutine(current=>addRoutine(current,item));
  }
  reset();setNotice('루틴을 기기에 저장했어요. 아래 알림 연결 상태도 확인해 주세요.');
 });
 const scheduledToday=state?routinesForDate(state,today):[];
 const completed=scheduledToday.filter(item=>item.completedDates.includes(today)).length;
 const visibleToday=scheduledToday.filter(item=>!batteryMode||item.energy==='low');
 const todayItems=visibleToday.filter(item=>showDone||!item.completedDates.includes(today));
 const history=state?recentRoutineHistory(state,today):[];
 const selectedDay=history.find(day=>day.date===historyDate)??history[0];
 const statuses={scheduled:'예약 반영 완료',disabled:'서버 알림 설정 OFF',permission_denied:'휴대폰 알림 권한이 꺼져 있어요',waiting:'기록·서버 설정 확인 중',error:'기기 예약 반영 실패 · 재시도 필요',unsupported:'웹에서는 휴대폰 알림을 예약할 수 없어요'};
 return <Page title="생활 루틴">
  <Card><Text style={styles.title}>오늘 {completed}/{scheduledToday.length} 완료</Text><Text style={styles.text}>반복 일정과 완료 기록은 이 계정의 기기에 저장돼요.</Text>
   <Button title={batteryMode?'✓ 방전모드 ON':'방전모드 OFF'} disabled={busy} onPress={()=>setBatteryMode(value=>!value)}/>
   <Text style={styles.small}>방전모드는 ‘5분 이하’ 루틴만 화면에 보여줘요. 다른 루틴의 알림을 임의로 끄지는 않아요.</Text>
  </Card>
  <Card><Text style={styles.text}>생활 루틴 알림 · {notificationPreferences?(notificationPreferences.routine_reminders?'ON':'OFF'):'설정 미확인'}</Text>
   <Text style={styles.small}>{notificationBusy?'기기 예약을 반영 중이에요…':statuses[notificationInfo?.status]||'알림 상태 확인 필요'}</Text>
   {notificationInfo?.status==='scheduled'&&<Text style={styles.small}>다음 7일 {notificationInfo.count}건 · {new Date(notificationInfo.until).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}까지 예약 범위</Text>}
   <Text style={styles.small}>한국 시간 기준이에요. 앱 진입·편집 때 앞으로 7일치를 예약하고 오늘 완료한 알림은 취소해요. 7일 이상 앱을 열지 않으면 이후 알림은 새로 예약되지 않아요.</Text>
   {!!notificationError&&<Text accessibilityRole="alert" style={styles.error}>{notificationError}</Text>}
   <Button title={notificationPreferences?.routine_reminders?'루틴 알림 끄기':'루틴 알림 켜기'} disabled={busy||notificationBusy||!notificationPreferences||!routineNotificationsSupported}
    onPress={()=>run(async()=>{await enableRoutineReminders(!notificationPreferences.routine_reminders);setNotice('서버 알림 설정과 이 기기의 예약을 반영했어요.');})}/>
   <Button title="알림 설정 다시 확인 / 예약 재시도" disabled={busy||notificationBusy} onPress={()=>run(refreshRoutineNotifications)}/>
   {routineNotificationsSupported&&<Button title="휴대폰 알림 설정 열기" disabled={busy} onPress={()=>run(()=>Linking.openSettings())}/>}
   <Text style={styles.small}>마이페이지의 생활 루틴 알림 설정과 연결돼요. 다른 기기에서 설정을 바꾼 경우 이 앱을 다시 열 때 반영해요.</Text>
  </Card>
  {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}{!!notice&&<Text style={styles.small}>{notice}</Text>}
  {!!loadError&&<Card><Text style={styles.error}>{loadError}</Text><Button title="루틴 다시 불러오기" disabled={busy} onPress={()=>run(retryRoutineLoad)}/></Card>}
  <Card><Text style={styles.title}>오늘 할 일</Text>
   {!state&&<Text style={styles.text}>루틴을 불러오는 중이에요.</Text>}
   <Button title={showDone?'완료 항목 숨기기':'완료 항목도 보기'} disabled={busy||!state} onPress={()=>setShowDone(value=>!value)}/>
   {state&&!todayItems.length&&<Text style={styles.text}>{!visibleToday.length?(batteryMode?'오늘 예정된 5분 이하 루틴이 없어요.':'오늘 예정된 루틴이 없어요.'):'지금 보이는 루틴을 모두 완료했어요.'}</Text>}
   {todayItems.map(item=>{const done=item.completedDates.includes(today);return <View key={item.id} style={{gap:8,borderBottomWidth:1,borderBottomColor:'#e1eae5',paddingVertical:10}}>
    <Text style={[styles.text,done&&{textDecorationLine:'line-through',opacity:.55}]}>{done?'✓ ':''}{item.title}</Text>
    <Text style={styles.small}>{repeatLabel(item.days)} · {item.energy==='low'?'5분 이하':'보통'}{item.reminderTime?` · ${item.reminderTime} (한국 시간)`:''}</Text>
    <Button title={done?'완료 취소':'오늘 완료'} disabled={busy} onPress={()=>run(async()=>{
     await updateRoutine(current=>toggleRoutineComplete(current,item.id,koreaDate(new Date())));
     setNotice(done?'완료 표시를 취소했어요. 시간이 아직 지나지 않았다면 오늘 알림도 다시 예약해요.':'오늘 완료했어요. 남아 있는 오늘 알림을 정리해요.');
    })}/>
   </View>;})}
  </Card>
  {state&&<Card>
   <Text style={styles.title}>최근 7일 완료 기록</Text>
   <Text style={styles.text}>총 {history.reduce((count,day)=>count+day.completed.length,0)}건 완료</Text>
   <View style={styles.row}>{history.map(day=><Button key={day.date}
    title={(selectedDay?.date===day.date?'✓ ':'')+(day.date===today?'오늘':day.date.slice(5).replace('-','/'))+' · '+day.completed.length+'건'}
    disabled={busy} onPress={()=>setHistoryDate(day.date)}/>)}</View>
   {!!selectedDay&&<><Text style={styles.text}>{selectedDay.date} 완료 목록</Text>
    {selectedDay.completed.length?selectedDay.completed.map(item=><Text key={item.id} style={styles.small}>✓ {item.title}</Text>):<Text style={styles.small}>완료 기록이 없어요.</Text>}
   </>}
   <Text style={styles.small}>한국 날짜 기준이에요. 현재 등록된 루틴의 완료 기록을 표시해요.</Text>
  </Card>}
  <Card><Text style={styles.title}>{editing?'반복 루틴 수정':'반복 루틴 추가'}</Text>
   <Field label="루틴 이름" value={form.title} maxLength={60} editable={!busy} placeholder="예: 설거지 5분" onChangeText={value=>change('title',value)}/>
   <Field label="알림 시간 (선택, 한국 시간 HH:MM)" value={form.reminderTime} maxLength={5} editable={!busy} keyboardType="numbers-and-punctuation" placeholder="21:30" onChangeText={value=>change('reminderTime',value)}/>
   <Text style={styles.text}>반복 요일</Text><View style={styles.row}>{[['매일',EVERY_DAY],['평일',WEEKDAYS],['주말',WEEKEND]].map(([name,days])=><Button key={name} title={(sameDays(days)?'✓ ':'')+name} disabled={busy} onPress={()=>change('days',days)}/>)}</View>
   <View style={styles.row}>{WEEK_DAYS.map(day=><Button key={day.value} title={(form.days.includes(day.value)?'✓ ':'')+day.label} disabled={busy} onPress={()=>toggleDay(day.value)}/>)}</View>
   <Text style={styles.text}>에너지</Text><View style={styles.row}>{[['5분 이하','low'],['보통','normal']].map(([name,value])=><Button key={value} title={(form.energy===value?'✓ ':'')+name} disabled={busy} onPress={()=>change('energy',value)}/>)}</View>
   <Button title={busy?'저장 중…':editing?'수정 저장':'루틴 저장'} disabled={busy||!state} onPress={save}/>
   {editing&&<Button title="수정 취소" disabled={busy} onPress={reset}/>}
  </Card>
  <Card><Text style={styles.title}>등록된 반복 루틴</Text>
   {state&&!state.routines.length&&<Text style={styles.text}>아직 등록한 루틴이 없어요.</Text>}
   {state?.routines.map(item=><View key={item.id} style={{gap:8,borderBottomWidth:1,borderBottomColor:'#e1eae5',paddingVertical:10}}>
    <Text style={styles.text}>{item.title}</Text><Text style={styles.small}>{repeatLabel(item.days)} · {item.energy==='low'?'5분 이하':'보통'}{item.reminderTime?` · ${item.reminderTime} · 항목 알림 ${item.remindersEnabled===false?'OFF':'ON'}`:' · 알림 시간 없음'}</Text>
    <Button title="이름 / 요일 / 시간 수정" disabled={busy} onPress={()=>{setEditing(item.id);setForm({title:item.title,days:[...item.days],energy:item.energy,reminderTime:item.reminderTime||''});setNotice('위 수정란에서 변경해 주세요.');}}/>
    {!!item.reminderTime&&<Button title={item.remindersEnabled===false?'이 항목 알림 켜기':'이 항목 알림 끄기'} disabled={busy} onPress={()=>run(()=>updateRoutine(current=>toggleRoutineReminder(current,item.id)))}/>}
    <Button title="삭제" disabled={busy} onPress={()=>run(async()=>{await updateRoutine(current=>removeRoutine(current,item.id));if(editing===item.id)reset();setNotice('루틴을 삭제했어요. 기기 알림 정리 결과는 위 알림 상태를 확인해 주세요.');})}/>
   </View>)}
  </Card>
 </Page>;
}
