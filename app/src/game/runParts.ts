import * as THREE from 'three';
/** red1 is a segmented, unskinned Tripo model. Animate its independent named parts as a light-weight run approximation. */
export function makeRunParts(root:THREE.Object3D){
 const names=['tripo_part_1','tripo_part_2','tripo_part_6','tripo_part_7','tripo_part_8','tripo_part_12','tripo_part_13'];
 const parts=names.map(name=>{const node=root.getObjectByName(name);return node?{name,node,position:node.position.clone(),rotation:node.rotation.clone()}:null;}).filter((v):v is NonNullable<typeof v>=>!!v);
 return parts.length>=6?parts:[];
}
export function animateRunParts(parts:ReturnType<typeof makeRunParts>,time:number){
 const wave=Math.sin(time*8);for(const p of parts){
  const leg=p.name==='tripo_part_6'||p.name==='tripo_part_7'||p.name==='tripo_part_8'||p.name==='tripo_part_12'||p.name==='tripo_part_13';
  const sign=['tripo_part_1','tripo_part_7','tripo_part_8'].includes(p.name)?1:-1;
  p.node.position.z=p.position.z+wave*sign*(leg?.025:.035);
  p.node.position.y=p.position.y+(leg?Math.max(0,wave*sign)*.022:0);
  p.node.rotation.x=p.rotation.x+wave*sign*(leg?.16:-.20);
 }
}
