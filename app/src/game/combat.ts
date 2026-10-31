import type {Action} from '../vision/actions';

export type Attack='shock'|'sweep';
export type State={phase:'idle'|'playing'|'win'|'lose';hp:number;player:number;energy:number;remaining:number;next:number;warning:number;attack:Attack|null;attackCount:number;dodged:boolean;event:string;hit:number};
export type Input={type:'start'}|{type:'tick';ms:number}|{type:'action';action:Action};

export const initialCombat=():State=>({phase:'idle',hp:100,player:100,energy:0,remaining:75000,next:9000,warning:0,attack:null,attackCount:0,dodged:false,event:'站直并校准，然后开始',hit:0});

/** Deterministic local combat: remote content never decides damage or victory. */
export function combatReducer(s:State,a:Input):State{
 if(a.type==='start')return {...initialCombat(),phase:'playing',event:'手先停稳，再向画面侧前方挥拳'};
 if(s.phase!=='playing')return a.type==='action'&&a.action==='ready'?combatReducer(s,{type:'start'}):s;
 const n={...s};
 if(a.type==='action'){
  if(a.action==='punch'){
   n.hp=Math.max(0,n.hp-5);n.energy=Math.min(100,n.energy+9);n.hit++;n.event='命中！';
  }else if((a.action==='dodge'||a.action==='duck')&&n.warning>0&&!n.dodged){
   const correct=(n.attack==='shock'&&a.action==='dodge')||(n.attack==='sweep'&&a.action==='duck');
   if(correct){n.dodged=true;n.energy=Math.min(100,n.energy+15);n.event='闪避成功 · 能量 +15';}
   else n.event=n.attack==='shock'?'冲击波：请侧身':'横扫：请下蹲';
  }else if(a.action==='special'){
   if(n.energy>=100){n.energy=0;n.hp=Math.max(0,n.hp-35);n.hit++;n.event='现实封印！';}
   else n.event='能量未满，继续攻击';
  }
 }else{
  let dt=Math.max(0,Math.min(250,a.ms));n.remaining=Math.max(0,n.remaining-dt);
  while(dt>0){
   if(n.warning>0){const step=Math.min(dt,n.warning);dt-=step;n.warning-=step;if(!n.warning){if(!n.dodged){n.player=Math.max(0,n.player-20);n.event='被攻击命中';}n.attack=null;n.next=6800;}}
   else{const step=Math.min(dt,n.next);dt-=step;n.next-=step;if(!n.next){n.warning=3000;n.dodged=false;n.attack=n.attackCount%2===0?'shock':'sweep';n.attackCount++;n.event=n.attack==='shock'?'冲击波来袭 · 侧身':'横扫来袭 · 下蹲';}}
  }
 }
 if(n.hp<=0){n.phase='win';n.event='异常体已封印';}
 else if(!n.player||!n.remaining){n.phase='lose';n.event='现实防线崩坏';}
 return n;
}
