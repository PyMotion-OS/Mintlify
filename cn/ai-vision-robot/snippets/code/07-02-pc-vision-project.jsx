// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const pcVisionProject = {
  title: "pc_vision_project.py",
  code: `import time

import cv2
import pymotion as pm

from camera import Camera, log_message     # 后台有效取图和日志，沿用26
from obstacle_policy import decide_motion  # 合并循迹意图与测距保护，吸收43
from differential_drive import vw_to_rpm   # 把V/W换成左右轮RPM，沿用11
from line_control import line_tracker_to_vw  # 把五路状态换成循迹意图，沿用15/16
# find_qr：二维码观测；check_qr_state：判定消失；draw_qr_marks：标记二维码，沿用30
from qr_observation import check_qr_state, draw_qr_marks, find_qr
from servo_control import nod_camera, reset_servos  # 复位返回双角度，再用37的当前姿态点头方法
# load_yolo_resources：加载资源；detect_objects：检测；draw_detections：标记检测快照
from yolo_detection import detect_objects, draw_detections, load_yolo_resources


# --- 本页可调整的参数 ---
V = 80                                     # 正常前进速度，单位毫米/秒
SLOW_V = 40                                # 看到站台后的减速速度，单位毫米/秒
K = 25                                     # 每格五路偏差对应的转向速度，单位度/秒


# 取得有效图片和二维码观测，非等待阶段显示实时标记
def observe_station(camera, task_state):
    """取得有效图片和二维码观测，非等待阶段显示实时标记。"""
    image = camera.latest()                                 # 无图或过期时返回None，不能把断流当作二维码消失
    qr_data = None
    if image is not None:
        qr_data = find_qr(image)                            # 沿用30，返回二维码文字、位置与偏差
        if task_state != "wait":
            cv2.imshow("AI route - Esc close, Space continue", draw_qr_marks(image, qr_data))
    return image, qr_data                                   # wait阶段保留到站检测快照，不被实时图片覆盖


# 识别到站快照并点头两次，调用前须先停机
def run_station_task(model, image, commands, up_down_angle, left_right_angle, station_name):
    """识别到站快照并点头两次，调用前须先停机。"""
    detections, detection_time = detect_objects(model, image, 0.25)  # 沿用32，仅检测到站图片，置信度门槛0.25
    cv2.imshow("AI route - Esc close, Space continue", draw_detections(image, detections, detection_time))
    labels = []
    for detection in detections:
        labels.append(detection["label"])
    log_message("INFO", "vision", f"站台: {station_name}  物体: {labels}")
    nod_camera(commands, up_down_angle, left_right_angle)   # 沿用38，围绕实际双角度点头两次并回位


# 结合站台阶段、图片和两种事件的时效，得到最终V/W与原因
def get_project_motion(tracker_event, ultrasonic_event, task_state, image):
    """结合站台阶段、图片和两种事件的时效，得到最终V/W与原因。"""
    now = time.monotonic()                                  # 在识别与点头之后取时刻，耗时也计入数据存放时间
    speed = V
    if task_state == "slow":
        speed = SLOW_V
    line_motion = (0, 0, "line_waiting")
    if tracker_event is not None and now - tracker_event.received_monotonic <= 0.3:
        line_motion = line_tracker_to_vw(tracker_event.data.is_detected, speed, K)  # 沿用15/16，新鲜五路数据转换为循迹意图
    ultrasonic_data = None
    if ultrasonic_event is not None and now - ultrasonic_event.received_monotonic <= 0.3:
        ultrasonic_data = ultrasonic_event.data             # 沿用43，只把新鲜测距交给保护策略
    if task_state == "wait":
        line_motion = (0, 0, "wait_confirm")
    elif image is None:
        line_motion = (0, 0, "image_waiting")
    return decide_motion(line_motion, ultrasonic_data)      # 吸收43，停机意图优先，其次应用测距保护


# 循迹到站后静止识别、点头两次，等待空格确认再继续
def run(camera, data_queue, commands, up_down_angle, left_right_angle):
    """循迹到站后静止识别、点头两次，等待空格确认再继续。"""
    _, model = load_yolo_resources()                        # 加载一次YOLO模型和标签，不在每个站台重复加载
    task_state = "normal"                                   # normal正常循迹、slow减速、wait停机等待确认
    tracker_event, ultrasonic_event = None, None
    next_send_at = time.monotonic()
    last_motion = None

    while True:
        key = cv2.waitKey(1)
        if key == 27:
            return                                          # 结束run，外层with随后释放会话、控制权、连接和相机
        if key == 32 and task_state == "wait":
            task_state = "normal"                           # 空格恢复正常阶段，后面仍需检查当前图片与传感器时效

        # 第一步：沿用43，分别保存完整事件；保留SDK的收到时刻，不能把出队当成新采样
        sensor_data = data_queue.read(timeout=0.5)          # 有数据即返回；断流最多等0.5秒，旧命令先在0.35秒后失效
        if sensor_data is not None and sensor_data.source == "line_tracker":
            tracker_event = sensor_data
        elif sensor_data is not None and sensor_data.source == "ultrasonic":
            ultrasonic_event = sensor_data

        # 第二步：沿用30判断站台阶段；图片相同也不跳过传感器处理与下发
        image, qr_data = observe_station(camera, task_state)  # 取有效图片与二维码，等待时保留检测快照
        if task_state == "normal" and qr_data is not None and (qr_data["text"] == "STATION_A" or qr_data["text"] == "STATION_B"):
            station_name = qr_data["text"]
            _, last_detected_time = check_qr_state(qr_data, station_name, None, 1)  # 记录当前站台最近出现的时刻
            task_state = "slow"
        elif task_state == "slow":
            qr_state, last_detected_time = check_qr_state(qr_data, station_name, last_detected_time, 1)  # 连续消失1秒才确认离站，断流不算离站
            if qr_state == "lost":
                task_state = "wait"
                # 第三步：进入wait立即停机，这次零速不受普通发送时刻限制
                commands.motor_speeds.write({3: 0, 4: 0}, valid_for=0.35)  # M3左轮、M4右轮，先停机再进行耗时推理
                next_send_at = time.monotonic() + 0.1       # 从本次停机重新计时，避免同一时刻重复普通下发
                run_station_task(model, image, commands, up_down_angle, left_right_angle, station_name)  # 静止识别一次并点头两次

        # 第四步：检查输入时效并合并站台阶段与测距保护
        v, w, reason = get_project_motion(tracker_event, ultrasonic_event, task_state, image)
        left_rpm, right_rpm = vw_to_rpm(v, w)               # 将最终意图换成左右轮RPM

        # 第五步：正常运动只由最终目标出口发送，停机等待时也发送零速
        now = time.monotonic()
        if now >= next_send_at:
            commands.motor_speeds.write({3: left_rpm, 4: right_rpm}, valid_for=0.35)  # 正常按0.1秒节拍续发，0.35秒未更新则旧命令失效
            next_send_at = now + 0.1
        motion = (task_state, reason, left_rpm, right_rpm)
        if motion != last_motion:
            log_message("INFO", "decision", f"阶段: {task_state}  原因: {reason}  左轮: {left_rpm} RPM  右轮: {right_rpm} RPM")
            last_motion = motion


def main():
    """连接相机与传感器，取得控制权后运行视觉站台任务。"""
    try:
        with Camera() as camera:
            with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
                with robot.control():
                    up_down_angle, left_right_angle = reset_servos(robot)  # 复位并取得实际双角度，不在主文件重复配置
                    # 打开实时控制会话
                    with robot.realtime.open(data_sources=("line_tracker", "ultrasonic"), command_targets={"motor_speeds": (3, 4), "pwm_position_servos": (4, 5)}) as session:
                        run(camera, session.data, session.commands, up_down_angle, left_right_angle)
    except KeyboardInterrupt:
        log_message("INFO", "project", "Ctrl+C 主动停机")
    except (OSError, ValueError, cv2.error, pm.lite.LiteError) as exc:
        log_message("ERROR", "project", str(exc))
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def observe_station(camera, task_state):", from: 24, to: 32, defaultOpen: false },
    { label: "def run_station_task(model, image, commands, up_down_angle, left_right_angle, station_name):", from: 36, to: 44, defaultOpen: false },
    { label: "def get_project_motion(tracker_event, ultrasonic_event, task_state, image):", from: 48, to: 64, defaultOpen: false },
    { label: "def run(camera, data_queue, commands, up_down_angle, left_right_angle):", from: 68, to: 117, defaultOpen: false },
  ],
}
