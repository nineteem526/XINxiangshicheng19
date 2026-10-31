import * as THREE from 'three';
import type {Lane} from './laneRun';
export type LaneLayout={x:number;y:number;depth:number;spread:number};
export const DEFAULT_LAYOUT:LaneLayout={x:0,y:0,depth:1,spread:1};
/** Projection shared with LaneMonsters: markers and physical-position selection use the same near endpoints. */
export function laneMarker(lane:Lane,layout:LaneLayout,width:number,height:number):{x:number;y:number}{
 const camera=new THREE.PerspectiveCamera(40,width/Math.max(1,height),.1,100);camera.position.set(0,3,12);camera.lookAt(0,1,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();
 const p=new THREE.Vector3(layout.x+(lane-1)*4.2*layout.spread,layout.y-1,0).project(camera);
 return {x:(p.x+1)/2,y:(1-p.y)/2};
}
export function laneAtScreenX(x:number,layout:LaneLayout,width:number,height:number):Lane{
 const markers=([0,1,2] as Lane[]).map(l=>laneMarker(l,layout,width,height).x);
 return x<(markers[0]+markers[1])/2?0:x<(markers[1]+markers[2])/2?1:2;
}
/** Map a normalised landmark to the on-screen position of the object-fit:contain video. */
export function videoXToScreen(x:number,videoWidth:number,videoHeight:number,boxWidth:number,boxHeight:number,mirror:boolean){
 const scale=Math.min(boxWidth/videoWidth,boxHeight/videoHeight),width=videoWidth*scale;
 return ((boxWidth-width)/2+(mirror?1-x:x)*width)/boxWidth;
}
