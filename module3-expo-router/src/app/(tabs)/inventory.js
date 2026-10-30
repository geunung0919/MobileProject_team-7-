import React,{useState} from 'react';import {Text} from 'react-native';import {router} from 'expo-router';
import {Page,Card,Button,Field,styles} from '../../components/UI';
import ReferenceNotice from '../../components/ReferenceNotice';import UndoCard from '../../components/UndoCard';
import {useApp} from '../../state/AppProvider';import {daysLeft} from '../../domain/inventory.mjs';
import {STORAGE_METHODS,DATE_TYPES} from '../../domain/inventoryFields.mjs';import {money} from '../../domain/transactions.mjs';
export default function Inventory(){
 const {state}=useApp();const [query,setQuery]=useState('');
 const items=state.inventory.filter(i=>i.name.includes(query)).sort((a,b)=>a.expiresAt.localeCompare(b.expiresAt));
 return <Page title="내 재고" subtitle="보관 참고일이 가까운 순서로 보여요."><UndoCard/><Button title="+ 재고 등록" onPress={()=>router.push('/inventory/new')}/><Field label="재료 검색" value={query} onChangeText={setQuery}/><ReferenceNotice/>
 {items.length?items.map(i=>{const d=daysLeft(i.expiresAt);return <Card key={i.id}><Text style={styles.label}>{i.name} · {i.quantity}{i.unit}</Text>
 <Text style={d<0?styles.error:styles.muted}>보관 참고일(추정): {i.expiresAt} · {d<0?`${-d}일 지남`:d===0?'D-Day':`D-${d}`}</Text>
 <Text style={styles.muted}>구매일 {i.purchasedAt||'미입력'} · {STORAGE_METHODS.find(o=>o.value===i.storageMethod)?.label||'보관 방법 미입력'}</Text>
 <Text style={styles.muted}>날짜 출처: {DATE_TYPES.find(o=>o.value===i.dateType)?.label||'미입력'}</Text><Text>잔여 구매 금액: {money(i.remainingCost)}</Text>
 <Button secondary title="수정 / 삭제" onPress={()=>router.push(`/inventory/${i.id}`)}/><Button secondary title="일부 수량 폐기하기" onPress={()=>router.push(`/inventory/discard/${i.id}`)}/></Card>}):<Text>표시할 재고가 없어요.</Text>}
 {!!state.discards.length&&<Card><Text style={styles.label}>최근 폐기 기록</Text>{state.discards.slice(0,10).map(d=><Text key={d.id}>{d.name} {d.quantity}{d.unit} · {money(d.cost)} · {new Date(d.createdAt).toLocaleDateString('ko-KR')}{d.reason?` · ${d.reason}`:''}</Text>)}</Card>}
 </Page>;
}
