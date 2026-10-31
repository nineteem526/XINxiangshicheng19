export type Point = { x: number; y: number; z: number; visibility?: number };
export type Action = 'punch' | 'left' | 'right' | 'duck' | 'special' | 'ready';
type Vec={x:number;y:number};
type HandState={smooth:Vec|null;anchor:Vec|null;stableAt:number;motionAt:number;samples:number;armed:boolean};
const hand=():HandState=>({smooth:null,anchor:null,stableAt:0,motionAt:0,samples:0,armed:false});
export class ActionRecognizer {
  private baseline: {x:number; y:number; scale:number} | null = null;
  private hands:[HandState,HandState]=[hand(),hand()];
  private last: Record<Action,number> = {punch:-Infinity,left:-Infinity,right:-Infinity,duck:-Infinity,special:-Infinity,ready:-Infinity};
  private armed = { lean:true, duck:true, special:true, ready:true };
  private held = { special:0, ready:0 };
  private lastFrame=0;
  private resetHands(){this.hands=[hand(),hand()];}
  lost(){this.resetHands();this.held={special:0,ready:0};this.lastFrame=0;}
  reset(){this.baseline=null;this.lost();this.armed={lean:true,duck:true,special:true,ready:true};this.last={punch:-Infinity,left:-Infinity,right:-Infinity,duck:-Infinity,special:-Infinity,ready:-Infinity};}
  update(p: Point[], t: number): {actions:Action[]; status:string} {
    const ids=[11,12,15,16,23,24];
    if(ids.some(i=>!p[i]||(p[i].visibility??0)<.6)){this.lost();return {actions:[],status:'请确保肩、手和髋部完整入镜'};}
    if(this.lastFrame && (t-this.lastFrame>250 || t<=this.lastFrame))this.lost();this.lastFrame=t;
    const [ls,rs,lw,rw,lh,rh]=ids.map(i=>p[i]);
    const x=(ls.x+rs.x+lh.x+rh.x)/4,y=(lh.y+rh.y)/2,scale=Math.hypot(ls.x-rs.x,ls.y-rs.y);
    if(scale<.06){this.lost();return {actions:[],status:'请靠近摄像头'};}
    if(!this.baseline){this.baseline={x,y,scale};return {actions:[],status:'已校准，站直后开始'};}
    const b=this.baseline,dx=(x-b.x)/b.scale,dy=(y-b.y)/b.scale;
    const actions:Action[]=[];const emit=(a:Action,cd:number)=>{if(t-this.last[a]>cd){actions.push(a);this.last[a]=t;return true;}return false;};
    const raised=lw.y<ls.y-.08&&rw.y<rs.y-.08,ready=lw.y<lh.y&&rw.y<rh.y&&!raised;
    if(raised){if(!this.held.special)this.held.special=t;if(this.armed.special&&t-this.held.special>650){emit('special',1800);this.armed.special=false;}}else{this.held.special=0;this.armed.special=true;}
    if(ready){if(!this.held.ready)this.held.ready=t;if(this.armed.ready&&t-this.held.ready>900){emit('ready',1800);this.armed.ready=false;}}else{this.held.ready=0;this.armed.ready=true;}
    let maxTravel=0;
    for(const [i,w] of [lw,rw].entries()){
      const h=this.hands[i],shoulder=i===0?ls:rs;
      const relative={x:(w.x-shoulder.x)/b.scale,y:(w.y-shoulder.y)/b.scale};
      if(!h.smooth){h.smooth=relative;h.anchor={...relative};h.stableAt=t;continue;}
      h.smooth={x:h.smooth.x*.6+relative.x*.4,y:h.smooth.y*.6+relative.y*.4};
      if(!h.anchor){h.anchor={...h.smooth};h.stableAt=t;continue;}
      const dist=Math.hypot(h.smooth.x-h.anchor.x,h.smooth.y-h.anchor.y);maxTravel=Math.max(maxTravel,dist);
      if(raised){this.hands[i]=hand();continue;}
      if(!h.armed){if(dist>.16){h.anchor={...h.smooth};h.stableAt=t;}else if(t-h.stableAt>=250){h.armed=true;h.anchor={...h.smooth};}continue;}
      if(!h.motionAt && dist>.18){h.motionAt=t;h.samples=1;}
      else if(h.motionAt)h.samples++;
      if(h.motionAt && t-h.motionAt>650){this.hands[i]=hand();continue;}
      if(h.motionAt && t-h.motionAt>=100 && h.samples>=3 && dist>.7 && w.y<y){
        if(emit('punch',600)){this.resetHands();break;}this.hands[i]=hand();
      }
    }
    if(Math.abs(dx)>.45&&this.armed.lean){emit(dx<0?'left':'right',700);this.armed.lean=false;}else if(Math.abs(dx)<.2)this.armed.lean=true;
    if(dy>.32&&this.armed.duck){emit('duck',700);this.armed.duck=false;}else if(dy<.14)this.armed.duck=true;
    return {actions,status:`水平 ${dx.toFixed(2)} · 下蹲 ${dy.toFixed(2)} · 挥拳位移 ${maxTravel.toFixed(2)}（阈值 0.70）`};
  }
}
