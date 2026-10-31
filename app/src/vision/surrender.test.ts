import {describe,it,expect} from 'vitest';
import type {Point} from './actions';
import {isLyingDown,SurrenderTracker,SURRENDER_MS} from './surrender';
import {initialRun,runReducer} from '../game/laneRun';
const pose=(shoulder:[number,number],hip:[number,number],knee:[number,number])=>{const p:Point[]=Array.from({length:33},()=>({x:0,y:0,z:0,visibility:0}));for(const [ids,v] of [[[11,12],shoulder],[[23,24],hip],[[25,26],knee]] as const)for(const i of ids)p[i]={x:v[0],y:v[1],z:0,visibility:.95};return p;};
describe('surrender easter egg',()=>{
 it('detects a horizontal torso and legs, while rejecting upright, crouched and missing poses',()=>{expect(isLyingDown(pose([.2,.7],[.45,.71],[.7,.72]),16/9)).toBe(true);expect(isLyingDown(pose([.5,.25],[.5,.5],[.5,.7]),16/9)).toBe(false);expect(isLyingDown(pose([.5,.5],[.55,.7],[.7,.75]),16/9)).toBe(false);expect(isLyingDown(null,16/9)).toBe(false);});
 it('requires uninterrupted evidence for eight seconds and resets on loss',()=>{const tracker=new SurrenderTracker();expect(tracker.update(true,1000)).toBe(0);expect(tracker.update(true,5000)).toBe(4000);expect(tracker.update(false,5100)).toBe(0);expect(tracker.update(true,6000)).toBe(0);expect(tracker.update(true,6000+SURRENDER_MS)).toBe(SURRENDER_MS);});
 it('ends an active game as surrender and leaves an idle game unchanged',()=>{const initial=initialRun();expect(runReducer(initial,{type:'surrender'}).phase).toBe('idle');const end=runReducer({...initial,phase:'playing'},{type:'surrender'});expect(end.phase).toBe('lose');expect(end.event).toContain('投降');});
});
