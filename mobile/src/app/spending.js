import { useCallback,useRef,useState } from 'react';
import { Pressable,StyleSheet,Text,View } from 'react-native';
import { Redirect,router,useFocusEffect,useLocalSearchParams } from 'expo-router';
import { Page,Card,Field,Button,styles,useTask } from '../components/UI';
import { useSession } from '../state/Session';
import { koreaToday,parseMoney,won } from '../lib/api';
const categories={food:'외식·배달',groceries:'식재료',living:'생활용품',transport:'교통',other:'기타'};
const empty=()=>({title:'',amount:'',date:koreaToday(),category:'food'});
const validMonth=value=>typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const badges={food:'외식',groceries:'식재료',living:'생활',transport:'교통',other:'기타'};
const sources={ocr:'영수증',sms:'결제 문자',notification:'자동수집',kakao:'카카오톡',commerce:'온라인 주문'};
function MonthButton({label,children,onPress,disabled}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[design.monthButton,disabled&&design.disabled]}><Text style={design.monthText}>{children}</Text></Pressable>;
}
function BudgetSummary({summary,warning}){
 const {budget_krw:limit,spent_krw:spent,remaining_krw:left}=summary;
 const used=limit>0?Math.round(spent/limit*100):null;
 return <View style={design.hero}>
 <Text style={design.label}>조회 월 남은 예산</Text>
 <Text style={design.balance}>{left==null?'예산 미설정':won(left)}</Text>
 {used!=null&&<><Text style={styles.small}>예산의 {used}% 사용</Text><View style={design.track}><View style={[design.fill,{width:`${Math.max(0,Math.min(100,used))}%`}]}/></View></>}
 <View style={design.totals}><View><Text style={styles.small}>지출</Text><Text style={design.value}>{won(spent)}</Text></View><View><Text style={styles.small}>월 예산</Text><Text style={design.value}>{won(limit)}</Text></View></View>
 <Text style={warning==='exceeded'?styles.error:styles.small}>{warnings[warning]}</Text>
 </View>;
}
const warnings={unset:'예산을 설정해 주세요.',normal:'예산 안에서 사용하고 있어요.',near_limit:'예산을 80% 이상 사용했어요.',reached:'예산을 모두 사용했어요.',exceeded:'예산을 초과했어요.'};
export default function Spending(){
 const {api,setSession}=useSession(),{busy,error,run,setError}=useTask();
 const {period:savedPeriod,savedExpense}=useLocalSearchParams();
 const initialMonth=validMonth(savedPeriod)?savedPeriod:koreaToday().slice(0,7);
 const activeMonth=useRef(initialMonth);
 const lastSavedExpense=useRef(null);
 const [month,setMonth]=useState(initialMonth),[data,setData]=useState(null),[budget,setBudget]=useState('');
 const [entry,setEntry]=useState(empty),[editing,setEditing]=useState(null),[deleting,setDeleting]=useState(null),[notice,setNotice]=useState('');
 const [manualOpen,setManualOpen]=useState(false),[budgetOpen,setBudgetOpen]=useState(false),[toolsOpen,setToolsOpen]=useState(false);
 const refresh=async(period=activeMonth.current)=>{
  if(!validMonth(period))throw new Error('조회 월을 확인하세요.');
  const d=await api('me/spending?period='+period);
  activeMonth.current=period;setMonth(period);setData(d);setBudget(d.data.budget_krw==null?'':String(d.data.budget_krw));
 };
 useFocusEffect(useCallback(()=>{
  if(!api)return;
  const fromSave=validMonth(savedPeriod)&&typeof savedExpense==='string'&&lastSavedExpense.current!==savedExpense;
  if(fromSave)lastSavedExpense.current=savedExpense;
  if(fromSave){
   activeMonth.current=savedPeriod;setMonth(savedPeriod);setData(null);
   setNotice('지출을 저장했어요.');
  }
  run(()=>refresh());
 },[api,savedPeriod,savedExpense])); // eslint-disable-line react-hooks/exhaustive-deps
 if(!api)return <Redirect href="/"/>;
 const reset=()=>{setEntry(empty());setEditing(null);setManualOpen(false)};
 const field=(key,value)=>setEntry(e=>({...e,[key]:value}));
 const afterWrite=async(action)=>{await action();setNotice('저장 완료.');await refresh()};
 const moveMonth=offset=>run(async()=>{
  const [year,m]=month.split('-').map(Number);
  const index=year*12+m-1+offset;
  const period=`${String(Math.floor(index/12)).padStart(4,'0')}-${String(index%12+1).padStart(2,'0')}`;
  await refresh(period);setDeleting(null);reset();setNotice('');
 });
 const monthLabel=month.replace(/^(\d{4})-(\d{2})$/,(_,year,m)=>`${year}년 ${Number(m)}월`);
 return <Page title="소비">
 <View style={design.monthRow}>
  <MonthButton label="이전 달" disabled={busy} onPress={()=>moveMonth(-1)}>‹</MonthButton>
  <Text style={design.monthText}>{monthLabel}</Text>
  <MonthButton label="다음 달" disabled={busy} onPress={()=>moveMonth(1)}>›</MonthButton>
 </View>
 {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
 {!!notice&&<Text accessibilityLiveRegion="polite" style={styles.text}>{notice}</Text>}
 {data&&<BudgetSummary summary={data.data} warning={data.warning}/>}
 <Button title="영수증 촬영 · 사진첩 업로드" disabled={busy} onPress={()=>router.push('/spending-import')}/>
 <View style={styles.row}>
  <Button title={manualOpen?'직접 입력 닫기':'지출 직접 입력'} disabled={busy} onPress={()=>manualOpen?reset():setManualOpen(true)}/>
  <Button title={budgetOpen?'예산 설정 닫기':'예산 설정'} disabled={busy||!data} onPress={()=>setBudgetOpen(!budgetOpen)}/>
  <MonthButton label="소비 내역 새로고침" disabled={busy} onPress={()=>run(()=>refresh())}>새로고침</MonthButton>
 </View>
 {busy&&<Text accessibilityLiveRegion="polite" style={styles.small}>처리 중…</Text>}
 {data&&budgetOpen&&<Card>
 <Field label="월 예산 (원)" value={budget} onChangeText={setBudget} keyboardType="number-pad" editable={!busy}/>
 <Button title="온보딩 예산 불러오기" disabled={busy} onPress={()=>{if(data.suggested_budget_krw==null){setError('생활 설정에 입력된 예산이 없어요.');return}setBudget(String(data.suggested_budget_krw));setNotice('불러왔어요. 예산 저장을 눌러 적용하세요.')}}/>
 <Button title="예산 저장" disabled={busy} onPress={()=>run(()=>afterWrite(()=>api('me/spending/budgets/'+month,'PUT',{budget_krw:parseMoney(budget)})))}/>
 <Button title="예산 해제" disabled={busy} onPress={()=>run(()=>afterWrite(()=>api('me/spending/budgets/'+month,'PUT',{budget_krw:null})))}/></Card>}
 {manualOpen&&
 <Card><Text style={styles.title}>{editing?'지출 수정':'지출 등록'}</Text><Field label="사용처·내용" value={entry.title} onChangeText={v=>field('title',v)} editable={!busy} maxLength={100}/><Field label="금액 (원)" value={entry.amount} onChangeText={v=>field('amount',v)} keyboardType="number-pad" editable={!busy}/><Field label="날짜 (YYYY-MM-DD)" value={entry.date} onChangeText={v=>field('date',v)} editable={!busy}/><View style={styles.row}>{Object.entries(categories).map(([k,label])=><Button key={k} title={(entry.category===k?'✓ ':'')+label} disabled={busy} onPress={()=>field('category',k)}/>)}</View>
 <Button title={editing?'수정 저장':'지출 등록'} disabled={busy} onPress={()=>run(async()=>{
 const body={title:entry.title.trim(),amount_krw:parseMoney(entry.amount,false),spent_on:entry.date,category:entry.category};
 if(!body.title||!/^\d{4}-\d{2}-\d{2}$/.test(body.spent_on))throw new Error('사용처와 날짜 형식을 확인하세요.');
 await api('me/spending/expenses'+(editing?'/'+editing:''),editing?'PUT':'POST',body);
 reset();setData(null);setNotice('지출을 저장했어요.');await refresh(body.spent_on.slice(0,7));
 })}/><Button title="입력 취소" disabled={busy} onPress={reset}/></Card>}
 {data&&<Card><Text style={design.sectionTitle}>소비 내역</Text>{!data.expenses.length&&<Text style={styles.text}>이 달의 내역이 없어요.</Text>}{data.expenses.map(e=><View key={e.id} style={{gap:10,borderBottomWidth:1,borderBottomColor:'#e1eae5',paddingVertical:12}}><View style={design.transaction}><View style={design.badge}><Text style={design.badgeText}>{badges[e.category]||'기타'}</Text></View><View style={design.transactionText}><Text style={design.value}>{e.title}</Text><Text style={styles.small}>{e.spent_on} · {categories[e.category]||'기타'}{sources[e.import_source]?' · '+sources[e.import_source]:''}</Text></View><Text style={design.value}>{won(e.amount_krw)}</Text></View><View style={styles.row}>{e.category==='groceries'&&<Button title="냉장고에 등록" disabled={busy} onPress={()=>router.push({pathname:'/fridge/from-expense',params:{expenseId:e.id,period:e.spent_on.slice(0,7)}})}/>}<Button title="수정" disabled={busy} onPress={()=>{setManualOpen(true);setEditing(e.id);setEntry({title:e.title,amount:String(e.amount_krw),date:e.spent_on,category:e.category});setNotice('위 지출 수정란에서 수정하세요.')}}/><Button title="삭제" disabled={busy} onPress={()=>setDeleting(e.id)}/></View>{deleting===e.id&&<><Text style={styles.error}>이 내역을 삭제할까요?</Text><Button title="삭제 확인" disabled={busy} onPress={()=>run(async()=>{await api('me/spending/expenses/'+e.id,'DELETE');setDeleting(null);if(editing===e.id)reset();setData(null);await refresh()})}/><Button title="삭제 취소" disabled={busy} onPress={()=>setDeleting(null)}/></>}</View>)}</Card>}
 <MonthButton label={toolsOpen?'다른 기능 닫기':'다른 기능 열기'} disabled={busy} onPress={()=>setToolsOpen(!toolsOpen)}>{toolsOpen?'다른 기능 닫기':'다른 기능 보기'}</MonthButton>
 {toolsOpen&&<View style={styles.row}>{[
  ['자동수집함','/notification-inbox'],['냉장고·식사','/fridge'],['생활 루틴','/routine'],
  ['통합 현황','/dashboard'],['마이페이지','/mypage'],['생활 설정','/onboarding'],
 ].map(([label,href])=><Button key={href} title={label} disabled={busy} onPress={()=>router.push(href)}/>)}<Button title="연결 종료" disabled={busy} onPress={()=>{setSession(null);router.replace('/')}}/></View>}
 </Page>
}

const design=StyleSheet.create({
 monthRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
 monthButton:{minHeight:44,minWidth:44,paddingHorizontal:12,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'#fff'},
 monthText:{fontSize:16,fontWeight:'700',color:'#1F3A30'},
 disabled:{opacity:.45},
 hero:{gap:10,padding:22,borderRadius:24,backgroundColor:'#EEF6F1'},
 label:{color:'#236749',fontSize:15,fontWeight:'700'},
 balance:{color:'#1F3A30',fontSize:34,fontWeight:'700'},
 track:{height:8,borderRadius:8,overflow:'hidden',backgroundColor:'#DCEBE1'},
 fill:{height:8,backgroundColor:'#2F8A5B',borderRadius:8},
 totals:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:8,borderTopWidth:1,borderTopColor:'#DCEBE1',paddingTop:12},
 sectionTitle:{fontSize:22,fontWeight:'700',color:'#1F3A30'},
 value:{fontSize:16,fontWeight:'700',color:'#1F3A30'},
 transaction:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:10},
 transactionText:{flexGrow:1,flexShrink:1,flexBasis:100,gap:3},
 badge:{backgroundColor:'#E1F3E9',borderRadius:14,paddingHorizontal:9,paddingVertical:10},
 badgeText:{color:'#236749',fontSize:12,fontWeight:'700'},
});
