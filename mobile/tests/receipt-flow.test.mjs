import {test} from 'node:test';
import assert from 'node:assert/strict';
import {receiptCapability, readReceiptImage} from '../src/lib/receiptFlow.mjs';
const photo={canceled:false,assets:[{uri:'file:///receipt.jpg'}]};
test('Expo Go previews without invoking unavailable OCR or transmitting images',async()=>{
 let image;const fail=()=>{throw Error('must not call')};
 const result=await readReceiptImage(photo,{...receiptCapability('android',true),recognize:fail,onSelected:uri=>image=uri,onText:fail,analyze:fail});
 assert.equal(result,'preview');assert.equal(image,photo.assets[0].uri);
 assert.equal(receiptCapability('web',false).canRecognize,false);
 assert.equal(receiptCapability('ios',false).canRecognize,true);
});
test('cancelled picker preserves existing input; malformed asset cannot mutate it',async()=>{
 const fail=()=>{throw Error('must not mutate')};
 assert.equal(await readReceiptImage({canceled:true},{onSelected:fail}),'cancelled');
 await assert.rejects(()=>readReceiptImage({assets:[{}]},{onSelected:fail}),/사진/);
});
test('recognized text survives server failure for retry without another photo',async()=>{
 let text='',image='';
 await assert.rejects(()=>readReceiptImage(photo,{canRecognize:true,onSelected:uri=>image=uri,recognize:async()=> '마트 12,000원',onText:value=>text=value,analyze:async()=>{throw Error('offline')}}),/offline/);
 assert.equal(text,'마트 12,000원');assert.equal(image,photo.assets[0].uri);
});
test('native OCR can run without server and never saves expenses by itself',async()=>{
 let text;
 assert.equal(await readReceiptImage(photo,{canRecognize:true,onSelected:()=>{},recognize:async()=> '영수증 원문',onText:value=>text=value}),'recognized');
 assert.equal(text,'영수증 원문');
});
