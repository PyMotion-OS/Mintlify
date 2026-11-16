// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const yoloDetection = {
  title: "yolo_detection.py",
  code: `from pathlib import Path
import json
import os
import time

import cv2

# --- 共用配置（一般不用动）---
COMMON_DIR = Path(__file__).parents[1] / "common"
LABELS_PATH = COMMON_DIR / "coco_labels.json"
MODEL_PATH = COMMON_DIR / "yolo11n.pt"
IMAGE_SIZE = 320                           # 输入越小通常检测越快、远处细节越少

def load_yolo_resources():
    """读取 common 中的类别标签和本地模型，返回标签表与模型对象。"""
    os.environ["YOLO_AUTOINSTALL"] = "false"                # 缺少依赖时直接报错，不在运行中自动安装
    os.environ["YOLO_OFFLINE"] = "true"                     # 只使用本地模型，不连接网络下载资源
    # ultralytics 第一次导入时读取上面两个设置，所以必须先设置再导入
    from ultralytics import YOLO

    label_items = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    labels = {}
    # label_items 是按顺序保存的类别列表；改成以 id 为键后，可以直接用 class_id 查中英文名
    for item in label_items:
        labels[item["id"]] = item                           # 类别编号同时对应稳定的中英文名称
    model = YOLO(str(MODEL_PATH))                            # 读取本地模型并得到后续检测使用的对象
    return labels, model

def detect_objects(model, image, confidence):
    """把模型输出整理为稳定检测字段，并返回处理毫秒数。"""
    start_time = time.monotonic()
    yolo_results = model.predict(
        image,                                              # 要检测的 OpenCV BGR 图片
        conf=confidence,                                    # 丢弃低于这个置信度的检测结果
        imgsz=IMAGE_SIZE,                                   # 使用上方固定输入尺寸处理图片
        device="cpu",                                       # 明确使用 CPU，电脑和树莓派都能运行
        verbose=False,                                      # 不打印 Ultralytics 自带的逐张检测日志
    )
    yolo_result = yolo_results[0]                           # 本次只有一张图片，取得它对应的 Results
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
    return marked_image`,
  folds: [
    { label: "def load_yolo_resources():", from: 14, to: 27, defaultOpen: false },
    { label: "def detect_objects(model, image, confidence):", from: 29, to: 50, defaultOpen: false },
    { label: "def draw_detections(image, detections, detection_time):", from: 52, to: 62, defaultOpen: false },
  ],
}
