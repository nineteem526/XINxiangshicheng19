import {useCallback,useState,type RefObject} from 'react';
import type {Action,Direction} from './actions';
import {usePoseMain} from './usePoseMain';
import {usePoseWorker} from './usePoseWorker';

/** Prefer background inference; unsupported or failed workers fall back to the reduced-load path. */
export function usePose(video:RefObject<HTMLVideoElement|null>,active:boolean,onAction:(action:Action,direction?:Direction)=>void,skeleton:RefObject<HTMLCanvasElement|null>,showSkeleton:boolean,maxFps=15){
 const [workerAvailable,setWorkerAvailable]=useState(()=>typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&typeof createImageBitmap==='function');
 const fail=useCallback(()=>setWorkerAvailable(false),[]);
 const worker=usePoseWorker(video,active&&workerAvailable,onAction,skeleton,showSkeleton,maxFps,fail);
 const main=usePoseMain(video,active&&!workerAvailable,onAction,skeleton,showSkeleton,maxFps);
 return workerAvailable?worker:{...main,status:`${main.status}（兼容模式）`};
}
