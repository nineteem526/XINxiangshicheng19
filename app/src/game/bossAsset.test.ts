import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {normalizeBoss,validateGlb} from './bossAsset';

function glb(json:unknown){const raw=new TextEncoder().encode(JSON.stringify(json));const n=Math.ceil(raw.length/4)*4;const data=new ArrayBuffer(20+n);const v=new DataView(data);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,data.byteLength,true);v.setUint32(12,n,true);v.setUint32(16,0x4e4f534a,true);const bytes=new Uint8Array(data,20,n);bytes.fill(32);bytes.set(raw);return data;}
describe('Boss GLB import',()=>{
 it('accepts a self-contained GLB and rejects externally referenced assets',()=>{expect(()=>validateGlb(glb({asset:{version:'2.0'},images:[{uri:'data:image/png;base64,AA=='}]}))).not.toThrow();expect(()=>validateGlb(glb({asset:{version:'2.0'},images:[{uri:'https://example.invalid/x.png'}]}))).toThrow(/外部资源/);});
 it('rejects an incomplete or invalid file',()=>{expect(()=>validateGlb(new ArrayBuffer(8))).toThrow();const data=glb({asset:{version:'2.0'}});new DataView(data).setUint32(8,123,true);expect(()=>validateGlb(data)).toThrow();});
 it('centres the model and puts its lowest point at the ground',()=>{const object=new THREE.Mesh(new THREE.BoxGeometry(2,4,2),new THREE.MeshBasicMaterial());object.position.set(3,6,2);const root=normalizeBoss(object);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root);expect(bounds.min.y).toBeCloseTo(0);expect(bounds.getSize(new THREE.Vector3()).y).toBeCloseTo(2.8);expect(bounds.getCenter(new THREE.Vector3()).x).toBeCloseTo(0);});
});
