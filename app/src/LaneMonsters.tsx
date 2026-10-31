import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {loadBoss,disposeBoss} from './game/bossAsset';
import {type Monster,attackFrom} from './game/laneRun';
import type {LaneLayout} from './game/laneGeometry';
const colors={red:0xff415e,blue:0x3da5ff,green:0x53e493,yellow:0xffd34d,purple:0xc876ff};
export function LaneMonsters({monsters,file,onStatus,layout}:{monsters:Monster[];file:File|null;onStatus:(s:string)=>void;layout:LaneLayout}){
 const host=useRef<HTMLDivElement>(null),state=useRef(monsters),status=useRef(onStatus),layoutRef=useRef(layout);state.current=monsters;status.current=onStatus;layoutRef.current=layout;
 useEffect(()=>{const el=host.current!;const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(0,3,12);camera.lookAt(0,1,0);scene.add(new THREE.HemisphereLight(0xffffff,0x65516d,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,8,6);scene.add(light);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(1.25,devicePixelRatio));renderer.setClearColor(0,0);el.appendChild(renderer.domElement);
 const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();};window.addEventListener('resize',resize);resize();
 let cancelled=false,model:THREE.Group|null=null;const objects=new Map<number,THREE.Group>();const placeholder=new THREE.IcosahedronGeometry(.65,1);const baseMaterial=new THREE.MeshStandardMaterial({color:0x3a1022,roughness:.7});const ringGeometry=new THREE.RingGeometry(.62,.72,32);
 if(file){status.current(`正在加载 ${file.name}…`);void loadBoss(file).then(m=>{if(cancelled){disposeBoss(m);return;}model=m;objects.forEach(o=>scene.remove(o));objects.clear();status.current(`已加载 ${file.name}`);}).catch(e=>status.current(`加载失败：${e.message}；使用占位怪物`));}else status.current('使用占位怪物，可导入 GLB');
 let raf=0;const tick=()=>{raf=requestAnimationFrame(tick);const now=state.current,ids=new Set(now.map(m=>m.id));for(const [id,obj] of objects){if(!ids.has(id)){scene.remove(obj);obj.traverse(o=>{if(o.userData.ring && o instanceof THREE.Mesh)(o.material as THREE.Material).dispose();});objects.delete(id);}}
 for(const m of now){let obj=objects.get(m.id);if(!obj){obj=new THREE.Group();if(model)obj.add(model.clone(true));else{const mesh=new THREE.Mesh(placeholder,baseMaterial);mesh.position.y=.7;obj.add(mesh);}const ring=new THREE.Mesh(ringGeometry,new THREE.MeshBasicMaterial({color:colors[m.gem],side:THREE.DoubleSide}));ring.userData.ring=true;ring.rotation.x=-Math.PI/2;ring.position.y=.03;obj.add(ring);scene.add(obj);objects.set(m.id,obj);}const p=m.progress,l=layoutRef.current;obj.position.set(l.x+(m.lane-1)*(2.2+2.0*p)*l.spread,l.y+.25-1.25*p,-3*l.depth*(1-p));obj.scale.setScalar(Math.max(.12,.83-(1-p)*.58*l.depth));obj.rotation.y=Math.sin(performance.now()*.001)*.08;obj.children[obj.children.length-1].scale.setScalar(p>=attackFrom?1.3:1);}
 renderer.render(scene,camera);};tick();return()=>{cancelled=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);objects.forEach(obj=>obj.traverse(o=>{if(o.userData.ring&&o instanceof THREE.Mesh)(o.material as THREE.Material).dispose();}));placeholder.dispose();baseMaterial.dispose();ringGeometry.dispose();if(model)disposeBoss(model);renderer.dispose();el.removeChild(renderer.domElement);};
 },[file]);return <div className="lane-three" ref={host}/>;
}
