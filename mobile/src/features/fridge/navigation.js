import {router as expoRouter} from 'expo-router';
export {useLocalSearchParams,useFocusEffect,useRootNavigationState} from 'expo-router';
export function fridgePath(target){
 if(typeof target==='object')return {...target,pathname:fridgePath(target.pathname)};
 const path=target.replace('/(tabs)','');
 return path.startsWith('/fridge')?path:'/fridge'+(path==='/'?'':path);
}
export const router={push:t=>expoRouter.push(fridgePath(t)),replace:t=>expoRouter.replace(fridgePath(t)),back:()=>expoRouter.back(),toFridge:()=>expoRouter.replace('/fridge')};
