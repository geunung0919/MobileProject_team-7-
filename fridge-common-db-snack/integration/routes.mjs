export function resolveTarget(target){
 const input=typeof target==='string'?{pathname:target}:target;
 const path=input.pathname;
 if(path==='/(tabs)/recipe')return {name:'RecipeList',params:{}};
 if(path==='/(tabs)/inventory')return {name:'Tabs',params:{screen:'Fridge'}};
 const params={...input.params,path};
 if(path.startsWith('/inventory/')&&!['new','history','alerts','manage'].includes(path.split('/')[2]))params.id=decodeURIComponent(path.split('/').pop());
 if(path.startsWith('/recipe/')&&!['conditions','reminders'].includes(path.split('/')[2]))params.id=decodeURIComponent(path.split('/')[2]);
 return {name:'Module3',params};
}
