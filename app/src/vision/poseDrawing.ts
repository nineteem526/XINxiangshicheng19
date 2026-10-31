import type {Point} from './actions';
const edges=[[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[12,14],[14,16],[16,18],[16,20],[16,22],[11,23],[12,24],[23,24],[23,25],[25,27],[27,29],[29,31],[27,31],[24,26],[26,28],[28,30],[30,32],[28,32]];
const joints=[11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];

export function drawSkeleton(canvas:HTMLCanvasElement|null,points:Point[]|null,video:HTMLVideoElement,enabled:boolean){
 if(!canvas||!video.videoWidth||!video.videoHeight)return;
 const scale=Math.min(1,640/Math.max(video.videoWidth,video.videoHeight)),width=Math.max(1,Math.round(video.videoWidth*scale)),height=Math.max(1,Math.round(video.videoHeight*scale));
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,width,height);if(!points||!enabled)return;
 const visible=(i:number)=>points[i]&&(points[i].visibility??0)>=.55;
 ctx.lineWidth=Math.max(3,width*.003);ctx.strokeStyle='#66faff';ctx.lineCap='round';ctx.shadowColor='#00dfff';ctx.shadowBlur=4;
 for(const [a,b] of edges){if(!visible(a)||!visible(b))continue;ctx.beginPath();ctx.moveTo(points[a].x*width,points[a].y*height);ctx.lineTo(points[b].x*width,points[b].y*height);ctx.stroke();}
 ctx.fillStyle='#fff57b';for(const i of joints){if(!visible(i))continue;ctx.beginPath();ctx.arc(points[i].x*width,points[i].y*height,Math.max(4,width*.004),0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
}
