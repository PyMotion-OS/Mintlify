// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const colorServoTracking = {
  title: "color_servo_tracking.py",
  code: `import time

import cv2
import pymotion as pm

from camera import Camera, log_message       # 引用 4.9 的摄像头类和统一日志函数
from servo_control import move_servos, reset_servos # 引用舵机复位和安全执行函数
from target_observation import draw_target_marks, find_target # 引用 4.9 的目标观测和结果标记


# --- 本页可调整的参数 ---
TARGET_TYPE = "blue"                         # 跟随蓝色目标，也可改为gray、green或yellow
DEAD_ZONE = 0.10                             # 二维偏差进入中心10%后保持当前角度
K = 5                                      # 偏差为1时调整10°，数值越大跟随动作越强


# 把一个方向的归一化偏差换成新的舵机角度
def error_to_angle(error, angle, K):
    """把一个方向的归一化偏差换成新的舵机角度。"""
    if error is None or abs(error) <= DEAD_ZONE:
        return angle                                         # 没有目标或进入中心范围时保持当前角度
    return angle + error * K                                # 偏差乘K得到本轮需要调整的角度


# 持续把颜色目标偏差换成舵机角度并发送实时命令
def run(camera, commands, up_down_angle, left_right_angle):
    """持续把颜色目标偏差换成舵机角度并发送实时命令。"""
    last_angles = None                                      # 两个角度变化时才打印新日志

    while True:
        image = camera.latest()                             # 返回0.5秒内的最新图片，否则返回None
        if image is not None:
            target_data = find_target(image, TARGET_TYPE)   # 返回目标中心、面积和二维偏差

            up_down_angle = error_to_angle(target_data["error_y"], up_down_angle, K) # 上下方向与偏差同号
            left_right_angle = error_to_angle(target_data["error_x"], left_right_angle, -K) # 左右方向与偏差反号

            up_down_angle, left_right_angle = move_servos(commands, up_down_angle, left_right_angle)
            cv2.imshow("Color servo tracking - Esc to close", draw_target_marks(image, target_data))

            angles = (up_down_angle, left_right_angle)
            if angles != last_angles:
                log_message("INFO", "servo", f"上下: {up_down_angle:.1f}°  左右: {left_right_angle:.1f}°")
                last_angles = angles

        if cv2.waitKey(1) == 27:
            break                                           # Esc结束循环，退出实时会话并关闭双舵机输出
        time.sleep(0.1)                                     # 每0.1秒执行一次，实时指令约为10 Hz


def main():
    """启动时先复位，再让双舵机持续跟随颜色目标。"""
    try:
        with Camera() as camera:
            with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
                with robot.control():
                    up_down_angle, left_right_angle = reset_servos(robot) # 复位并返回两个起始角度
                    # 打开实时控制会话；S4控制上下，S5控制左右
                    with robot.realtime.open(command_targets={"pwm_position_servos": (4, 5)}) as session:
                        run(camera, session.commands, up_down_angle, left_right_angle)
    except (ValueError, pm.lite.LiteError) as exc:
        log_message("ERROR", "servo", f"{type(exc).__name__}: {exc}")
    except KeyboardInterrupt:
        log_message("INFO", "servo", "Ctrl+C 主动结束")
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def error_to_angle(error, angle, K):", from: 18, to: 22, defaultOpen: false },
    { label: "def run(camera, commands, up_down_angle, left_right_angle):", from: 26, to: 48, defaultOpen: false },
  ],
}
