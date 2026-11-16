// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const lineFollowing = {
  title: "line_following.py",
  code: `import pymotion as pm

from differential_drive import vw_to_rpm
from line_control import PATTERN_NAMES, line_tracker_to_vw  # 引用例程15产出的分类和运动计算


# --- 本例程可调整的参数 ---
V = 80                                     # 基础前进速度，毫米/秒
K = 25                                     # 转弯增益，每一格偏差增加 25 度/秒的 W

# --- 共用配置（一般不用动）---
PORT_LEFT, PORT_RIGHT = 3, 4               # 左轮接 M3，右轮接 M4
TRANSPORT = "wifi"                         # Wi-Fi 连接模式
TIMEOUT = 15.0                             # Wi-Fi 连接最大超时时间

# 持续把最新五路数据换成 V/W 和双轮转速，再发送双轮目标
def run(data_queue, commands):
    """持续把最新五路数据换成 V/W 和双轮转速，再发送双轮目标。"""
    last_motion = None

    while True:                                             # 条件一直为真，所以持续进行循迹控制
        # read() 会等待下一条新数据，所以 while 不会一直快速循环；最多等待 1 秒
        sensor_data = data_queue.read(timeout=1.0)
        if sensor_data is None:                             # 1 秒内没有新数据
            v, w, pattern_type = 0, 0, "waiting"            # V/W 归零，使双轮目标也归零
        else:
            tracker_line_data = sensor_data.data            # 取得本次更新的五路循迹数据
            # 调用例程 15 的函数，把五路状态换成 V、W 和图案分类
            v, w, pattern_type = line_tracker_to_vw(tracker_line_data.is_detected, V, K)

        # 调用例程 11 的差速函数，把 V/W 换成左右轮转速
        left_rpm, right_rpm = vw_to_rpm(v, w)
        # medium 约 0.1 秒更新一次；0.35 秒留有余量，断流时也会先自动停机
        commands.motor_speeds.write({PORT_LEFT: left_rpm, PORT_RIGHT: right_rpm}, valid_for=0.35)

        current_motion = (pattern_type, left_rpm, right_rpm)
        if current_motion != last_motion:                   # 状态或双轮转速变化时才打印
            print(
                f"分类: {PATTERN_NAMES[pattern_type]}  "
                f"左轮: {left_rpm} RPM  右轮: {right_rpm} RPM"
            )
            last_motion = current_motion


def main():
    """连接机器人，根据五路循迹数据持续调整双轮转速。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():
                # 打开实时控制会话；medium 约 10 Hz 更新五路循迹数据
                with robot.realtime.open(data_sources=("line_tracker",), command_targets={"motor_speeds": (PORT_LEFT, PORT_RIGHT)}, frequency="medium", data_queue_size=1) as session:
                    run(session.data, session.commands)
    except KeyboardInterrupt:
        print("Ctrl+C 主动停机")
    except pm.lite.LiteError as exc:
        print(f"出错: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def run(data_queue, commands):", from: 17, to: 42, defaultOpen: false },
  ],
}
