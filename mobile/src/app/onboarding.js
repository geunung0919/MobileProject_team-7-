import { useEffect,useState } from 'react';
import { Text,View } from 'react-native';
import { Redirect,router,useLocalSearchParams } from 'expo-router';
import { Page,Card,Field,Button,styles,useTask } from '../components/UI';
import { useSession } from '../state/Session';
import { onboardingBody,answerLabel,stepErrors } from '../lib/onboarding';
import { DiagnosisSummary } from '../components/DiagnosisSummary';
export default function Onboarding(){
 const {returnTo}=useLocalSearchParams();
 const destination=returnTo==='mypage'?'/mypage':'/spending';
 const {api}=useSession(),{busy,error,run,setError}=useTask();
 const [form,setForm]=useState(null),[profile,setProfile]=useState({}),[preview,setPreview]=useState(null),[saved,setSaved]=useState(null),[stepIndex,setStepIndex]=useState(0),[fieldErrors,setFieldErrors]=useState({});
 const load=()=>run(async()=>{const f=await api('onboarding/form');let p={};try{p=(await api('me/onboarding')).profile}catch(e){if(e.status!==404)throw e}setForm(f);setProfile(p);setPreview(null);setStepIndex(0);setFieldErrors({})});
 useEffect(()=>{if(api)load()},[api]); // eslint-disable-line react-hooks/exhaustive-deps
 if(!api)return <Redirect href="/"/>;
 if(saved)return <Page key="result" title="생활 설정을 저장했어요">
 <DiagnosisSummary result={saved}/>
 <Card><Text style={styles.text}>이제 무엇을 해볼까요?</Text>
 {preview.actions.map(action=>action.target==='/spending'
 ?<Button key={action.code} title={action.label} onPress={()=>router.replace('/spending')}/>
 :<Text key={action.code} style={styles.small}>{action.label} · 화면 연결 준비 중</Text>)}
 </Card>
 <Button title="통합 현황 보기" onPress={()=>router.replace('/dashboard')}/>
 <Button title="생활 설정 다시 수정" onPress={()=>{setProfile(saved.profile);setSaved(null);setPreview(null);setStepIndex(0)}}/>
 <Button title={destination==='/mypage'?'마이페이지로':'소비 관리로'} onPress={()=>router.replace(destination)}/>
 </Page>;
 const change=(key,value)=>{setProfile(p=>({...p,[key]:value}));setPreview(null);setFieldErrors(errors=>{const next={...errors};delete next[key];return next})};
 const body=()=>onboardingBody(form,profile);
 const review=form&&stepIndex===form.steps.length;
 const move=index=>{setStepIndex(index);setPreview(null);setError('');setFieldErrors({})};
 const next=()=>{const errors=stepErrors(form,profile,stepIndex);setFieldErrors(errors);if(Object.keys(errors).length){setError('입력한 항목을 확인해 주세요.');return}move(stepIndex+1)};
 return <Page key={`step-${stepIndex}`} title="나에게 맞는 생활 설정">{!!error&&<Text style={styles.error}>{error}</Text>}{!form?<Button title="다시 불러오기" disabled={busy} onPress={load}/>:<>
 <Text style={styles.small}>{review?'입력 내용 확인':`${stepIndex+1} / ${form.steps.length}단계 · ${form.steps[stepIndex].title}`}</Text>
 {!review&&[form.steps[stepIndex]].map(step=><Card key={step.id}><Text style={styles.title}>{step.title}</Text>{step.fields.map(f=><View key={f.name} style={{gap:8}}>
 {(f.widget==='integer'||f.widget==='region_search')?<Field label={f.label} value={profile[f.name]==null?'':String(profile[f.name])} keyboardType="number-pad" editable={!busy} onChangeText={v=>change(f.name,v||null)}/>:<><Text style={styles.text}>{f.label}</Text><View style={styles.row}>
 <Button disabled={busy} title={(profile[f.name]==null||profile[f.name]===f.skip_value?'✓ ':'')+'나중에 입력'} onPress={()=>change(f.name,f.skip_value??null)}/>
 {f.widget==='multi_select'&&<Button disabled={busy} title={(Array.isArray(profile[f.name])&&!profile[f.name].length?'✓ ':'')+'없음'} onPress={()=>change(f.name,[])}/>}
 {Object.entries(f.option_labels).filter(([v])=>v!==f.skip_value).map(([v,label])=>{const multi=f.widget==='multi_select',selected=multi?(profile[f.name]||[]).includes(v):profile[f.name]===v;return <Button key={v} disabled={busy} title={(selected?'✓ ':'')+label} onPress={()=>change(f.name,multi?(selected?profile[f.name].filter(x=>x!==v):[...(profile[f.name]||[]),v]):v)}/>})}</View></>}
 <Text style={styles.small}>{f.help_text}</Text>{!!fieldErrors[f.name]&&<Text accessibilityRole="alert" style={styles.error}>{fieldErrors[f.name]}</Text>}</View>)}</Card>)}
 {review&&<Card><Text style={styles.text}>저장할 내용을 확인해 주세요.</Text>{form.steps.map((step,index)=><View key={step.id} style={{gap:8}}>
 <Text style={styles.text}>{step.title}</Text>{step.fields.map(field=><Text key={field.name} style={styles.small}>{field.label} · {answerLabel(field,profile[field.name]??field.skip_value??null)}</Text>)}
 <Button title={`${step.title} 수정`} disabled={busy} onPress={()=>move(index)}/></View>)}</Card>}
 {!review&&<Button title={stepIndex===form.steps.length-1?'입력 내용 확인':'다음'} disabled={busy} onPress={next}/>}
 {stepIndex>0&&<Button title="이전" disabled={busy} onPress={()=>move(stepIndex-1)}/>}
 {review&&<Button title="저장 전 미리보기" disabled={busy} onPress={()=>run(async()=>setPreview(await api('me/onboarding/preview','POST',body())))}/>}
 {preview&&<><Text style={styles.text}>저장 전 미리보기 · 아직 저장되지 않았어요.</Text><DiagnosisSummary result={preview}/><Card><Button title="확인하고 저장" disabled={busy} onPress={()=>run(async()=>{const result=await api('me/onboarding','PUT',preview.profile);setSaved(result)})}/></Card></>}
 </>}<Button title={destination==='/mypage'?'취소하고 마이페이지로':'취소하고 소비 관리로'} disabled={busy} onPress={()=>router.replace(destination)}/></Page>
}
