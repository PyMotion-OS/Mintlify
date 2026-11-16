// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const servoMove = {
  title: "servo_move.py",
  code: `import time

import pymotion as pm

PORT_UP_DOWN = 4                           # 上下舵机接 PWM 端口 4
PORT_LEFT_RIGHT = 5                        # 左右舵机接 PWM 端口 5


def main():
    """三个角度依次转过去，间隔 0.2s / 0.5s，最后打印总耗时。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():                 # 舵机也是执行器，先拿控制权（1.6）
                start = time.monotonic()          # 开始前记时间：只增不减，适合算耗时

                robot.pwm_servos.move_to({PORT_UP_DOWN: 60, PORT_LEFT_RIGHT: 100})
                print("移动: 上下 60°，左右 100°")
                time.sleep(0.2)                   # 停 0.2 秒

                robot.pwm_servos.move_to({PORT_UP_DOWN: 70, PORT_LEFT_RIGHT: 100})
                print("移动: 上下 70°，左右 100°")
                time.sleep(0.5)                   # 停 0.5 秒

                robot.pwm_servos.move_to({PORT_UP_DOWN: 70, PORT_LEFT_RIGHT: 120})
                print("复位: 上下 70°，左右 120°")

                print(f"执行时间: {time.monotonic() - start:.2f} 秒")

    except pm.lite.LiteError as exc:
        print(f"连接失败（{exc}）")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def main():", from: 9, to: 30, defaultOpen: true },
  ],
}
