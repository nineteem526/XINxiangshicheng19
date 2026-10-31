import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {DEFAULT_LAYOUT,laneAtScreenX,laneMarker,videoXToScreen,monsterWorldPosition} from './laneGeometry';
describe('screen position and lane geometry',()=>{
 it('selects the nearest projected lane without filtering or delayed switching',()=>{const w=1280,h=720;for(const lane of [0,1,2] as const){const x=laneMarker(lane,DEFAULT_LAYOUT,w,h).x;expect(laneAtScreenX(x,DEFAULT_LAYOUT,w,h)).toBe(lane);}});
 it('keeps feet on the same ground while perspective makes approaching monsters larger and lower',()=>{const camera=new THREE.PerspectiveCamera(40,1280/720,.1,100);camera.position.set(0,3,12);camera.lookAt(0,1,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();const far=monsterWorldPosition(0,0,DEFAULT_LAYOUT),near=monsterWorldPosition(0,1,DEFAULT_LAYOUT);expect(far.y).toBe(near.y);expect(far.x).toBe(near.x);expect(far.z).toBeLessThan(near.z);const project=(p:THREE.Vector3)=>p.clone().project(camera);expect(project(near).y).toBeLessThan(project(far).y);const apparentHeight=(p:THREE.Vector3)=>project(p.clone().add(new THREE.Vector3(0,2,0))).y-project(p).y;expect(apparentHeight(near)).toBeGreaterThan(apparentHeight(far));});
 it('accounts for letterboxing and mirror',()=>{expect(videoXToScreen(0,640,480,1600,900,false)).toBeCloseTo(.125);expect(videoXToScreen(0,640,480,1600,900,true)).toBeCloseTo(.875);});
 it('moves selection boundaries together with adjusted route positions',()=>{const w=1280,h=720,layout={...DEFAULT_LAYOUT,x:2,spread:.7};for(const lane of [0,1,2] as const)expect(laneAtScreenX(laneMarker(lane,layout,w,h).x,layout,w,h)).toBe(lane);});
});
