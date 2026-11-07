import React, { useState } from 'react';
import { ScrollView, Text, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../store/AuthContext';
import { styles } from './LoginScreen';
export default function ReceiptCaptureScreen({ navigation, route }) {
  const { session, api } = useAuth();
  const [busy,setBusy] = useState(false); const [error,setError]=useState(''); const [uri,setUri]=useState('');
  const capture = async (camera) => {
    setBusy(true);setError('');
    try {
      if(camera){ const permission=await ImagePicker.requestCameraPermissionsAsync(); if(!permission.granted)throw new Error('휴대폰 설정에서 Expo Go의 카메라 권한을 허용해 주세요.'); }
      const result=await (camera?ImagePicker.launchCameraAsync:ImagePicker.launchImageLibraryAsync)({mediaTypes:['images'],quality:0.8});
      if(result.canceled)return;
      const asset=result.assets[0];setUri(asset.uri);
      if(session.demo)throw new Error('사진 선택 완료. 실제 OCR은 로그아웃 후 서버에 연결하면 사용할 수 있어요.');
      const image=await ImageManipulator.manipulateAsync(asset.uri,[{resize:{width:1600}}],{compress:0.8,format:ImageManipulator.SaveFormat.JPEG,base64:true});
      const resultOcr=await api('/api/v1/me/spending/receipts/analyze','POST',{image_base64:image.base64,mime_type:'image/jpeg'});
      const c=resultOcr.candidate;
      navigation.replace('ReceiptResult',{receipt:{store:c.title||'',date:c.spent_on,total:c.amount_krw||0,items:[]},ocrText:resultOcr.raw_text,warnings:resultOcr.warnings});
    }catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <ScrollView contentContainerStyle={styles.page}>
    <Pressable onPress={()=>navigation.goBack()}><Text>‹ 돌아가기</Text></Pressable><Text style={styles.title}>영수증 인식</Text>
    <Text>사진을 분석한 뒤 금액과 품목을 직접 확인하고 저장해요.</Text>
    {!!uri && <Image source={{uri}} style={{height:260,width:'100%'}} resizeMode="contain" />}
    <Pressable disabled={busy} style={styles.button} onPress={()=>capture(route.params?.source!=='gallery')}><Text style={styles.white}>{busy?'분석 중…':route.params?.source==='gallery'?'사진 선택':'카메라 열기'}</Text></Pressable>
    <Pressable disabled={busy} style={styles.input} onPress={()=>capture(false)}><Text>앨범에서 선택</Text></Pressable>
    <Text accessibilityLiveRegion="polite">{error}</Text>
  </ScrollView>;
}
