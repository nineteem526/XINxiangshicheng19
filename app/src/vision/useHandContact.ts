import {useEffect,useRef,type RefObject} from 'react';
import type {Point} from './actions';
import {handPoints,HandContactTracker,type HitBox} from './handContact';
export function useHandContact(video:RefObject<HTMLVideoElement|null>,landmarks:RefObject<Point[]|null>,landmarksAt:RefObject<number>,active:boolean,mirror:boolean,fit:'contain'|'cover',targets:HitBox[],onHit:(id:number)=>void){
 const targetRef=useRef(targets),callback=useRef(onHit);targetRef.current=targets;callback.current=onHit;
 useEffect(()=>{if(!active)return;const tracker=new HandContactTracker();const id=window.setInterval(()=>{const v=video.current,p=landmarks.current,now=performance.now();if(!v||!p||now-landmarksAt.current>500)return;const hit=tracker.update(handPoints(p,v,mirror,fit),targetRef.current,now);if(hit!==null)callback.current(hit);},50);return()=>{clearInterval(id);tracker.reset();};},[active,video,landmarks,landmarksAt,mirror,fit]);
}
