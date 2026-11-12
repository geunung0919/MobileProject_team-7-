import {createNavigationContainerRef, StackActions, useRoute, useFocusEffect} from '@react-navigation/native';
export const navigationRef=createNavigationContainerRef();
export {useFocusEffect};
export const useRootNavigationState=()=>({key:'integration'});
import {resolveTarget} from './routes.mjs';
export {resolveTarget};
function go(target,replace=false){if(!navigationRef.isReady())return;const r=resolveTarget(target);if(r.name==='Tabs'||r.name==='RecipeList'){navigationRef.navigate(r.name,r.params);return;} navigationRef.dispatch(replace?StackActions.replace(r.name,r.params):StackActions.push(r.name,r.params));}
let pendingFridge=false;
export function flushPendingNavigation(){
 if(!pendingFridge||!navigationRef.isReady())return;
 pendingFridge=false;
 navigationRef.resetRoot({index:0,routes:[{name:'Tabs',state:{index:0,routes:[{name:'Fridge'}]}}]});
}
function toFridge(){pendingFridge=true;flushPendingNavigation();}
export const router={toFridge,push:t=>go(t),replace:t=>go(t,true),back:()=>{if(navigationRef.canGoBack())navigationRef.goBack();else navigationRef.navigate('Tabs',{screen:'Fridge'});}};
export const useLocalSearchParams=()=>useRoute().params||{};
