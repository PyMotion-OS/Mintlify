// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const faceTools = {
  title: "face_tools.py",
  code: `from pathlib import Path

import cv2
import numpy as np


MIN_FACE_SIZE = 80
MIN_BRIGHTNESS = 45
MAX_BRIGHTNESS = 210
MIN_SHARPNESS = 100.0

COMMON_DIR = Path(__file__).parents[1] / "common"
DETECTION_MODEL = COMMON_DIR / "face_detection_yunet_2023mar.onnx"
DATA_DIR = Path(__file__).with_name("data")
REFERENCE_PATH = DATA_DIR / "face_sample.png"
QUERY_PATH = DATA_DIR / "face_sample_2.png"


# 读取本页的两张图片，返回登记图片和查询图片
def load_image():
    """读取本页的两张图片，返回登记图片和查询图片。"""
    reference_bytes = np.fromfile(REFERENCE_PATH, dtype=np.uint8)
    reference_image = cv2.imdecode(reference_bytes, cv2.IMREAD_COLOR)
    query_bytes = np.fromfile(QUERY_PATH, dtype=np.uint8)
    query_image = cv2.imdecode(query_bytes, cv2.IMREAD_COLOR)
    return reference_image, query_image


# 读取本地 YuNet 文件，并返回 OpenCV 人脸检测器
def create_face_detector():
    """读取本地 YuNet 文件，并返回 OpenCV 人脸检测器。"""
    model_bytes = np.fromfile(DETECTION_MODEL, dtype=np.uint8)
    return cv2.FaceDetectorYN.create("onnx", model_bytes, np.empty(0, np.uint8), (320, 320), 0.80)


# 依次检查人脸完整度、尺寸、亮度和清晰度，再返回是否合格和原因
def check_face_quality(image, face):
    """依次检查人脸完整度、尺寸、亮度和清晰度，再返回是否合格和原因。"""
    face_x, face_y, face_width, face_height = face["box"]
    image_height, image_width = image.shape[0], image.shape[1]
    if face_x < 0 or face_y < 0 or face_x + face_width > image_width or face_y + face_height > image_height:
        return False, "人脸不完整"
    if face_width < MIN_FACE_SIZE or face_height < MIN_FACE_SIZE:
        return False, "人脸太小"

    # 第一步：取出人脸框内的像素；图片切片不会改变原图
    face_image = image[face_y:face_y + face_height, face_x:face_x + face_width]
    # 第二步：resize() 返回一张 112×112 的新图片，让不同大小的人脸使用同一组质量阈值
    standard_face = cv2.resize(face_image, (112, 112))
    # 第三步：把 BGR 彩色图片转换成灰度图片，每个像素只保留一个 0～255 的亮度值
    gray_face = cv2.cvtColor(standard_face, cv2.COLOR_BGR2GRAY)
    brightness = float(gray_face.mean())
    # 第四步：Laplacian() 找出相邻像素的亮度变化；CV_64F 保留计算中的小数和负数
    edges = cv2.Laplacian(gray_face, cv2.CV_64F)
    # 第五步：var() 计算边缘数值的变化程度；清晰图片的边缘变化通常更大
    sharpness = float(edges.var())
    reasons = []
    if brightness < MIN_BRIGHTNESS:
        reasons.append("人脸过暗")
    if brightness > MAX_BRIGHTNESS:
        reasons.append("人脸过亮")
    if sharpness < MIN_SHARPNESS:
        reasons.append("人脸模糊")
    if reasons:
        return False, "、".join(reasons)
    return True, "人脸质量合格"


# 吸收 6.4/6.4 的检测与质量判断，返回 SFace 需要的一行 YuNet 原始数据
def get_quality_face(detector, image):
    """吸收 6.4/6.4 的检测与质量判断，返回 SFace 需要的一行 YuNet 原始数据。"""
    image_height, image_width = image.shape[0], image.shape[1]
    detector.setInputSize((image_width, image_height))
    detection_result = detector.detect(image)
    raw_faces = detection_result[1]
    if raw_faces is None or len(raw_faces) != 1:
        raise ValueError("图片中必须恰好有一张人脸")

    raw_face = raw_faces[0]                                 # 已确认只有一张人脸，第 0 项就是这张人脸
    # 质量判断只读取 box；五个关键点仍保留在 raw_face 中，供 SFace 对齐使用
    face = {"box": [round(raw_face[0]), round(raw_face[1]), round(raw_face[2]), round(raw_face[3])]}
    is_good, reason = check_face_quality(image, face)
    if not is_good:
        raise ValueError(reason)
    return raw_face`,
  folds: [
    { label: "def load_image():", from: 20, to: 26, defaultOpen: false },
    { label: "def create_face_detector():", from: 30, to: 33, defaultOpen: false },
    { label: "def check_face_quality(image, face):", from: 37, to: 66, defaultOpen: false },
    { label: "def get_quality_face(detector, image):", from: 70, to: 85, defaultOpen: false },
  ],
}
