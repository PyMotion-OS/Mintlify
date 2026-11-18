// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const safeLineFollowing = {
  title: "safe_line_following.py",
  code: `import time
import pymotion as pm

from differential_drive import drive               # 复用 2.4 产出的差速封装
from line_control import PATTERN_NAMES, line_tracker_to_vw  # 引用 3.3 的循迹分类与运动计算
from obstacle_policy import OBSTACLE_NAMES, ultrasonic_to_vw  # 引用避障名称和距离策略


# --- 本页可调整的参数 ---
V = 80                                     # 基础前进速度，毫米/秒
K = 25                                     # 转弯增益，每一格偏差增加 25 度/秒的 W

# --- 共用配置（一般不用动）---
PORT_LEFT, PORT_RIGHT = 3, 4               # 左轮接 M3，右轮接 M4

# 事件超过 0.5 秒没更新，就当作这一路没收到
def fresh_data(event, max_age=0.5):
    """事件未过期就返回其中的数据；没有事件或已过期时返回 None。"""
    if event is None:                                       # 这一路还没收到过任何数据
        return None
    if time.monotonic() - event.received_monotonic > max_age:
        return None                                         # 太久了，不能再用这个旧值
    return event.data


# 依次进行循迹、避障和差速计算，丢线时发送双轮 0 并结束
def run(data_queue, commands):
    """依次进行循迹、避障和差速计算，丢线时发送双轮 0 并结束。"""
    last_motion = None
    tracker_event, ultrasonic_event = None, None            # 两路各自保存最近一条事件

    while True:                                             # 条件一直为真，所以持续进行安全循迹
        # 每轮只取一条事件，按来源更新对应那一路；两路互不等待，一路坏了另一路照常工作
        sensor_data = data_queue.read(timeout=1.0)
        if sensor_data is not None and sensor_data.source == "line_tracker":
            tracker_event = sensor_data
        elif sensor_data is not None and sensor_data.source == "ultrasonic":
            ultrasonic_event = sensor_data

        # 两路各自检查新鲜度：超过 0.5 秒没更新，就当作这一路没收到
        tracker_line_data = fresh_data(tracker_event)
        ultrasonic_data = fresh_data(ultrasonic_event)

        if tracker_line_data is None or ultrasonic_data is None:
            v, w, pattern_type, obstacle_state = 0, 0, "waiting", "waiting"
            distance_text = "未收到"
        else:
            # 第一步：调用 3.3 的函数，把五路状态换成 V、W 和图案分类
            v, w, pattern_type = line_tracker_to_vw(tracker_line_data.is_detected, V, K)
            # 第二步：使用 3.1 的规则，根据距离保持、减半或归零 V/W
            v, w, obstacle_state = ultrasonic_to_vw(ultrasonic_data, v, w)
            distance_text = "无回波"
            if ultrasonic_data.distance is not None:        # 有具体距离时显示数值和毫米单位
                distance_text = f"{ultrasonic_data.distance} mm"

        # 第三步：调用 2.4 的差速函数，把最终 V/W 换成左右轮转速并发送
        left_rpm, right_rpm = drive(commands, v, w)

        current_motion = (pattern_type, obstacle_state, left_rpm, right_rpm)
        if current_motion != last_motion:                   # 状态或双轮转速变化时才打印
            print(
                f"分类: {PATTERN_NAMES[pattern_type]}  "
                f"避障: {OBSTACLE_NAMES[obstacle_state]}  距离: {distance_text}\\n"
                f"左轮: {left_rpm} RPM  右轮: {right_rpm} RPM"
            )
            last_motion = current_motion

        if pattern_type == "lost":                          # 前面已经发送双轮 0，结束 run() 后三个 with 会依次退出
            print("丢失循迹线，程序结束")
            return


def main():
    """连接机器人，结合五路循迹和超声波避障控制双轮。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():
                # 打开实时控制会话，同时收五路和超声波数据
                with robot.realtime.open(data_sources=("line_tracker", "ultrasonic"), command_targets={"motor_speeds": (PORT_LEFT, PORT_RIGHT)}) as session:
                    run(session.data, session.commands)
    except KeyboardInterrupt:
        print("Ctrl+C 主动停机")
    except pm.lite.LiteError as exc:
        print(f"出错: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def fresh_data(event, max_age=0.5):", from: 17, to: 23, defaultOpen: false },
    { label: "def run(data_queue, commands):", from: 27, to: 71, defaultOpen: false },
  ],
}
