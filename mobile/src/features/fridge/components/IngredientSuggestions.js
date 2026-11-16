import React from 'react';
import {View,Text,Pressable} from 'react-native';
import {suggestIngredients} from '../domain/ingredientCatalog.mjs';
export default function IngredientSuggestions({value,onSelect}){
 const rows=suggestIngredients(value);if(!rows.length)return null;
 return <View style={{marginVertical:10,gap:6}}><Text style={{color:'#66766e'}}>식재료 선택 · 단위는 수량과 함께 확인해 주세요</Text>
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{rows.map(i=><Pressable key={i.id} accessibilityRole="button" accessibilityLabel={`${i.name}, 기본 단위 ${i.unit}`} onPress={()=>onSelect(i)} style={{padding:12,minHeight:44,borderRadius:16,backgroundColor:'#e4f3eb'}}><Text style={{color:'#217451'}}>{i.name} · {i.unit}</Text></Pressable>)}</View></View>;
}
