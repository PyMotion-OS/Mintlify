// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const measureOpencv = {
  title: "measure_opencv.py",
  code: `import time

import cv2

from camera import Camera, log_message     # 沿用26的有效取图、后台重连与日志
from target_observation import draw_target_marks, find_target  # 原样吸收 4.10 的颜色观测与二维标记


# --- 本页可调整的参数 ---
PROCESS_WIDTH = 640                        # 处理宽度越小，通常处理越快、细节越少


# 按处理宽度等比例缩小图片，并返回缩小后的图片
def resize_image(image):
    """按处理宽度等比例缩小图片，并返回缩小后的图片。"""
    if image.shape[1] <= PROCESS_WIDTH:                     # 图片宽度已经不超过目标宽度
        return image
    scale = PROCESS_WIDTH / image.shape[1]                  # 计算宽度需要缩小的比例
    image_height = round(image.shape[0] * scale)            # 高度使用同一比例，避免图片变形
    return cv2.resize(image, (PROCESS_WIDTH, image_height))


# 显示颜色目标，并测量每张有效新图片的处理耗时
def run(camera):
    """显示颜色目标，并测量每张有效新图片的处理耗时。"""
    last_image = None                                       # 沿用38，以图片对象判断后台是否收到新图
    last_state = None                                       # 只在目标状态变化时打印日志

    while True:                                             # 条件一直为真，所以持续测量 OpenCV 处理耗时
        if cv2.waitKey(20) == 27:
            return                                          # 结束run，外层with随后停止摄像头线程

        image = camera.latest()                             # 有效性判断交给相机，主文件只接收图片或None
        if image is None or image is last_image:
            continue                                        # 无图或仍是上一张图片时，跳过本轮处理

        last_image = image
        # 第一步：把新画面等比例缩小；固定像素面积的过滤规则也会随缩图影响可见目标
        start_time = time.monotonic()
        image = resize_image(image)
        # 第二步：复用 4.10 的完整算法，计时包含缩图、观测和结果标记
        target_data = find_target(image)
        marked_image = draw_target_marks(image, target_data)
        processing_time = (time.monotonic() - start_time) * 1000  # 秒乘 1000，得到本轮处理毫秒数

        # 第三步：只显示处理尺寸和本轮处理耗时，便于比较缩图的效果
        text = f"SIZE {image.shape[1]}x{image.shape[0]}  PROCESS {processing_time:.0f} ms"
        cv2.putText(marked_image, text, (20, marked_image.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 176, 255), 2)
        cv2.imshow("OpenCV performance - Esc to close", marked_image)

        if target_data["state"] != last_state:
            log_message("INFO", "opencv", f"状态: {target_data['state']}  处理耗时: {processing_time:.0f} ms")
            last_state = target_data["state"]


def main():
    """打开相机，运行OpenCV性能观察。"""
    try:
        with Camera() as camera:
            run(camera)
    except KeyboardInterrupt:
        print("结果: Ctrl+C 主动结束")
    except (OSError, ValueError, cv2.error) as exc:
        log_message("ERROR", "camera", str(exc))
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def resize_image(image):", from: 14, to: 20, defaultOpen: false },
    { label: "def run(camera):", from: 24, to: 53, defaultOpen: false },
  ],
}
