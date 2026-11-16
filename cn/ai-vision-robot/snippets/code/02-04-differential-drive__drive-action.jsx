// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const driveAction = {
  title: "drive_action.py",
  code: `import math
import time

import pymotion as pm

# --- 本例程可调整的参数 ---
ACTION = "spin_left"                         # 动作，名字见下面的 ACTIONS
V = 175                                    # 前进速度，毫米/秒（175 对应直行 50 RPM）
W = 60                                     # 转弯快慢，度/秒（50 对应原地转 20 RPM）

# --- 机器人尺寸 ---
R = 33.75                                  # 轮子半径，毫米（直径 67.5）
D = 160.0                                  # 左右轮间距，毫米

# --- 共用配置（一般不用动）---
PORT_LEFT, PORT_RIGHT = 3, 4               # 左轮 M3、右轮 M4
MAX_RPM = 60                               # 单轮转速上限

ACTIONS = {                                # 动作表：名字 → (前进速度, 转弯快慢)
    "forward": (V, 0),                     # 直行向前
    "backward": (-V, 0),                   # 直行向后
    "forward_left": (V, W),                # 前进同时向左画弧
    "forward_right": (V, -W),              # 前进同时向右画弧
    "spin_left": (0, W),                   # 原地向左转
    "spin_right": (0, -W),                 # 原地向右转
}

def limit_rpm(left, right):
    """同尺度限幅：超过单轮上限就两边一起缩小，弯道形状不变；返回值已取整"""
    fast = max(abs(left), abs(right))                       # 两轮里转得最快的那个
    if fast > MAX_RPM:                                      # 超过上限才需要缩
        scale = MAX_RPM / fast                              # 缩小的比例
        left = left * scale                                 # 左轮按同一比例缩小
        right = right * scale                               # 右轮按同一比例缩小
    return round(left), round(right)                        # 电机只收整数，四舍五入

def vw_to_rpm(v, w):
    """差速映射：前进速度和转弯快慢 → 左右轮的转速（RPM）

    左轮线速度 = 前进速度 - 角速度 × 轮间距 ÷ 2
    右轮线速度 = 前进速度 + 角速度 × 轮间距 ÷ 2
    轮转速 = 轮线速度 × 60 ÷ (2 × π × 轮子半径)
    算完先限幅、再取整，然后返回
    """
    w = math.radians(w)                                     # 重点：度/秒 → 弧度/秒
    c = 2 * math.pi * R                                     # 轮子转一圈走多远，毫米
    left_v = v - w * D / 2                                  # 左轮线速度，毫米/秒
    right_v = v + w * D / 2                                 # 右轮线速度，毫米/秒
    return limit_rpm(left_v * 60 / c, right_v * 60 / c)     # 线速度换成转速，再限幅

def drive(commands, v, w, valid_for=0.35):
    """把前进速度和转弯快慢换算成左右轮转速并写入命令入口，返回两个转速。"""
    # commands 是实时会话的命令入口；v 毫米/秒，w 度/秒，valid_for 是命令有效期
    left, right = vw_to_rpm(v, w)                           # 得到限幅取整后的左右轮转速
    commands.motor_speeds.write(
        {PORT_LEFT: left, PORT_RIGHT: right},               # 设定左右主动轮的目标转速
        valid_for=valid_for,                                # 大于 0.1 秒发送周期；定时发送中断后会自动停机
    )
    return left, right                                      # 主程序继续使用两个转速

def main():
    """选一个动作，算出左右轮转速，运行 1.5 秒后停机。"""
    v, w = ACTIONS[ACTION]

    with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
        with robot.control():
            # 打开实时控制会话
            with robot.realtime.open(command_targets={"motor_speeds": (PORT_LEFT, PORT_RIGHT)}) as session:
                left, right = drive(session.commands, v, w)
                print(f"动作: {ACTION}  左轮: {left} RPM  右轮: {right} RPM")
                time.sleep(1.5)                             # 保持这个动作运行 1.5 秒
                session.commands.motor_speeds.stop()        # 主动停机，不等待命令自己过期

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def limit_rpm(left, right):", from: 28, to: 35, defaultOpen: false },
    { label: "def vw_to_rpm(v, w):", from: 37, to: 49, defaultOpen: false },
    { label: "def drive(commands, v, w, valid_for=0.35):", from: 51, to: 59, defaultOpen: false },
    { label: "def main():", from: 61, to: 72, defaultOpen: true },
  ],
}
