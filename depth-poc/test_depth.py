import base64, io, unittest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from main import app, MODEL

@unittest.skipUnless(MODEL.exists(), '需要先下载深度模型')
class DepthServiceTests(unittest.TestCase):
    def test_local_inference_and_rejection_of_remote_peer(self):
        image=np.zeros((180,320,3),dtype=np.uint8)
        image[:,:,0]=np.arange(320,dtype=np.uint16)[None,:]%256
        image[:,100:220,1]=180
        buf=io.BytesIO();Image.fromarray(image).save(buf,format='JPEG')
        payload={'image':'data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode('ascii')}
        with TestClient(app) as client:
            remote=client.post('/depth/frame',headers={'x-forwarded-for':'192.168.1.10'},json=payload).json()
            self.assertFalse(remote['ok'])
            forged=client.post('/depth/frame',headers={'x-forwarded-for':'127.0.0.1, 192.168.1.10'},json=payload).json()
            self.assertFalse(forged['ok'])
            local=client.post('/depth/frame',headers={'x-forwarded-for':'127.0.0.1'},json=payload).json()
            self.assertTrue(local['ok'],local)
            self.assertGreater(local['inferenceMs'],0)
            png=base64.b64decode(local['depth'].split(',',1)[1]);out=Image.open(io.BytesIO(png))
            self.assertEqual(out.size,(256,144))
            self.assertGreater(int(np.ptp(np.asarray(out))),5)

if __name__=='__main__':unittest.main()


