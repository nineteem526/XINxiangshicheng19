# RealityGlitch 2.0

2026-10-31 新建的独立原型，Git 历史不包含旧项目提交。项目应用代码为本次开发重新编写；姿态识别所用 MediaPipe、React、Three.js 等是第三方依赖，模型和 WASM 也是第三方文件，并非本项目原创代码。赛事对第三方依赖、模型及代码生成的具体规则应以主办方规定为准。

## 当前状态

- 手机通过本机信令和 WebRTC 传递画面，视频在设备间传输。
- 实时视频是背景，3D Boss 与场景覆盖在画面上；尚未做人体分割或真实前后遮挡。
- 本地 Pose 模型识别挥拳、侧身、下蹲、双手举高；阈值沿用本次真人初测通过的原型，新的手机链路及整合画面仍需现场复测。
- 两套手选本地预设；扫描物品与 AI 生成世界尚未接入。Boss 和场景是程序化占位，不是最终美术。
- 战斗逻辑本地运行；可用空格、方向键、F 做调试回退。

## 启动

需要 Node.js 20+、Python 3.11+、Chrome 或 Edge。

```powershell
cd server
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8012
```

另开终端：

```powershell
cd app
npm ci
npm run dev
```

电脑访问 https://localhost:5174 。手机连同一 Wi-Fi 或电脑热点，点击手机直连，选择手机可以访问的网络地址，扫码并允许手机摄像头；本地 HTTPS 使用自签名证书，手机需要由使用者自行接受浏览器提示。手机横放、固定并拍到肩、双手和髋，站直点击重新校准。

运行 `cd app; npm test; npm run build`，以及 `python -m unittest discover -s server`。现场网络、识别准确率和性能仍以实测为准。
