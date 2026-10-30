import React,{useRef,useState} from 'react';
import {Text,Linking} from 'react-native';
import {router} from 'expo-router';
import {Page,Card,Field,Button,styles} from '../../components/UI';
import {useApp} from '../../state/AppProvider';
import {purchaseUrl,shoppingItem} from '../../domain/shopping.mjs';
export default function Shopping(){
 const {state,addShopping,toggleShopping,deleteShopping,editShopping}=useApp();
 const [name,setName]=useState(''),[q,setQ]=useState('1'),[unit,setUnit]=useState('개'),[editing,setEditing]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);const lock=useRef(false);
 async function run(action){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await action();}catch(e){setError(e.message || '처리하지 못했어요. 다시 시도해 주세요.');}finally{lock.current=false;setBusy(false);}}
 function reset(){setName('');setQ('1');setUnit('개');setEditing(null);}
 async function save(){await run(async()=>{const item=shoppingItem({name,quantity:q,unit});if(editing)await editShopping(editing,item);else await addShopping([item]);reset();});}
 const items=[...state.shopping].sort((a,b)=>Number(a.done)-Number(b.done));
 return <Page title="장보기 목록" subtitle="상품과 가격은 구매처에서 확인해 주세요. 구매한 품목은 날짜와 보관 정보를 확인한 뒤 재고로 등록해요.">
  <Card><Text style={styles.label}>{editing?'품목 수정':'품목 추가'}</Text><Field label="재료명" value={name} onChangeText={setName}/><Field label="수량" value={q} onChangeText={setQ} keyboardType="decimal-pad"/><Field label="단위" value={unit} onChangeText={setUnit}/><Button disabled={busy} title={editing?'수정 저장':'목록에 추가'} onPress={save}/>{editing&&<Button secondary disabled={busy} title="수정 취소" onPress={reset}/>}<Text style={styles.muted}>같은 이름·단위의 미구매 품목은 중복 추가하지 않고 더 큰 필요 수량을 유지해요.</Text></Card>
  {!!error&&<Text style={styles.error}>{error}</Text>}
  <Text style={styles.label}>살 것 {items.filter(i=>!i.done).length}개 · 구매 완료 {items.filter(i=>i.done).length}개</Text>
  {items.map(i=><Card key={i.id}><Text style={[styles.label,i.done&&{textDecorationLine:'line-through',opacity:0.5}]}>{i.name} {i.quantity}{i.unit}</Text>
   {!i.done&&<Button secondary disabled={busy} title="쿠팡에서 상품 검색" onPress={()=>run(()=>Linking.openURL(purchaseUrl(i.name)))}/>}
   {!i.inventoryId&&<><Button secondary disabled={busy} title={i.done?'구매 체크 해제':'구매 완료'} onPress={()=>run(()=>toggleShopping(i.id))}/><Button secondary disabled={busy} title="수량 / 품목 수정" onPress={()=>{setEditing(i.id);setName(i.name);setQ(String(i.quantity));setUnit(i.unit);}}/></>}
   {i.done&&!i.inventoryId&&<Button disabled={busy} title="구매한 품목 재고 등록" onPress={()=>router.push({pathname:'/inventory/new',params:{shoppingId:i.id}})}/>}
   {!!i.inventoryId&&<Text style={styles.muted}>재고 등록 완료</Text>}
   <Button secondary disabled={busy} title="목록에서 삭제" onPress={()=>run(async()=>{await deleteShopping(i.id);if(editing===i.id)reset();})}/>
  </Card>)}
  {!items.length&&<Text>장보기 목록이 비어 있어요. 레시피 상세에서 부족한 재료를 추가할 수도 있어요.</Text>}
 </Page>;
}
