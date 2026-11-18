const fs=require('fs'),path=require('path');
const babel=require('@babel/core');
const plugins=['@babel/plugin-transform-react-jsx','@babel/plugin-transform-modules-commonjs'].map(p=>require.resolve(p));
const modules=new Map(),external=new Map();
function add(file){
 const id=path.relative(__dirname,file).replaceAll(path.sep,'/');if(modules.has(id))return id;modules.set(id,'');
 const output=babel.transformSync(fs.readFileSync(file,'utf8'),{filename:file,babelrc:false,configFile:false,plugins}).code;
 const linked=output.replace(/\brequire\(["']([^"']+)["']\)/g,(_,name)=>{
  if(!name.startsWith('.')){if(!external.has(name))external.set(name,`External${external.size}`);return `__load(${JSON.stringify(name)})`;}
  const base=path.resolve(path.dirname(file),name),target=['','.js','.mjs','/index.js'].map(s=>base+s).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
  if(!target)throw new Error(`Missing ${name} in ${file}`);return `__load(${JSON.stringify(add(target))})`;
 });modules.set(id,linked);return id;
}
const entry=add(path.join(__dirname,'IntegrationApp.js'));
const imports=[...external].map(([name,v])=>name==='@expo/vector-icons'?`import {Ionicons as IconIonicons,MaterialCommunityIcons as IconMaterialCommunityIcons} from '@expo/vector-icons';`:['react','@react-native-async-storage/async-storage'].includes(name)?`import ${v} from ${JSON.stringify(name)};`:`import * as ${v} from ${JSON.stringify(name)};`).join('\n');
const body=[...modules].map(([id,code])=>`${JSON.stringify(id)}:function(module,exports,__load){\n${code}\n}`).join(',\n');
const ext=[...external].map(([id,v])=>`${JSON.stringify(id)}:`+(id==='@expo/vector-icons'?'{Ionicons:IconIonicons,MaterialCommunityIcons:IconMaterialCommunityIcons}':['react','@react-native-async-storage/async-storage'].includes(id)?`{__esModule:true,default:${v},...${v}}`:v)).join(',');
fs.writeFileSync(path.join(__dirname,'App.js'),`// Team UI + refrigerator (no login) | Expo Snack SDK 54 | AI is a local mock; inventory notifications use native local scheduling.\n${imports}\nconst __modules={${body}};\nconst __external={${ext}},__cache={};\nfunction __load(id){if(__external[id])return __external[id];if(__cache[id])return __cache[id].exports;const m={exports:{}};__cache[id]=m;if(!__modules[id])throw new Error('Missing module: '+id);__modules[id](m,m.exports,__load);return m.exports;}\nexport default __load(${JSON.stringify(entry)}).default;\n`);
fs.writeFileSync(path.join(__dirname,'bundle-manifest.json'),JSON.stringify({modules:[...modules.keys()],externals:[...external.keys()]},null,2));
console.log(`${modules.size} modules, ${fs.statSync(path.join(__dirname,'App.js')).size} bytes; externals: ${[...external.keys()].join(', ')}`);
