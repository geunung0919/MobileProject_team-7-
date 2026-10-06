import { dayKey } from '../domain/inventory.mjs';
const after=n=>{const d=new Date();d.setDate(d.getDate()+n);return dayKey(d);};
export function initialState(){return {inventory:[{id:'egg',name:'달걀',quantity:6,unit:'개',expiresAt:after(5)},{id:'rice',name:'밥',quantity:2,unit:'공기',expiresAt:after(2)},{id:'kimchi',name:'김치',quantity:300,unit:'g',expiresAt:after(14)}],meals:[],shopping:[]};}
export const recipes=[
{id:'fried-rice',name:'김치 볶음밥',minutes:15,ingredients:[{name:'밥',quantity:1,unit:'공기'},{name:'김치',quantity:100,unit:'g'},{name:'달걀',quantity:1,unit:'개'}],steps:['김치를 잘게 썰어요.','팬에 기름을 두르고 김치를 볶아요.','밥을 넣고 볶은 뒤 달걀 프라이를 올려요.']},
{id:'egg-rice',name:'달걀 덮밥',minutes:10,ingredients:[{name:'밥',quantity:1,unit:'공기'},{name:'달걀',quantity:2,unit:'개'}],steps:['달걀을 풀고 소금으로 간해요.','팬에서 달걀을 부드럽게 익혀요.','따뜻한 밥 위에 올려요.']},
{id:'tofu',name:'두부 김치',minutes:15,ingredients:[{name:'두부',quantity:1,unit:'모'},{name:'김치',quantity:150,unit:'g'}],steps:['두부를 데쳐 먹기 좋게 잘라요.','김치를 팬에 볶아요.','두부와 김치를 함께 담아요.']}
];
