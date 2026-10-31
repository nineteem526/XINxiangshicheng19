import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {makeRunParts,animateRunParts} from './runParts';
describe('segmented monster run',()=>{
 it('moves matched limbs without changing the original model',()=>{const base=new THREE.Group();for(const name of ['tripo_part_1','tripo_part_2','tripo_part_6','tripo_part_7','tripo_part_8','tripo_part_12','tripo_part_13']){const part=new THREE.Object3D();part.name=name;base.add(part);}const clone=base.clone(true),parts=makeRunParts(clone);expect(parts).toHaveLength(7);animateRunParts(parts,Math.PI/16);expect(clone.getObjectByName('tripo_part_6')!.position.z).not.toBe(0);expect(base.getObjectByName('tripo_part_6')!.position.z).toBe(0);});
 it('does not apply the segmented motion to unrelated models',()=>{expect(makeRunParts(new THREE.Group())).toHaveLength(0);});
});
