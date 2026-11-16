import {useState} from 'react';
import {Text,View,Pressable} from 'react-native';
import {router} from 'expo-router';
import {useApp} from '../../features/fridge/state/AppProvider';
import {Page,Button,styles} from '../../features/fridge/components/UI';
import {daysLeft} from '../../features/fridge/domain/inventory.mjs';
import {useDayClock} from '../../features/fridge/hooks/useDayClock';
import SyncStatus from '../../features/fridge/components/SyncStatus';
export default function Fridge(){
 const {state}=useApp();useDayClock();const [urgentOnly,setUrgentOnly]=useState(false);
 const urgent=i=>daysLeft(i.expiresAt)>=0&&daysLeft(i.expiresAt)<=3;
 const items=state.inventory.filter(i=>!urgentOnly||urgent(i)).slice().sort((a,b)=>(a.expiresAt||'9999').localeCompare(b.expiresAt||'9999'));
 return <Page title="냉장고" subtitle="우리 집 식재료, 기한 전에 챙겨요.">
 <Button secondary title="＋ 식재료 추가" onPress={()=>router.push('/fridge/inventory/new')}/>
 <Button secondary title="레시피 검색 · 임시 추천" onPress={()=>router.push('/fridge/recipe')}/>
 <View style={{gap:8}}>{[['재고 관리 · 사용/폐기','inventory'],['장보기 목록','shopping'],['식사 · 폐기 기록','meal'],['날짜 알림','inventory/alerts'],['변경 기록','inventory/history']].map(([title,path])=><Button key={path} secondary title={title} onPress={()=>router.push('/fridge/'+path)}/>)}</View>
 <SyncStatus/>
 <Text style={styles.label}>보관 중인 식재료</Text><Button secondary title={urgentOnly?`날짜 임박 ${state.inventory.filter(urgent).length} · 전체 보기`:`전체 ${state.inventory.length} · 임박만 보기`} onPress={()=>setUrgentOnly(v=>!v)}/>
 {items.map(i=>{const days=daysLeft(i.expiresAt);return <Pressable accessibilityRole="button" key={i.id} onPress={()=>router.push('/fridge/inventory/'+i.id)} style={{paddingVertical:18,borderBottomWidth:1,borderColor:'#e0e8df'}}><Text style={styles.label}>{i.name}　{Number.isNaN(days)?'기한 미확정':days===0?'오늘까지':days<0?'기한 경과':days+'일 남음'}</Text><Text style={styles.muted}>{i.quantity}{i.unit} · {i.expiresAt||'날짜 입력 필요'}</Text></Pressable>;})}
 {!items.length&&<Text>등록된 식재료가 없어요.</Text>}
 </Page>;
}
