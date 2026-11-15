import {test} from 'node:test';
import assert from 'node:assert/strict';
import {receiptCapability, readReceiptImage, scoreReceiptResult} from '../src/lib/receiptFlow.mjs';
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

import {receiptUploadBody,analyzeReceiptPhoto,MAX_RECEIPT_BYTES} from '../src/lib/receiptFlow.mjs';
const selected={uri:'file:///photo.jpg',base64:'/9j/AA==',fileSize:6};
test('upload validates size and actual image signature',()=>{
 assert.equal(receiptUploadBody(selected).mime_type,'image/jpeg');
 assert.equal(receiptUploadBody({...selected,base64:'iVBORw0KGgoAAA'}).mime_type,'image/png');
 assert.throws(()=>receiptUploadBody({...selected,fileSize:MAX_RECEIPT_BYTES+1}),/8MB/);
 assert.throws(()=>receiptUploadBody({uri:'a'}),/사진/);
 assert.throws(()=>receiptUploadBody({...selected,base64:'HEIC'}),/JPG/);
});
test('server OCR sends selected image on analysis but never confirms expenses',async()=>{
 const calls=[];let text;
 const result=await analyzeReceiptPhoto(selected,{mode:'server',api:async(...args)=>{calls.push(args);return {raw_text:'영수증',candidate:{amount_krw:1000}}},onText:value=>text=value,onPhase:()=>{}});
 assert.equal(calls.length,1);assert.equal(calls[0][0],'me/spending/receipts/analyze');
 assert.equal(calls[0][2].image_base64,selected.base64);assert.equal(calls[0][3].timeoutMs,45000);
 assert.equal(text,'영수증');assert.equal(result.candidate.amount_krw,1000);
});
test('cancelled OCR never publishes late response',async()=>{
 const controller=new AbortController();let published=false;
 await assert.rejects(()=>analyzeReceiptPhoto(selected,{mode:'server',signal:controller.signal,onPhase:()=>{},onText:()=>published=true,api:async()=>{controller.abort();return {raw_text:'late',candidate:{}}}}),/취소/);
 assert.equal(published,false);
});
test('native OCR retains text on server failure and disconnected mode never uploads',async()=>{
 let text='';
 await assert.rejects(()=>analyzeReceiptPhoto(selected,{mode:'device',recognize:async()=> '원문',onText:v=>text=v,onPhase:()=>{},api:async()=>{throw Error('offline')}}),/offline/);
 assert.equal(text,'원문');
 await assert.rejects(()=>analyzeReceiptPhoto(selected,{mode:'server',api:null,onText:()=>{},onPhase:()=>{}}),/서버 연결/);
});


test('hybrid OCR chooses the result that parses the receipt better', async()=>{
  const calls=[]; let text='';
  const result=await analyzeReceiptPhoto(selected,{
    mode:'hybrid',
    recognize:async()=> '기기 OCR 원문',
    onText:value=>text=value,
    onPhase:()=>{},
    api:async(path)=>{
      calls.push(path);
      if(path==='me/spending/receipts/analyze') return {
        raw_text:'서버 OCR',
        engine:'tesseract-ensemble',
        candidate:{title:'사용처 확인 필요',amount_krw:12000,spent_on:'2026-11-11'},
        receipt_items:[{is_ingredient:false}],
        warnings:['확인 필요'],
        receipt_document:{document_type:'purchase_receipt'},
      };
      return {
        candidate:{title:'이마트',amount_krw:12000,spent_on:'2026-11-11'},
        receipt_items:[
          {is_ingredient:true},{is_ingredient:true},{is_ingredient:false}
        ],
        warnings:[],
        receipt_document:{document_type:'purchase_receipt'},
      };
    },
  });
  assert.equal(calls.length,3);
  assert.equal(result.ocr_selection.mode,'hybrid');
  assert.equal(result.ocr_selection.selected_engine,'device-text-recognizer');
  assert.equal(text,'기기 OCR 원문');
  assert.equal(calls.filter(path=>path==='me/spending/imports/preview').length,2);
});

test('receipt scoring rewards structured items and valid merchant',()=>{
  const weak={candidate:{title:'사용처 확인 필요',amount_krw:1000,spent_on:'2026-11-11'},receipt_items:[],warnings:[]};
  const strong={candidate:{title:'마트',amount_krw:1000,spent_on:'2026-11-11'},receipt_items:[{},{}],warnings:[]};
  assert.ok(scoreReceiptResult(strong)>scoreReceiptResult(weak));
});
