// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const camera = {
  title: "camera.py",
  code: `from datetime import datetime
import threading
import time

import cv2


# 按照时间、级别、来源和说明打印一条规范化日志
def log_message(level, source, message):
    """按照时间、级别、来源和说明打印一条规范化日志。"""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"{current_time} {level:<7} {source:<8} {message}")


class Camera:
    """管理一次摄像头连接，并在后台持续更新最新图片。"""

    CAMERA_URL = "rtsp://192.168.43.226:554/11"             # 从例程25开始由Camera保存默认地址

    def __init__(self):
        self.camera_url = self.CAMERA_URL                   # 主文件的connect(camera)使用这个地址连接
        self.frame_data = {
            "state": "waiting",                             # waiting、connected 或 disconnected
            "image": None,                                  # 当前最新图片，还未取得时为 None
            "frame_number": 0,                              # 每取得一张新图片就加 1
            "received_at": None,                            # 收到最新图片的单调时间
        }
        self.is_running = False                             # True 让后台线程继续取图，False 让线程结束
        self.capture = None                                 # 保存当前 VideoCapture，退出时需要释放
        self.thread = None                                  # 保存后台线程，退出时需要等待它结束

    def __enter__(self):
        """进入 with 时启动后台线程，为当前连接持续取图。"""
        # 连接已由主文件的 connect(camera) 建立，这里只启动例程 24 已经展示的取图线程
        self.is_running = True                              # 后台线程启动后可以进入取图循环
        self.thread = threading.Thread(target=self.update_image, daemon=True)
        self.thread.start()                                 # 开始执行 update_image()，主函数继续向下运行
        return self                                         # with ... as camera 得到当前 Camera 对象

    def update_image(self):
        """持续更新图片；连续五次失败后结束当前连接会话。"""
        failures = 0                                        # 成功取得图片后会重新从 0 计算
        while self.is_running and failures < 5:
            try:
                is_received, image = self.capture.read()    # 返回是否成功，以及本次取得的图片
            except cv2.error:                               # 视频流报错时也算本次取图失败，让主函数能够重连
                is_received, image = False, None
            if not is_received:
                failures += 1                               # 连续达到五次后，while 条件结束当前会话
                continue                                    # 本次没有新图片，不覆盖上一份图片数据

            failures = 0                                    # 本次成功，前面的偶发失败不再累计
            self.frame_data = {
                "state": "connected",                       # 当前连接仍能正常提供图片
                "image": image,                             # 保存刚取得的最新图片
                # 编号加 1 表示出现新图片，需要去重的任务仍可通过 latest_data() 取得编号
                "frame_number": self.frame_data["frame_number"] + 1,
                "received_at": time.monotonic(),            # 沿用例程 24，记录图片进入本机的时刻
            }

        self.is_running = False                             # 通知主函数：当前连接已经不能继续取图

    def latest_data(self):
        """返回当前连接状态、最新图片、帧编号和图片年龄。"""
        frame_data = self.frame_data.copy()                 # 复制后再加入 age，不修改后台线程的数据
        if frame_data["received_at"] is None:               # 没有有效图片时，图片年龄也不存在
            frame_data["age"] = None
        else:
            # 吸收例程 24 主程序的年龄计算：当前时间减去收到时刻，得到本机存放秒数
            frame_data["age"] = time.monotonic() - frame_data["received_at"]
        return frame_data                                   # 返回状态、图片、编号、接收时间和年龄，供 latest() 或主程序使用

    def latest(self, max_age=0.5):
        """返回最新且没有过期的图片，默认有效期为 0.5 秒。"""
        # 吸收例程 24 主程序中“没有图片”和“图片过期”的判断，调用方只接收图片或 None
        frame_data = self.latest_data()                     # 先取得同一张图片及其年龄，再判断是否可以使用
        if frame_data["image"] is None:                     # 还没取得首张图片，或断流时已经清空旧图片
            return None
        if frame_data["age"] > max_age:                     # 图片存放时间超过允许值，不再交给后续识别
            return None
        return frame_data["image"]                          # 仍有效的图片可以重复取得，编号去重另用 latest_data()

    def __exit__(self, exc_type, exc_value, traceback):
        """离开 with 时停止后台线程，并释放本次视频连接。"""
        self.is_running = False                             # 让 update_image() 的 while 条件变成 False
        self.thread.join(timeout=2.0)                       # 最多等待 2 秒，让后台取图函数运行结束
        if self.capture is not None:
            self.capture.release()                          # 关闭本次视频流，主函数随后可建立新连接
            self.capture = None`,
  folds: [
    { label: "def log_message(level, source, message):", from: 9, to: 12, defaultOpen: false },
    { label: "    def __init__(self):", from: 20, to: 30, defaultOpen: false },
    { label: "    def __enter__(self):", from: 32, to: 38, defaultOpen: false },
    { label: "    def update_image(self):", from: 40, to: 61, defaultOpen: false },
    { label: "    def latest_data(self):", from: 63, to: 71, defaultOpen: false },
    { label: "    def latest(self, max_age=0.5):", from: 73, to: 81, defaultOpen: false },
    { label: "    def __exit__(self, exc_type, exc_value, traceback):", from: 83, to: 89, defaultOpen: false },
  ],
}
