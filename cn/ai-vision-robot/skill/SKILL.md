<!-- SKILL 文件（写给 AI 工具的产品说明书）—— 内容初稿，待产品资料到位后由产品/设计者核对补全 -->

# PyMotion Robot · SKILL

这是一份写给 AI 工具（Claude Code、Cursor 等）看的产品说明书。把它交给 AI，AI 就能理解这台 Robot 怎么连、每个例程怎么跑、参数什么含义，进而帮你完成环境配置、修改例程、解释代码。

## 产品定位

PyMotion Robot 是一台面向编程教学的视觉小车。Python 侧通过 `pymotion` SDK 的 `lite` 接口与机器人通信，覆盖连接、传感器读取、电机/舵机控制、视觉与 YOLO 等能力。

## 连接方式

```python
import pymotion as pm

# 1.1 首次讲解用常量形式；1.2 起统一内联
with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
    ...
```

- `transport`：连接方式，本手册全程 `"wifi"`（树莓派场景用 `"usb"`）
- `timeout`：连接最长等待时间，单位秒，局域网内 10～20 秒足够
- `with` 块结束自动断开连接

## 例程清单（模块一）

| 例程 | 主题 | 涉及能力 |
| --- | --- | --- |
| 1.1 | WIFI 模式连接 | `connect()`、设备信息 |
| 1.2 | 超声波测距 | `robot.ultrasonic()`、`if/elif/else` |
| 1.3 | 循迹与循环 | `for`、`list`、`time.sleep` |
| 1.4 | 电压与函数 | `def` 自定义函数 |
| 1.5 | 状态与异常清理 | `try/except/finally` |
| 1.6 | 电机与类 | `class`、`with` 上下文管理器 |
| 1.7 | 双舵机与计时 | PWM 舵机、`time.monotonic()` |

## 安全约定

AI 动手前应先说明要做什么；动作类命令（连接、控制电机/舵机、修改例程）需用户确认后再执行。
