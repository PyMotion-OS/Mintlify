// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const faceFeatureComparison = {
  title: "face_feature_comparison.py",
  code: `from pathlib import Path

import cv2
import numpy as np

from face_tools import create_face_detector, get_quality_face, load_image  # 吸收例程 35 的检测与质量判断


# --- 本例程可调整的参数 ---
MATCH_THRESHOLD = 0.50                     # 余弦相似度达到此值时，判断为同一个人
PERSON_NAME = "user01"                     # 人为设置的登记代号，匹配到这组特征后返回它，不是模型猜出的姓名

# --- 共用配置（一般不用动）---
COMMON_DIR = Path(__file__).parents[1] / "common"
RECOGNITION_MODEL = COMMON_DIR / "face_recognition_sface_2021dec.onnx"
FEATURE_FILE = COMMON_DIR / "faces.npz"     # 直接写入 common，后续例程读这一份


# 读取本地 SFace 文件，并返回 OpenCV 人脸特征模型
def create_face_recognizer():
    """读取本地 SFace 文件，并返回 OpenCV 人脸特征模型。"""
    model_bytes = np.fromfile(RECOGNITION_MODEL, dtype=np.uint8)
    # FaceRecognizerSF 是 OpenCV 自带的 SFace 使用入口；本例程调用成熟模型，不展开网络结构
    return cv2.FaceRecognizerSF.create(
        "onnx",                                             # 告诉 OpenCV 传入的是 ONNX 模型内容
        model_bytes,                                        # 从本地文件读取的 SFace 模型内容
        np.empty(0, np.uint8),                              # SFace 不需要单独的配置文件
    )


# 检测一张质量合格的人脸，完成对齐，再返回 SFace 提取的 128 个特征
def get_face_feature(detector, recognizer, image):
    """检测一张质量合格的人脸，完成对齐，再返回 SFace 提取的 128 个特征。"""
    raw_face = get_quality_face(detector, image)            # 吸收例程 35，返回 SFace 需要的 YuNet 原始数据
    aligned_face = recognizer.alignCrop(image, raw_face)    # alignCrop() 根据五个关键点摆正并裁剪人脸
    feature_row = recognizer.feature(aligned_face)          # feature() 把对齐图片转换成一行 128 个特征数值
    return feature_row.reshape(-1)                          # reshape(-1) 把一行数组整理成一维数组，仍保留 128 个数


# 用 SFace 比较两组人脸特征，返回余弦相似度
def compare_face_features(recognizer, reference_feature, query_feature):
    """用 SFace 比较两组人脸特征，返回余弦相似度。"""
    # match() 是 SFace 自带的特征比较能力；FR_COSINE 指定余弦相似度，越大表示越相似
    score = recognizer.match(reference_feature, query_feature, cv2.FaceRecognizerSF_FR_COSINE)
    return float(score)                                     # 相似度不是概率，0.75 不表示有 75% 的把握


# 把匿名代号和对应人脸特征保存为本地 NPZ 文件
def save_feature_file(names, features):
    """把匿名代号和对应人脸特征保存为本地 NPZ 文件。"""
    FEATURE_FILE.parent.mkdir(exist_ok=True)                # 第一次保存时创建特征文件所在文件夹
    # NPZ 是保存多个 NumPy 数组的文件；每个代号对应一行 128 个特征数值
    feature_rows = np.asarray(features, dtype=np.float32).reshape(-1, 128)
    # names 保存文字数组，features 保存数值数组；文件不包含原始照片
    np.savez(FEATURE_FILE, names=np.asarray(names, dtype=str), features=feature_rows)


def main():
    """提取两张图片的特征并比较，再把登记图片的特征保存为 NPZ。"""
    # 第一步：创建检测器和特征模型，分别负责找到人脸和提取特征
    detector = create_face_detector()
    recognizer = create_face_recognizer()

    # 第二步：两张图片分别经过质量检查、关键点对齐和 128 个特征提取
    reference_image, query_image = load_image()             # 两张图片的路径和读取步骤都在 face_tools.py
    reference_feature = get_face_feature(detector, recognizer, reference_image)
    query_feature = get_face_feature(detector, recognizer, query_image)

    # 第三步：把两组特征交给 SFace 比较，再用阈值解释分数
    score = compare_face_features(recognizer, reference_feature, query_feature)
    print(f"特征数量: {reference_feature.size}")
    print(f"余弦相似度: {score:.3f}")
    if score >= MATCH_THRESHOLD:
        print("匹配结果: 同一个人")
    else:
        print("匹配结果: 不匹配")

    # 第四步：只登记 face_sample.png 的特征；face_sample_2.png 用来检验，不混入登记样本
    save_feature_file([PERSON_NAME], [reference_feature])   # 两个列表的同一位置对应同一个人
    print(f"登记代号: {PERSON_NAME}")
    print(f"特征文件: {FEATURE_FILE}")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def create_face_recognizer():", from: 20, to: 28, defaultOpen: false },
    { label: "def get_face_feature(detector, recognizer, image):", from: 32, to: 37, defaultOpen: false },
    { label: "def compare_face_features(recognizer, reference_feature, query_feature):", from: 41, to: 45, defaultOpen: false },
    { label: "def save_feature_file(names, features):", from: 49, to: 55, defaultOpen: false },
  ],
}
