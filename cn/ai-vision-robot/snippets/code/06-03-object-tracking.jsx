// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const objectTracking = {
  title: "object_tracking.py",
  code: `import time

import cv2

from camera import Camera, log_message     # 沿用例程 32 的实时摄像头输入
from yolo_detection import IMAGE_SIZE, load_yolo_resources  # 沿用例程 32 的模型、标签和输入尺寸

# --- 本例程可调整的参数 ---
TARGET_LABEL = "person"                    # 只保留 person 类别的跟踪结果
CONFIDENCE = 0.25                          # 全模块统一只保留置信度达到 0.25 的结果

def track_objects(model, image, confidence):
    """调用模型自带的跟踪能力，在稳定检测字段中增加持续编号。"""
    start_time = time.monotonic()                           # 记录开始时刻，用于计算整次跟踪耗时
    # track() 是 Ultralytics 模型对象自带的跟踪入口；本例程调用能力，不自行实现跟踪算法
    # 返回值仍是 Results 列表，但每个已关联目标比普通检测多一个持续使用的 id
    tracking_results = model.track(
        image,                                              # 要跟踪的摄像头图片
        persist=True,                                       # 保留前一张图片的目标关系和编号
        # bytetrack.yaml 随 Ultralytics 安装，保存跟踪器类型和匹配阈值，不是本例程的材料文件
        tracker="bytetrack.yaml",                           # 读取内置配置，使用 ByteTrack 关联前后图片中的目标
        conf=confidence,                                    # 丢弃低于这个置信度的跟踪结果
        imgsz=IMAGE_SIZE,                                   # 沿用例程 32 的固定输入尺寸
        device="cpu",                                       # 明确使用 CPU，电脑和树莓派都能运行
        verbose=False,                                      # 不打印 Ultralytics 自带的逐张日志
    )
    yolo_result = tracking_results[0]                       # 本次只有一张图片，取得它对应的 Results

    # 把 Results 中的张量转换为容易筛选、绘图和传给后续例程的 Python 字段
    tracks = []
    if yolo_result.boxes.id is not None:
        for box in yolo_result.boxes:
            class_id = int(box.cls.item())
            tracks.append({
                "track_id": int(box.id.item()),             # 同一个目标在连续图片中的持续编号
                "class_id": class_id,                       # 沿用例程 32 的稳定类别编号
                "label": yolo_result.names[class_id],       # 沿用模型内部的英文规范名
                "confidence": float(box.conf.item()),       # 0 到 1 的跟踪置信度
                "box": box.xyxy[0].cpu().tolist(),          # 左上角 x/y 和右下角 x/y
            })

    tracking_time = (time.monotonic() - start_time) * 1000   # 秒乘 1000 得到本次跟踪耗时，单位毫秒
    return tracks, tracking_time

def choose_target(tracks, selected_id, target_label):
    """第一次选择面积最大的指定类别，之后只寻找同一个跟踪编号。"""
    # 先从模型返回的所有类别中，只留下本例程要跟踪的人物
    candidates = []
    for track in tracks:
        if track["label"] == target_label:
            candidates.append(track)

    if selected_id is None and candidates:
        # 程序刚开始时还没有锁定编号，用检测框面积选择画面中最主要的人物
        largest_candidate = candidates[0]                   # 比较前的初始赋值
        largest_area = 0
        for candidate in candidates:
            x1, y1, x2, y2 = candidate["box"]
            area = (x2 - x1) * (y2 - y1)
            if area > largest_area:
                largest_candidate, largest_area = candidate, area
        selected_id = largest_candidate["track_id"]         # 第一次选最大目标，后续不自动换成其他编号

    for candidate in candidates:
        if candidate["track_id"] == selected_id:
            return candidate, selected_id                   # 编号仍在画面中，继续返回同一个人物

    return None, selected_id                                # 目标丢失时保留编号，但本帧不产生目标

def draw_tracks(image, tracks, selected_id, target_label, tracking_time):
    """候选画橘框，当前选中目标画红框，并显示类别、编号和置信度。"""
    marked_image = image.copy()
    for track in tracks:                                    # 逐个读取跟踪对象，给符合类别的对象画边框
        if track["label"] != target_label:                  # 过滤其他类别，只继续处理本例程指定的 person
            continue                                        # 跳过本次剩余绘图，进入下一个跟踪对象
        x1, y1, x2, y2 = track["box"]
        x1, y1, x2, y2 = round(x1), round(y1), round(x2), round(y2)

        color = (0, 140, 255)
        if track["track_id"] == selected_id:
            color = (0, 0, 255)                             # 红框表示程序当前锁定的人物

        cv2.rectangle(marked_image, (x1, y1), (x2, y2), color, 3)
        text = f"{track['label']}  ID {track['track_id']}  {track['confidence']:.2f}"
        cv2.putText(marked_image, text, (x1, max(25, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    cv2.putText(marked_image, f"time={tracking_time:.0f} ms", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 176, 255), 2)
    return marked_image

def main():
    """实时跟踪摄像头中的人物，并持续锁定第一次选择的编号。"""
    _, model = load_yolo_resources()                        # 沿用例程 32 的本地模型设置
    selected_id = None                                      # None 表示还没有选定要持续跟踪的编号
    last_state = None                                       # 只在状态或编号改变时输出一行日志
    try:
        with Camera() as camera:
            while True:
                if cv2.waitKey(1) == 27:
                    break                                   # Esc 结束实时跟踪循环
                image = camera.latest()                     # 取得 0.5 秒内的最新图片
                if image is None:
                    continue                                # 没有有效图片时等待摄像头更新

                # 第一步：模型关联前后图片中的目标，并为同一个目标尽量保持相同编号
                tracks, tracking_time = track_objects(model, image, CONFIDENCE)

                # 第二步：第一次选择主要人物，之后只寻找同一个 track_id，不自动换人
                target, selected_id = choose_target(tracks, selected_id, TARGET_LABEL)
                state = "lost"
                if target is not None:
                    state = "tracking"                      # tracking 表示锁定编号仍在当前画面中

                # 第三步：状态变化时打印；窗口中红框是锁定目标，橘框是其他候选
                current_state = (state, selected_id)
                if current_state != last_state:
                    log_message("INFO", "tracking", f"状态: {state}  编号: {selected_id}")
                    last_state = current_state
                cv2.imshow("Object tracking - Esc to close", draw_tracks(image, tracks, selected_id, TARGET_LABEL, tracking_time))
    except ValueError as exc:
        log_message("ERROR", "tracking", str(exc))
    except KeyboardInterrupt:
        log_message("INFO", "tracking", "Ctrl+C 主动结束")
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def track_objects(model, image, confidence):", from: 12, to: 43, defaultOpen: false },
    { label: "def choose_target(tracks, selected_id, target_label):", from: 45, to: 68, defaultOpen: false },
    { label: "def draw_tracks(image, tracks, selected_id, target_label, tracking_time):", from: 70, to: 88, defaultOpen: false },
    { label: "def main():", from: 90, to: 124, defaultOpen: true },
  ],
}
