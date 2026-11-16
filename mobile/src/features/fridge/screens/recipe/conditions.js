import React,{useRef,useState} from 'react';
import {Text,Switch,View} from 'react-native';
import {useApp} from '../../state/AppProvider';
import {Page,Field,Button,styles} from '../../components/UI';
import Choices from '../../components/Choices';
export default function Conditions(){
 const {state,saveConditions}=useApp(),[draft,setDraft]=useState(()=>({...state.conditions})),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),lock=useRef(false);
 const set=k=>v=>{setDraft(d=>({...d,[k]:v}));setMessage('');};
 return <Page title="조리·식사 조건" subtitle="저장한 조건은 다음 레시피 검색에도 적용돼요.">
 <Choices multiple label="사용 가능한 도구" options={[{value:'pan',label:'팬'},{value:'pot',label:'냄비'},{value:'microwave',label:'전자레인지'}]} value={draft.tools} onChange={set('tools')}/>
 <Field label="최대 조리시간 (분, 0은 제한 없음)" keyboardType="number-pad" value={String(draft.maxMinutes)} onChangeText={set('maxMinutes')}/>
 <Field label="이번 식사 예산 (원, 선택)" keyboardType="number-pad" value={draft.budget==null?'':String(draft.budget)} onChangeText={set('budget')}/>
 <Text style={styles.muted}>비용 정보가 없는 예시 요리는 예산 조건을 만족한다고 판단하지 않아 제외돼요. 예산을 비우면 비용 조건 없이 볼 수 있어요.</Text>
 <Choices label="체력" value={draft.energy} onChange={set('energy')} options={[{value:'normal',label:'보통'},{value:'low',label:'방전 · 간편 조리'}]}/>
 <Text style={styles.muted}>방전모드는 15분 이내·설거지가 적은 예시 메뉴만 보여줘요.</Text>
 <Field label="제외 재료 (쉼표로 구분)" value={draft.excluded} onChangeText={set('excluded')} placeholder="예: 달걀, 김치"/>
 <Text style={styles.muted}>등록된 재료명을 기준으로 제외해요. 알레르기가 있다면 제품 성분도 직접 확인해 주세요.</Text>
 {[['onePan','원팬 요리만'],['minCleanup','설거지 최소']].map(([key,label])=><View key={key} style={{flexDirection:'row',justifyContent:'space-between'}}><Text>{label}</Text><Switch accessibilityLabel={label} value={draft[key]} onValueChange={set(key)}/></View>)}
 <Button title="조건 저장" disabled={busy} onPress={async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{await saveConditions(draft);setMessage('저장했어요. 다음 추천과 검색에 적용돼요.');}catch(e){setMessage(e.message);}finally{lock.current=false;setBusy(false);}}}/><Text accessibilityLiveRegion="polite">{message}</Text>
 </Page>;
}
