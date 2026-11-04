import React,{useRef,useState} from 'react';
import {ScrollView,Text,View,Pressable,TextInput,StyleSheet} from 'react-native';
import {useApp} from '../state/AppProvider';
export function Page({title,subtitle,children}){const {error}=useApp();return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.title}>{title}</Text>{subtitle&&<Text style={styles.muted}>{subtitle}</Text>}{error&&<Text style={styles.error}>{error}</Text>}{children}</ScrollView>;}
export function Card({children}){return <View style={styles.card}>{children}</View>;}
export function Button({title,onPress,secondary=false,disabled=false}) {
 const {setError}=useApp();const lock=useRef(false);const [busy,setBusy]=useState(false);
 async function press(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await onPress();}catch(e){setError(e.message||'기기에 저장하지 못했어요. 저장 공간을 확인한 뒤 다시 시도해 주세요.');}finally{lock.current=false;setBusy(false);}}
 return <Pressable accessibilityRole="button" accessibilityState={{disabled:disabled||busy}} disabled={disabled||busy} onPress={press} style={[styles.button,secondary&&styles.secondary,(disabled||busy)&&{opacity:0.4}]}><Text style={{color:secondary?'#17664b':'white',fontWeight:'700'}}>{busy?'처리 중…':title}</Text></Pressable>;
}
export function Field({label,...props}){return <View style={{gap:6}}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} placeholderTextColor="#87928c" {...props}/></View>;}
export const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#f3f6f2'},content:{padding:20,gap:14,paddingBottom:40},title:{fontSize:28,fontWeight:'800',color:'#19382c'},label:{fontSize:17,fontWeight:'700',color:'#19382c'},muted:{color:'#617269',lineHeight:22},card:{backgroundColor:'white',borderRadius:18,padding:18,gap:10,borderWidth:1,borderColor:'#e0e8df'},button:{backgroundColor:'#217451',padding:14,borderRadius:12,alignItems:'center'},secondary:{backgroundColor:'#e8f2eb'},input:{backgroundColor:'white',borderWidth:1,borderColor:'#ccd8cd',padding:14,borderRadius:12},error:{color:'#b93838',lineHeight:22}});
