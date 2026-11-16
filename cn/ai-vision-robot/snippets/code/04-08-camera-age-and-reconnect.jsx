// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const cameraAgeAndReconnect = {
  title: "camera_age_and_reconnect.py",
  code: `import time

import cv2

from camera import Camera, log_message     # 提取例程 24 的摄像头类和日志；latest() 吸收图片有效性判断
from target_observation import draw_target_marks, find_target  # 引用例程 24 的目标观测和结果标记


# --- 本例程可调整的参数 ---
MAX_AGE = 0.5                              # 图片收到超过 0.5 秒就不再用于当前处理
RECONNECT_SECONDS = 1.0                    # 断流后等待 1 秒再建立下一次连接


# 打开一次视频连接，清空上次图片，成功返回 True，失败返回 False
def connect(camera):
    """打开一次视频连接，清空上次图片，成功返回 True，失败返回 False。"""
    # FFmpeg 连接超时和取图超时在打开视频流时传入；3000、1000 的单位是毫秒
    capture = cv2.VideoCapture(
        camera.camera_url,
        cv2.CAP_FFMPEG,                                     # 使用 FFmpeg 打开 RTSP 视频流
        [cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 3000, cv2.CAP_PROP_READ_TIMEOUT_MSEC, 1000],
    )
    if not capture.isOpened():                              # 没有打开视频流，本次连接失败
        capture.release()                                   # 释放本次连接占用的资源
        return False                                        # main() 随后等待，再调用本函数重试

    camera.capture = capture                                # 把已打开的连接交给 Camera 的取图线程
    old_data = camera.frame_data
    camera.frame_data = {
        "state": "connected",                               # 新增连接状态，供日志和后续任务判断
        "image": None,                                      # 清空上次图片，等待本次连接的首张图片
        "frame_number": old_data["frame_number"],           # 没有取得新图片，累计编号暂时不变
        "received_at": None,                                # 还没有新图片，也没有新的接收时间
    }
    log_message("INFO", "camera", "状态变为 connected")
    return True                                             # main() 随后进入 with，启动当前连接的取图线程


# 把状态改为 disconnected，并清空不能继续使用的旧图片
def set_disconnected(camera):
    """把状态改为 disconnected，并清空不能继续使用的旧图片。"""
    old_data = camera.frame_data
    if old_data["state"] != "disconnected":                 # 连续连接失败时只记录一次断开，避免刷屏
        log_message("WARNING", "camera", "状态变为 disconnected")
    camera.frame_data = {
        "state": "disconnected",                            # 当前没有可用连接
        "image": None,                                      # 清空旧图，避免断流后继续识别停住的画面
        "frame_number": old_data["frame_number"],           # 没有新图片，累计编号保持不变
        "received_at": None,                                # 没有有效图片，图片年龄也不存在
    }


def main():
    """建立连接、识别有效图片；断流后释放旧连接，等待并重新连接。"""
    camera = Camera()                                      # 创建对象并使用类内默认地址，此时还没有连接

    try:
        # 外层循环负责重连；内层循环只处理当前连接，结束后释放旧连接再重新尝试
        while True:
            if cv2.waitKey(20) == 27:
                break                                       # 结束外层重连循环，随后执行 finally 关闭窗口

            # 本例程在主线程连接，最多等待 3 秒，期间窗口消息会暂停处理
            if not connect(camera):                         # 调用上面的普通函数，False 表示本次连接失败
                set_disconnected(camera)                    # 调用上面的普通函数，记录断开并清空旧图片
                time.sleep(RECONNECT_SECONDS)               # 等待 1 秒，避免连接失败时快速反复重试
                continue                                    # 回到外层循环，再次执行 connect(camera)

            # 连接已由 connect(camera) 建立；with 只启动取图线程，并在离开时停止和释放
            with camera:
                while camera.is_running:
                    if cv2.waitKey(20) == 27:
                        return                              # 结束 main()；先退出 with，再执行 finally 关闭窗口

                    image = camera.latest(MAX_AGE)          # 取得有效图片；无图片或收到后超过 0.5 秒返回 None
                    if image is None:
                        continue                            # 跳过本次识别，重新等待后台更新图片

                    target_data = find_target(image)        # 引用 target_observation.py，得到蓝色目标中心和二维偏差
                    cv2.imshow("Camera age and reconnect - Esc to close", draw_target_marks(image, target_data))

            set_disconnected(camera)                        # with 已停止线程、释放旧连接，再清空图片信息
            time.sleep(RECONNECT_SECONDS)                   # 等待后回到外层循环，再次调用 connect(camera)
    except (ValueError, cv2.error) as exc:
        log_message("ERROR", "camera", str(exc))
    except KeyboardInterrupt:
        log_message("INFO", "camera", "Ctrl+C 主动结束")
    finally:
        cv2.destroyAllWindows()                             # 正常结束、中断或报错后都关闭图片窗口


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def connect(camera):", from: 15, to: 36, defaultOpen: false },
    { label: "def set_disconnected(camera):", from: 40, to: 50, defaultOpen: false },
  ],
}
