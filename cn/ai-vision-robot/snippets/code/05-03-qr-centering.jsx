// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const qrCentering = {
  title: "qr_centering.py",
  code: `import time

import cv2
import pymotion as pm

from camera import Camera, log_message     # 引用例程26的摄像头类和统一日志函数
from differential_drive import vw_to_rpm   # 引用例程11的差速函数
from qr_observation import draw_qr_marks, find_qr  # 吸收例程28的二维码观测和绘画函数
from servo_control import CENTER_ERROR, error_to_angle, move_servos, reset_servos  # 引用舵机控制函数

# --- 本例程可调整的参数 ---
TARGET_TEXT = "GREETING"                   # 只对准文字与这里相同的二维码
LOST_SECONDS = 0.5                         # 连续0.5秒未识别到目标，才确认识别中断
W = 80                                     # 横向转动强度；左右轮转不动时增大这个值
SERVO_K = 5                                # 纵向偏差为1时，上下舵机本轮调整5度

def check_qr_state(qr_data, target_text, last_detected_time, lost_seconds):
    """连续检查指定二维码，返回识别状态和最近一次识别时刻。"""
    if target_text is None:
        return "waiting", None                              # 没有指定目标时保持等待

    current_time = time.monotonic()                         # 取得当前时刻，用于计算消失了多久
    if qr_data is not None and qr_data["text"] == target_text:
        return "detected", current_time                     # 当前识别成功，保存这次识别时刻

    if last_detected_time is None:
        return "waiting", None                              # 目标从未出现，继续等待第一次识别

    missing_seconds = current_time - last_detected_time     # 当前时刻减去上次时刻，得到消失秒数
    if missing_seconds < lost_seconds:
        return "missing", last_detected_time                # 消失时间较短，暂时不判定中断

    return "lost", last_detected_time                       # 达到规定时间，确认识别已经中断

def run(camera, commands, up_down_angle, left_right_angle):
    """横向用双轮对准二维码，纵向用S4对准二维码。"""
    last_detected_time = None                               # 保存目标二维码最近一次识别成功的时刻
    last_state = None                                       # 二维码状态变化时才打印新日志

    while True:
        image = camera.latest()                             # 返回0.5秒内的最新图片，否则返回None
        qr_data = None
        if image is not None:
            qr_data = find_qr(image)                        # 把有效图片变成标准二维码观测
        # 传入本轮观测和上次成功时刻，返回本轮状态和更新后的时刻
        qr_state, last_detected_time = check_qr_state(qr_data, TARGET_TEXT, last_detected_time, LOST_SECONDS)

        if qr_state != "detected":
            left_rpm, right_rpm = 0, 0                      # 等待、短暂丢失或确认中断时停止双轮
        else:
            # 左右偏差由双轮处理：目标在左时W为正，机器人向左原地转动
            if abs(qr_data["error_x"]) <= CENTER_ERROR:
                left_rpm, right_rpm = 0, 0                  # 横向进入中心范围后停止双轮
            else:
                left_rpm, right_rpm = vw_to_rpm(0, -qr_data["error_x"] * W)
            # 上下偏差只改变S4；S5保持居中，避免与双轮同时控制左右方向
            up_down_angle = error_to_angle(qr_data["error_y"], up_down_angle, SERVO_K)
            up_down_angle, left_right_angle = move_servos(commands, up_down_angle, left_right_angle)

        if image is not None:
            cv2.imshow("QR centering - Esc to close", draw_qr_marks(image, qr_data))

        commands.motor_speeds.write({3: left_rpm, 4: right_rpm}, valid_for=0.3)  # M3左轮、M4右轮
        if qr_state != last_state:
            log_message("INFO", "qr", f"状态: {qr_state}  左轮: {left_rpm}  右轮: {right_rpm}")
            last_state = qr_state

        if cv2.waitKey(1) == 27:
            break                                           # Esc结束循环，退出实时控制会话
        time.sleep(0.1)                                     # 每0.1秒处理一次，命令频率约为10Hz

def main():
    """复位双舵机，再用双轮和S4对准指定二维码。"""
    try:
        with Camera() as camera:
            with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
                with robot.control():
                    up_down_angle, left_right_angle = reset_servos(robot)
                    # 打开实时控制会话；M3/M4控制双轮，S4/S5控制上下和左右舵机
                    with robot.realtime.open(command_targets={"motor_speeds": (3, 4), "pwm_position_servos": (4, 5)}) as session:
                        run(camera, session.commands, up_down_angle, left_right_angle)
    except (ValueError, pm.lite.LiteError) as exc:
        log_message("ERROR", "qr", f"{type(exc).__name__}: {exc}")
    except KeyboardInterrupt:
        log_message("INFO", "qr", "Ctrl+C主动结束")
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def check_qr_state(qr_data, target_text, last_detected_time, lost_seconds):", from: 17, to: 33, defaultOpen: false },
    { label: "def run(camera, commands, up_down_angle, left_right_angle):", from: 35, to: 70, defaultOpen: false },
    { label: "def main():", from: 72, to: 87, defaultOpen: true },
  ],
}
