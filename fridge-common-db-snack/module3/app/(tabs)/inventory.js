import React,{useState} from 'react';
import {Text} from 'react-native';
import {router} from '../../../integration/router';
import {Page,Card,Button,Field,styles} from '../../components/UI';
import Choices from '../../components/Choices';
import ReferenceNotice from '../../components/ReferenceNotice';
import UndoCard from '../../components/UndoCard';
import {useApp} from '../../state/AppProvider';
import {useDayClock} from '../../hooks/useDayClock';
import {daysLeft} from '../../domain/inventory.mjs';
import {STORAGE_METHODS} from '../../domain/inventoryFields.mjs';
import {money} from '../../domain/transactions.mjs';
import {householdForecast} from '../../domain/nonAi.mjs';
export default function Inventory(){
 const {state,confirmHousehold}=useApp(),{today}=useDayClock();
 const [query,setQuery]=useState(''),[place,setPlace]=useState('all'),[period,setPeriod]=useState('all'),[error,setError]=useState('');
 const items=state.inventory.filter(i=>i.name.includes(query)&&(place==='all'||(place==='household'?i.category==='household':i.storageMethod===place))&&(period==='all'||(i.category!=='household'&&(period==='urgent'?daysLeft(i.expiresAt,today)>=0&&daysLeft(i.expiresAt,today)<=3:daysLeft(i.expiresAt,today)<0)))).sort((a,b)=>(a.expiresAt||'9999').localeCompare(b.expiresAt||'9999'));
 return <Page title="냉장고·창고" subtitle="같은 품목도 구매 묶음별로 구분해요."><UndoCard/><Button secondary title="전체 재고 변경 이력" onPress={()=>router.push("/inventory/history")}/><Button title="+ 재고 등록" onPress={()=>router.push('/inventory/new')}/><Button secondary title="냉장고 레시피" onPress={()=>router.push('/(tabs)/recipe')}/><Button secondary title="재고 임박 알림 설정" onPress={()=>router.push('/inventory/alerts')}/>
 <Choices label="보관 장소 / 분류" value={place} onChange={setPlace} options={[{value:'all',label:'전체'},...STORAGE_METHODS,{value:'household',label:'생필품'}]}/>
 <Choices label="날짜 상태" value={period} onChange={setPeriod} options={[{value:'all',label:'전체'},{value:'urgent',label:'3일 이내'},{value:'past',label:'날짜 경과'}]}/>
 <Field label="재고 이름 검색" value={query} onChangeText={setQuery}/><Text style={styles.muted}>{today} 기준 · {items.length}개 구매 묶음</Text>{!!error&&<Text style={styles.error}>{error}</Text>}
 {items.map(i=>{const d=daysLeft(i.expiresAt,today),forecast=i.category==='household'?householdForecast(i,state.usages):null;return <Card key={i.id}>
 <Text style={styles.label}>{i.name} · {i.quantity}{i.unit}</Text><Text>{i.category==='household'?'생필품':'식재료'} · {STORAGE_METHODS.find(o=>o.value===i.storageMethod)?.label||'보관 미입력'}</Text>
 {!!i.expiresAt&&<Text style={d<0?styles.error:styles.muted}>{i.dateType==='package'?'표시 소비기한':'보관 참고일'} {i.expiresAt} · {d<0?`${-d}일 지남`:d===0?'오늘까지':`${d}일 남음`}</Text>}
 <Text style={styles.muted}>구매일 {i.purchasedAt||'미입력'} · 개봉 {i.openedAt||'미확인'}</Text><Text>잔여 금액 {money(i.remainingCost)}</Text>
 <Button secondary title="수정 / 삭제 / 보관 상태" onPress={()=>router.push(`/inventory/${i.id}`)}/><Button secondary title="실제 사용량 입력" onPress={()=>router.push(`/inventory/use/${i.id}`)}/><Button secondary title="일부 수량 폐기" onPress={()=>router.push(`/inventory/discard/${i.id}`)}/>
 {forecast&&<><Text style={styles.muted}>{forecast.mode==='estimate'?`사용 기록 기준 예상 잔량 ${forecast.quantity}${i.unit} (추정) · 기록 잔량은 자동 변경하지 않아요.`:'사용 기록이 부족해 잔량을 예측하지 않아요.'}</Text><Text>다음 수동 확인일 {forecast.reviewAt}</Text><Button secondary title="아직 남음 · 기록 잔량과 같음" onPress={()=>confirmHousehold(i.id).catch(e=>setError(e.message))}/><Text style={styles.muted}>실제 잔량이 다르면 수정 화면에서 수량을 보정해 주세요.</Text></>}
 <Text style={styles.label}>최근 변경 이력</Text>
 {(state.inventoryEvents||[]).filter(e=>e.batchId===i.id).slice(0,5).map(e=><Text key={e.id} style={styles.muted}>{new Date(e.at).toLocaleString('ko-KR')} · {e.kind==='create'?'등록':e.kind==='use'?'사용':e.kind==='delete'?'삭제':'수정'}{e.kind==='use'&&!state.usages.some(u=>u.id===e.id)?' (취소됨)':''}{e.before?` · ${e.before.quantity} → ${e.after?.quantity??0}${i.unit}`:''}{e.before?.storageMethod!==e.after?.storageMethod?` · 보관 ${STORAGE_METHODS.find(o=>o.value===e.before?.storageMethod)?.label||'미입력'} → ${STORAGE_METHODS.find(o=>o.value===e.after?.storageMethod)?.label||'없음'}`:''}{e.before?.openedAt!==e.after?.openedAt?` · 개봉 ${e.after?.openedAt||'미확인'}`:''}</Text>)}
 {state.meals.flatMap(m=>(m.changes||[]).filter(c=>c.batchId===i.id).map(c=><Text key={m.id+c.batchId} style={styles.muted}>{new Date(m.createdAt).toLocaleString('ko-KR')} · 조리 {c.quantity}{c.unit} 사용</Text>)).slice(0,5)}
 </Card>;})}
 {!items.length&&<Text>조건에 맞는 재고가 없어요.</Text>}<ReferenceNotice/>
 </Page>;
}
