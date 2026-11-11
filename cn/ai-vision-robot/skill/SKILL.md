# PyMotion Robot · SKILL

这是一份写给 AI 工具（Claude Code、Cursor 等）看的产品说明书。把本文件交给 AI，AI 就能理解这台 Robot 怎么连、每个例程怎么跑、参数什么含义，进而帮你完成环境配置、修改例程、解释代码。

> 用法：把本 SKILL 全文放进 AI 工具的上下文（或保存为 `.md` 文件交给 AI）。

## 产品定位

AI Vision Robot 是一台面向编程教学的视觉小车，是 PyMotion Lite 控制器的生态产品。车上有两块板：

- **PyMotion Lite 控制器**：管电机、舵机、传感器，电脑通过 **Wi-Fi** 或 USB 连接它
- **树莓派**：管摄像头视觉与 AI 算力（模块 8 才上车，前期不涉及）

Python 侧通过 `pymotion` SDK 的 `lite` 接口与 Robot 通信。Robot 手册默认读者已经完成环境配置，从 `hello_robot.py` 开始，每页只教一件事。

## 环境配置（引用基础手册，不重复）

**AI 配环境时，不要自己编步骤，去查 PyMotion Lite 使用手册（基础手册）的对应章节**：

| 要做的事 | 看哪个章节 | 要点 |
| --- | --- | --- |
| 装 SDK、装 VS Code、验证环境 | Lite 手册 2.1 安装开发环境 | Windows 用 `install.bat`，Ubuntu 用 `setup-ubuntu.sh`；都是 ZIP 完整解压、本地 wheel 离线安装 |
| 配网（AP 配网 + Token） | Lite 手册 2.1.5 | 连接 `PyMotion-Lite-XXXX` 热点 → `http://192.168.4.1:8787/wifi/setup` 填 Wi-Fi 名/密码/服务地址/Token |
| 查设备、连设备 | Lite 手册 2.2 发现与连接 | `pm.lite.list_devices()` 扫描；`pm.lite.connect()` 连接 |
| 跑通第一个例程 | Lite 手册 2.3 简单例程运行 | 先 `pymotion doctor --offline` 再跑 `01-pymotion-lite.py` |

基础手册章节路径（以部署后的 URL 为准）：

- `.../cn/py-motion-lite/2/01-development-environment`
- `.../cn/py-motion-lite/2/02-discovery-and-connection`
- `.../cn/py-motion-lite/2/03-run-simple-examples`

**Token 是必填的**：USB 和 Wi-Fi 都需要 Token 认证，缺失或不匹配抛 `AuthenticationError`。优先用环境变量 `PYMOTION_AUTH_TOKEN`，或 `connect(auth_token=...)` 传入。默认 Token 是 `123456`，建议首次配置时改掉。

## 连接方式（Robot 手册的关键区别）

**Robot 手册全程用 `transport="wifi"`**，这和 Lite 手册默认的 `"usb"` 不同。AI 帮用户写 Robot 例程时，默认用 Wi-Fi：

```python
import pymotion as pm

# Robot 手册：连接用 wifi；with 块结束自动断开
with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
    print(f"设备  ID: {robot.connection.device_id}")
    print(f"传输方式: {robot.connection.transport}")
```

- `transport`：Robot 手册用 `"wifi"`；树莓派上车后（模块 8）用 `"usb"`
- `timeout`：连接最长等待时间（秒），局域网 10～20 秒足够
- `robot.connection.device_id`：12 位设备 ID，每台唯一
- `robot.connection.transport`：本次实际使用的连接方式

**写代码时的约定**（Robot 手册规范，AI 照着做）：

- 1.1 首次讲解时用常量 `TRANSPORT = "wifi"`、`TIMEOUT = 15.0`；1.2 起直接内联 `connect(transport="wifi", timeout=15.0)`，不写常量
- 不写 `data_queue.read(timeout=...)` 之外的多余默认参数（如 `max_age`）

## 例程清单（模块一）

模块一是「Robot 与 Python 基础」，7 个例程，每个学一个 Python 概念 + 一个 Robot 能力：

| 例程 | 主题 | 学到的 Python | 学到的 Robot 能力 |
| --- | --- | --- | --- |
| 1.1 | WIFI 模式连接 | `import`、`with`、`print`、`try/except` | `connect()`、读设备 ID 和传输方式 |
| 1.2 | 超声波测距 | 变量、`if/elif/else` 判断 | `robot.ultrasonic()` 读前方距离 |
| 1.3 | 循迹与循环 | `for` 循环、`list`、`time.sleep` | 五路循迹传感器持续采样 |
| 1.4 | 电压与函数 | `def` 自定义函数 | `robot.battery()` 读电池电压 |
| 1.5 | 状态与异常清理 | `try/except/finally` | 读设备状态包 |
| 1.6 | 电机与类 | `class`、`with` 上下文管理器 | 电机前进、后退，进出自动停机 |
| 1.7 | 双舵机与计时 | `time.monotonic()` 计时 | PWM 舵机转到指定角度 |

**每个例程的完整代码**：AI 需要具体例程代码时，去查 Robot 手册对应页面（`.../cn/ai-vision-robot/01-python-basics/0X-.../index`），以页面里的 `hello_robot.py` / `check_distance.py` 等完整示例为准，不要凭记忆编。

## 安全约定

- AI 动手前应先说明要做什么；动作类命令（连接、控制电机/舵机、修改例程）需用户确认后再执行
- 控制电机/舵机前，确认周围无障碍、机器人不会冲出去伤人损物
- 不要把真实 Token 写进要分享的示例、截图或公开仓库
