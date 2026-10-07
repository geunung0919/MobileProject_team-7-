import { useCallback,useState } from 'react';
import { Text,View } from 'react-native';
import { Redirect,router,useFocusEffect } from 'expo-router';
import { Page,Card,Field,Button,styles,useTask } from '../components/UI';
import { useSession } from '../state/Session';
import { koreaToday,parseMoney,won } from '../lib/api';
const categories={food:'외식·배달',groceries:'식재료',living:'생활용품',transport:'교통',other:'기타'};
const empty=()=>({title:'',amount:'',date:koreaToday(),category:'food'});
const warnings={unset:'예산을 설정해 주세요.',normal:'예산 안에서 사용하고 있어요.',near_limit:'예산을 80% 이상 사용했어요.',reached:'예산을 모두 사용했어요.',exceeded:'예산을 초과했어요.'};
export default function Spending(){
 const {api,setSession}=useSession(),{busy,error,run,setError}=useTask();
 const [month,setMonth]=useState(koreaToday().slice(0,7)),[data,setData]=useState(null),[budget,setBudget]=useState('');
 const [entry,setEntry]=useState(empty),[editing,setEditing]=useState(null),[deleting,setDeleting]=useState(null),[notice,setNotice]=useState('');
 const refresh=async(period=month)=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw new Error('조회 월은 YYYY-MM으로 입력하세요.');const d=await api('me/spending?period='+period);setData(d);setBudget(d.data.budget_krw==null?'':String(d.data.budget_krw));setMonth(period)};
 useFocusEffect(useCallback(()=>{if(api)run(()=>refresh())},[api])); // eslint-disable-line react-hooks/exhaustive-deps
 if(!api)return <Redirect href="/"/>;
 const reset=()=>{setEntry(empty());setEditing(null)};
 const field=(key,value)=>setEntry(e=>({...e,[key]:value}));
 const afterWrite=async(action,period=month)=>{await action();setData(null);setNotice('저장 완료.');await refresh(period)};
 return <Page title="내 소비 관리"><View style={styles.row}><Button title="냉장고·식사" disabled={busy} onPress={()=>router.push('/fridge')}/><Button title="생활 설정" disabled={busy} onPress={()=>router.push('/onboarding')}/><Button title="연결 종료" disabled={busy} onPress={()=>{setSession(null);router.replace('/')}}/></View>
 {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}{!!notice&&<Text style={styles.small}>{notice}</Text>}
 <Card><Field label="조회 월 (YYYY-MM)" value={month} editable={!busy} onChangeText={v=>{setMonth(v);setData(null);setDeleting(null);reset();setNotice('')}}/><Button title={busy?'처리 중…':'조회 / 새로고침'} disabled={busy} onPress={()=>run(()=>refresh())}/></Card>
 {data&&<><Card><Text style={styles.small}>남은 예산</Text><Text style={styles.title}>{won(data.data.remaining_krw)}</Text><Text style={styles.text}>사용 {won(data.data.spent_krw)} / 예산 {won(data.data.budget_krw)}</Text><Text style={data.warning==='exceeded'?styles.error:styles.text}>{warnings[data.warning]}</Text>
 <Field label="월 예산 (원)" value={budget} onChangeText={setBudget} keyboardType="number-pad" editable={!busy}/>
 <Button title="온보딩 예산 불러오기" disabled={busy} onPress={()=>{if(data.suggested_budget_krw==null){setError('생활 설정에 입력된 예산이 없어요.');return}setBudget(String(data.suggested_budget_krw));setNotice('불러왔어요. 예산 저장을 눌러 적용하세요.')}}/>
 <Button title="예산 저장" disabled={busy} onPress={()=>run(()=>afterWrite(()=>api('me/spending/budgets/'+month,'PUT',{budget_krw:parseMoney(budget)})))}/>
 <Button title="예산 해제" disabled={busy} onPress={()=>run(()=>afterWrite(()=>api('me/spending/budgets/'+month,'PUT',{budget_krw:null})))}/></Card>
 <Card><Text style={styles.title}>{editing?'지출 수정':'지출 등록'}</Text><Field label="사용처·내용" value={entry.title} onChangeText={v=>field('title',v)} editable={!busy} maxLength={100}/><Field label="금액 (원)" value={entry.amount} onChangeText={v=>field('amount',v)} keyboardType="number-pad" editable={!busy}/><Field label="날짜 (YYYY-MM-DD)" value={entry.date} onChangeText={v=>field('date',v)} editable={!busy}/><View style={styles.row}>{Object.entries(categories).map(([k,label])=><Button key={k} title={(entry.category===k?'✓ ':'')+label} disabled={busy} onPress={()=>field('category',k)}/>)}</View>
 <Button title={editing?'수정 저장':'지출 등록'} disabled={busy} onPress={()=>run(async()=>{
 const body={title:entry.title.trim(),amount_krw:parseMoney(entry.amount,false),spent_on:entry.date,category:entry.category};
 if(!body.title||!/^\d{4}-\d{2}-\d{2}$/.test(body.spent_on))throw new Error('사용처와 날짜 형식을 확인하세요.');
 await api('me/spending/expenses'+(editing?'/'+editing:''),editing?'PUT':'POST',body);
 reset();setData(null);setNotice('지출을 저장했어요.');await refresh(body.spent_on.slice(0,7));
 })}/><Button title="입력 취소" disabled={busy} onPress={reset}/></Card>
 <Card><Text style={styles.title}>소비 내역</Text>{!data.expenses.length&&<Text style={styles.text}>이 달의 내역이 없어요.</Text>}{data.expenses.map(e=><View key={e.id} style={{gap:10,borderBottomWidth:1,borderBottomColor:'#e1eae5',paddingVertical:12}}><Text style={styles.text}>{e.title} · {won(e.amount_krw)}</Text><Text style={styles.small}>{e.spent_on} · {categories[e.category]}</Text><View style={styles.row}>{e.category==='groceries'&&<Button title="냉장고에 등록" disabled={busy} onPress={()=>router.push({pathname:'/fridge/from-expense',params:{expenseId:e.id,period:e.spent_on.slice(0,7)}})}/>}<Button title="수정" disabled={busy} onPress={()=>{setEditing(e.id);setEntry({title:e.title,amount:String(e.amount_krw),date:e.spent_on,category:e.category});setNotice('위 지출 수정란에서 수정하세요.')}}/><Button title="삭제" disabled={busy} onPress={()=>setDeleting(e.id)}/></View>{deleting===e.id&&<><Text style={styles.error}>이 내역을 삭제할까요?</Text><Button title="삭제 확인" disabled={busy} onPress={()=>run(async()=>{await api('me/spending/expenses/'+e.id,'DELETE');setDeleting(null);if(editing===e.id)reset();setData(null);await refresh()})}/><Button title="삭제 취소" disabled={busy} onPress={()=>setDeleting(null)}/></>}</View>)}</Card></>}
 </Page>
}
