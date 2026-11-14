// 이후 백엔드 연결용. 현재 화면은 AppProvider의 기기 저장 데이터를 사용합니다.
export async function request(path,options={}) {
 const base=process.env.EXPO_PUBLIC_API_URL;
 if(!base)throw new Error('EXPO_PUBLIC_API_URL을 설정해 주세요.');
 const response=await fetch(`${base.replace(/\/$/,'')}/${path.replace(/^\//,'')}`,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 if(!response.ok)throw new Error(`API 오류: ${response.status}`);
 return response.status===204?null:response.json();
}
