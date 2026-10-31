import {describe,it,expect} from 'vitest';
import {initialRun,runReducer,type RunState} from './laneRun';
describe('game feedback',()=>{
 it('distinguishes repeated misses and a matching hit',()=>{let s:RunState={...initialRun(),phase:'playing'};s=runReducer(s,{type:'punch'});expect(s.feedback?.kind).toBe('miss');const first=s.feedback?.id;s=runReducer(s,{type:'punch'});expect(s.feedback?.id).not.toBe(first);s.monsters=[{id:1,lane:1,gem:'red',progress:.5}];s=runReducer(s,{type:'punch'});expect(s.feedback?.kind).toBe('clear');});
 it('reports damage when a monster reaches the occupied lane',()=>{const s:RunState={...initialRun(),phase:'playing',monsters:[{id:1,lane:1,gem:'red',progress:.999}]};expect(runReducer(s,{type:'tick',ms:100}).feedback?.kind).toBe('hurt');});
});
