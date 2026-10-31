"""Local-only depth prototype; never uploads frames to an external service."""
import asyncio
import base64
import io
import os
import time
from pathlib import Path
import numpy as np
import onnxruntime as ort
from PIL import Image
from fastapi import FastAPI, Request
from pydantic import BaseModel, Field

MODEL=Path(__file__).parent/'models'/'depth-anything-v2-small-int8.onnx'
app=FastAPI()
session=None
load_error=None
inference_lock=asyncio.Lock()

@app.on_event('startup')
def load_model():
    global session, load_error
    try:
        options=ort.SessionOptions(); options.intra_op_num_threads=max(1,min(4,os.cpu_count() or 2));options.graph_optimization_level=ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        session=ort.InferenceSession(str(MODEL),sess_options=options,providers=['CPUExecutionProvider'])
    except Exception as exc: load_error=str(exc)

@app.get('/depth/status')
def status():
    return {'ready':session is not None,'provider':'CPUExecutionProvider','error':load_error if session is None else None}

class DepthRequest(BaseModel):
    image:str=Field(max_length=1_200_000)

def infer(image_url:str):
    if session is None: raise RuntimeError('深度模型未就绪')
    if not image_url.startswith('data:image/jpeg;base64,'): raise ValueError('图片格式无效')
    data=base64.b64decode(image_url.split(',',1)[1],validate=True)
    if len(data)>850_000: raise ValueError('图片过大')
    image=Image.open(io.BytesIO(data)).convert('RGB')
    # Dimensions are divisible by 14. Smaller inputs make an explicit speed/quality tradeoff.
    resized=image.resize((322,182),Image.Resampling.BICUBIC)
    rgb=np.asarray(resized,dtype=np.float32)/255.0
    rgb=(rgb-np.array([.485,.456,.406],np.float32))/np.array([.229,.224,.225],np.float32)
    tensor=np.transpose(rgb,(2,0,1))[None].astype(np.float32)
    start=time.perf_counter(); out=session.run(None,{session.get_inputs()[0].name:tensor})[0]; elapsed=(time.perf_counter()-start)*1000
    depth=np.squeeze(out).astype(np.float32);low,high=np.percentile(depth,[2,98]); depth=np.clip((depth-low)/max(float(high-low),1e-6),0,1)
    result=Image.fromarray((depth*255).astype(np.uint8),mode='L').resize((256,144),Image.Resampling.BILINEAR)
    buf=io.BytesIO();result.save(buf,format='PNG',optimize=False)
    return {'depth':'data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode('ascii'),'inferenceMs':round(elapsed,1),'inputWidth':322,'inputHeight':182}

@app.post('/depth/frame')
async def frame(request:Request,body:DepthRequest):
    # The listener is loopback-only. The Vite proxy supplies the actual peer address.
    from ipaddress import ip_address
    peer=request.headers.get('x-forwarded-for','').split(',')[-1].strip() or (request.client.host if request.client else '')
    try:
        if not ip_address(peer).is_loopback:return {'ok':False,'error':'仅允许本机请求'}
    except ValueError:return {'ok':False,'error':'无法确认请求来源'}
    try:
        async with inference_lock: result=await asyncio.to_thread(infer,body.image)
        return {'ok':True,**result}
    except Exception as exc:return {'ok':False,'error':str(exc)[:200]}

