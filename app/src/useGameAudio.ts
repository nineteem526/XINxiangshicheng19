import {useCallback,useEffect,useRef} from 'react';
import type {Feedback,Gem} from './game/laneRun';
type SoundKind=Feedback['kind'];
export function useGameAudio(enabled:boolean,playing:boolean){
 const context=useRef<AudioContext|null>(null),active=useRef(enabled),voices=useRef<Partial<Record<`${Gem}-${'skill'|'death'}`,HTMLAudioElement>>>({}),effects=useRef<Partial<Record<'blue'|'purple',HTMLAudioElement>>>({});active.current=enabled;
 useEffect(()=>{for(const color of ['red','blue','purple'] as const)for(const kind of ['skill','death'] as const){const key=`${color}-${kind}` as const;const audio=new Audio(`/audio/monsters/${key}.mp3?v=trimmed2`);audio.preload='auto';audio.volume=.65;voices.current[key]=audio;}for(const [color,file] of [['blue','ice'],['purple','lightning']] as const){const sound=new Audio(`/audio/monsters/${file}-effect.mp3`);sound.preload='auto';sound.volume=.55;effects.current[color]=sound;}return()=>{for(const a of Object.values(effects.current)){a?.pause();if(a)a.src='';}effects.current={};for(const a of Object.values(voices.current)){a?.pause();if(a)a.src='';}voices.current={};};},[]);
 useEffect(()=>{if(!enabled){for(const a of Object.values(voices.current))a?.pause();for(const a of Object.values(effects.current))a?.pause();}},[enabled]);
 const playElement=useCallback((color:Gem)=>{if(!active.current||color==='red')return;const sound=effects.current[color];if(!sound)return;sound.currentTime=0;void sound.play().catch(()=>{});},[]);
 const playVoice=useCallback((color:Gem,kind:'skill'|'death')=>{if(!active.current)return;const audio=voices.current[`${color}-${kind}`];if(!audio)return;audio.currentTime=0;void audio.play().catch(()=>{});},[]);
 useEffect(()=>()=>{void context.current?.close();context.current=null;},[]);
 const unlock=useCallback(()=>{try{context.current??=new AudioContext();if(context.current.state==='suspended')void context.current.resume();}catch{/* Keep the game playable without audio. */}},[]);
 const play=useCallback((kind:SoundKind,gem?:Gem)=>{const c=context.current;if(!active.current||!c||c.state!=='running')return;
  const limiter=c.createDynamicsCompressor();limiter.threshold.value=-7;limiter.knee.value=4;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.18;limiter.connect(c.destination);window.setTimeout(()=>limiter.disconnect(),1000);
  const tone=(start:number,end:number,duration:number,delay=0,type:OscillatorType='sine',volume=.14)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(start,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(limiter);o.start(t);o.stop(t+duration+.02);};
  const noise=(duration:number,volume:number,frequency:number)=>{const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);source.connect(filter).connect(gain).connect(limiter);source.start();source.stop(c.currentTime+duration);};
  if(kind==='miss'){noise(.13,.12,800);tone(330,110,.15,0,'triangle',.045);}
  if(kind==='hit'||kind==='clear'){noise(.28,.68,380);noise(.14,.48,1800);tone(175,38,.38,0,'sine',.58);tone(80,35,.42,.02,'triangle',.36);tone(650,110,.19,0,'sawtooth',.20);tone(1500,320,.14,.015,'square',.14);noise(.11,.28,3200);}
  if((kind==='hit'||kind==='clear')&&gem==='red'){tone(125,42,.24,.01,'triangle',.19);noise(.16,.16,520);}
  if((kind==='hit'||kind==='clear')&&gem==='blue'){tone(1150,620,.22,.02,'sine',.12);noise(.16,.10,4200);}
  if((kind==='hit'||kind==='clear')&&gem==='purple'){tone(760,110,.17,.01,'sawtooth',.10);noise(.1,.12,2600);}
  if(kind==='clear'){tone(1568,1500,.16,.02,'sine',.16);tone(2349,2240,.12,.025,'sine',.07);tone(2093,1980,.23,.10,'sine',.12);noise(.035,.07,5000);}
  if(kind==='special'){noise(.4,.25,1200);tone(150,900,.45,0,'sawtooth',.15);tone(600,1200,.5,.1,'sine',.1);}
  if(kind==='hurt'){noise(.2,.19,350);tone(150,48,.35,0,'sawtooth',.13);tone(85,42,.32,.1,'triangle',.10);}
 },[]);
 // A restrained, looping minor-key fantasy cue, generated locally with Web Audio.
 useEffect(()=>{
  if(!enabled||!playing)return;
  const c=context.current;if(!c)return;
  const bus=c.createGain();bus.gain.value=.24;bus.connect(c.destination);
  const bpm=96,beat=60/bpm,stepLength=beat/2;
  const melody=[0,0,69.30,0,82.41,0,92.50,0,82.41,0,69.30,0,61.74,0,0,0, 0,0,73.42,0,82.41,0,110,0,98,0,82.41,0,73.42,0,0,0, 0,0,77.78,0,92.50,0,116.54,0,103.83,0,92.50,0,77.78,0,0,0, 0,0,73.42,0,87.31,0,110,0,98,0,82.41,0,69.30,0,0,0];
  const chords=[[138.59,164.81,207.65],[146.83,174.61,220],[155.56,185,233.08],[138.59,164.81,207.65]];
  let step=0,next=c.currentTime+.05;
  const note=(freq:number,at:number,dur:number,volume:number,type:OscillatorType,attack:number)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+attack);g.gain.exponentialRampToValueAtTime(.0001,at+dur);o.connect(g).connect(bus);o.start(at);o.stop(at+dur+.02);};
  const schedule=()=>{while(next<c.currentTime+.16){const i=step%melody.length,bar=Math.floor(i/16),n=melody[i];if(n){note(n*2,next,.5,.055,'triangle',.045);note(n*4,next,.32,.009,'sine',.025);}if(i%16===0){for(const f of chords[bar])note(f,next,beat*3.8,.017,'sine',.4);note(chords[bar][0]/2,next,beat*1.8,.045,'triangle',.08);}if(i%8===4)note(chords[bar][0]/2,next,beat*1.3,.026,'triangle',.08);step++;next+=stepLength;}};
  schedule();const timer=window.setInterval(schedule,100);
  return()=>{clearInterval(timer);const t=c.currentTime;bus.gain.cancelScheduledValues(t);bus.gain.setValueAtTime(bus.gain.value,t);bus.gain.linearRampToValueAtTime(0,t+.12);window.setTimeout(()=>bus.disconnect(),200);};
 },[enabled,playing]);
 return {unlock,play,playVoice,playElement};
}
