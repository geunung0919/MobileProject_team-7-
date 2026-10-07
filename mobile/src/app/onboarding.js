import { useEffect,useState } from 'react';
import { Text,View } from 'react-native';
import { Redirect,router,useLocalSearchParams } from 'expo-router';
import { Page,Card,Field,Button,styles,useTask } from '../components/UI';
import { useSession } from '../state/Session';
import { won } from '../lib/api';
export default function Onboarding(){
 const {returnTo}=useLocalSearchParams();
 const destination=returnTo==='mypage'?'/mypage':'/spending';
 const {api}=useSession(),{busy,error,run}=useTask();
 const [form,setForm]=useState(null),[profile,setProfile]=useState({}),[preview,setPreview]=useState(null);
 const load=()=>run(async()=>{const f=await api('onboarding/form');let p={};try{p=(await api('me/onboarding')).profile}catch(e){if(e.status!==404)throw e}setForm(f);setProfile(p);setPreview(null)});
 useEffect(()=>{if(api)load()},[api]); // eslint-disable-line react-hooks/exhaustive-deps
 if(!api)return <Redirect href="/"/>;
 const change=(key,value)=>{setProfile(p=>({...p,[key]:value}));setPreview(null)};
 const body=()=>Object.fromEntries(form.steps.flatMap(s=>s.fields).map(f=>{const v=profile[f.name];return [f.name,f.widget==='integer'?(v==null||v===''?null:Number(v)):(v??f.skip_value??null)]}));
 return <Page title="나에게 맞는 생활 설정">{!!error&&<Text style={styles.error}>{error}</Text>}{!form?<Button title="다시 불러오기" disabled={busy} onPress={load}/>:<>
 {form.steps.map(step=><Card key={step.id}><Text style={styles.title}>{step.title}</Text>{step.fields.map(f=><View key={f.name} style={{gap:8}}>
 {(f.widget==='integer'||f.widget==='region_search')?<Field label={f.label} value={profile[f.name]==null?'':String(profile[f.name])} keyboardType="number-pad" editable={!busy} onChangeText={v=>change(f.name,v||null)}/>:<><Text style={styles.text}>{f.label}</Text><View style={styles.row}>
 <Button disabled={busy} title={(profile[f.name]==null||profile[f.name]===f.skip_value?'✓ ':'')+'나중에 입력'} onPress={()=>change(f.name,f.skip_value??null)}/>
 {f.widget==='multi_select'&&<Button disabled={busy} title={(Array.isArray(profile[f.name])&&!profile[f.name].length?'✓ ':'')+'없음'} onPress={()=>change(f.name,[])}/>}
 {Object.entries(f.option_labels).filter(([v])=>v!==f.skip_value).map(([v,label])=>{const multi=f.widget==='multi_select',selected=multi?(profile[f.name]||[]).includes(v):profile[f.name]===v;return <Button key={v} disabled={busy} title={(selected?'✓ ':'')+label} onPress={()=>change(f.name,multi?(selected?profile[f.name].filter(x=>x!==v):[...(profile[f.name]||[]),v]):v)}/>})}</View></>}
 <Text style={styles.small}>{f.help_text}</Text></View>)}</Card>)}
 <Button title="저장 전 미리보기" disabled={busy} onPress={()=>run(async()=>setPreview(await api('me/onboarding/preview','POST',body())))}/>
 {preview&&<Card><Text style={styles.text}>월 생활비 목표: {won(preview.profile.monthly_budget_krw)}</Text><Text style={styles.small}>미입력 {preview.diagnosis.missing_fields.length}개 · 월 예산에는 별도로 확인 후 적용해요.</Text><Button title="확인하고 저장" disabled={busy} onPress={()=>run(async()=>{await api('me/onboarding','PUT',preview.profile);router.replace(destination)})}/></Card>}
 </>}<Button title={destination==='/mypage'?'취소하고 마이페이지로':'취소하고 소비 관리로'} disabled={busy} onPress={()=>router.replace(destination)}/></Page>
}
