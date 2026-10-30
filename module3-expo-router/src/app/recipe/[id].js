import React,{useRef,useState} from 'react';
import {Text} from 'react-native';
import {useLocalSearchParams,router} from 'expo-router';
import {Page,Card,Button,Field,styles} from '../../components/UI';
import ReferenceNotice from '../../components/ReferenceNotice';
import UndoCard from '../../components/UndoCard';
import {useApp,newId} from '../../state/AppProvider';
import {available,shortages} from '../../domain/inventory.mjs';
import {planMeal,money} from '../../domain/transactions.mjs';
import {recipes} from '../../data/seed';
export default function Detail(){
 const {id}=useLocalSearchParams();const r=recipes.find(x=>x.id===id);
 const {state,recordMeal,addMissing}=useApp();
 const [step,setStep]=useState('detail'),[usage,setUsage]=useState(()=>r?.ingredients.map(i=>({...i,quantity:String(i.quantity)}))||[]);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false),transactionId=useRef(null);
 if(!r)return <Page title="레시피를 찾을 수 없어요."/>;
 const missing=shortages(state.inventory,r);
 let preview=null,problem='';
 if(step==='cooking'){try{preview=planMeal(state.inventory,usage);}catch(e){problem=e.message;}}
 async function confirm(){
  if(lock.current)return;lock.current=true;setBusy(true);setMessage('');
  try {await recordMeal(r,usage,transactionId.current);setStep('done');}
  catch(e){setMessage(e.message);}finally{lock.current=false;setBusy(false);}
 }
 async function add(){if(lock.current)return;lock.current=true;setBusy(true);try{await addMissing(r);setMessage('장보기 목록에 추가했어요. 장보기 탭에서 상품을 검색할 수 있어요.');}catch(e){setMessage(e.message);}finally{lock.current=false;setBusy(false);}}
 return <Page title={r.name} subtitle={`${r.minutes}분 · 기준 1인분 · 앱에 등록된 예시 레시피`}>
  {step==='detail'&&<><Button secondary title="이 레시피 알림 예약" onPress={()=>router.push({pathname:'/recipe/reminders',params:{recipeId:r.id}})}/><Card><Text style={styles.label}>필요한 재료</Text>{r.ingredients.map(i=><Text key={i.name}>{i.name} {i.quantity}{i.unit}</Text>)}</Card>
  {missing.length>0&&<Card><Text style={styles.label}>부족한 재료</Text>{missing.map(i=><Text key={i.name}>{i.name} {i.quantity}{i.unit}</Text>)}<Button secondary disabled={busy} title="장보기 목록에 추가" onPress={add}/></Card>}
  <Button disabled={busy} title="요리 시작하기" onPress={()=>{transactionId.current=newId();setMessage('');setStep('cooking');}}/></>}
  {step!=='done'&&<Card><Text style={styles.label}>조리 순서</Text>{r.steps.map((s,i)=><Text key={s}>{i+1}. {s}</Text>)}</Card>}
  {step==='cooking'&&<>
   <Text style={styles.label}>실제로 사용한 양을 확인해 주세요</Text><Text style={styles.muted}>사용하지 않은 재료는 0으로 입력하세요. 단위는 변경되지 않으며 기한이 지난 재고는 조리 차감에서 제외돼요.</Text>
   {usage.map((i,index)=><Card key={`${i.name}-${i.unit}`}><Field editable={!busy} label={`${i.name} (${i.unit})`} keyboardType="decimal-pad" value={i.quantity} onChangeText={value=>setUsage(rows=>rows.map((row,n)=>n===index?{...row,quantity:value}:row))}/><Text style={styles.muted}>차감 가능: {available(state.inventory,i)}{i.unit}</Text></Card>)}
   {problem?<Text style={styles.error}>{problem}</Text>:<Card><Text style={styles.label}>차감 예정</Text>{preview.changes.map(c=><Text key={c.batchId}>{c.name} {c.quantity}{c.unit} · {money(c.cost)}</Text>)}</Card>}
   <Button disabled={busy||!!problem} title={busy?'저장 중…':'확인 후 차감'} onPress={confirm}/>
   <Button secondary disabled={busy} title="요리 취소 (차감 없음)" onPress={()=>{setStep('detail');setMessage('');}}/>
  </>}
  {step==='done'&&<><Text style={styles.label}>{state.meals.some(m=>m.id===transactionId.current)?'식사 기록과 재고 차감을 저장했어요.':'식사 차감이 취소되었어요.'}</Text><UndoCard/><Button title="식사 기록 보기" onPress={()=>router.replace('/(tabs)/meal')}/></>}
  {message?<Text style={styles.muted}>{message}</Text>:null}<ReferenceNotice/>
 </Page>;
}
