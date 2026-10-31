import unittest
from pydantic import ValidationError
from scan import WorldBrief
class WorldBriefTests(unittest.TestCase):
    def test_rejects_unapproved_world_or_extra_fields(self):
        with self.assertRaises(ValidationError):
            WorldBrief.model_validate({'object':'杯子','boss':'杯王','world':'run code','description':'故障世界'})
        with self.assertRaises(ValidationError):
            WorldBrief.model_validate({'object':'杯子','boss':'杯王','world':'lava','description':'故障世界','code':'bad'})
    def test_accepts_bounded_data(self):
        self.assertEqual(WorldBrief.model_validate({'object':'杯子','boss':'杯王','world':'lava','description':'熔岩世界'}).world,'lava')

class ScanAccessTests(unittest.TestCase):
    def test_remote_peer_cannot_initiate_scan(self):
        from fastapi.testclient import TestClient
        from main import app
        with TestClient(app) as client:
            r=client.post('/api/scan',headers={'x-forwarded-for':'192.168.1.20'},json={'image':'data:image/jpeg;base64,YQ=='})
        self.assertEqual(r.json(),{'ok':False,'error':'仅电脑端可以发起扫描'})
