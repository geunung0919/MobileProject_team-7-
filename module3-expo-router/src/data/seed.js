import { dayKey } from '../domain/inventory.mjs';
const after=n=>{const d=new Date();d.setDate(d.getDate()+n);return dayKey(d);};
export function initialState(){return {inventory:[{id:'egg',name:'달걀',quantity:6,unit:'개',expiresAt:after(5)},{id:'rice',name:'밥',quantity:2,unit:'공기',expiresAt:after(2)},{id:'kimchi',name:'김치',quantity:300,unit:'g',expiresAt:after(14)}],meals:[],shopping:[]};}
export const recipes=[
{id:'fried-rice',name:'김치 볶음밥',minutes:15,tools:['pan'],onePan:true,minCleanup:true,ingredients:[{name:'밥',quantity:1,unit:'공기'},{name:'김치',quantity:100,unit:'g'},{name:'달걀',quantity:1,unit:'개'}],steps:['김치를 잘게 썰어요.','팬에 기름을 두르고 김치를 볶아요.','밥을 넣고 볶다가 한쪽에서 달걀을 충분히 익혀 함께 섞어요.']},
{id:'egg-rice',name:'달걀 덮밥',minutes:10,tools:['pan'],onePan:true,minCleanup:true,ingredients:[{name:'밥',quantity:1,unit:'공기'},{name:'달걀',quantity:2,unit:'개'}],steps:['달걀을 풀고 소금으로 간해요.','팬에서 달걀을 부드럽게 익혀요.','따뜻한 밥 위에 올려요.']},
{id:'tofu',name:'두부 김치',minutes:15,tools:['pan','pot'],onePan:false,minCleanup:false,ingredients:[{name:'두부',quantity:1,unit:'모'},{name:'김치',quantity:150,unit:'g'}],steps:['두부를 데쳐 먹기 좋게 잘라요.','김치를 팬에 볶아요.','두부와 김치를 함께 담아요.']},
{id:'microwave-rice',name:'전자레인지 달걀밥',minutes:10,tools:['microwave'],onePan:false,minCleanup:true,ingredients:[{name:'밥',quantity:1,unit:'공기'},{name:'달걀',quantity:1,unit:'개'}],steps:['전자레인지용 용기에 밥과 껍질을 제거해 잘 푼 달걀을 담아요.','밀폐하지 말고 기기와 용기의 사용 지침에 맞춰 가열해요.','중간에 섞고 달걀이 속까지 완전히 익었는지 확인해요.']}
];
