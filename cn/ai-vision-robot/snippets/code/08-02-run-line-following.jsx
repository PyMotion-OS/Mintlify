// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const runLineFollowing = {
  title: "run_line_following.py",
  code: `import time

import pymotion as pm

from differential_drive import vw_to_rpm   # 吸收 2.4，V/W 换成左右轮 RPM
from line_control import PATTERN_NAMES, line_tracker_to_vw  # 吸收 3.5 的五路分类、转向和名称
from obstacle_policy import OBSTACLE_NAMES, ultrasonic_to_vw  # 吸收 3.5 的超声波保护


# --- 本页可调整的参数 ---
V = 60                                     # 基础前进速度，毫米/秒
K = 25                                     # 转弯增益，每一格偏差增加 25 度/秒的 W


# 在 0.3 秒内收齐两种未过期事件，再返回五路和超声波读数
def receive_sensors(data_queue):
    """在 0.3 秒内收齐两种未过期事件，再返回五路和超声波读数。"""
    tracker_event, ultrasonic_event = None, None
    end_time = time.monotonic() + 0.3                       # 演化 3.5：一种数据持续到达时，也不能无限等待另一种
    while tracker_event is None or ultrasonic_event is None:
        remaining_time = end_time - time.monotonic()
        if remaining_time <= 0:
            return None, None
        sensor_data = data_queue.read(timeout=remaining_time)  # 最多等到本轮收集截止，不改变 medium 的刷新频率
        if sensor_data is None:
            return None, None                               # 缺一种数据，本轮不产生运动
        if sensor_data.source == "line_tracker":
            tracker_event = sensor_data
        elif sensor_data.source == "ultrasonic":
            ultrasonic_event = sensor_data
    # 沿用 2.3 的 received_monotonic；较早收到的事件超过 0.3 秒，两种读数都不用于本轮运动
    if time.monotonic() - min(tracker_event.received_monotonic, ultrasonic_event.received_monotonic) > 0.3:
        return None, None
    return tracker_event.data, ultrasonic_event.data


# 依次进行循迹、避障和差速计算，丢线时发送双轮 0 并结束
def run(data_queue, commands):
    """依次进行循迹、避障和差速计算，丢线时发送双轮 0 并结束。"""
    last_motion = None

    while True:                                             # 条件一直为真，所以持续进行安全循迹
        # 第一步：沿用 3.5 收集两种读数，本页再检查收集截止和事件存放时间
        tracker_line_data, ultrasonic_data = receive_sensors(data_queue)
        if tracker_line_data is None or ultrasonic_data is None:
            v, w, pattern_type, obstacle_state = 0, 0, "waiting", "waiting"
            distance_text = "未收到"
        else:
            # 第二步：调用 3.3 的函数，把五路状态换成 V、W 和图案分类
            v, w, pattern_type = line_tracker_to_vw(tracker_line_data.is_detected, V, K)
            # 调用 3.5 的函数，根据距离保持、减半或归零 V/W；距离阈值在 obstacle_policy.py
            v, w, obstacle_state = ultrasonic_to_vw(ultrasonic_data, v, w)
            distance_text = "无回波"
            if ultrasonic_data.distance is not None:        # 有具体距离时显示数值和毫米单位
                distance_text = f"{ultrasonic_data.distance} mm"

        # 第三步：最终 V/W 换成双轮 RPM；正常停止发送零速，退出时由实时会话停止输出
        left_rpm, right_rpm = vw_to_rpm(v, w)               # 调用 2.4 的函数，得到左右主动轮转速
        # medium 约 0.1 秒更新一次；0.35 秒留有余量，断流时旧命令会先自动失效
        commands.motor_speeds.write({3: left_rpm, 4: right_rpm}, valid_for=0.35)  # M3 左轮、M4 右轮

        current_motion = (pattern_type, obstacle_state, left_rpm, right_rpm)
        if current_motion != last_motion:                   # 状态或双轮转速变化时才打印
            print(
                f"分类: {PATTERN_NAMES[pattern_type]}  "
                f"避障: {OBSTACLE_NAMES[obstacle_state]}  距离: {distance_text}\\n"
                f"左主动轮: {left_rpm} RPM  右主动轮: {right_rpm} RPM"
            )
            last_motion = current_motion

        if pattern_type == "lost":                          # 已经发送双轮 0，return 结束 run() 并依次退出三个 with
            print("结果: 丢失循迹线，程序结束")
            return


def main():
    """在树莓派通过 USB 运行 3.5 的安全循迹任务。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():                           # 发送主动轮目标前取得控制权
                # 打开实时控制会话
                with robot.realtime.open(data_sources=("line_tracker", "ultrasonic"), command_targets={"motor_speeds": (3, 4)}, frequency="medium", data_queue_size=8) as session:
                    run(session.data, session.commands)
    except KeyboardInterrupt:
        print("结果: Ctrl+C 主动停机")
    except pm.lite.LiteError as exc:
        print(f"出错: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def receive_sensors(data_queue):", from: 16, to: 34, defaultOpen: false },
    { label: "def run(data_queue, commands):", from: 38, to: 73, defaultOpen: false },
  ],
}
