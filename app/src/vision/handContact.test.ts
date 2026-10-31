import {describe,it,expect} from 'vitest';
import {HandContactTracker,videoPointToScreen,type HitBox} from './handContact';
const box:HitBox={id:7,left:100,top:100,right:200,bottom:200};
describe('screen-space hand contact',()=>{
 it('maps video points through letterboxing and mirroring',()=>{const rect={left:10,top:20,width:400,height:400};expect(videoPointToScreen({x:0,y:0},400,200,rect,false)).toEqual({x:10,y:120});expect(videoPointToScreen({x:0,y:0},400,200,rect,true)).toEqual({x:410,y:120});});
 it('fires once on entry, not while held, and rearms after leaving',()=>{const t=new HandContactTracker(),inside=[{x:150,y:150}],outside=[{x:50,y:50}];expect(t.update([inside,null],[box],1000)).toBe(7);expect(t.update([inside,null],[box],2000)).toBeNull();expect(t.update([outside,null],[box],2050)).toBeNull();expect(t.update([inside,null],[box],2100)).toBe(7);});
 it('counts simultaneous contact once and does not treat tracking loss as leaving',()=>{const t=new HandContactTracker(),inside=[{x:150,y:150}];expect(t.update([inside,inside],[box],1000)).toBe(7);expect(t.update([null,null],[box],1600)).toBeNull();expect(t.update([inside,inside],[box],1700)).toBeNull();});
 it('prevents accidental rapid double hits from separate hands',()=>{const t=new HandContactTracker(),inside=[{x:150,y:150}],outside=[{x:50,y:50}];expect(t.update([inside,outside],[box],1000)).toBe(7);expect(t.update([inside,inside],[box],1100)).toBeNull();});
});
