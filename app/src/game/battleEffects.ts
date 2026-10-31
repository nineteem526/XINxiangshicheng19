// Adapted from the supplied battle-effects.js.
// @ts-nocheck
export function createBattleEffects(canvas) {
 const c=canvas.getContext('2d'), effects=[]; let w,h,dpr,last=performance.now(),frame,live=true;
 function resize(){let r=canvas.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;c.setTransform(dpr,0,0,dpr,0,0)}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function rand(a,b){return a+Math.random()*(b-a)}
 function play(type,o={}){if(!['lava','ice','lightning'].includes(type))throw Error('Unknown effect');let e={type,x:o.x??w/2,y:o.y??h*.68,s:o.scale??1,t:0,p:[],bolts:[]};for(let i=0;i<72;i++){let a=rand(0,Math.PI*2),v=rand(25,240);e.p.push({vx:Math.cos(a)*v,vy:rand(80,350),z:Math.sin(a)*v,life:rand(.5,1.4),size:rand(1,7),n:Math.random()})}for(let j=0;j<7;j++){let p=[],x=rand(-18,18),y=-400; p.push([x,y]);for(let i=1;i<10;i++){let q=i/9;p.push([x*(1-q)+rand(-28,28)*(1-q),y*(1-q)])}e.bolts.push(p)}effects.push(e);if(effects.length>8)effects.shift()}
 function draw(e,dt){e.t+=dt;let t=e.t, duration=e.type==='ice'?2.2:1.5, fade=Math.min(1,Math.max(0,(duration-t)/.45));if(t>duration)return false;c.save();c.translate(e.x,e.y);c.scale(e.s,e.s);c.globalCompositeOperation='lighter';
 if(e.type==='lava'){
  let expand=Math.min(1,t*4),r=expand*180;c.globalAlpha=fade;let glow=c.createRadialGradient(0,0,0,0,0,r);glow.addColorStop(0,'rgba(255,248,133,.9)');glow.addColorStop(.22,'rgba(255,112,0,.8)');glow.addColorStop(.58,'rgba(220,35,0,.45)');glow.addColorStop(1,'rgba(130,0,0,0)');c.save();c.scale(1,.35);c.fillStyle=glow;c.beginPath();c.arc(0,0,r,0,7);c.fill();c.restore();
  for(let i=0;i<9;i++){let a=i*2.4,rr=15+i*17*expand;c.strokeStyle=`rgba(255,${110+i*8},0,${fade*.65})`;c.lineWidth=rand(2,5);c.shadowBlur=16;c.shadowColor='#ff4000';c.beginPath();c.moveTo(Math.cos(a)*rr*.2,Math.sin(a)*rr*.15);c.lineTo(Math.cos(a+.3)*rr,Math.sin(a+.3)*rr*.3);c.lineTo(Math.cos(a+.55)*rr*1.3,Math.sin(a+.55)*rr*.4);c.stroke()}
 }
 if(e.type==='ice'){
  c.shadowColor='#4dbfff';c.shadowBlur=18;
  for(let row=4;row>=0;row--){let progress=Math.min(1,Math.max(0,(t-(4-row)*.19)*5));if(!progress)continue;let depth=row*33;for(let col=-2;col<=2;col++){let x=col*34,y=-depth,ht=(65+(2-Math.abs(col))*20)*progress,base=17;c.globalAlpha=fade;let g=c.createLinearGradient(x-base,y-ht,x+base,y);g.addColorStop(0,'#efffff');g.addColorStop(.4,'#81dfff');g.addColorStop(.8,'#1878bb');g.addColorStop(1,'#d6ffff');c.fillStyle=g;c.beginPath();c.moveTo(x-base,y);c.lineTo(x-11,y-ht*.4);c.lineTo(x+3,y-ht);c.lineTo(x+base,y-ht*.25);c.lineTo(x+base+5,y);c.closePath();c.fill();c.strokeStyle='#d9ffff';c.lineWidth=1;c.stroke();c.beginPath();c.moveTo(x+3,y-ht);c.lineTo(x,y-ht*.22);c.lineTo(x-base,y);c.stroke()}}
 }
 if(e.type==='lightning'&&t<.8){let flash=Math.max(0,1-t/.8)*(0.65+Math.random()*.35);c.globalAlpha=flash;for(let j=0;j<e.bolts.length;j++){let p=e.bolts[j];c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.shadowColor='#b942ff';c.shadowBlur=22;c.strokeStyle='#9b32ff';c.lineWidth=14-j;c.stroke();c.shadowBlur=8;c.strokeStyle='#fff';c.lineWidth=2;c.stroke()}let r=Math.min(180,t*800);c.beginPath();c.ellipse(0,0,r,r*.25,0,0,7);c.strokeStyle='#c973ff';c.lineWidth=4;c.stroke()}
 for(let p of e.p){if(t>p.life)continue;let x=p.vx*t,y=-p.vy*t+260*t*t+p.z*t*.18,size=Math.max(.2,p.size*(1-t/p.life));c.globalAlpha=(1-t/p.life)*fade;c.shadowBlur=12;c.shadowColor=e.type==='lava'?'#ff5a00':e.type==='ice'?'#9aeaff':'#d07bff';c.fillStyle=e.type==='lava'?(p.n>.55?'#ffda5c':'#ff5100'):e.type==='ice'?'#bff6ff':'#e6bdff';c.beginPath();if(e.type==='ice'){c.moveTo(x,y-size*2);c.lineTo(x+size,y);c.lineTo(x,y+size*2);c.lineTo(x-size,y);c.closePath()}else c.arc(x,y,size,0,7);c.fill()}
 c.restore();return true}
 function loop(now){if(!live)return;let dt=Math.min((now-last)/1000,.05);last=now;c.clearRect(0,0,w,h);for(let i=effects.length-1;i>=0;i--)if(!draw(effects[i],dt))effects.splice(i,1);frame=requestAnimationFrame(loop)}frame=requestAnimationFrame(loop);return {play,destroy(){live=false;cancelAnimationFrame(frame);observer.disconnect();c.clearRect(0,0,w,h)}}
}
