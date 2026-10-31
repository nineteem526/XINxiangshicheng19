import {useEffect,useRef,useState,type RefObject} from 'react';
import {ActionRecognizer,type Action,type Direction,type Point} from './actions';
import {drawSkeleton} from './poseDrawing';

type Response={type:'ready'}|{type:'error';message:string}|{type:'result';timestamp:number;points:Point[]|null};

export function usePoseWorker(video:RefObject<HTMLVideoElement|null>,active:boolean,onAction:(a:Action,direction?:Direction)=>void,skeleton:RefObject<HTMLCanvasElement|null>,showSkeleton:boolean,maxFps:number,onFailure:()=>void,combatOnly=false){
 const recognizer=useRef(new ActionRecognizer(combatOnly?{enabledActions:['punch'],actionIntervalMs:650}:undefined)),callback=useRef(onAction),skeletonOn=useRef(showSkeleton),landmarks=useRef<Point[]|null>(null),landmarksAt=useRef(0);callback.current=onAction;skeletonOn.current=showSkeleton;
 const [status,setStatus]=useState('等待摄像头'),[detail,setDetail]=useState(''),[last,setLast]=useState('—');
 useEffect(()=>{if(!showSkeleton){const c=skeleton.current;c?.getContext('2d')?.clearRect(0,0,c.width,c.height);}},[showSkeleton,skeleton]);
 useEffect(()=>{
  if(!active){setStatus('等待摄像头');landmarks.current=null;landmarksAt.current=0;return;}
  let stopped=false,ready=false,busy=false,raf=0,lastTime=0,lastVideo=-1,lastUi=0;
  const input=document.createElement('canvas'),context=input.getContext('2d');if(!context){onFailure();return;}
  let worker:Worker;try{worker=new Worker('/workers/pose-worker.js');}catch{onFailure();return;}
  setStatus('正在后台加载姿态模型');
  worker.onmessage=(event:MessageEvent<Response>)=>{
   if(stopped)return;const msg=event.data;if(msg.type==='ready'){ready=true;setStatus('姿态模型就绪（后台）');return;}if(msg.type==='error'){console.warn('后台姿态识别不可用，切换兼容模式：',msg.message);onFailure();return;}
   busy=false;const v=video.current,p=msg.points;landmarks.current=p;landmarksAt.current=performance.now();if(!v)return;drawSkeleton(skeleton.current,p,v,skeletonOn.current);
   const now=performance.now();if(p){const result=recognizer.current.update(p,msg.timestamp);for(const action of result.actions){setLast(action);callback.current(action,action==='dodge'?result.direction:undefined);}if(now-lastUi>150){setDetail(result.status);lastUi=now;}}
   else{recognizer.current.lost();if(now-lastUi>300){setDetail('未检测到人体');lastUi=now;}}
  };
  worker.onerror=event=>{event.preventDefault();if(!stopped){console.warn('后台姿态识别无法启动，切换兼容模式：',event.message);onFailure();}};
  worker.postMessage({type:'init'});
  const loop=(now:number)=>{
   if(stopped)return;const v=video.current;
   if(ready&&!busy&&v&&v.readyState>=2&&v.currentTime!==lastVideo&&now-lastTime>=1000/(maxFps||15)){
    busy=true;lastTime=now;lastVideo=v.currentTime;const scale=Math.min(1,640/Math.max(v.videoWidth,v.videoHeight)),w=Math.max(1,Math.round(v.videoWidth*scale)),h=Math.max(1,Math.round(v.videoHeight*scale));
    if(input.width!==w||input.height!==h){input.width=w;input.height=h;}context.drawImage(v,0,0,w,h);
    void createImageBitmap(input).then(bitmap=>{if(stopped){bitmap.close();return;}worker.postMessage({type:'frame',bitmap,timestamp:now},[bitmap]);}).catch(()=>{if(!stopped)onFailure();});
   }
   raf=requestAnimationFrame(loop);
  };
  raf=requestAnimationFrame(loop);
  return()=>{stopped=true;cancelAnimationFrame(raf);worker.terminate();landmarks.current=null;recognizer.current.lost();const c=skeleton.current;c?.getContext('2d')?.clearRect(0,0,c.width,c.height);};
 },[active,video,skeleton,maxFps,onFailure]);
 return {status,detail,last,landmarks,landmarksAt,calibrate:()=>recognizer.current.reset()};
}
