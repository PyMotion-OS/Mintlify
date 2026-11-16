// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const servoPosition = {
  title: "servo_position.py",
  code: `import time

import pymotion as pm

# --- 本例程可调整的参数 ---
PORT_UP_DOWN = 4                           # 上下舵机接 PWM 端口 4（S4），角度范围 0°～85°
PORT_LEFT_RIGHT = 5                        # 左右舵机接 PWM 端口 5（S5），角度范围 60°～180°
UP_DOWN_HOME, LEFT_RIGHT_HOME = 70, 120     # 复位姿态：上下70°，左右居中120°

def reset_servos(robot):
    """用普通位置命令复位双舵机，并返回两个复位角度。"""
    robot.pwm_servos.move_to({PORT_UP_DOWN: UP_DOWN_HOME, PORT_LEFT_RIGHT: LEFT_RIGHT_HOME})
    time.sleep(1.0)                                         # 等待双舵机到达复位姿态
    return UP_DOWN_HOME, LEFT_RIGHT_HOME                    # 后续角度从复位姿态开始计算

def move_servos(commands, up_down_angle=70, left_right_angle=120):
    """限制双舵机角度并发送实时命令，返回实际发送的两个角度。"""
    # commands 是实时会话的命令入口，两个角度单位为度；省略时停在复位姿态
    if up_down_angle < 0:
        up_down_angle = 0                                   # S4 转不到 0° 以下
    elif up_down_angle > 85:
        up_down_angle = 85                                  # S4 最多抬到 85°

    if left_right_angle < 60:
        left_right_angle = 60                               # S5 转不到 60° 以下
    elif left_right_angle > 180:
        left_right_angle = 180                              # S5 最多转到 180°

    # 0.3 秒只约束命令本身：过期后不再重发，舵机仍停在最后的角度
    commands.pwm_position_servos.write(
        {PORT_UP_DOWN: up_down_angle, PORT_LEFT_RIGHT: left_right_angle}, valid_for=0.3
    )
    return up_down_angle, left_right_angle                  # 主程序继续使用限制后的安全角度

def main():
    """先复位到 70°/120°，再用实时命令各偏 10°，观察"命令到期但角度仍保持"。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():                           # 舵机也是执行器，先拿控制权

                # 第一步：move_to 复位。普通位置命令，不需要实时会话（例程 07 学过）
                up_down_angle, left_right_angle = reset_servos(robot)
                print(f"复位: 上下 {up_down_angle}°，左右 {left_right_angle}°")

                # 第二步：打开实时控制会话，只声明两路舵机
                with robot.realtime.open(command_targets={"pwm_position_servos": (PORT_UP_DOWN, PORT_LEFT_RIGHT)}) as session:
                    up_down_angle, left_right_angle = move_servos(
                        session.commands,
                        up_down_angle=60,                   # 比复位 70° 更低 10°
                        left_right_angle=130,               # 比居中 120° 偏右 10°
                    )
                    print(f"舵机: 上下 {up_down_angle}°，左右 {left_right_angle}°")
                    time.sleep(2.0)                         # 给舵机转动和保持的时间

                    # valid_for=0.3 秒早过期了，位置命令失效后舵机仍停在目标角度
                    print(f"命令 0.3 秒就过期，但舵机保持在 {up_down_angle}°/{left_right_angle}°")

    except pm.lite.LiteError as exc:
        print(f"出错: {type(exc).__name__}: {exc}")
    except KeyboardInterrupt:
        print("Ctrl+C 主动结束；退出 control 时会关闭 PWM 输出")

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def reset_servos():", from: 10, to: 14, defaultOpen: false },
    { label: "def move_servos():", from: 16, to: 33, defaultOpen: false },
    { label: "def main():", from: 35, to: 61, defaultOpen: true },
  ],
}
