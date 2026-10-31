import type {Point} from './actions';
export const SURRENDER_MS=8000;
/** Screen-space posture only; missing or low-confidence body points never count. */
export function isLyingDown(points:Point[]|null,aspect:number):boolean{
 if(!points||!Number.isFinite(aspect)||aspect<=0)return false;
 const visible=(i:number)=>{const p=points[i];return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&(p.visibility??0)>=.65;};
 const middle=(a:number,b:number)=>{const list=[a,b].filter(visible).map(i=>points[i]);if(!list.length)return null;return {x:list.reduce((n,p)=>n+p.x,0)/list.length,y:list.reduce((n,p)=>n+p.y,0)/list.length};};
 const shoulder=middle(11,12),hip=middle(23,24),knee=middle(25,26);if(!shoulder||!hip||!knee)return false;
 const dx=(shoulder.x-hip.x)*aspect,dy=shoulder.y-hip.y,span=Math.hypot(dx,dy);
 const legDx=(hip.x-knee.x)*aspect,legDy=hip.y-knee.y,legSpan=Math.hypot(legDx,legDy);
 return span>.10&&legSpan>.07&&Math.abs(dx)>Math.abs(dy)*1.8&&Math.abs(legDx)>Math.abs(legDy)*1.15;
}
export class SurrenderTracker{
 private since:number|null=null;
 update(lying:boolean,now:number){if(!lying){this.since=null;return 0;}this.since??=now;return Math.min(SURRENDER_MS,Math.max(0,now-this.since));}
 reset(){this.since=null;}
}
