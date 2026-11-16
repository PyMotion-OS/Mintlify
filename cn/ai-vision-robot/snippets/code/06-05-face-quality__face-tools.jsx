// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const faceTools = {
  title: "face_tools.py",
  code: `from pathlib import Path

import cv2
import numpy as np


COMMON_DIR = Path(__file__).parents[1] / "common"
MODEL_PATH = COMMON_DIR / "face_detection_yunet_2023mar.onnx"
IMAGE_PATH = Path(__file__).with_name("face_sample.png")


# 读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片
def load_image():
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(IMAGE_PATH, dtype=np.uint8)
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)


# 读取本地 YuNet 文件，并返回 OpenCV 人脸检测器
def create_face_detector():
    """读取本地 YuNet 文件，并返回 OpenCV 人脸检测器。"""
    model_bytes = np.fromfile(MODEL_PATH, dtype=np.uint8)   # 模型字节写法支持 Windows 中文路径
    return cv2.FaceDetectorYN.create(
        "onnx",
        model_bytes,
        np.empty(0, np.uint8),
        (320, 320),
        0.85,                                               # 只保留置信度达到 0.85 的人脸
    )


# 检测人脸，再把原始数组整理成人脸框、landmarks（五个人脸关键点坐标）和置信度
def observe_faces(detector, image):
    """检测人脸，再把原始数组整理成人脸框、landmarks（五个人脸关键点坐标）和置信度。"""
    # 创建检测器时的 320×320 只是初始值；检测前必须换成当前图片的真实尺寸
    image_height, image_width = image.shape[0], image.shape[1]
    detector.setInputSize((image_width, image_height))      # 匹配真实图片避免报错，返回坐标也直接对应原图像素
    detection_result = detector.detect(image)               # 调用例程 34 的 YuNet 检测入口
    raw_faces = detection_result[1]                         # 第 1 项是后面需要的人脸数组
    if raw_faces is None:
        return []                                           # 没有检测到人脸时返回空列表

    faces = []
    # 每次取一张人脸，再把固定的 15 个数整理成三个稳定字段
    for raw_face in raw_faces:
        face_x = round(raw_face[0])
        face_y = round(raw_face[1])
        face_width = round(raw_face[2])
        face_height = round(raw_face[3])
        right_eye = [float(raw_face[4]), float(raw_face[5])]
        left_eye = [float(raw_face[6]), float(raw_face[7])]
        nose_tip = [float(raw_face[8]), float(raw_face[9])]
        right_mouth = [float(raw_face[10]), float(raw_face[11])]
        left_mouth = [float(raw_face[12]), float(raw_face[13])]
        landmarks = [right_eye, left_eye, nose_tip, right_mouth, left_mouth]
        confidence = float(raw_face[14])
        faces.append({
            "box": [face_x, face_y, face_width, face_height],
            "landmarks": landmarks,
            "confidence": confidence,
        })
    return faces


# 给每张人脸画出检测框、五个关键点和置信度
def draw_faces(image, faces):
    """给每张人脸画出检测框、五个关键点和置信度。"""
    marked_image = image.copy()
    for face in faces:
        face_x, face_y, face_width, face_height = face["box"]
        cv2.rectangle(marked_image, (face_x, face_y), (face_x + face_width, face_y + face_height), (0, 200, 0), 3)
        for point in face["landmarks"]:
            cv2.circle(marked_image, (round(point[0]), round(point[1])), 4, (0, 176, 255), -1)
        text = f"face {face['confidence']:.2f}"
        cv2.putText(marked_image, text, (face_x, max(25, face_y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 0), 2)
    return marked_image`,
  folds: [
    { label: "def load_image():", from: 13, to: 16, defaultOpen: false },
    { label: "def create_face_detector():", from: 20, to: 29, defaultOpen: false },
    { label: "def observe_faces(detector, image):", from: 33, to: 62, defaultOpen: false },
    { label: "def draw_faces(image, faces):", from: 66, to: 76, defaultOpen: false },
  ],
}
