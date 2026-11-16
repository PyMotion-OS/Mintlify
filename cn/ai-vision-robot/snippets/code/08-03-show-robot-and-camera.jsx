// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const showRobotAndCamera = {
  title: "show_robot_and_camera.py",
  code: `import cv2
import numpy as np
import pymotion as pm

from camera import Camera, log_message     # 沿用26的有效取图、后台重连与日志


# 复制图片，标出距离和五路读数，未收到或无效时显示对应状态
def draw_status(image, ultrasonic_data, tracker_line_data):
    """复制图片，标出距离和五路读数，未收到或无效时显示对应状态。"""
    marked_image = image.copy()
    distance_text = "waiting"
    if ultrasonic_data is not None:
        if ultrasonic_data.distance is not None and ultrasonic_data.valid:
            distance_text = f"{ultrasonic_data.distance:.0f} mm"
        else:
            distance_text = ultrasonic_data.state           # no_echo等状态照实显示，不用0冒充距离

    line_text = "waiting"
    if tracker_line_data is not None:
        if tracker_line_data.valid:
            line_text = str(tracker_line_data.is_detected)
        else:
            line_text = tracker_line_data.state

    cv2.rectangle(marked_image, (15, 15), (620, 110), (32, 32, 32), -1)
    cv2.putText(marked_image, f"DISTANCE: {distance_text}", (30, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 176, 255), 2)
    cv2.putText(marked_image, f"LINE: {line_text}", (30, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 176, 255), 2)
    return marked_image

# 把最新五路与超声波读数标在相机画面上
def run(camera, data_queue):
    """把最新五路与超声波读数标在相机画面上。"""
    ultrasonic_data, tracker_line_data = None, None
    while True:
        if cv2.waitKey(1) == 27:
            return                                          # 结束run，外层with随后释放相机、会话和连接

        # 第一步：沿用10，按来源更新两类读数，不要求两种事件同时到达
        sensor_data = data_queue.read(timeout=0.5)          # 有数据即返回，无数据最多等0.5秒，不另加sleep
        if sensor_data is not None:
            if sensor_data.source == "ultrasonic":
                ultrasonic_data = sensor_data.data
            elif sensor_data.source == "line_tracker":
                tracker_line_data = sensor_data.data

        # 第二步：沿用26，由latest负责检查图片是否存在、是否过期
        image = camera.latest()
        if image is None:
            image = np.zeros((360, 800, 3), dtype=np.uint8)  # 无图时用黑底继续显示传感器读数

        # 第三步：即使图片相同也刷新读数；本例不进行运动控制
        marked_image = draw_status(image, ultrasonic_data, tracker_line_data)
        cv2.imshow("Robot and camera - Esc to close", marked_image)


def main():
    """连接USB传感器与相机，打开数据会话后联合显示。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            # 打开实时数据会话
            with robot.realtime.open(data_sources=("ultrasonic", "line_tracker"), frequency="medium", data_queue_size=8) as session:
                with Camera() as camera:
                    run(camera, session.data)
    except KeyboardInterrupt:
        log_message("INFO", "display", "Ctrl+C 主动结束")
    except (OSError, pm.lite.LiteError, ValueError, cv2.error) as exc:
        log_message("ERROR", "display", str(exc))
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def draw_status(image, ultrasonic_data, tracker_line_data):", from: 9, to: 29, defaultOpen: false },
    { label: "def run(camera, data_queue):", from: 32, to: 54, defaultOpen: false },
  ],
}
