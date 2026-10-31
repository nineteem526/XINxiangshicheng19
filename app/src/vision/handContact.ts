import type {Point} from './actions';
export type ScreenPoint={x:number;y:number};
export type HitBox={id:number;left:number;top:number;right:number;bottom:number};
export function videoPointToScreen(point:Pick<Point,'x'|'y'>,videoWidth:number,videoHeight:number,rect:{left:number;top:number;width:number;height:number},mirror:boolean,fit:'contain'|'cover'='contain'):ScreenPoint{
 const scale=(fit==='contain'?Math.min:Math.max)(rect.width/videoWidth,rect.height/videoHeight),w=videoWidth*scale,h=videoHeight*scale;
 return {x:rect.left+(rect.width-w)/2+(mirror?1-point.x:point.x)*w,y:rect.top+(rect.height-h)/2+point.y*h};
}
export class HandContactTracker{
 private inside=[false,false];private lastHit=-Infinity;
 reset(){this.inside=[false,false];this.lastHit=-Infinity;}
 update(hands:(ScreenPoint[]|null)[],targets:HitBox[],now:number):number|null{
  let hit:number|null=null;
  for(let i=0;i<2;i++){
   const points=hands[i];if(!points)continue; // Missing landmarks are not evidence that a hand left.
   const target=targets.find(box=>points.some(p=>p.x>=box.left&&p.x<=box.right&&p.y>=box.top&&p.y<=box.bottom));
   if(target&&!this.inside[i]&&hit===null&&now-this.lastHit>=450){hit=target.id;this.lastHit=now;}
   this.inside[i]=!!target;
  }
  return hit;
 }
}
export function handPoints(points:Point[],video:HTMLVideoElement,mirror:boolean,fit:'contain'|'cover'='contain'){
 if(!video.videoWidth||!video.videoHeight)return [null,null];
 const rect=video.getBoundingClientRect();
 return [[15,17,19],[16,18,20]].map(ids=>{const wrist=points[ids[0]];if(!wrist||(wrist.visibility??0)<.55)return null;return ids.map(i=>points[i]).filter(p=>p&&(p.visibility??0)>=.55).map(p=>videoPointToScreen(p,video.videoWidth,video.videoHeight,rect,mirror,fit));});
}
