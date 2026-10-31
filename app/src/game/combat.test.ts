import {describe,it,expect} from 'vitest';
import {combatReducer,initialCombat,type State} from './combat';
const tick=(state:State,ms:number)=>{for(let i=0;i<ms;i+=50)state=combatReducer(state,{type:'tick',ms:Math.min(50,ms-i)});return state;};
describe('complete combat loop',()=>{
 it('can start, charge, finish and win without a remote service',()=>{let s=combatReducer(initialCombat(),{type:'start'});for(let i=0;i<12;i++)s=combatReducer(s,{type:'action',action:'punch'});expect(s.energy).toBe(100);s=combatReducer(s,{type:'action',action:'special'});expect(s.energy).toBe(0);expect(s.hp).toBe(5);s=combatReducer(s,{type:'action',action:'punch'});expect(s.phase).toBe('win');});
 it('telegraphs attacks and rewards only one dodge per attack',()=>{let s=combatReducer(initialCombat(),{type:'start'});s=tick(s,9000);expect(s.warning).toBeGreaterThan(0);s=combatReducer(s,{type:'action',action:'dodge'});s=combatReducer(s,{type:'action',action:'dodge'});expect(s.energy).toBe(15);s=tick(s,2200);expect(s.player).toBe(100);});
 it('applies damage when warnings are missed and reaches defeat',()=>{let s=combatReducer(initialCombat(),{type:'start'});s=tick(s,11200);expect(s.player).toBe(80);s=tick(s,36000);expect(s.phase).toBe('lose');expect(s.player).toBe(0);});
 it('does not accept attack input after the battle ends',()=>{let s=combatReducer(initialCombat(),{type:'start'});for(let i=0;i<20;i++)s=combatReducer(s,{type:'action',action:'punch'});const hp=s.hp;s=combatReducer(s,{type:'action',action:'punch'});expect(s.phase).toBe('win');expect(s.hp).toBe(hp);});
});
