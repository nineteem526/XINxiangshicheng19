import {describe,it,expect} from 'vitest';
import {DEFAULT_LAYOUT,laneAtScreenX,laneMarker,videoXToScreen} from './laneGeometry';
describe('screen position and lane geometry',()=>{
 it('selects the nearest projected lane without filtering or delayed switching',()=>{const w=1280,h=720;for(const lane of [0,1,2] as const){const x=laneMarker(lane,DEFAULT_LAYOUT,w,h).x;expect(laneAtScreenX(x,DEFAULT_LAYOUT,w,h)).toBe(lane);}});
 it('accounts for letterboxing and mirror',()=>{expect(videoXToScreen(0,640,480,1600,900,false)).toBeCloseTo(.125);expect(videoXToScreen(0,640,480,1600,900,true)).toBeCloseTo(.875);});
 it('moves selection boundaries together with adjusted route positions',()=>{const w=1280,h=720,layout={...DEFAULT_LAYOUT,x:2,spread:.7};for(const lane of [0,1,2] as const)expect(laneAtScreenX(laneMarker(lane,layout,w,h).x,layout,w,h)).toBe(lane);});
});
