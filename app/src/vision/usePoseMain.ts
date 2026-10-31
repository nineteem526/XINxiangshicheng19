import {useEffect,useRef,useState,type RefObject} from 'react';
import {FilesetResolver,PoseLandmarker} from '@mediapipe/tasks-vision';
import {ActionRecognizer,type Action,type Direction,type Point} from './actions';
import {drawSkeleton} from './poseDrawing';

/** Reduced-load fallback for browsers that cannot run the pose worker. */
export function usePoseMain(video:RefObject<HTMLVideoElement|null>,active:boolean,onAction:(a:Action,direction?:Direction)=>void,skeleton:RefObject<HTMLCanvasElement|null>,showSkeleton:boolean,maxFps=15,combatOnly=false){
 const recognizer=useRef(new ActionRecognizer(combatOnly?{enabledActions:['punch'],actionIntervalMs:650}:undefined)),callback=useRef(onAction),skeletonOn=useRef(showSkeleton),landmarks=useRef<Point[]|null>(null),landmarksAt=useRef(0);callback.current=onAction;skeletonOn.current=showSkeleton;
 const [status,setStatus]=useState('等待摄像头'),[detail,setDetail]=useState(''),[last,setLast]=useState('—');
 useEffect(()=>{if(!showSkeleton){const c=skeleton.current;c?.getContext('2d')?.clearRect(0,0,c.width,c.height);}},[showSkeleton,skeleton]);
 useEffect(()=>{
  if(!active){setStatus('等待摄像头');landmarks.current=null;landmarksAt.current=0;return;}
  let stopped=false,raf=0,model:PoseLandmarker|null=null,lastVideo=-1,lastUi=0,lastInference=0;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  (async()=>{try{
   if(!ctx)throw new Error('无法创建识别画面');setStatus('加载姿态模型中');const files=await FilesetResolver.forVisionTasks('/wasm');
   model=await PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'/models/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55,outputSegmentationMasks:false});
   if(stopped){model.close();return;}setStatus('姿态模型就绪');
   const loop=()=>{if(stopped)return;const v=video.current,now=performance.now();try{
    if(v&&v.readyState>=2&&v.currentTime!==lastVideo&&now-lastInference>=1000/(maxFps||15)){
     lastVideo=v.currentTime;lastInference=now;const scale=Math.min(1,640/Math.max(v.videoWidth,v.videoHeight)),w=Math.max(1,Math.round(v.videoWidth*scale)),h=Math.max(1,Math.round(v.videoHeight*scale));
     if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.drawImage(v,0,0,w,h);
     model!.detectForVideo(canvas,now,result=>{const p=result.landmarks[0]??null;landmarks.current=p;landmarksAt.current=performance.now();drawSkeleton(skeleton.current,p,v,skeletonOn.current);
      if(p){const r=recognizer.current.update(p,now);for(const action of r.actions){setLast(action);callback.current(action,action==='dodge'?r.direction:undefined);}if(now-lastUi>150){setDetail(r.status);lastUi=now;}}
      else{recognizer.current.lost();if(now-lastUi>300){setDetail('未检测到人体');lastUi=now;}}
     });
    }
    raf=requestAnimationFrame(loop);
   }catch(error){setStatus(`姿态识别已停止：${(error as Error).message}`);recognizer.current.lost();}};loop();
  }catch(error){if(!stopped)setStatus(`姿态模型失败：${(error as Error).message}`);}})();
  return()=>{stopped=true;cancelAnimationFrame(raf);model?.close();landmarks.current=null;recognizer.current.lost();const c=skeleton.current;c?.getContext('2d')?.clearRect(0,0,c.width,c.height);};
 },[active,video,skeleton,maxFps]);
 return {status,detail,last,landmarks,landmarksAt,calibrate:()=>recognizer.current.reset()};
}
