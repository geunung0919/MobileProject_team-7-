import React,{useRef,useState} from 'react';
import {Text} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {useApp,newId} from '../../../state/AppProvider';
import {Page,Field,Button,Card} from '../../../components/UI';
import UndoCard from '../../../components/UndoCard';
import {removeFromBatch,money} from '../../../domain/transactions.mjs';
export default function Use(){
 const {id}=useLocalSearchParams(),{state,useItem}=useApp(),item=state.inventory.find(i=>i.id===id);
 const [amount,setAmount]=useState(''),[done,setDone]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),tx=useRef(newId()),lock=useRef(false);
 if(done)return <Page title="사용 기록"><Text>{state.usages.some(u=>u.id===tx.current)?'사용량을 저장했어요.':'사용이 취소됐어요.'}</Text><UndoCard/></Page>;
 if(!item)return <Page title="재고를 찾을 수 없어요."/>;
 let preview=null;try{preview=removeFromBatch(item,amount);}catch{}
 return <Page title={`${item.name} 사용`} subtitle="실제 사용한 수량만 입력해 주세요."><Text>현재 {item.quantity}{item.unit}</Text><Field label={`사용량 (${item.unit})`} keyboardType="decimal-pad" value={amount} onChangeText={setAmount}/>{preview&&<Card><Text>남을 수량 {preview.item.quantity}{item.unit}</Text><Text>사용 금액 {money(preview.cost)}</Text></Card>}<Button title="확인 후 차감" disabled={!preview||busy} onPress={async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{await useItem(id,amount,tx.current);setDone(true);}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}}/><Text>{error}</Text></Page>;
}
