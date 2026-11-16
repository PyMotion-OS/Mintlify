// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
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
RECOGNITION_MODEL = COMMON_DIR / "face_recognition_sface_2021dec.onnx"
FEATURE_FILE = COMMON_DIR / "faces.npz"    # 吸收 36 的保存接口；36 的视频识别主流程只读此文件

def create_face_detector():
    """读取本地 YuNet 文件，并返回 OpenCV 人脸检测器。"""
    model_bytes = np.fromfile(DETECTION_MODEL, dtype=np.uint8)
    return cv2.FaceDetectorYN.create("onnx", model_bytes, np.empty(0, np.uint8), (320, 320), 0.80)

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

def get_quality_face(detector, image):
    """返回合格人脸的 YuNet 原始数据；实时画面不合格时返回 None。"""
    image_height, image_width = image.shape[0], image.shape[1]
    detector.setInputSize((image_width, image_height))
    detection_result = detector.detect(image)
    raw_faces = detection_result[1]
    if raw_faces is None or len(raw_faces) != 1:
        return None                                         # 实时画面中无脸或多人时，主循环继续等待

    raw_face = raw_faces[0]                                 # 已确认只有一张人脸，第 0 项就是这张人脸
    # 质量判断只读取 box；五个关键点仍保留在 raw_face 中，供 SFace 对齐使用
    face = {"box": [round(raw_face[0]), round(raw_face[1]), round(raw_face[2]), round(raw_face[3])]}
    is_good, _ = check_face_quality(image, face)
    if not is_good:
        return None                                         # 尺寸、亮度或清晰度不合格，不进入特征提取
    return raw_face

def create_face_recognizer():
    """读取本地 SFace 文件，并返回 OpenCV 人脸特征模型。"""
    model_bytes = np.fromfile(RECOGNITION_MODEL, dtype=np.uint8)
    # FaceRecognizerSF 是 OpenCV 自带的 SFace 使用入口；本例程调用成熟模型，不展开网络结构
    return cv2.FaceRecognizerSF.create(
        "onnx",                                             # 告诉 OpenCV 传入的是 ONNX 模型内容
        model_bytes,                                        # 从本地文件读取的 SFace 模型内容
        np.empty(0, np.uint8),                              # SFace 不需要单独的配置文件
    )

def get_face_feature(detector, recognizer, image):
    """提取合格人脸的 128 个特征；没有合格人脸时返回 None。"""
    raw_face = get_quality_face(detector, image)            # 吸收例程 35，返回 SFace 需要的 YuNet 原始数据
    if raw_face is None:
        return None                                         # 36 起实时识别用返回值跳过普通无效画面
    aligned_face = recognizer.alignCrop(image, raw_face)    # alignCrop() 根据五个关键点摆正并裁剪人脸
    feature_row = recognizer.feature(aligned_face)          # feature() 把对齐图片转换成一行 128 个特征数值
    return feature_row.reshape(-1)                          # reshape(-1) 把一行数组整理成一维数组，仍保留 128 个数

def compare_face_features(recognizer, reference_feature, query_feature):
    """用 SFace 比较两组人脸特征，返回余弦相似度。"""
    # match() 是 SFace 自带的特征比较能力；FR_COSINE 指定余弦相似度，越大表示越相似
    score = recognizer.match(reference_feature, query_feature, cv2.FaceRecognizerSF_FR_COSINE)
    return float(score)                                     # 相似度不是概率，0.75 不表示有 75% 的把握

def draw_faces(image, person_name, score):
    """复制图片，在水印下方显示识别代号和相似度。"""
    marked_image = image.copy()                             # 只在副本上绘制，保留原始图片供后续识别
    text = person_name
    if score is not None:
        text += f"  score={score:.3f}"                       # 没有合格人脸时 score 为 None，只显示人脸状态
    cv2.rectangle(marked_image, (10, 65), (650, 120), (32, 32, 32), -1)
    cv2.putText(marked_image, text, (20, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 176, 255), 2)
    return marked_image

def save_feature_file(names, features):
    """把匿名代号和对应人脸特征保存为本地 NPZ 文件。"""
    FEATURE_FILE.parent.mkdir(exist_ok=True)                # 第一次保存时创建特征文件所在文件夹
    # NPZ 是保存多个 NumPy 数组的文件；每个代号对应一行 128 个特征数值
    feature_rows = np.asarray(features, dtype=np.float32).reshape(-1, 128)
    # names 保存文字数组，features 保存数值数组；文件不包含原始照片
    np.savez(FEATURE_FILE, names=np.asarray(names, dtype=str), features=feature_rows)`,
  folds: [
    { label: "def create_face_detector():", from: 16, to: 19, defaultOpen: false },
    { label: "def check_face_quality(image, face):", from: 21, to: 50, defaultOpen: false },
    { label: "def get_quality_face(detector, image):", from: 52, to: 67, defaultOpen: false },
    { label: "def create_face_recognizer():", from: 69, to: 77, defaultOpen: false },
    { label: "def get_face_feature(detector, recognizer, image):", from: 79, to: 86, defaultOpen: false },
    { label: "def compare_face_features(recognizer, reference_feature, query_feature):", from: 88, to: 92, defaultOpen: false },
    { label: "def draw_faces(image, person_name, score):", from: 94, to: 102, defaultOpen: false },
    { label: "def save_feature_file(names, features):", from: 104, to: 110, defaultOpen: false },
  ],
}
