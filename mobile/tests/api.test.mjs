import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi,normalizeUrl,parseMoney } from '../src/lib/api.js';
test('서버 주소와 원 단위 입력 검증',()=>{
 assert.equal(normalizeUrl(' http://192.168.0.10:8000/ '),'http://192.168.0.10:8000');
 for(const v of ['file:///tmp/x','http://u:p@host','http://host/path']) assert.throws(()=>normalizeUrl(v));
 assert.equal(parseMoney('0'),0);assert.equal(parseMoney('300000'),300000);
 for(const v of ['','-1','1.2','1e3','1000000001'])assert.throws(()=>parseMoney(v));
 assert.throws(()=>parseMoney('0',false));
});
test('인증 헤더, API 경로, 서버 오류 전달',async()=>{
 const old=globalThis.fetch;let call;
 globalThis.fetch=async(url,opts)=>{call={url,opts};return {ok:true,json:async()=>({saved:true})}};
 try{
 const api=createApi('http://localhost:8000','test-token');
 await api('me/spending/budgets/2026-09','PUT',{budget_krw:300000});
 assert.equal(call.url,'http://localhost:8000/api/v1/me/spending/budgets/2026-09');
 assert.equal(call.opts.headers.Authorization,'Bearer test-token');
 assert.equal(JSON.parse(call.opts.body).budget_krw,300000);
 globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({error:{message:'인증 실패'}})});
 await assert.rejects(()=>api('me/spending'),e=>e.status===401&&e.message==='인증 실패');
 }finally{globalThis.fetch=old}
});
