# 深度场景对比原型

独立实验，正式战斗页仍为原入口。它将实时视频贴在由相对深度驱动的 Three.js 位移网格上，属于近似 2.5D 效果，并非真实地面扫描、完整三维重建或物理深度。人体动作与遮挡继续运行在浏览器。视频帧只发送到本机 127.0.0.1:8013 处理，不发送线上模型。

模型：Depth Anything V2 Small 的 ONNX 量化版本，Apache-2.0，来源 https://huggingface.co/onnx-community/depth-anything-v2-small ，文件版本 f7421df0cc30f121782ab050d42f0a423291dcde，SHA-256 fcf51f1b230362b28690bb9d1809bf0431f29cad20534e3f589bd7285547f20d。模型文件不提交 Git，必须自行下载并校验。

Windows 启动：在该目录运行 `powershell -ExecutionPolicy Bypass -File .\get-model.ps1`，安装 `python -m pip install -r requirements.txt`，再运行 `python -m uvicorn main:app --host 127.0.0.1 --port 8013`。还要按照根目录 README 启动 8012 原有信令服务及 5174 前端；电脑打开 https://localhost:5174/?depth-lab。

“原画面”和“现有 3D 叠加”模式不做深度推理；“实时深度场景”启用本地服务。界面分别显示 CPU 模型推理耗时和端到端请求耗时、浏览器动画回调频率；回调频率不等于帧率、用户动作延迟或经验证的稳定性能。真实手机网络、姿态识别及实际场地需另行测试。模型输入固定缩放到 322×182、相对深度按当前帧归一化并平滑，可能产生闪烁和尺度跳变。实验服务只在本机监听，并对代理请求来源限制为本机。
