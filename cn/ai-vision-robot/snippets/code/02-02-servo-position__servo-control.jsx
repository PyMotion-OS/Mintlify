// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const servoControl = {
  title: "servo_control.py",
  code: `import time


# --- 本文件可调整的参数 ---
PORT_UP_DOWN = 4                           # 上下舵机接 PWM 端口 4（S4）
PORT_LEFT_RIGHT = 5                        # 左右舵机接 PWM 端口 5（S5）
UP_DOWN_HOME, LEFT_RIGHT_HOME = 90, 90    # 复位姿态：双 90° 约为居中，可以根据实际情况微调


# 用普通位置命令复位双舵机，并返回两个复位角度
def reset_servos(robot):
    """用普通位置命令复位双舵机，并返回两个复位角度。"""
    robot.pwm_servos.move_to({PORT_UP_DOWN: UP_DOWN_HOME, PORT_LEFT_RIGHT: LEFT_RIGHT_HOME})
    time.sleep(1.0)                                         # 等待双舵机到达复位姿态
    return UP_DOWN_HOME, LEFT_RIGHT_HOME                    # 后续角度从复位姿态开始计算


# 限制双舵机角度并发送实时命令，返回实际发送的两个角度
def move_servos(commands, up_down_angle=90, left_right_angle=90):
    """限制双舵机角度并发送实时命令，返回实际发送的两个角度。"""
    # commands 是实时会话的命令入口，两个角度单位为度；省略时停在复位姿态
    # 以上为 0 的方向：上下角度越大越往下，0° 在上方，双 90° 约为居中（可按实际情况微调）
    if up_down_angle < 0:
        up_down_angle = 0                                   # 小于 0° 时停在上方极限
    elif up_down_angle > UP_DOWN_HOME + 15:
        up_down_angle = UP_DOWN_HOME + 15                   # 最多到居中+15°，再往下几乎被底盘挡住

    if left_right_angle < 0:
        left_right_angle = 0                                # 左右可输入 0°～180°
    elif left_right_angle > 180:
        left_right_angle = 180                              # 超出 180° 时停在最大角度

    # 0.3 秒只约束命令本身：过期后不再重发，舵机仍停在最后的角度
    commands.pwm_position_servos.write(
        {PORT_UP_DOWN: up_down_angle, PORT_LEFT_RIGHT: left_right_angle}, valid_for=0.3
    )
    return up_down_angle, left_right_angle                  # 主程序继续使用限制后的安全角度`,
  folds: [
    { label: "def reset_servos(robot):", from: 11, to: 15, defaultOpen: false },
    { label: "def move_servos(commands, up_down_angle=90, left_right_angle=90):", from: 19, to: 37, defaultOpen: false },
  ],
}
