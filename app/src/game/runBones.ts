import * as THREE from 'three';
const limbs=[['LeftUpLeg',1,.72],['RightUpLeg',-1,.72],['LeftLeg',-1,.38],['RightLeg',1,.38],['LeftArm',-1,.65],['RightArm',1,.65],['LeftForeArm',-1,.22],['RightForeArm',1,.22]] as const;
export function makeBoneRun(root:THREE.Object3D){
 const result:{bone:THREE.Bone;original:THREE.Quaternion;sign:number;amount:number}[]=[];
 root.traverse(node=>{if(!(node instanceof THREE.Bone))return;const match=limbs.find(([name])=>node.name.endsWith(name));if(match)result.push({bone:node,original:node.quaternion.clone(),sign:match[1],amount:match[2]});});
 return result.length>=4?result:[];
}
const axis=new THREE.Vector3(1,0,0),rotation=new THREE.Quaternion();
export function animateBoneRun(bones:ReturnType<typeof makeBoneRun>,time:number){const wave=Math.sin(time*8);for(const {bone,original,sign,amount} of bones){rotation.setFromAxisAngle(axis,wave*sign*amount);bone.quaternion.copy(original).multiply(rotation);}}
