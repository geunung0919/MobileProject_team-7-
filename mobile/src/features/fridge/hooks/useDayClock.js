import {useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {dayKey} from '../domain/inventory.mjs';
export function useDayClock(){
 const [clock,setClock]=useState(()=>({today:dayKey(),zone:new Date().getTimezoneOffset()}));
 useEffect(()=>{
  const refresh=()=>{const today=dayKey(),zone=new Date().getTimezoneOffset();setClock(old=>old.today===today&&old.zone===zone?old:{today,zone});};
  const timer=setInterval(refresh,15000),sub=AppState.addEventListener('change',status=>{if(status==='active')refresh();});
  return ()=>{clearInterval(timer);sub.remove();};
 },[]);return clock;
}
