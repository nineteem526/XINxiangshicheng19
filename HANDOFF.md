# RealityGlitch 2.0 交接说明

更新：2026-10-31（北京时间）。本文件供无法查看之前聊天记录的接手者使用。

## 重要更新：三线宝石玩法已开始实现（2026-10-31）

正式首页现为三线挑战，旧单 Boss 页面在 `?boss-classic`。怪物沿三条隐形路线接近并放大，根据人物髋部在画面的实时位置选择路线并有标记，可调整路线的上下、左右、间距和视觉景深，挥拳攻击当前线进入范围的怪物；宝石同色三颗自动消除，5 次获胜；3 命、90 秒、8 格满失败。`app/src/LaneGame.tsx`、`app/src/LaneMonsters.tsx`、`app/src/game/laneRun.ts` 是主要新文件。新玩法不再用 dodge 切换路线，人体不见时保留上一次路线；镜像、路线调整和人体位置需要真人测试。五种颜色目前共用一个模型或占位物，宝石也是图形占位；正式资产路径尚待用户提供。模拟摄像头及键盘已走通一次三消，真实手机和性能尚未验证。以下单 Boss 描述是旧模式背景，若冲突以本更新为准。

## 先确认目录

用户给出的目录是 `C:\Users\a\Desktop\RealityGlitch2`，但本次正在运行、最近开发和测试的项目实际位于 **`C:\Users\a\Desktop\RealityGlitch2-fresh`**。不要误在前者继续开发。本说明在两个目录各放一份，内容相同。实际开发仓库当前分支 `depth-scene-poc`，最新提交 `e54227e`（2026-10-31）；交接文档本身不一定已提交。开始工作先检查 `git status`。

用户表示主办方希望代码尽量新建、不复用旧项目，所有 commit 都要是当天的；具体赛事规则仍需用户向主办方确认。fresh 是独立仓库，应用代码为本次重写，React、Three.js、MediaPipe 及模型/WASM 是第三方依赖，不能声称全部原创。不要伪造提交日期。

## 目标与已定方案

制作一款现场展示用的 3D 体感战斗游戏。固定横放 iPhone 拍摄真实场景，通过 Wi-Fi/WebRTC 传到电脑；电脑显示实时摄像画面，叠加 3D 怪物并识别玩家动作。队友用 Tripo Pro 制作资产。

用户已决定：**直接使用现实视频背景，不对现实场景做实时 3D 重建，也不需要人体遮挡/人体分割功能**。旧深度实验保留作历史原型，不是正式路线，不要默认重新启用。玩家和怪物在画面中对峙，怪物位置可手动调整；画面跟踪和脚部估计是二维近似，不是真实 3D 空间定位。

## 当前实现

- 正式页支持手机直连、本机摄像头、姿态骨架显示、校准、镜像、画面比例、怪物放置和本地 GLB 导入。刷新后需重新选择 GLB。
- MediaPipe 姿态识别：挥拳、侧身闪避（左右已合并）、下蹲、双手举高、准备姿势。用户曾真人测试并认为基本可用；不要无故改已调好的举手/准备姿势。战斗中动作和闪避仍需要真人复测。
- Boss 攻击有冲击波与横扫：分别侧身、下蹲闪避；75 秒战斗，能量满且 Boss 血量不高于 35% 时双手举高终结；有结算统计。
- 姿态推理优先后台 Worker，单帧缩放、限频，失败时自动退回主线程兼容模式，不启用分割。用户之前反馈多个顶部按钮点击卡死；模拟摄像头测试中多按钮可响应，但实际 iPhone、现场性能及动作准确性尚未复验，不能宣称完全修复。
- 构建与测试上次通过：前端 22 项测试、生产构建；模拟摄像头验证后台姿态模型就绪并测试顶部按钮。真人手机验证仍需用户协助。

## 已有 Boss 资产

`C:\Users\a\xwechat_files\wxid_0usevhq45d9722_06e0\msg\file\2026-10\lava golem 3d model.glb`

Tripo 导出，约 62.6 MiB，约 193 万三角面；贴图内嵌，1 个网格、3 张贴图，没有骨骼、没有动画。已在独立模拟摄像头测试页成功导入并显示，但未验证真实手机连接时的性能。资产路径在微信缓存目录，可能被清理；按用户意愿保存到合适目录。许可与赛事使用规则由用户确认。

当前加载器支持自包含 GLB（上限 100 MiB、无外部引用），支持调整位置/大小/朝向，无法播放模型内动画；当前仅有程序化的整体晃动和受击缩放。原图模型不适合直接认定为现场性能达标。

用户希望 Boss 动起来。建议队友优先交：低面数优化版 + 骨骼绑定 + 至少 `Idle`、`Attack` 两段动画，有时间增加 `Hit`、`Death`；最终单个自包含带贴图/骨骼/动画的 GLB。自动绑定不一定适合粗壮的巨人，需要验证、可能手工修权重。开发侧再接入 Three.js AnimationMixer，按待机、攻击预警、受击和死亡事件切换动作；攻击动作与现有判定时间同步。用户也接受先做模型整体蓄力/后退等程序动画，但不要称其为骨骼动画。以上动画工作尚未完成。

## 路径与运行

实际工作目录 `C:\Users\a\Desktop\RealityGlitch2-fresh`，需要 Node.js 20+、Python 3.11+、Chrome/Edge。两个 PowerShell 终端：

```powershell
cd C:\Users\a\Desktop\RealityGlitch2-fresh\server
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8012
```

```powershell
cd C:\Users\a\Desktop\RealityGlitch2-fresh\app
npm ci
npm run dev
```

电脑打开 https://localhost:5174/ ，点击“手机直连”；iPhone 与电脑同网，扫码、由用户接受自签名证书、允许摄像头权限，手机横放固定，全身及脚尽量入镜，站直后重新校准。动作测试页 https://localhost:5174/?pose-test 。若端口被占用，先检查现有进程，避免擅自结束用户工作。

核心文件：`app/src/main.tsx`（游戏页面），`app/src/Arena.tsx`（3D 场景），`app/src/game/bossAsset.ts`（GLB 载入），`app/src/game/combat.ts`（战斗），`app/src/vision/actions.ts`（动作判定），`app/src/vision/usePoseWorker.ts` 和 `app/public/workers/pose-worker.js`（后台识别），`app/src/vision/usePoseMain.ts`（兼容模式），`app/src/PoseTest.tsx`（动作测试），`app/src/camera.tsx` 或相应 camera 源文件（手机摄像头连接），`server/`（信令/扫描服务）。项目内 `README.md` 有更多启动和环境说明。

`npm ci` 的 postinstall 会从已安装的 MediaPipe 包生成 `app/public/wasm/` 与 `app/public/vendor/`，这些生成文件被忽略且不会随 Git 提交；缺少时重新安装依赖或运行 `node app/scripts/prepare-assets.mjs`。不要将第三方生成文件冒充原创代码。

前端检查：`cd app; npm test; npm run build`；后端：在项目根目录执行 `python -m unittest discover -s server`。可选的物品扫描会把单帧发给配置的视觉模型服务，环境变量在 `server/.env`；不要读取或泄露密钥，勿宣称联网服务已经实测。

## 建议下一步

1. 在正式页连接用户 iPhone，复测按钮响应、姿态识别和怪物攻击/闪避；确认现场卡顿是否仍出现。
2. 队友优化熔岩巨人并提供带动画 GLB，同时开发端可按用户意愿先增强占位模型的程序化动作。
3. 拿到动画资产后，检查文件结构、接入动画播放与战斗状态同步；对低面数模型做真实设备性能测试。
