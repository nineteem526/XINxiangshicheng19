import {useEffect,useState,type RefObject} from 'react';

/** Experimental depth processing is explicit, local, low-frequency and single-flight. */
export function useLocalDepth(video:RefObject<HTMLVideoElement|null>,enabled:boolean){
 const [depth,setDepth]=useState('');const [status,setStatus]=useState('深度实验关闭');
 useEffect(()=>{
  if(!enabled){setDepth('');setStatus('深度实验关闭');return;}
  let stopped=false,timer=0;const controller=new AbortController(),canvas=document.createElement('canvas');
  const loop=async()=>{
   if(stopped)return;if(document.hidden){timer=window.setTimeout(loop,1000);return;}
   const v=video.current;if(!v?.videoWidth||!v.videoHeight){setStatus('深度实验：等待摄像头');timer=window.setTimeout(loop,500);return;}
   try{
    const scale=Math.min(1,640/v.videoWidth);canvas.width=Math.round(v.videoWidth*scale);canvas.height=Math.round(v.videoHeight*scale);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法读取视频帧');ctx.drawImage(v,0,0,canvas.width,canvas.height);
    const response=await fetch('/depth/frame',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:canvas.toDataURL('image/jpeg',.65)}),signal:controller.signal});
    if(!response.ok)throw new Error(`服务错误 ${response.status}`);const result=await response.json();if(!result.ok||typeof result.depth!=='string'||!result.depth.startsWith('data:image/png;base64,'))throw new Error(result.error||'深度结果无效');if(stopped)return;
    setDepth(result.depth);setStatus(`深度实验：本机推理 ${Math.round(result.inferenceMs)} 毫秒，约每秒更新`);timer=window.setTimeout(loop,800);
   }catch(error){if(stopped)return;setDepth('');setStatus(`深度不可用，已回退实景：${(error as Error).message}`);}
  };
  setStatus('深度实验启动中');void loop();return()=>{stopped=true;controller.abort();clearTimeout(timer);};
 },[video,enabled]);
 return {depth,status};
}
