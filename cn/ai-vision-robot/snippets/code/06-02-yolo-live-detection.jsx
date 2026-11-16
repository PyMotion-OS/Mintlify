// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const yoloLiveDetection = {
  title: "yolo_live_detection.py",
  code: `import cv2

from camera import Camera, log_message     # 沿用模块四、五最终版的后台取图、年龄、重连和日志能力
# yolo_detection.py 吸收例程 31 的三个 YOLO 函数
from yolo_detection import detect_objects, draw_detections, load_yolo_resources


# --- 本例程可调整的参数 ---
CONFIDENCE = 0.25                          # 只保留置信度达到 0.25 的检测结果


def main():
    """把 Camera 提供的最新有效图片持续交给例程 31 的 YOLO 函数。"""
    _, model = load_yolo_resources()                        # 复用例程 31 的离线设置并得到模型对象
    try:
        with Camera() as camera:
            while True:
                if cv2.waitKey(1) == 27:
                    break                                   # Esc 结束循环，随后停止摄像头线程
                image = camera.latest()                     # 返回 0.5 秒内的最新图片；没有图片或已经过期时返回 None
                if image is None:
                    continue                                # 没有有效图片时不进入 YOLO，继续等待后台更新

                detections, detection_time = detect_objects(model, image, CONFIDENCE)  # 返回检测字段和毫秒耗时
                cv2.imshow("YOLO live detection - Esc to close", draw_detections(image, detections, detection_time))
    except ValueError as exc:
        log_message("ERROR", "yolo", str(exc))
    except KeyboardInterrupt:
        log_message("INFO", "yolo", "Ctrl+C 主动结束")
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
  ],
}
