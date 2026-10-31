import {useEffect,useRef,type RefObject} from 'react';
import * as THREE from 'three';
import {createBattleEffects} from '../game/battleEffects';
import type {Feedback} from '../game/laneRun';
import type {Point} from '../vision/actions';
import type {LaneLayout} from '../game/laneGeometry';

type Props={feedback:Feedback|null;video?:RefObject<HTMLVideoElement|null>;landmarks?:RefObject<Point[]|null>;landmarksAt?:RefObject<number>;mirror?:boolean;layout?:LaneLayout};
export function BattleEffects({feedback,video,landmarks,landmarksAt,mirror=false}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),host=useRef<HTMLDivElement>(null),effects=useRef<ReturnType<typeof createBattleEffects>|null>(null);
 const lastPosition=useRef({head:{x:window.innerWidth/2,y:window.innerHeight*.35},feet:{x:window.innerWidth/2,y:window.innerHeight*.8}});
 const ice=useRef<((x:number,y:number)=>void)|null>(null);
 useEffect(()=>{if(!canvas.current)return;effects.current=createBattleEffects(canvas.current);return()=>{effects.current?.destroy();effects.current=null;};},[]);
 useEffect(()=>{const el=host.current;if(!el)return;const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1,0,1,-1000,1000);camera.position.z=20;
  let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));el.appendChild(renderer.domElement);
  const geometry=new THREE.ConeGeometry(24,130,8);geometry.rotateX(Math.PI/2);const material=new THREE.MeshPhongMaterial({color:0x9eeeff,emissive:0x217bb2,shininess:100,transparent:true});scene.add(new THREE.HemisphereLight(0xffffff,0x327cc0,2));
  const items:{mesh:THREE.Mesh;start:number}[]=[];
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.left=0;camera.right=w;camera.top=0;camera.bottom=h;camera.updateProjectionMatrix();};window.addEventListener('resize',resize);resize();
  ice.current=(x,y)=>{const mesh=new THREE.Mesh(geometry,material.clone());mesh.position.set(x,y,0);scene.add(mesh);items.push({mesh,start:performance.now()});};
  let frame=0;const loop=(now:number)=>{frame=requestAnimationFrame(loop);for(let i=items.length-1;i>=0;i--){const e=items[i],t=(now-e.start)/1000;if(t>.8){scene.remove(e.mesh);(e.mesh.material as THREE.Material).dispose();items.splice(i,1);continue;}const scale=.35+Math.min(1,t/.25)*.9;e.mesh.scale.setScalar(scale);e.mesh.rotation.z=t*2;(e.mesh.material as THREE.MeshPhongMaterial).opacity=t<.35?.95:Math.max(0,1-(t-.35)/.45);}renderer.render(scene,camera);};frame=requestAnimationFrame(loop);
  return()=>{ice.current=null;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);for(const e of items)(e.mesh.material as THREE.Material).dispose();geometry.dispose();material.dispose();renderer.dispose();el.removeChild(renderer.domElement);};
 },[]);
 useEffect(()=>{const update=()=>{
  const p=landmarks?.current,v=video?.current;if(p&&v?.videoWidth&&v.videoHeight&&performance.now()-(landmarksAt?.current??0)<500){const rect=v.getBoundingClientRect(),scale=Math.min(rect.width/v.videoWidth,rect.height/v.videoHeight),w=v.videoWidth*scale,h=v.videoHeight*scale,ox=rect.left+(rect.width-w)/2,oy=rect.top+(rect.height-h)/2;
   const point=(ids:number[])=>{const valid=ids.map(i=>p[i]).filter(q=>q&&(q.visibility??0)>=.5);if(!valid.length)return null;const x=valid.reduce((n,q)=>n+q.x,0)/valid.length,y=valid.reduce((n,q)=>n+q.y,0)/valid.length;return {x:ox+(mirror?1-x:x)*w,y:oy+y*h};};
   lastPosition.current={head:point([0,7,8])??lastPosition.current.head,feet:point([27,28,31,32])??lastPosition.current.feet};}};
  const timer=window.setInterval(update,100);return()=>clearInterval(timer);
 },[video,landmarks,landmarksAt,mirror]);
 useEffect(()=>{if(feedback?.kind!=='hurt'||!feedback.gem)return;
  const {head,feet}=lastPosition.current;
  if(feedback.gem==='blue')ice.current?.(head.x,head.y);else effects.current?.play(feedback.gem==='red'?'lava':'lightning',{...(feedback.gem==='red'?feet:head),scale:Math.max(.5,Math.min(1,window.innerHeight/900))});
 },[feedback]);
 return <><canvas ref={canvas} className="battle-effects" aria-hidden="true"/><div ref={host} className="battle-effects ice-effects" aria-hidden="true"/></>;
}
