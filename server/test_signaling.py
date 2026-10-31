import unittest
from fastapi.testclient import TestClient
from main import app, rooms

class SignalingTests(unittest.TestCase):
    def test_pair_and_relay(self):
        with TestClient(app) as client:
            with client.websocket_connect('/api/host') as host:
                room=host.receive_json()
                self.assertEqual(room['type'], 'room')
                self.assertEqual(len(room['code']), 6)
                with client.websocket_connect('/api/phone/'+room['code']) as phone:
                    self.assertEqual(host.receive_json()['type'], 'joined')
                    phone.send_json({'type':'offer','sdp':{'type':'offer','sdp':'test'}})
                    self.assertEqual(host.receive_json()['type'], 'offer')
                    host.send_json({'type':'answer','sdp':{'type':'answer','sdp':'test'}})
                    self.assertEqual(phone.receive_json()['type'], 'answer')
                self.assertEqual(host.receive_json()['type'], 'left')
        self.assertFalse(rooms)

if __name__=='__main__': unittest.main()
