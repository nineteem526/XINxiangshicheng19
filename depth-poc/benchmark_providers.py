import time,statistics
import numpy as np
import onnxruntime as ort
from pathlib import Path
path=str(Path(__file__).parent/'models'/'depth-anything-v2-small-int8.onnx')
print('available providers:',ort.get_available_providers(),flush=True)
rng=np.random.default_rng(4);tensor=rng.random((1,3,182,322),dtype=np.float32)
providers=[('CPU',['CPUExecutionProvider'])]
if 'DmlExecutionProvider' in ort.get_available_providers():providers.append(('DirectML',['DmlExecutionProvider','CPUExecutionProvider']))
for name,eps in providers:
 try:
  options=ort.SessionOptions();options.intra_op_num_threads=4;options.enable_mem_pattern=False;options.execution_mode=ort.ExecutionMode.ORT_SEQUENTIAL
  start=time.perf_counter();session=ort.InferenceSession(path,sess_options=options,providers=eps);print(name,'session providers',session.get_providers(),'initialization sec',round(time.perf_counter()-start,2),flush=True)
  session.run(None,{session.get_inputs()[0].name:tensor});times=[]
  for i in range(8):
   start=time.perf_counter();session.run(None,{session.get_inputs()[0].name:tensor});times.append((time.perf_counter()-start)*1000)
  print(name,'median ms',round(statistics.median(times),1),'range',round(min(times),1),'-',round(max(times),1),flush=True)
 except Exception as e:print(name,'FAILED',str(e)[:500],flush=True)
