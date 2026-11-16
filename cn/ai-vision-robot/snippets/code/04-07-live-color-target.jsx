// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const liveColorTarget = {
  title: "live_color_target.py",
  code: `from datetime import datetime
import threading                           # 使用后台线程执行 更新摄像头图片 的函数
import time                                # 使用单调时间计算图片收到后经过的秒数

import cv2

from target_observation import draw_target_marks, find_target  # 吸收例程 23 的目标观测和结果标记函数

# --- 本例程可调整的参数 ---
CAMERA_URL = "rtsp://192.168.43.226:554/11" # 填写 RTSP 摄像头地址
MAX_AGE = 0.5                              # 图片收到后超过 0.5 秒就不再用于识别，单位秒

def log_message(level, source, message):
    """按照时间、级别、来源和说明打印一条规范化日志。"""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"{current_time} {level:<7} {source:<8} {message}")

class Camera:
    """在例程 18 的基础上，使用后台线程持续更新最新图片。"""

    def __init__(self, camera_url):
        """保存摄像头地址，并准备最新图片、编号、接收时间和线程状态。"""
        self.camera_url = camera_url
        self.capture = None
        self.frame_data = {
            "image": None,                                  # 最新图片；还没有图片时为 None
            "frame_number": 0,                              # 每取得一张新图片就加 1，用于判断是否重复
            "received_at": None,                            # 图片进入本机时的单调时间，用于计算年龄
        }
        self.is_running = False                             # 更新图片的线程的运行标记
        self.thread = None                                  # 保存后台线程对象，退出时需要等待它结束

    def __enter__(self):
        """进入 with 时连接摄像头，并启动后台取图线程。"""
        self.capture = cv2.VideoCapture(self.camera_url)
        if not self.capture.isOpened():
            self.capture.release()                          # 进入 with 失败时也释放这次连接
            raise ValueError("摄像头连接失败，请检查地址和网络")

        log_message("INFO", "camera", "状态变为 connected")
        self.is_running = True
        # 创建后台线程，线程启动后执行当前对象的 update_image()
        self.thread = threading.Thread(target=self.update_image, daemon=True)
        self.thread.start()
        return self

    def update_image(self):
        """在线程中持续取得图片，并替换当前 Camera 保存的最新图片。"""
        while self.is_running:                              # True 时持续取图，退出 with 后__exit__（）使其变成 False
            is_received, image = self.capture.read()        # 返回 是否取得图片，以及取得的图片
            if not is_received:
                log_message("WARNING", "camera", "状态变为 disconnected")
                self.is_running = False                     # 改为 False 后，后台线程和主程序的 while 条件都不再成立
                break                                       # break 立即结束当前 while，update_image() 随后返回

            # 整体替换字典，让图片、编号和接收时间一起更新，主函数取得的是同一张图片的信息
            self.frame_data = {
                "image": image,                             # 保存本次取得的图片
                "frame_number": self.frame_data["frame_number"] + 1,
                "received_at": time.monotonic(),            # 取得只向前计时的秒数，不受电脑校时影响
            }

    def latest_data(self):
        """返回后台线程最近一次取得的图片、编号和接收时间。"""
        return self.frame_data.copy()                       # 复制字典；其中的图片仍是同一张图片，没有复制像素

    def __exit__(self, exc_type, exc_value, traceback):
        """离开 with 时停止并等待后台线程，再释放摄像头。"""
        self.is_running = False                             # 把 update_image() 的 while 条件改为 False
        self.thread.join(timeout=2.0)                       # 最多等待 2 秒，让 update_image() 运行结束
        self.capture.release()                              # 关闭 self.capture 保存的视频流

def main():
    """后台更新图片，主程序只识别有效期内、没有处理过的图片。"""
    last_frame_number = 0                                   # 保存主程序已经处理过的最新图片编号

    try:
        with Camera(CAMERA_URL) as camera:
            while camera.is_running:                        # is_running 为 True 时重复执行，变成 False 后结束循环
                if cv2.waitKey(20) == 27:                   # 等待约 20 毫秒并处理窗口消息，Esc 的按键值是 27
                    break                                   # 结束 main() 的 while，随后离开 with 并调用 __exit__()

                frame_data = camera.latest_data()           # 取得同一张图片及其编号、接收时间
                if frame_data["image"] is None:
                    continue                                # 还没有图片，跳过本轮识别，重新等待后台更新

                # 当前单调时间减去收到时刻，得到图片进入本机后经过的秒数；不包含 RTSP 原有延迟
                age = time.monotonic() - frame_data["received_at"]
                if age > MAX_AGE:                           # 超过允许的存放时间，这张图片已经过期
                    continue                                # 跳过旧画面的识别，重新检查是否收到有效图片

                if frame_data["frame_number"] == last_frame_number:
                    continue                                # 编号相同表示已经处理过，不再重复识别

                last_frame_number = frame_data["frame_number"]  # 保存本次编号，下一轮用它判断图片是否更新
                target_data = find_target(frame_data["image"])  # 引用观测函数，返回蓝色目标的中心和二维偏差
                cv2.imshow("Live color target - Esc to close", draw_target_marks(frame_data["image"], target_data))  # 引用标记函数绘制当前观测结果
    except ValueError as exc:                               # 如果 Camera.__enter__() 抛出的连接错误，在这里捕获
        log_message("ERROR", "camera", str(exc))
    except KeyboardInterrupt:
        log_message("INFO", "camera", "Ctrl+C 主动结束")
    finally:
        cv2.destroyAllWindows()                             # 正常结束或中断后都关闭图片窗口

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def log_message(level, source, message):", from: 13, to: 16, defaultOpen: false },
    { label: "def main():", from: 73, to: 103, defaultOpen: true },
  ],
}
