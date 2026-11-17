// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const sensorDecision = {
  title: "sensor_decision.py",
  code: `import time

import pymotion as pm

from differential_drive import vw_to_rpm   # 吸收 2.4 的差速函数
from line_control import line_tracker_to_vw  # 吸收 3.3 的五路分类与转向
from obstacle_policy import ultrasonic_to_vw  # 吸收 3.5 的超声波保护


# --- 本页可调整的参数 ---
V = 60                                     # 循迹基础前进速度，单位毫米/秒
K = 25                                     # 每格五路偏差对应的转向速度，单位度/秒


# 先检查循迹意图和测距输入，再由超声波保持、减半或归零 V/W
def decide_motion(line_motion, ultrasonic_data):
    """先检查循迹意图和测距输入，再由超声波保持、减半或归零 V/W。"""
    v, w, line_state = line_motion
    if line_state != "line":
        return 0, 0, line_state                             # 丢线、等待或任务暂停时，测距正常也不能放行
    if ultrasonic_data is None:
        return 0, 0, "distance_waiting"                     # 没收到测距或测距过期时停止
    return ultrasonic_to_vw(ultrasonic_data, v, w)          # 复用 15 的 no_echo、无效、减速与停止规则


# 独立更新两种事件，计算最终策略，并按0.1秒节拍下发双轮目标
def run(data_queue, commands):
    """独立更新两种事件，计算最终策略，并按0.1秒节拍下发双轮目标。"""
    tracker_event, ultrasonic_event = None, None
    next_send_at = time.monotonic()
    last_motion = None
    while True:
        # 第一步：沿用 2.3，按来源保存完整事件；两种传感器分别更新
        sensor_data = data_queue.read(timeout=0.5)          # 有数据即返回；断流最多等0.5秒，旧命令先在0.35秒后失效
        if sensor_data is not None and sensor_data.source == "line_tracker":
            tracker_event = sensor_data
        elif sensor_data is not None and sensor_data.source == "ultrasonic":
            ultrasonic_event = sensor_data

        # 第二步：先检查事件存放时间，再调用已有算法生成循迹意图
        now = time.monotonic()
        line_motion = (0, 0, "line_waiting")
        if tracker_event is not None and now - tracker_event.received_monotonic <= 0.3:
            line_motion = line_tracker_to_vw(tracker_event.data.is_detected, V, K)
        ultrasonic_data = None
        if ultrasonic_event is not None and now - ultrasonic_event.received_monotonic <= 0.3:
            ultrasonic_data = ultrasonic_event.data         # 过期事件不传给保护策略，不使用上一次有效距离

        # 第三步：把两种输入交给上面的抽象函数，返回的就是唯一允许执行的 V/W
        v, w, reason = decide_motion(line_motion, ultrasonic_data)
        left_rpm, right_rpm = vw_to_rpm(v, w)

        # 第四步：感知只更新目标；沿用 14 的 0.1 秒节拍，普通停止仍发送零速
        if now >= next_send_at:
            commands.motor_speeds.write({3: left_rpm, 4: right_rpm}, valid_for=0.35)  # M3左轮、M4右轮，刷新中断后旧命令自动失效
            next_send_at = now + 0.1
        motion = (reason, left_rpm, right_rpm)
        if motion != last_motion:
            print(f"策略: {reason}  V: {v} mm/s  W: {w} °/s  左轮: {left_rpm} RPM  右轮: {right_rpm} RPM")
            last_motion = motion


def main():
    """连接真实传感器，取得控制权后运行多源运动决策。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():
                # 打开实时控制会话
                with robot.realtime.open(data_sources=("line_tracker", "ultrasonic"), command_targets={"motor_speeds": (3, 4)}, frequency="medium", data_queue_size=8) as session:
                    run(session.data, session.commands)     # 接收并执行策略；medium约10Hz更新，run按0.1秒刷新目标
    except KeyboardInterrupt:
        print("结果: Ctrl+C 主动停机")
    except (ValueError, pm.lite.LiteError) as exc:
        print(f"出错: {exc}")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def decide_motion(line_motion, ultrasonic_data):", from: 16, to: 23, defaultOpen: false },
    { label: "def run(data_queue, commands):", from: 27, to: 60, defaultOpen: false },
  ],
}
