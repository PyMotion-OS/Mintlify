// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const obstacleStop = {
  title: "obstacle_stop.py",
  code: `import pymotion as pm

# --- 本页可调整的参数 ---
STOP_DISTANCE = 350                        # 停机距离，单位毫米
SLOW_DISTANCE = 500                        # 减速距离，单位毫米
NORMAL_RPM = 30                            # 正常双轮转速，单位转/分

# --- 共用配置（一般不用动）---
PORT_LEFT, PORT_RIGHT = 3, 4               # 左轮接 M3，右轮接 M4


# 根据超声波状态和距离选择正常、减速或停机
def choose_rpm(ultrasonic_data):
    """根据超声波状态和距离选择正常、减速或停机。"""
    if ultrasonic_data.state == "no_echo":                 # 本页把无回波作为未测到障碍，保持正常速度
        return NORMAL_RPM, "未测到障碍"

    if not ultrasonic_data.valid:                           # 其他不可用状态把速度设为 0
        return 0, "数据无效"

    if ultrasonic_data.distance <= STOP_DISTANCE:           # 距离过近时速度设为 0
        return 0, "停机"

    if ultrasonic_data.distance < SLOW_DISTANCE:            # 进入减速区间时把正常速度减半
        return NORMAL_RPM // 2, "减速"

    return NORMAL_RPM, "正常"                               # 距离较远时保持正常速度


# 持续获取距离、选择速度、发送双轮目标并打印状态变化
def run(data_queue, commands):
    """持续获取距离、选择速度、发送双轮目标并打印状态变化。"""
    last_state = None

    while True:                                             # 条件一直为真，所以持续重复避障控制
        # read() 会等待下一条新数据，所以 while 不会一直快速循环；最多等待 1 秒
        sensor_data = data_queue.read(timeout=1)
        if sensor_data is None:                             # 1 秒内没有新数据
            rpm, state = 0, "等待数据"
            distance = None
        else:
            ultrasonic_data = sensor_data.data
            rpm, state = choose_rpm(ultrasonic_data)        # 根据距离选择转速和状态
            distance = ultrasonic_data.distance
        # 指令有效期要大于 read() 最长等待的 1 秒，避免等待新数据时指令提前失效
        commands.motor_speeds.write({PORT_LEFT: rpm, PORT_RIGHT: rpm}, valid_for=1.5)

        if state != last_state:                             # 当前状态改变时才打印，并保存为上一次状态
            print(f"状态: {state}  距离(mm): {distance}  目标: {rpm} RPM")
            last_state = state


def main():
    """连接机器人，持续根据前方距离调整双轮转速。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():
                # 打开实时控制会话，加入定时接收传感器功能
                with robot.realtime.open(data_sources=("ultrasonic",), command_targets={"motor_speeds": (PORT_LEFT, PORT_RIGHT)}) as session:
                    run(session.data, session.commands)
    except KeyboardInterrupt:
        print("Ctrl+C 主动停机")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def choose_rpm(ultrasonic_data):", from: 13, to: 27, defaultOpen: false },
    { label: "def run(data_queue, commands):", from: 31, to: 50, defaultOpen: false },
  ],
}
