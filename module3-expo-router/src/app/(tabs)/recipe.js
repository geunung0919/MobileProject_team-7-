import React,{useMemo,useState} from 'react';
import {Text,Switch,View} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import {Page,Card,Button,Field,styles} from '../../components/UI';
import ReferenceNotice from '../../components/ReferenceNotice';
import {useApp} from '../../state/AppProvider';
import {recipes} from '../../data/seed';
import {searchRecipes} from '../../domain/recipeSearch.mjs';
export default function Recipe(){
 const {state}=useApp();
 const [query,setQuery]=useState(''),[maxMinutes,setMaxMinutes]=useState(0),[readyOnly,setReadyOnly]=useState(false),[sort,setSort]=useState('recommended'),[day,setDay]=useState('');
 useFocusEffect(React.useCallback(()=>{setDay(new Date().toDateString());},[]));
 const result=useMemo(()=>searchRecipes(recipes,state.inventory,{query,maxMinutes,readyOnly,sort}),[state.inventory,query,maxMinutes,readyOnly,sort,day]);
 return <Page title="레시피 검색" subtitle="앱에 등록된 예시 레시피를 검색해요. 추천 순서는 재고와 날짜를 기준으로 정해요.">
  <Field label="요리 이름 또는 재료" value={query} onChangeText={setQuery} placeholder="예: 볶음밥, 계란, 두부 김치" returnKeyType="search"/>
  <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{[0,10,15,30].map(n=><Button key={n} secondary={maxMinutes!==n} title={n?`${n}분 이내`:'시간 전체'} onPress={()=>setMaxMinutes(n)}/>)}</View>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text>현재 재고로 가능한 요리만</Text><Switch accessibilityLabel="현재 재고로 가능한 요리만" value={readyOnly} onValueChange={setReadyOnly}/></View>
  <Button secondary title={sort==='recommended'?'정렬: 재고 추천순 (눌러서 빠른순)':'정렬: 조리시간순 (눌러서 추천순)'} onPress={()=>setSort(s=>s==='recommended'?'quick':'recommended')}/>
  <Button secondary title="매일 레시피 알림 설정" onPress={()=>router.push('/recipe/reminders')}/>
  <Text style={styles.label}>검색 결과 {result.length}개</Text>
  {result.map(r=><Card key={r.id}><Text style={styles.label}>{r.name}</Text><Text>{r.minutes}분 · 1인분 · {r.missing.length?`부족한 재료 ${r.missing.length}종`:'재료 준비 완료'}</Text><Text style={styles.muted}>{r.ingredients.map(i=>i.name).join(' · ')}</Text><Button title="레시피 보기" onPress={()=>router.push(`/recipe/${r.id}`)}/></Card>)}
  {!result.length&&<Card><Text>조건에 맞는 레시피가 없어요. 검색어 또는 재고 필터를 바꿔 보세요.</Text><Button secondary title="검색 조건 초기화" onPress={()=>{setQuery('');setMaxMinutes(0);setReadyOnly(false);setSort('recommended');}}/></Card>}
  <ReferenceNotice/>
 </Page>;
}
