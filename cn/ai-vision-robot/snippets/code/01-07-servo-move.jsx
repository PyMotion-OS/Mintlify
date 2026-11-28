// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const servoMove = {
  title: "servo_move.py",
  code: `import time

import pymotion as pm

# --- 本页可调整的参数 ---
PORT_UP_DOWN = 4                           # 上下舵机接 PWM 端口 4（S4），可输入值范围 0~180
PORT_LEFT_RIGHT = 5                        # 左右舵机接 PWM 端口 5（S5），可输入值范围 0~180


def main():
    """三个角度依次转过去，每次用 sleep 等它转完，最后打印脚本耗时。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:  # 用 USB 时把 "wifi" 改成 "usb"
            with robot.control():                               # 舵机也是执行器，先拿控制权

                start = time.monotonic()                        # 只增不减的计时，适合算时间间隔

                # move_to 只把目标角度发出去就立刻返回，不会停下来等舵机转到位
                robot.pwm_servos.move_to({PORT_UP_DOWN: 80, PORT_LEFT_RIGHT: 100})
                time.sleep(1)                                   # 等舵机转过去（0° 在上方，80° 比居中更抬头）

                robot.pwm_servos.move_to({PORT_UP_DOWN: 90, PORT_LEFT_RIGHT: 100})
                time.sleep(0.5)                                 # 上下先到居中高度，左右还停在 100°

                # 双 90° 约为居中；不同小车略有差异，可按实际情况微调，得到摄像头正前方的居中度数
                robot.pwm_servos.move_to({PORT_UP_DOWN: 90, PORT_LEFT_RIGHT: 90})
                time.sleep(0.2)                                

                # 这个耗时只包含三次 sleep 和通信往返，不代表舵机真正到位的时间
                print(f"脚本耗时: {time.monotonic() - start:.2f} 秒")

    except pm.lite.LiteError as exc:
        print(f"连接失败（{exc}）")
    except KeyboardInterrupt:
        print("Ctrl+C 主动结束；退出 control 时会关闭 PWM 输出")


if __name__ == "__main__":
    main()`,
  folds: [
  ],
}
