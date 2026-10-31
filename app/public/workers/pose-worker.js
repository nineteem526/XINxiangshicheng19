self.exports={};
importScripts('/vendor/vision_bundle.js');
const {FilesetResolver,PoseLandmarker}=self.exports;
const scope=self;
let model=null;

scope.onmessage=async event=>{
 const msg=event.data;
 if(msg.type==='init'){
  try{
   const files=await FilesetResolver.forVisionTasks('/wasm');
   model=await PoseLandmarker.createFromOptions(files,{canvas:new OffscreenCanvas(1,1),baseOptions:{modelAssetPath:'/models/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55,outputSegmentationMasks:false});
   scope.postMessage({type:'ready'});
  }catch(error){scope.postMessage({type:'error',message:error.message});}
  return;
 }
 const {bitmap,timestamp}=msg;
 try{
  if(!model)throw new Error('姿态模型尚未加载');
  model.detectForVideo(bitmap,timestamp,result=>{
   const points=result.landmarks[0]??null;
   scope.postMessage({type:'result',timestamp,points});
  });
 }catch(error){scope.postMessage({type:'error',message:error.message});}
 finally{bitmap.close();}
};
