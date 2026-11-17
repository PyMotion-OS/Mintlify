// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const qrStation = {
  title: "qr_station.py",
  code: `import time

import cv2
import pymotion as pm

from camera import Camera, log_message     # 引用 4.9 的摄像头类和统一日志函数
from differential_drive import vw_to_rpm   # 引用 2.4 的差速函数
from line_control import line_tracker_to_vw  # 引用 3.3 的五路分类和转向函数
from qr_observation import check_qr_state, draw_qr_marks, find_qr  # 引用 5.3 的连续识别和绘画


# --- 本页可调整的参数 ---
V = 100                                     # 默认循迹速度，单位毫米/秒
SLOW_V = 60                                # 站台任务中的减速速度，单位毫米/秒
K = 25                                     # 五路偏差每增加一格，W增加25度/秒


# 循迹遇到站台时减速，二维码离开后停机8秒，再恢复循迹
def run(camera, data_queue, commands):
    """循迹遇到站台时减速，二维码离开后停机8秒，再恢复循迹。"""
    state = "normal"                                        # normal正常循迹，slow减速

    while True:
        # 第一步：等待五路新数据，再取得最新图片
        sensor_data = data_queue.read(timeout=0.2)          # 约0.1秒收到一条新数据，断流时最多等待0.2秒
        image = camera.latest()                             # 调用 4.9 的类方法，无有效图片时返回None
        qr_data = None
        if image is not None:
            qr_data = find_qr(image)                        # 调用 5.2 的二维码识别函数
            cv2.imshow("QR station - Esc to close", draw_qr_marks(image, qr_data))

        # 第二步：处理正常和减速两个阶段
        if state == "normal" and qr_data is not None and (qr_data["text"] == "STATION_A" or qr_data["text"] == "STATION_B"):
            station_name = qr_data["text"]
            _, last_detected_time = check_qr_state(qr_data, station_name, None, 1)
            state = "slow"                                  # 识别到站台，本轮开始减速
            log_message("INFO", "station", f"站台: {station_name}  状态: slow")
        elif state == "slow":
            # 调用 5.3 演化出的函数，只检查当前站台是否连续消失
            qr_state, last_detected_time = check_qr_state(qr_data, station_name, last_detected_time, 1)
            if qr_state == "lost":
                log_message("INFO", "station", f"站台: {station_name}  状态: stop")
                time.sleep(8)                               # 停止下发，旧命令0.35秒后自动失效
                state = "normal"
                log_message("INFO", "station", f"站台: {station_name}  状态: normal")
                continue                                    # 重新读取最新图片和五路数据后再恢复循迹

        # 第三步：按当前阶段选择速度，再用五路数据计算双轮转速并下发
        speed = SLOW_V if state == "slow" else V
        if sensor_data is None:
            v, w, line_state = 0, 0, "waiting"              # 五路超时时归零，不使用上一轮的数据
        else:
            v, w, line_state = line_tracker_to_vw(sensor_data.data.is_detected, speed, K)  # 复用 3.3 的循迹计算
        if image is None:
            v, w = 0, 0                                     # 无图时同时归零V/W，偏离线中心也不转动

        left_rpm, right_rpm = vw_to_rpm(v, w)               # 调用 2.4 的差速函数，得到左右轮转速
        # M3左轮、M4右轮；每轮只发送一次，0.35秒内未续发则旧命令自动失效
        commands.motor_speeds.write({3: left_rpm, 4: right_rpm}, valid_for=0.35)

        if line_state == "lost":
            log_message("INFO", "line", "路线断开，停止并结束运行")
            return                                          # 已发送零速度，结束run并依次退出外层with
        if cv2.waitKey(1) == 27:
            return                                          # Esc结束run，外层with随后停止实时控制并释放连接


def main():
    """连接摄像头、五路和双轮，运行循迹站台演示。"""
    try:
        with Camera() as camera:
            with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
                with robot.control():
                    # 打开实时控制会话；M3左轮、M4右轮
                    with robot.realtime.open(data_sources=("line_tracker",), command_targets={"motor_speeds": (3, 4)}) as session:
                        run(camera, session.data, session.commands)
    except (ValueError, pm.lite.LiteError) as exc:
        log_message("ERROR", "station", f"{type(exc).__name__}: {exc}")
    except KeyboardInterrupt:
        log_message("INFO", "station", "Ctrl+C主动停机")
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def run(camera, data_queue, commands):", from: 19, to: 65, defaultOpen: false },
  ],
}
