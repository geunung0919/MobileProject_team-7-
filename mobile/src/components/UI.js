import { useRef, useState } from 'react';
import { Text, TextInput, Pressable, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#f3f7f5'},body:{padding:20,gap:16,paddingBottom:60},
  title:{fontSize:28,fontWeight:'700',color:'#163d35'},text:{fontSize:16,color:'#244a40'},
  card:{padding:20,gap:12,backgroundColor:'white',borderRadius:18},
  input:{borderWidth:1,borderColor:'#b6cfc3',borderRadius:10,padding:12,fontSize:16,color:'#163d35',backgroundColor:'white'},
  button:{padding:14,borderRadius:10,backgroundColor:'#166b55',alignItems:'center'},buttonText:{color:'white',fontWeight:'600',fontSize:16},
  row:{flexDirection:'row',gap:8,flexWrap:'wrap'},error:{color:'#ad3425',fontSize:15},small:{fontSize:13,color:'#567167'},
});
export function Page({ title, children }) {return <SafeAreaView style={styles.page} edges={['bottom','left','right']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}><Text style={styles.title}>{title}</Text>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>}
export const Card=({children})=><View style={styles.card}>{children}</View>;
export function Button({ title, onPress, disabled=false }) {return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[styles.button,disabled&&{opacity:.45}]}><Text style={styles.buttonText}>{title}</Text></Pressable>}
export function Field({ label, ...props }) {return <View style={{gap:6}}><Text style={styles.text}>{label}</Text><TextInput accessibilityLabel={label} autoCapitalize="none" style={styles.input} {...props}/></View>}
export function useTask() {
 const lock=useRef(false), [busy,setBusy]=useState(false),[error,setError]=useState('');
 const run=async fn=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn()}catch(e){setError(e.message||'요청에 실패했어요.')}finally{lock.current=false;setBusy(false)}};
 return {busy,error,run,setError};
}
