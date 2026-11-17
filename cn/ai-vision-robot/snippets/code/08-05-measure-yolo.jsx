// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const measureYolo = {
  title: "measure_yolo.py",
  code: `from pathlib import Path

import cv2

from camera import Camera, log_message     # 沿用26的有效取图、后台重连与日志
# 加载离线模型与标签、检测物体、绘制检测结果：沿用32，本例只观察耗时和温度
from yolo_detection import detect_objects, draw_detections, load_yolo_resources


# --- 本页可调整的参数 ---
CONFIDENCE = 0.25                          # 只保留置信度达到0.25的检测结果
TEMP_WARN = 75.0                           # 处理器达到75℃时显示过热


# 检测有效新图片，显示检测耗时和启动时读取的处理器温度
def run(camera, temperature):
    """检测有效新图片，显示检测耗时和启动时读取的处理器温度。"""
    _, model = load_yolo_resources()                        # 第一步：只加载一次本例data中的离线标签和模型
    last_image = None
    while True:
        if cv2.waitKey(20) == 27:
            return                                          # 结束run，外层with随后停止相机线程

        # 第二步：取得有效新图片，不在主文件重复检查图片年龄
        image = camera.latest()
        if image is None or image is last_image:
            continue                                        # 无图或仍是上一张图片时，跳过本轮检测
        last_image = image

        # 第三步：检测返回的耗时已经是毫秒，直接沿用绘画显示，不再设置慢推理分级
        detections, detection_time = detect_objects(model, image, CONFIDENCE)
        marked_image = draw_detections(image, detections, detection_time)
        temperature_text = "None"
        if temperature is not None:
            temperature_text = f"{temperature:.1f} C"
            if temperature >= TEMP_WARN:
                temperature_text += " HOT"
        cv2.putText(marked_image, f"TEMP {temperature_text}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 176, 255), 2)
        cv2.imshow("YOLO performance - Esc to close", marked_image)


def main():
    """读取一次处理器温度，打开相机运行本地YOLO性能观察。"""
    try:
        temperature = None                                  # 非树莓派没有温度文件时，画面显示None
        temperature_file = Path("/sys/class/thermal/thermal_zone0/temp")
        if temperature_file.exists():
            temperature = int(temperature_file.read_text().strip()) / 1000  # 沿用45，系统温度除以1000换算为℃，启动时读取一次
        with Camera() as camera:
            run(camera, temperature)                        # 把本次温度值传给显示循环，不在循环中重复读取
    except KeyboardInterrupt:
        log_message("INFO", "yolo", "Ctrl+C 主动结束")
    except (OSError, ValueError, cv2.error) as exc:
        log_message("ERROR", "yolo", str(exc))
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def run(camera, temperature):", from: 16, to: 39, defaultOpen: false },
  ],
}
