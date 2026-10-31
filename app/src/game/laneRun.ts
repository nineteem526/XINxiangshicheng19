export type Gem='red'|'blue'|'purple';
export type Lane=0|1|2;
export type Monster={id:number;lane:Lane;gem:Gem;progress:number;hp?:number;maxHp?:number};
export type Feedback={id:number;kind:'hit'|'miss'|'clear'|'hurt'|'special';lane:Lane;gem?:Gem;progress?:number;slot?:number;monsterId?:number};
export type RunState={feedback:Feedback|null;feedbackId:number;phase:'idle'|'playing'|'win'|'lose';lane:Lane;health:number;remaining:number;clears:number;gems:Gem[];monsters:Monster[];spawnIn:number;serial:number;event:string;hits:number};
export type RunInput={type:'start'}|{type:'surrender'}|{type:'tick';ms:number}|{type:'move';step:-1|1}|{type:'punch'}|{type:'selectLane';lane:Lane};
export const COLORS:Gem[]=['red','blue','purple'];
export const names:Record<Gem,string>={red:'红',blue:'蓝',purple:'紫'};
export const goal=5,capacity=8,travelMs=8000,attackFrom=.20;
export const initialRun=():RunState=>({feedback:null,feedbackId:0,phase:'idle',lane:1,health:3,remaining:90000,clears:0,gems:['red','purple','blue','red','purple'],monsters:[],spawnIn:1000,serial:0,event:'移动到怪物所在路线，挥拳攻击',hits:0});
export function runReducer(s:RunState,a:RunInput):RunState{
 if(a.type==='start')return {...initialRun(),lane:s.lane,phase:'playing'};
 if(a.type==='selectLane')return a.lane===s.lane?s:{...s,lane:a.lane,...(s.phase==='playing'?{event:`当前${['左','中','右'][a.lane]}侧路线`}:{})};
 if(s.phase!=='playing')return s;
 if(a.type==='surrender')return {...s,phase:'lose',event:'检测到持续倒地：投降彩蛋触发'};
 if(a.type==='move'){const lane=Math.max(0,Math.min(2,s.lane+a.step)) as Lane;return {...s,lane,event:lane===s.lane?'已经到达最边上的路线':`已切换到${['左','中','右'][lane]}侧`};}
 if(a.type==='punch'){
  const target=s.monsters.filter(m=>m.lane===s.lane&&m.progress>=attackFrom&&m.progress<1).sort((a,b)=>b.progress-a.progress)[0];
  if(!target)return {...s,event:'挥空了 · 等怪物靠近',feedbackId:s.feedbackId+1,feedback:{id:s.feedbackId+1,kind:'miss',lane:s.lane}};
  let gems=[...s.gems,target.gem],clears=s.clears,event=`击败${names[target.gem]}色怪物`;
  if(gems.filter(g=>g===target.gem).length>=3){let removed=0;gems=gems.filter(g=>g!==target.gem||removed++>=3);clears++;event=`${names[target.gem]}宝石三消！`;}
  const phase=clears>=goal?'win':gems.length>=capacity?'lose':'playing';
  if(phase==='lose')event='宝石区已满，挑战失败';if(phase==='win')event='三消目标完成！';
  return {...s,phase,gems,clears,event,hits:s.hits+1,feedbackId:s.feedbackId+1,feedback:{id:s.feedbackId+1,kind:clears>s.clears?'clear':'hit',lane:target.lane,gem:target.gem,progress:target.progress,slot:Math.min(s.gems.length,capacity-1)},monsters:s.monsters.filter(m=>m.id!==target.id)};
 }
 const dt=Math.max(0,Math.min(a.ms,250)),remaining=Math.max(0,s.remaining-dt);
 let health=s.health, event=s.event;
 let monsters=s.monsters.map(m=>({...m,progress:m.progress+dt/travelMs}));
 for(const m of monsters)if(m.progress>=1&&m.lane===s.lane){health--;event='怪物冲到面前，失去一格生命';}
 monsters=monsters.filter(m=>m.progress<1);
 let spawnIn=s.spawnIn-dt,serial=s.serial;
 if(spawnIn<=0){const lanes:Lane[]=[1,0,2,1,2,0];const gemPattern:Gem[]=['red','purple','blue','red','purple','blue'];monsters.push({id:serial,lane:lanes[serial%lanes.length],gem:gemPattern[serial%gemPattern.length],progress:0});serial++;spawnIn+=3000;}
 const phase=health<=0||remaining<=0?'lose':'playing';if(phase==='lose')event=health<=0?'生命耗尽':'时间耗尽';
 return {...s,phase,remaining,health,monsters,spawnIn,serial,event,...(health<s.health?{feedbackId:s.feedbackId+1,feedback:{id:s.feedbackId+1,kind:'hurt' as const,lane:s.lane}}:{})};
}
