"""Local WebRTC rendezvous; video remains peer-to-peer."""
import asyncio
import secrets
import socket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()
rooms: dict[str, dict] = {}

@app.get('/api/addresses')
def addresses():
    found = set()
    for item in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
        ip = item[4][0]
        if not ip.startswith('127.'):
            found.add(ip)
    return {'addresses': sorted(found, key=lambda ip: (not ip.startswith('192.168.137.'), ip))}

@app.websocket('/api/host')
async def host(ws: WebSocket):
    await ws.accept()
    code = f'{secrets.randbelow(1000000):06d}'
    while code in rooms:
        code = f'{secrets.randbelow(1000000):06d}'
    room = {'host': ws, 'phone': None, 'lock': asyncio.Lock()}
    rooms[code] = room
    try:
        await ws.send_json({'type': 'room', 'code': code})
        while True:
            data = await ws.receive_json()
            phone = room['phone']
            if phone and data.get('type') in ('answer', 'ice'):
                await phone.send_json(data)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        rooms.pop(code, None)
        if room['phone']:
            try: await room['phone'].close(code=1000)
            except RuntimeError: pass

@app.websocket('/api/phone/{code}')
async def phone(ws: WebSocket, code: str):
    room = rooms.get(code)
    if not room:
        await ws.close(code=4404)
        return
    async with room['lock']:
        if room['phone']:
            await ws.close(code=4409)
            return
        await ws.accept()
        room['phone'] = ws
    try:
        await room['host'].send_json({'type':'joined'})
        while True:
            data = await ws.receive_json()
            if data.get('type') in ('offer', 'ice'):
                await room['host'].send_json(data)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        room['phone'] = None
        try: await room['host'].send_json({'type':'left'})
        except RuntimeError: pass

# Only the local desktop can initiate paid vision requests through the Vite proxy.
from ipaddress import ip_address
from pathlib import Path
from fastapi import Request
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from scan import create_world
load_dotenv(Path(__file__).with_name('.env'))

class ScanRequest(BaseModel):
    image: str = Field(max_length=2_500_000)

@app.post('/api/scan')
async def scan_object(request: Request, body: ScanRequest):
    forwarded=request.headers.get('x-forwarded-for','').split(',')[0].strip()
    peer=forwarded or (request.client.host if request.client else '')
    try:
        if not ip_address(peer).is_loopback:
            return {'ok':False,'error':'仅电脑端可以发起扫描'}
    except ValueError:
        return {'ok':False,'error':'无法确认请求来源'}
    try:
        brief=await create_world(body.image)
        return {'ok':True,'world':brief.model_dump()}
    except ValueError as exc:
        return {'ok':False,'error':str(exc)}
    except Exception:
        return {'ok':False,'error':'模型调用失败或返回数据无效，请使用本地预设'}
