import {describe,it,expect} from 'vitest';
import {initialRun,runReducer,type RunState} from './laneRun';
const playing=():RunState=>({...initialRun(),phase:'playing'});
describe('lane and matching gameplay',()=>{
 it('clamps movement to the three lanes',()=>{let s=playing();s=runReducer(s,{type:'move',step:-1});s=runReducer(s,{type:'move',step:-1});expect(s.lane).toBe(0);});
 it('hits only in selected lane and inside attack range, then clears three gems',()=>{let s:RunState={...playing(),monsters:[{id:1,lane:1 as const,gem:'red' as const,progress:.1}]};s=runReducer(s,{type:'punch'});expect(s.hits).toBe(0);s.monsters[0].progress=.5;s=runReducer(s,{type:'punch'});expect(s.hits).toBe(1);expect(s.clears).toBe(1);expect(s.gems.filter(g=>g==='red')).toHaveLength(0);});
 it('clears three blue gems when a blue monster is defeated',()=>{const s:RunState={...playing(),gems:['blue','blue'],monsters:[{id:7,lane:1,gem:'blue',progress:.5}]};const next=runReducer(s,{type:'punch'});expect(next.clears).toBe(1);expect(next.gems).toEqual([]);expect(next.feedback?.gem).toBe('blue');});
 it('spawns only red, purple and blue monsters',()=>{for(let serial=0;serial<18;serial++){const s={...playing(),serial,spawnIn:0};const next=runReducer(s,{type:'tick',ms:1});expect(['red','purple','blue']).toContain(next.monsters[0].gem);}});
 it('damages only when a monster reaches the player lane',()=>{const s={...playing(),monsters:[{id:1,lane:0 as const,gem:'red' as const,progress:.999},{id:2,lane:1 as const,gem:'purple' as const,progress:.999}]};expect(runReducer(s,{type:'tick',ms:100}).health).toBe(2);});
 it('wins at five clears and loses on a full board after a nonmatching gem',()=>{let s:RunState={...playing(),clears:4,monsters:[{id:1,lane:1 as const,gem:'red' as const,progress:.5}]};expect(runReducer(s,{type:'punch'}).phase).toBe('win');s={...playing(),gems:['red','red','red','red','blue','blue','blue'],monsters:[{id:1,lane:1 as const,gem:'purple' as const,progress:.5}]};expect(runReducer(s,{type:'punch'}).phase).toBe('lose');});
});
