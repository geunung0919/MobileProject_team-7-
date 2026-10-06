import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
function run(cmd,args,cwd=process.cwd()) { execFileSync(cmd,args,{cwd,stdio:'inherit',shell:process.platform==='win32'}); }
const temp = mkdtempSync(join(tmpdir(),'module3-'));
try {
  run(npx,['--yes','create-expo-app@latest',join(temp,'base'),'--template','blank','--no-install']);
  const current=JSON.parse(readFileSync('package.json','utf8'));
  const base=JSON.parse(readFileSync(join(temp,'base','package.json'),'utf8'));
  writeFileSync('package.json',JSON.stringify({...base,name:current.name,main:'expo-router/entry',scripts:current.scripts},null,2)+'\n');
  run(npm,['install']);
  run(npx,['expo','install','expo-router','react-native-safe-area-context','react-native-screens','expo-linking','expo-constants','expo-status-bar','@react-native-async-storage/async-storage','react-native-web','react-dom','@expo/metro-runtime','react-native-reanimated','react-native-worklets']);
  console.log('설치 완료. npm start 로 실행하세요. package-lock.json도 Git에 커밋하세요.');
} finally { rmSync(temp,{recursive:true,force:true}); }
