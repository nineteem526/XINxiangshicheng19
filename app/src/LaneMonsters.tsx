import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {loadBoss,disposeBoss} from './game/bossAsset';
import {type Gem,type Monster,attackFrom} from './game/laneRun';
import {monsterWorldPosition,type LaneLayout} from './game/laneGeometry';
import {makeRunParts,animateRunParts} from './game/runParts';
import {makeBoneRun,animateBoneRun} from './game/runBones';

// Strip horizontal root motion: the game controls movement along each lane.
function inPlaceRun(clip:THREE.AnimationClip){
 const result=clip.clone();
 for(const track of result.tracks){
  if(!/hips\.position$/i.test(track.name)||track.getValueSize()!==3)continue;
  const x=track.values[0],z=track.values[2];
  for(let i=0;i<track.values.length;i+=3){track.values[i]=x;track.values[i+2]=z;}
 }
 return result;
}
const colors:Record<Gem,number>={red:0xff415e,blue:0x3da5ff,purple:0xc876ff};
export function LaneMonsters({monsters,file,onStatus,layout,modelScale,modelAngles,feedback,attackClock}:{attackClock?:number;feedback:import('./game/laneRun').Feedback|null;monsters:Monster[];file:File|null;onStatus:(s:string)=>void;layout:LaneLayout;modelScale:number;modelAngles:{red:number;purple:number;blue:number}}){
 const feedbackRef=useRef(feedback),attackClockRef=useRef(attackClock),host=useRef<HTMLDivElement>(null),state=useRef(monsters),status=useRef(onStatus),layoutRef=useRef(layout),scaleRef=useRef(modelScale),anglesRef=useRef(modelAngles);
 feedbackRef.current=feedback;attackClockRef.current=attackClock;
 state.current=monsters;status.current=onStatus;layoutRef.current=layout;scaleRef.current=modelScale;anglesRef.current=modelAngles;
 useEffect(()=>{
  const el=host.current!;const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(0,3,12);camera.lookAt(0,1,0);scene.add(new THREE.HemisphereLight(0xffffff,0x65516d,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,8,6);scene.add(light);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(1.25,devicePixelRatio));renderer.setClearColor(0,0);el.appendChild(renderer.domElement);
  const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();};window.addEventListener('resize',resize);resize();
  let cancelled=false;const models:Partial<Record<Gem,THREE.Group>>={};let custom:THREE.Group|null=null;const objects=new Map<number,THREE.Group>();const placeholder=new THREE.IcosahedronGeometry(.65,1);const ringGeometry=new THREE.RingGeometry(.62,.72,32);
  const removeObject=(obj:THREE.Group)=>{scene.remove(obj);obj.userData.mixer?.stopAllAction();obj.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.ownedMaterial)(o.material as THREE.Material).dispose();});};
  const resetObjects=()=>{objects.forEach(removeObject);objects.clear();};
  if(file){status.current(`正在加载 ${file.name}…`);void loadBoss(file).then(m=>{if(cancelled){disposeBoss(m);return;}custom=m;resetObjects();status.current(`已导入 ${file.name} · 所有颜色使用此模型`);}).catch(e=>{if(!cancelled)status.current(`加载失败：${e.message}`);});}
  else {
   status.current('正在加载红色、紫色和蓝色怪物…');
   void Promise.allSettled((['red','purple','blue'] as const).map(async color=>{const response=await fetch(`/monsters/${color}.glb`);if(!response.ok)throw new Error(color);const blob=await response.blob();const model=await loadBoss(new File([blob],`${color}.glb`));if(cancelled){disposeBoss(model);return;}models[color]=model;resetObjects();})).then(results=>{if(!cancelled)status.current(results.some(r=>r.status==='rejected')?'部分模型加载失败，使用彩色占位怪物':'红、紫、蓝怪物已就绪');});
  }
  const retired:{obj:THREE.Group;until:number}[]=[];
  let previous=performance.now();let raf=0;
  const tick=()=>{raf=requestAnimationFrame(tick);const current=performance.now(),delta=Math.min((current-previous)/1000,.1);previous=current;
   for(let i=retired.length-1;i>=0;i--){const r=retired[i];r.obj.userData.mixer?.update(delta);if(current>=r.until){removeObject(r.obj);retired.splice(i,1);}}
   const now=state.current,ids=new Set(now.map(m=>m.id));
   for(const [id,obj] of objects)if(!ids.has(id)){const f=feedbackRef.current;if(f?.monsterId===id&&(f.kind==='hit'||f.kind==='clear')&&obj.userData.fall){const actions=obj.userData;actions.run?.stop();actions.attack?.stop();actions.fall.reset().setLoop(THREE.LoopOnce,1);actions.fall.clampWhenFinished=true;actions.fall.timeScale=2;actions.fall.play();retired.push({obj,until:current+1500});}else removeObject(obj);objects.delete(id);}
   for(const m of now){let obj=objects.get(m.id);if(!obj){obj=new THREE.Group();const visual=new THREE.Group();obj.add(visual);obj.userData.visual=visual;const model=custom??models[m.gem];
    if(model){const clone=cloneSkeleton(model);visual.add(clone);const clip=model.animations.find(a=>a.name.toLowerCase()==='run');if(clip){const mixer=new THREE.AnimationMixer(clone),run=mixer.clipAction(inPlaceRun(clip));run.play();obj.userData.mixer=mixer;obj.userData.run=run;const strike=model.animations.find(a=>a.name.toLowerCase()===(m.gem==='red'?'angry_01':'cast_a_spell'));if(strike){const action=mixer.clipAction(inPlaceRun(strike));action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.timeScale=strike.duration/3;obj.userData.attack=action;}const fall=model.animations.find(a=>a.name.toLowerCase()==='fall');if(fall)obj.userData.fall=mixer.clipAction(inPlaceRun(fall));} else{obj.userData.runBones=makeBoneRun(clone);obj.userData.runParts=obj.userData.runBones.length?[]:makeRunParts(clone);}}
    else{const mesh=new THREE.Mesh(placeholder,new THREE.MeshStandardMaterial({color:colors[m.gem],roughness:.7}));mesh.userData.ownedMaterial=true;mesh.position.y=.7;visual.add(mesh);}
    const ring=new THREE.Mesh(ringGeometry,new THREE.MeshBasicMaterial({color:colors[m.gem],side:THREE.DoubleSide}));ring.userData.ownedMaterial=true;ring.rotation.x=-Math.PI/2;ring.position.y=.03;obj.add(ring);scene.add(obj);objects.set(m.id,obj);}
    obj.userData.visual.scale.setScalar(scaleRef.current);obj.userData.visual.rotation.y=!custom&&m.gem==='red'?anglesRef.current.red*Math.PI/180:!custom&&m.gem==='purple'?anglesRef.current.purple*Math.PI/180:!custom&&m.gem==='blue'?anglesRef.current.blue*Math.PI/180:0;const p=m.progress,l=layoutRef.current;obj.position.copy(monsterWorldPosition(m.lane,p,l));obj.scale.setScalar(.83);const seconds=performance.now()*.001+m.id*.7;
    if(obj.userData.mixer){const clock=attackClockRef.current;if(obj.userData.run)obj.userData.run.paused=p>=1&&clock===undefined;if(p>=1&&clock!==undefined){if(obj.userData.lastClock===undefined||clock>obj.userData.lastClock+100){obj.userData.run?.stop();obj.userData.attack?.reset().play();}obj.userData.lastClock=clock;}obj.userData.mixer.update(delta);}else{obj.rotation.y=Math.sin(seconds*8)*.10;obj.rotation.z=Math.sin(seconds*8)*.08;obj.rotation.x=.12+Math.abs(Math.sin(seconds*8))*.08;if(obj.userData.runBones?.length){animateBoneRun(obj.userData.runBones,seconds);obj.position.y+=Math.abs(Math.sin(seconds*8))*.04;}else if(obj.userData.runParts?.length)animateRunParts(obj.userData.runParts,seconds);else obj.position.y+=Math.abs(Math.sin(seconds*8))*.18;}
    obj.children[obj.children.length-1].scale.setScalar(p>=attackFrom?1.3:1);
   }renderer.render(scene,camera);
  };tick();return()=>{cancelled=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);resetObjects();retired.forEach(r=>removeObject(r.obj));placeholder.dispose();ringGeometry.dispose();if(custom)disposeBoss(custom);Object.values(models).forEach(disposeBoss);renderer.dispose();el.removeChild(renderer.domElement);};
 },[file]);return <div className="lane-three" ref={host}/>;
}
