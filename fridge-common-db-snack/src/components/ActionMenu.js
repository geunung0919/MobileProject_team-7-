import React,{useState} from 'react';
import {View,Text,Pressable,Modal,StyleSheet} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {colors,fonts,spacing} from '../theme';
export default function ActionMenu({label='더보기',items}){
 const [open,setOpen]=useState(false);
 return <View style={styles.anchor}>
  <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={()=>setOpen(true)} style={styles.trigger}><MaterialCommunityIcons name="dots-horizontal" size={26} color={colors.textSecondary}/></Pressable>
  <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={styles.overlay}><Pressable accessibilityRole="button" accessibilityLabel="메뉴 닫기" style={StyleSheet.absoluteFill} onPress={()=>setOpen(false)}/><View accessibilityViewIsModal style={styles.sheet}><Text style={styles.title}>{label}</Text>{items.map(([title,action])=><Pressable key={title} accessibilityRole="button" style={styles.row} onPress={()=>{setOpen(false);action();}}><Text style={styles.text}>{title}</Text><MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary}/></Pressable>)}<Pressable accessibilityRole="button" onPress={()=>setOpen(false)} style={styles.close}><Text style={styles.text}>닫기</Text></Pressable></View></View>
  </Modal>
 </View>;
}
const styles=StyleSheet.create({anchor:{alignItems:'flex-end',height:32,minWidth:44},trigger:{height:32,width:44,alignItems:'center',justifyContent:'center'},overlay:{flex:1,backgroundColor:'rgba(0,0,0,.28)',justifyContent:'flex-end'},sheet:{backgroundColor:colors.white,borderTopLeftRadius:28,borderTopRightRadius:28,padding:spacing.screenX,paddingBottom:36,width:'100%',maxWidth:600,alignSelf:'center'},title:{fontFamily:fonts.bold,fontWeight:'700',fontSize:20,color:colors.textPrimary,marginBottom:16},row:{minHeight:56,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderBottomColor:colors.divider},text:{fontFamily:fonts.regular,fontSize:16,color:colors.textPrimary},close:{padding:16,marginTop:12,alignItems:'center',borderRadius:28,backgroundColor:colors.cardBg}});
