import {names} from './laneRun';
import type {Gem,Lane,Monster,Feedback} from './laneRun';
export {names,attackFrom} from './laneRun';
export type {Gem,Lane,Feedback} from './laneRun';
export type Option={kind:'normal'|'shield'|'elite';gem?:Gem};
export const waves:Option[][]=[[{kind:'normal',gem:'red'},{kind:'shield'},{kind:'elite',gem:'blue'}],[{kind:'elite',gem:'red'},{kind:'normal',gem:'blue'},{kind:'shield'}],[{kind:'shield'},{kind:'elite',gem:'purple'},{kind:'normal',gem:'red'}],[{kind:'normal',gem:'purple'},{kind:'shield'},{kind:'elite',gem:'red'}],[{kind:'elite',gem:'blue'},{kind:'normal',gem:'purple'},{kind:'shield'}]];
export const goal=5, capacity=8;
const duration=8000, attackInterval=3000, spawnGap=1400;
type ScheduledMonster={monster:Monster;at:number};
export type ChoiceState={phase:'idle'|'playing'|'win'|'lose';lane:Lane;health:number;remaining:number;clears:number;gems:Gem[];monsters:Monster[];event:string;hits:number;feedback:Feedback|null;feedbackId:number;wave:number;waveTime:number;locked:Lane|null;history:string[];skillAvailable:boolean;attackClock:number;classic:boolean;pending:ScheduledMonster[];waveElapsed:number;waveEngaged:boolean};
type Input={type:'start'}|{type:'surrender'}|{type:'tick';ms:number;paused?:boolean}|{type:'move';step:-1|1}|{type:'selectLane';lane:Lane}|{type:'punch';targetId?:number}|{type:'special'};
const laneNames=['左','中','右'];
export function optionsFor(wave:number,classic=false):Option[]{const options=waves[wave%waves.length];return classic?options.map((o,i)=>o.kind==='shield'?{kind:'normal',gem:(['red','blue','purple'] as Gem[])[(wave+i)%3]}:o):options;}
function waveSetup(wave:number,classic:boolean){
 const options=optionsFor(wave,classic),lanes=options.map((o,i)=>o.gem?i:-1).filter(i=>i>=0);
 // Rotate the first lane each wave so encounters do not always enter from the same side.
 if(lanes.length&&wave%lanes.length)lanes.push(...lanes.splice(0,wave%lanes.length));
 const scheduled=lanes.map((lane,index):ScheduledMonster=>{const o=options[lane],hp=o.kind==='elite'?4:2;return {at:index*spawnGap,monster:{id:wave*3+lane,lane:lane as Lane,gem:o.gem!,progress:0,hp,maxHp:hp}};});
 return {monsters:scheduled.slice(0,1).map(x=>x.monster),pending:scheduled.slice(1),waveElapsed:0,waveTime:duration+Math.max(0,scheduled.length-1)*spawnGap};
}
export const initialRun=(classic=false):ChoiceState=>({phase:'idle',lane:1,health:3,remaining:0,clears:0,gems:['red','red','blue'],monsters:[],event:'选择路线',hits:0,feedback:null,feedbackId:0,wave:0,waveTime:duration,locked:null,history:[],skillAvailable:true,attackClock:attackInterval,classic,pending:[],waveElapsed:0,waveEngaged:false});
function nextWave(s:ChoiceState,description:string):ChoiceState {
 const history=[...s.history,`第 ${s.wave+1} 波：${description}`],wave=s.wave+1;
 return {...s,history,wave,locked:null,waveEngaged:false,attackClock:attackInterval,...waveSetup(wave,s.classic),event:`第 ${wave+1} 波：选择路线`};
}
export function runReducer(s:ChoiceState,a:Input):ChoiceState {
 if(a.type==='start')return {...initialRun(s.classic),lane:s.lane,phase:'playing',...waveSetup(0,s.classic),event:'第 1 波：选择路线'};
 if(a.type==='selectLane'||a.type==='move') {const lane=a.type==='selectLane'?a.lane:Math.max(0,Math.min(2,s.lane+a.step)) as Lane;return lane===s.lane?s:{...s,lane};}
 if(s.phase!=='playing')return s;
 if(a.type==='surrender')return {...s,phase:'lose',event:'检测到持续倒地：投降彩蛋触发'};
 if(a.type==='special')return !s.skillAvailable?s:nextWave({...s,skillAvailable:false,feedbackId:s.feedbackId+1,feedback:{id:s.feedbackId+1,kind:'special',lane:s.lane}},'使用清屏，未获得宝石');
 if(a.type==='punch'){
  if(a.targetId===undefined&&s.locked!==null&&s.lane!==s.locked)return {...s,event:`返回${laneNames[s.locked]}路攻击锁定目标`};
  const target=s.monsters.find(m=>a.targetId===undefined?m.lane===s.lane:m.id===a.targetId);if(!target)return {...s,event:s.pending.some(item=>item.monster.lane===s.lane)?'怪物正在接近，请稍候':'此路线没有怪物',feedbackId:s.feedbackId+1,feedback:{id:s.feedbackId+1,kind:'miss',lane:s.lane}};
  const hp=(target.hp??2)-1,locked=target.lane,feedbackId=s.feedbackId+1;
  if(hp>0)return {...s,locked,waveEngaged:true,monsters:s.monsters.map(m=>m.id===target.id?{...m,hp}:m),event:`命中！剩余 ${hp} 血`,feedbackId,feedback:{id:feedbackId,kind:'hit',lane:target.lane,gem:target.gem,progress:target.progress}};
  let gems=[...s.gems],clears=s.clears;const count=(target.maxHp??2)>2?2:1;let cleared=false;
  for(let i=0;i<count;i++){gems.push(target.gem);if(gems.filter(g=>g===target.gem).length>=3){let n=0;gems=gems.filter(g=>g!==target.gem||n++>=3);clears++;cleared=true;}}
  const feedback:Feedback={id:feedbackId,kind:cleared?'clear':'hit',lane:target.lane,gem:target.gem,progress:target.progress,slot:Math.min(s.gems.length,capacity-1),monsterId:target.id};
  const next={...s,gems,clears,hits:s.hits+1,feedbackId,feedback,locked:null,waveEngaged:true,monsters:s.monsters.filter(m=>m.id!==target.id)};
  if(clears>=goal)return {...next,phase:'win',monsters:[],event:'完成 5 次三消！'};
  if(gems.length>=capacity)return {...next,phase:'lose',monsters:[],event:'宝石区已满，挑战失败'};
  if(next.monsters.length===0&&next.pending.length===0)return nextWave(next,`${laneNames[locked]}路击败怪物`);
  return {...next,event:`${names[target.gem]}色怪物已击败`};
 }
 if(a.paused)return s;
 const dt=Math.max(0,Math.min(a.ms,250)),waveTime=Math.max(0,s.waveTime-dt),waveElapsed=s.waveElapsed+dt;
 const arriving=s.pending.filter(item=>item.at<=waveElapsed),pending=s.pending.filter(item=>item.at>waveElapsed);
 const monsters=[...s.monsters.map(m=>({...m,progress:Math.min(1,m.progress+dt/duration)})),...arriving.map(item=>({...item.monster,progress:Math.min(1,(waveElapsed-item.at)/duration)}))];
 let next={...s,waveTime,waveElapsed,monsters,pending};
 if(waveTime>0)return next;
 if(!s.waveEngaged&&s.locked===null&&optionsFor(s.wave,s.classic)[s.lane].kind==='shield')return nextWave(next,'选择安全路线');
 const clock=s.attackClock-dt;next={...next,attackClock:clock};
 if(clock>0)return next;
 const attacker=monsters.find(m=>m.lane===s.lane);
 if(!attacker)return {...next,attackClock:attackInterval};
 const health=s.health-1,feedbackId=s.feedbackId+1;
 return {...next,health,attackClock:attackInterval,phase:health<=0?'lose':'playing',event:health<=0?'生命耗尽':`${laneNames[s.lane]}路怪物攻击命中！`,feedbackId,feedback:{id:feedbackId,kind:'hurt',lane:s.lane,gem:attacker.gem,progress:attacker.progress,monsterId:attacker.id}};
}
