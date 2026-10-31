import {useCallback,useEffect,useRef} from 'react';
import type {Feedback} from './game/laneRun';
type SoundKind=Feedback['kind'];
export function useGameAudio(enabled:boolean){
 const context=useRef<AudioContext|null>(null),active=useRef(enabled);active.current=enabled;
 useEffect(()=>()=>{void context.current?.close();context.current=null;},[]);
 const unlock=useCallback(()=>{try{context.current??=new AudioContext();if(context.current.state==='suspended')void context.current.resume();}catch{/* The game remains playable without sound. */}},[]);
 const play=useCallback((kind:SoundKind)=>{const c=context.current;if(!active.current||!c||c.state!=='running')return;
  const tone=(start:number,end:number,duration:number,delay=0,type:OscillatorType='sine',volume=.14)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(start,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(c.destination);o.start(t);o.stop(t+duration+.02);};
  if(kind==='miss')tone(260,120,.12,0,'triangle',.07);
  if(kind==='hit'){tone(160,48,.18,0,'sawtooth',.11);tone(680,240,.12,0,'triangle',.08);}
  if(kind==='clear'){tone(180,55,.16,0,'sawtooth',.10);tone(560,840,.18,.04,'sine',.12);tone(780,1170,.24,.14,'sine',.10);}
  if(kind==='hurt'){tone(145,55,.28,0,'square',.08);tone(90,50,.3,.1,'sawtooth',.06);}
 },[]);
 return {unlock,play};
}
