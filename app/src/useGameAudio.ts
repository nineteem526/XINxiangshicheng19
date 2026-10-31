import {useCallback,useEffect,useRef} from 'react';
import type {Feedback} from './game/laneRun';
type SoundKind=Feedback['kind'];
export function useGameAudio(enabled:boolean,playing:boolean){
 const context=useRef<AudioContext|null>(null),active=useRef(enabled);active.current=enabled;
 useEffect(()=>()=>{void context.current?.close();context.current=null;},[]);
 const unlock=useCallback(()=>{try{context.current??=new AudioContext();if(context.current.state==='suspended')void context.current.resume();}catch{/* Keep the game playable without audio. */}},[]);
 const play=useCallback((kind:SoundKind)=>{const c=context.current;if(!active.current||!c||c.state!=='running')return;
  const limiter=c.createDynamicsCompressor();limiter.threshold.value=-7;limiter.knee.value=4;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.18;limiter.connect(c.destination);window.setTimeout(()=>limiter.disconnect(),1000);
  const tone=(start:number,end:number,duration:number,delay=0,type:OscillatorType='sine',volume=.14)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(start,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(limiter);o.start(t);o.stop(t+duration+.02);};
  const noise=(duration:number,volume:number,frequency:number)=>{const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);source.connect(filter).connect(gain).connect(limiter);source.start();source.stop(c.currentTime+duration);};
  if(kind==='miss'){noise(.13,.12,800);tone(330,110,.15,0,'triangle',.045);}
  if(kind==='hit'||kind==='clear'){noise(.28,.68,380);noise(.14,.48,1800);tone(175,38,.38,0,'sine',.58);tone(80,35,.42,.02,'triangle',.36);tone(650,110,.19,0,'sawtooth',.20);tone(1500,320,.14,.015,'square',.14);noise(.11,.28,3200);}
  if(kind==='clear'){tone(520,780,.16,.10,'sine',.10);tone(780,1170,.25,.23,'sine',.10);tone(1040,1560,.3,.34,'sine',.07);}
  if(kind==='hurt'){noise(.2,.19,350);tone(150,48,.35,0,'sawtooth',.13);tone(85,42,.32,.1,'triangle',.10);}
 },[]);
 useEffect(()=>{if(!enabled||!playing)return;let step=0;const tick=()=>{const c=context.current;if(!c||c.state!=='running'||!active.current)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();const notes=[73.42,73.42,87.31,73.42,98,87.31,73.42,65.41];o.type='triangle';o.frequency.setValueAtTime(notes[step%notes.length],t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.035,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.19);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.21);step++;};tick();const id=window.setInterval(tick,300);return()=>window.clearInterval(id);},[enabled,playing]);
 return {unlock,play};
}
