// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const visualObservation = {
  title: "visual_observation.py",
  code: `import cv2

from camera import Camera, log_message     # 引用最终摄像头类和统一日志函数
from target_observation import draw_target_marks, find_target  # 引用稳定的目标观测和结果标记

def main():
    """使用最终 Camera 连续输出不过期的视觉观测。"""
    last_state = None                                       # 保存上一次状态，状态不变时不重复打印日志

    try:
        # 类已吸收 4.9 的连接和重连循环，进入 with 后由后台线程执行
        with Camera() as camera:
            while True:
                if cv2.waitKey(20) == 27:                   # 每轮处理窗口消息，连接中断时仍能响应 Esc
                    break                                   # Esc 结束循环，随后离开 with 并停止摄像头线程

                image = camera.latest()                     # 返回 0.5 秒内的最新图片；没有图片或已经过期时返回 None
                if image is None:
                    if last_state != "waiting":
                        log_message("WARNING", "vision", "state=waiting  image=None")
                        last_state = "waiting"
                    continue                                # 没有有效图片时不进入颜色识别，继续等待后台更新

                target_data = find_target(image)            # 默认返回蓝色目标状态、中心、面积和二维偏差
                if target_data["state"] != last_state:
                    log_message("INFO", "vision", f"state={target_data['state']}  error_x={target_data['error_x']}  error_y={target_data['error_y']}")
                    last_state = target_data["state"]
                cv2.imshow("Reliable visual observation - Esc to close", draw_target_marks(image, target_data))
    except ValueError as exc:
        log_message("ERROR", "camera", str(exc))
    except KeyboardInterrupt:
        log_message("INFO", "camera", "Ctrl+C 主动结束")
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
  ],
}
