// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const yoloImageDetection = {
  title: "yolo_image_detection.py",
  code: `from pathlib import Path
import json
import os
import time

import cv2
import numpy as np

# --- 本例程可调整的参数 ---
# 置信度是模型对当前结果的评分，不是物体类别一定正确的概率
CONFIDENCE = 0.25                          # 只保留置信度达到 0.25 的检测结果

# --- 共用配置（一般不用动）---
COMMON_DIR = Path(__file__).parents[1] / "common"
IMAGE_PATH = COMMON_DIR / "street.jpg"     # 用于第一次检测的固定图片

def load_image():
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(IMAGE_PATH, dtype=np.uint8)
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

def load_yolo_resources():
    """读取 common 中的类别标签和本地模型，返回标签表与模型对象。"""
    os.environ["YOLO_AUTOINSTALL"] = "false"                # 缺少依赖时直接报错，不在运行中自动安装
    os.environ["YOLO_OFFLINE"] = "true"                     # 只使用本地模型，不连接网络下载资源
    # ultralytics 第一次导入时读取上面两个设置，所以必须先设置再导入
    from ultralytics import YOLO

    label_items = json.loads((COMMON_DIR / "coco_labels.json").read_text(encoding="utf-8"))
    labels = {}
    # label_items 是按顺序保存的类别列表；改成以 id 为键后，可以直接用 class_id 查中英文名
    for item in label_items:
        labels[item["id"]] = item                           # 类别编号同时对应稳定的中英文名称
    model = YOLO(str(COMMON_DIR / "yolo11n.pt"))            # 读取本地模型并得到后续检测使用的对象
    return labels, model

def detect_objects(model, image, confidence, image_size=320):
    """把模型输出整理为稳定检测字段，并返回处理毫秒数。"""
    start_time = time.monotonic()                           # 单调时钟只向前走，适合计算一段代码的耗时
    # predict() 返回每张输入图片的 Results，下面五个参数依次说明图片、最低分数、输入尺寸、设备和日志开关
    yolo_results = model.predict(
        image,                                              # 要检测的 OpenCV BGR 图片
        conf=confidence,                                    # 丢弃低于这个置信度的检测结果
        imgsz=image_size,                                   # 模型处理图片时使用的输入尺寸
        device="cpu",                                       # 明确使用 CPU，电脑和树莓派都能运行
        verbose=False,                                      # 不打印 Ultralytics 自带的逐张检测日志
    )
    yolo_result = yolo_results[0]                           # 本次只有一张图片，取得它对应的 Results

    # cls、conf 和 xyxy 原本是张量；cpu().tolist() 把它们转成容易观察的 Python 列表
    # 当前 Ultralytics 在 NMS 后按置信度从高到低排列，因此索引 0 是置信度最高的保留目标
    # 三个列表的相同位置共同描述一个目标，例如索引 0 是第一个目标的类别、置信度和检测框
    print(f"类别编号 cls: {yolo_result.boxes.cls.cpu().tolist()}")
    print(f"置信度 conf: {yolo_result.boxes.conf.cpu().tolist()}")
    print(f"检测框 xyxy（左上 x/y, 右下 x/y）: {yolo_result.boxes.xyxy.cpu().tolist()}")

    detections = []
    for box in yolo_result.boxes:
        class_id = int(box.cls.item())
        detections.append({
            "class_id": class_id,                           # 稳定类别编号，界面语言切换时保持不变
            "label": yolo_result.names[class_id],           # 模型内的英文规范名，供筛选逻辑使用
            "confidence": float(box.conf.item()),           # 0 到 1 的置信度分数
            "box": box.xyxy[0].cpu().tolist(),              # 左上角 x/y 和右下角 x/y
        })
    detection_time = (time.monotonic() - start_time) * 1000  # 秒乘 1000 得到本次检测耗时，单位毫秒
    return detections, detection_time

def draw_detections(image, detections, detection_time):
    """复制图片，再画出英文类别、置信度、检测框和处理耗时。"""
    marked_image = image.copy()
    for detection in detections:
        x1, y1, x2, y2 = detection["box"]
        x1, y1, x2, y2 = round(x1), round(y1), round(x2), round(y2)
        cv2.rectangle(marked_image, (x1, y1), (x2, y2), (0, 140, 255), 3)
        text = f"{detection['label']} {detection['confidence']:.2f}"
        cv2.putText(marked_image, text, (x1, max(25, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 140, 255), 2)
    cv2.putText(marked_image, f"objects={len(detections)}  time={detection_time:.0f} ms", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 176, 255), 2)
    return marked_image

def main():
    """使用固定图片认识本地 YOLO 模型、检测字段和绘图流程。"""
    image = load_image()                                    # 复用例程 22 的固定图片读取函数
    labels, model = load_yolo_resources()                   # 得到中英文标签表和可调用的模型对象
    detections, detection_time = detect_objects(model, image, CONFIDENCE, image_size=640)

    print()
    print("后续统一字段: class_id, label, confidence, box")
    print(f"检测数量: {len(detections)}")
    print(f"检测耗时: {detection_time:.0f} ms")

    detection_number = 1
    for detection in detections:
        x1, y1, x2, y2 = detection["box"]
        chinese_label = labels[detection["class_id"]]["zh"]
        print(
            f"目标 {detection_number}: ID: {detection['class_id']:<2}  "
            f"类别: {detection['label']} / {chinese_label}  "
            f"置信度: {detection['confidence']:.2f}  "
            f"检测框: ({x1:.0f}, {y1:.0f}) - ({x2:.0f}, {y2:.0f})"
        )
        detection_number += 1                               # 下一条检测结果使用下一个编号

    cv2.imshow("YOLO image detection - press any key", draw_detections(image, detections, detection_time))
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_image():", from: 17, to: 20, defaultOpen: false },
    { label: "def load_yolo_resources():", from: 22, to: 35, defaultOpen: false },
    { label: "def detect_objects(model, image, confidence, image_size=320):", from: 37, to: 67, defaultOpen: false },
    { label: "def draw_detections(image, detections, detection_time):", from: 69, to: 79, defaultOpen: false },
    { label: "def main():", from: 81, to: 106, defaultOpen: true },
  ],
}
