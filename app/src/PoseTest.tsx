import {useHandContact} from './vision/useHandContact';
import {useCallback,useEffect,useRef,useState} from 'react';
import qrcode from 'qrcode-generator';
import {useCamera} from './camera';
import {usePose} from './vision/usePose';
import type {Action} from './vision/actions';
import './pose-test.css';
const names:Record<Action,string>={punch:'碰撞攻击',dodge:'侧身闪避',duck:'下蹲闪避',special:'双手举高',ready:'准备姿势'};
export default function PoseTest(){
 const video=useRef<HTMLVideoElement>(null),skeleton=useRef<HTMLCanvasElement>(null);
 const cam=useCamera(video);const [showSkeleton,setShowSkeleton]=useState(true),[mirror,setMirror]=useState(false),[contain,setContain]=useState(true),[pair,setPair]=useState(false);
 const [addresses,setAddresses]=useState<string[]>([]),[address,setAddress]=useState(0),[event,setEvent]=useState<{name:string;count:number;at:number}|null>(null);
 const [counts,setCounts]=useState<Record<Action,number>>({punch:0,dodge:0,duck:0,special:0,ready:0});const countsRef=useRef(counts);countsRef.current=counts;
 const action=useCallback((a:Action)=>{const next={...countsRef.current,[a]:countsRef.current[a]+1};countsRef.current=next;setCounts(next);setEvent({name:names[a],count:next[a],at:Date.now()});},[]);
 const active=cam.status==='手机画面在线'||cam.status==='本机摄像头在线';const onAction=useCallback((a:Action)=>{if(a==='special')action(a);},[action]);const pose=usePose(video,active,onAction,skeleton,showSkeleton,15,true);
 const target={id:1,left:window.innerWidth*.5-65,right:window.innerWidth*.5+65,top:window.innerHeight*.35-65,bottom:window.innerHeight*.35+65};
 useHandContact(video,pose.landmarks,pose.landmarksAt,active,mirror,contain?'contain':'cover',[target],()=>action('punch'));
 useEffect(()=>{if(!event)return;const id=setTimeout(()=>setEvent(null),5000);return()=>clearTimeout(id);},[event]);
 const togglePair=()=>{if(pair){cam.stop();setPair(false);return;}cam.pair();setPair(true);fetch('/api/addresses').then(r=>r.json()).then(d=>setAddresses(d.addresses)).catch(()=>setAddresses([]));};
 const url=addresses[address]?`https://${addresses[address]}:${location.port}/?phone&code=${cam.code}`:'';let qr='';if(url&&cam.code){const q=qrcode(0,'M');q.addData(url);q.make();qr=q.createSvgTag({cellSize:4,margin:2,scalable:true});}
 const resetCounts=()=>{const empty={punch:0,dodge:0,duck:0,special:0,ready:0};countsRef.current=empty;setCounts(empty);setEvent(null);pose.calibrate();};
 return <main className="pose-test">
  <video ref={video} autoPlay playsInline muted className={`test-video ${contain?'contain':''} ${mirror?'mirror':''}`}/><div className="test-shade"/><canvas ref={skeleton} className={`test-skeleton ${contain?'contain':''} ${mirror?'mirror':''}`}/>
  <header className="test-header"><div><b>手部碰撞测试</b><small>与游戏使用相同碰撞规则 · 目标 15 帧/秒</small></div><nav><a className="test-return" href="/">返回游戏</a><button onClick={()=>void cam.localStart()}>本机摄像头</button><button onClick={togglePair}>手机直连</button><button onClick={pose.calibrate}>重新校准</button><button onClick={()=>setShowSkeleton(v=>!v)}>{showSkeleton?'骨架开':'骨架关'}</button><button onClick={()=>setContain(v=>!v)}>{contain?'画面完整':'画面填满'}</button><button onClick={()=>setMirror(v=>!v)}>{mirror?'镜像开':'镜像关'}</button><button onClick={resetCounts}>清零并校准</button></nav></header>
  {pair&&<aside className="test-pair"><div><strong>手机直连</strong><button onClick={togglePair}>关闭</button></div>{active?<p>手机已接入。手机横放，拍到肩、手、髋和双脚。</p>:<><p>手机与电脑连接同一网络，用 Safari 扫码。</p>{qr&&<div className="test-qr" dangerouslySetInnerHTML={{__html:qr}}/>}{addresses.length>1&&<select value={address} onChange={e=>setAddress(+e.target.value)}>{addresses.map((ip,i)=><option key={ip} value={i}>{ip}</option>)}</select>}<p>{url&&url.replace(/\?.*/,'')}</p><b className="test-code">{cam.code||'正在申请配对码'}</b></>}<p>{cam.status} {cam.error}</p></aside>}
  <div className="contact-target" aria-label="手部碰撞目标">✦<small>触碰目标</small></div><div className="test-status"><b>{cam.status}</b><span>{pose.status}</span><span>{pose.detail}</span></div>
  <section className={`test-event ${event?'detected':''}`} aria-live="polite">{event?<><span>识别到动作</span><strong key={event.at}>{event.name}</strong><b>第 {event.count} 次</b></>:<><span>等待动作</span><strong>将手移到上方目标</strong><b>碰到目标后移开，可再次命中</b></>}</section>
  <footer className="test-counts">{(['punch','special'] as Action[]).map(a=>[a,names[a]] as [Action,string]).map(([a,name])=><div key={a} className={event?.name===name?'active':''}><span>{name}</span><strong>{counts[a]}</strong></div>)}</footer>
  <p className="test-help">肩、手和髋入镜，把手移动到画面中的目标上；移开后可再次命中。双手举高约 0.7 秒可测试清屏。</p>
 </main>;
}

