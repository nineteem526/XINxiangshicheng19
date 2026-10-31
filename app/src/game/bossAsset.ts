import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Only accept self-contained GLB files: they must not cause external requests. */
export function validateGlb(data:ArrayBuffer):void {
  if(data.byteLength<20)throw new Error('文件太小，不是有效的 GLB');
  const view=new DataView(data);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==data.byteLength)throw new Error('需要完整的 glTF 2.0 GLB 文件');
  const length=view.getUint32(12,true),type=view.getUint32(16,true);
  if(type!==0x4e4f534a||length>data.byteLength-20)throw new Error('GLB 内容不完整');
  let json:unknown;try{json=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,length)).replace(/\u0000+$/,''));}catch{throw new Error('GLB 场景数据无法读取');}
  if(!json||typeof json!=='object')throw new Error('GLB 场景数据无效');
  const scene=json as {buffers?:{uri?:unknown}[];images?:{uri?:unknown}[]};
  for(const entry of [...(Array.isArray(scene.buffers)?scene.buffers:[]),...(Array.isArray(scene.images)?scene.images:[])]){
    if(entry?.uri!==undefined&&(typeof entry.uri!=='string'||!entry.uri.startsWith('data:')))throw new Error('GLB 含外部资源，请导出包含贴图的单文件 GLB');
  }
}

export function normalizeBoss(object:THREE.Object3D):THREE.Group {
  object.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<1e-6||![center.x,center.y,center.z].every(Number.isFinite))throw new Error('模型没有可见的有效几何');
  const shift=new THREE.Group();shift.add(object);shift.position.set(-center.x,-bounds.min.y,-center.z);
  const root=new THREE.Group();root.add(shift);root.scale.setScalar(2.8/size.y);return root;
}

export function disposeBoss(object:THREE.Object3D):void {
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  object.traverse(node=>{if(!(node instanceof THREE.Mesh))return;geometries.add(node.geometry);for(const material of (Array.isArray(node.material)?node.material:[node.material])){materials.add(material);for(const value of Object.values(material))if(value instanceof THREE.Texture)textures.add(value);}});
  textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
}

export async function loadBoss(file:File):Promise<THREE.Group>{
  if(file.size>100*1024*1024)throw new Error('模型超过 100 MB，请先压缩后再试');
  const data=await file.arrayBuffer();validateGlb(data);
  const gltf=await new GLTFLoader().parseAsync(data,'');
  try{return normalizeBoss(gltf.scene);}catch(error){disposeBoss(gltf.scene);throw error;}
}
