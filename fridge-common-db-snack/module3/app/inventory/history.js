import React from 'react';
import {Text} from 'react-native';
import {useApp} from '../../state/AppProvider';
import {Page,Card,styles} from '../../components/UI';
import {STORAGE_METHODS} from '../../domain/inventoryFields.mjs';
const labels={create:'등록',edit:'수정·확인',delete:'삭제',use:'사용',undo:'되돌리기'};
const storage=value=>STORAGE_METHODS.find(s=>s.value===value)?.label||'미입력';
export default function History(){
 const {state}=useApp();
 const rows=[...state.inventoryEvents.map(e=>({...e,type:'event'})),...state.meals.map(m=>({...m,at:m.createdAt,type:'meal'})),...state.discards.map(d=>({...d,at:d.createdAt,type:'discard'}))].sort((a,b)=>b.at.localeCompare(a.at));
 return <Page title="재고 변경 이력" subtitle="등록·수정·사용·폐기·취소 이력을 보여줘요. 삭제하거나 소진한 재고의 이력도 남아요.">
 {!rows.length&&<Text>기록된 변경이 없어요. 이 기능 도입 전 변경 이력은 복원하지 않아요.</Text>}
 {rows.map(e=><Card key={e.type+e.id}><Text style={styles.label}>{e.type==='event'?`${labels[e.kind]||e.kind} · ${e.after?.name||e.before?.name||'최근 작업'}`:e.type==='meal'?`조리 · ${e.name}`:`폐기 · ${e.name}`}</Text><Text style={styles.muted}>{new Date(e.at).toLocaleString('ko-KR')}</Text>
 {e.type==='event'&&e.before&&<><Text>수량 {e.before.quantity} → {e.after?.quantity??0} {e.after?.unit||e.before.unit}</Text><Text>보관 {storage(e.before.storageMethod)} → {e.after?storage(e.after.storageMethod):'삭제'}</Text><Text>날짜 {e.before.expiresAt||'미입력'} → {e.after?.expiresAt||'없음'}</Text><Text>개봉일 {e.before.openedAt||'미확인'} → {e.after?.openedAt||'미확인'}</Text></>}
 {e.kind==='use'&&!state.usages.some(u=>u.id===e.id)&&<Text>취소된 사용 기록</Text>}
 {e.type==='meal'&&e.usage.map((u,i)=><Text key={i}>{u.name} {u.quantity}{u.unit}</Text>)}{e.type==='discard'&&<Text>{e.quantity}{e.unit} · {e.reason||'사유 미입력'}</Text>}
 </Card>)}
 </Page>;
}
