import React,{useRef,useState} from 'react';
import {Text} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Page,Card,Field,Button,styles} from '../../../components/UI';
import ReferenceNotice from '../../../components/ReferenceNotice';
import UndoCard from '../../../components/UndoCard';
import {useApp,newId} from '../../../state/AppProvider';
import {removeFromBatch,quantity,money} from '../../../domain/transactions.mjs';
export default function Discard(){
 const {id}=useLocalSearchParams(),{state,discardItem}=useApp();
 const item=state.inventory.find(i=>i.id===id);
 const [amount,setAmount]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),tx=useRef(newId());
 let preview=null,problem='';
 if(item&&amount){try{preview=removeFromBatch(item,quantity(amount));}catch(e){problem=e.message;}}
 async function submit(){if(lock.current)return;lock.current=true;setBusy(true);try{await discardItem(id,amount,reason.trim(),tx.current);setDone(true);}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 if(done)return <Page title="폐기 처리"><Text>{state.discards.some(d=>d.id===tx.current)?'폐기량과 금액을 반영했어요.':'폐기가 취소되고 재고가 복구되었어요.'}</Text><UndoCard/><Button title="재고 목록" onPress={()=>router.replace('/(tabs)/inventory')}/></Page>;
 if(!item)return <Page title="재고를 찾을 수 없어요."/>;
 return <Page title={`${item.name} 폐기`}><Card><Text>현재 {item.quantity}{item.unit} · 잔여 구매 금액 {money(item.remainingCost)}</Text></Card>
  <Field editable={!busy} label={`폐기 수량 (${item.unit})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad"/>
  <Field editable={!busy} label="폐기 사유 (선택)" value={reason} onChangeText={setReason} maxLength={200}/>
  {preview&&<Card><Text style={styles.label}>확인 후 처리할 내용</Text><Text>폐기 금액: {money(preview.cost)}</Text><Text>남는 재고: {preview.item.quantity}{item.unit}</Text><Text>남는 구매 금액: {money(preview.item.remainingCost)}</Text><Text style={styles.muted}>원 단위로 반올림하며 전체 폐기 시 잔여 금액을 모두 반영해요. 가계부 결제 기록은 변경되지 않아요.</Text></Card>}
  {!!(problem||error)&&<Text style={styles.error}>{problem||error}</Text>}
  <Button title={busy?'저장 중…':'확인 후 폐기'} disabled={busy||!preview} onPress={submit}/><ReferenceNotice/>
 </Page>;
}
