// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const faceDetection = {
  title: "face_detection.py",
  code: `from pathlib import Path

import cv2
import numpy as np


# --- 本页可调整的参数 ---
MIN_CONFIDENCE = 0.85                      # YuNet 只保留置信度达到 0.85 的人脸

# --- 共用配置（一般不用动）---
COMMON_DIR = Path(__file__).parents[1] / "common"
# YuNet 是 OpenCV Zoo 提供的现成人脸检测模型；模型和 MIT 许可证都放在 common
MODEL_PATH = COMMON_DIR / "face_detection_yunet_2023mar.onnx"
IMAGE_PATH = Path(__file__).with_name("face_sample.png")  # 4.2 拍摄并放入本文件夹的授权肖像


# 读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片
def load_image():
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(IMAGE_PATH, dtype=np.uint8)
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)


# 读取本地 YuNet 文件，并返回 OpenCV 人脸检测器
def create_face_detector():
    """读取本地 YuNet 文件，并返回 OpenCV 人脸检测器。"""
    model_bytes = np.fromfile(MODEL_PATH, dtype=np.uint8)   # 模型字节写法支持 Windows 中文路径
    # FaceDetectorYN 是 OpenCV 自带的 YuNet 使用入口；本页调用成熟模型，不展开网络结构
    return cv2.FaceDetectorYN.create(
        "onnx",                                             # 告诉 OpenCV 传入的是 ONNX 模型内容
        model_bytes,                                        # 从上方本地文件读取的模型内容
        np.empty(0, np.uint8),                              # YuNet 不需要单独的配置文件
        (320, 320),                                         # 创建检测器时必须先给出一个初始输入尺寸
        MIN_CONFIDENCE,                                     # 丢弃低于这个置信度的人脸结果
    )


# 检测人脸，再把原始数组整理成人脸框、landmarks（五个人脸关键点坐标）和置信度
def observe_faces(detector, image):
    """检测人脸，再把原始数组整理成人脸框、landmarks（五个人脸关键点坐标）和置信度。"""
    # 创建检测器时的 320×320 只是初始值；检测前必须换成当前图片的真实尺寸
    image_height, image_width = image.shape[0], image.shape[1]
    detector.setInputSize((image_width, image_height))      # 匹配真实图片避免报错，返回坐标也直接对应原图像素

    # detect() 是 FaceDetectorYN 检测器自带的推理入口，内部使用已经加载的 YuNet 模型
    detection_result = detector.detect(image)               # 返回两个结果：执行状态和原始人脸数组
    raw_faces = detection_result[1]                         # 第 1 项才是后面需要的人脸数组
    if raw_faces is None:
        return []                                           # 没有检测到人脸时返回空列表

    faces = []
    # raw_faces 是“多张人脸组成的数组”；for 每次只取一张人脸的框、五个关键点坐标和置信度
    # landmarks 是人脸识别领域的专业名称，这里就是五个人脸关键点坐标
    for raw_face in raw_faces:
        face_x = round(raw_face[0])                         # 第 0 个数：人脸框左上角 x
        face_y = round(raw_face[1])                         # 第 1 个数：人脸框左上角 y
        face_width = round(raw_face[2])                     # 第 2 个数：人脸框宽度
        face_height = round(raw_face[3])                    # 第 3 个数：人脸框高度

        right_eye = [float(raw_face[4]), float(raw_face[5])]  # 第 4、5 个数：右眼 x/y
        left_eye = [float(raw_face[6]), float(raw_face[7])]  # 第 6、7 个数：左眼 x/y
        nose_tip = [float(raw_face[8]), float(raw_face[9])]  # 第 8、9 个数：鼻尖 x/y
        right_mouth = [float(raw_face[10]), float(raw_face[11])]  # 第 10、11 个数：右嘴角 x/y
        left_mouth = [float(raw_face[12]), float(raw_face[13])]  # 第 12、13 个数：左嘴角 x/y
        landmarks = [right_eye, left_eye, nose_tip, right_mouth, left_mouth]
        confidence = float(raw_face[14])                    # 第 14 个数：人脸置信度

        # 把模型难读的 15 个数整理成三个有名称的字段，后面的绘制函数可以直接使用
        faces.append({
            "box": [face_x, face_y, face_width, face_height],  # 左上角 x/y 和人脸框宽/高
            "landmarks": landmarks,                         # 专业字段名，保存上面五个关键点坐标
            "confidence": confidence,                       # YuNet 给出的人脸置信度
        })
    return faces


# 给每张人脸画出检测框、五个关键点和置信度
def draw_faces(image, faces):
    """给每张人脸画出检测框、五个关键点和置信度。"""
    marked_image = image.copy()
    for face in faces:                                      # 给每一个检测到的人脸画框和关键点
        face_x, face_y, face_width, face_height = face["box"]
        cv2.rectangle(marked_image, (face_x, face_y), (face_x + face_width, face_y + face_height), (0, 200, 0), 3)

        for point in face["landmarks"]:
            cv2.circle(marked_image, (round(point[0]), round(point[1])), 4, (0, 176, 255), -1)
        text = f"face {face['confidence']:.2f}"
        cv2.putText(marked_image, text, (face_x, max(25, face_y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 0), 2)
    return marked_image


def main():
    """调用 YuNet 检测授权肖像，并显示人脸位置、关键点和置信度。"""
    image = load_image()
    detector = create_face_detector()
    faces = observe_faces(detector, image)
    print(f"人脸数量: {len(faces)}")
    cv2.imshow("Face detection - press any key", draw_faces(image, faces))
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_image():", from: 18, to: 21, defaultOpen: false },
    { label: "def create_face_detector():", from: 25, to: 35, defaultOpen: false },
    { label: "def observe_faces(detector, image):", from: 39, to: 74, defaultOpen: false },
    { label: "def draw_faces(image, faces):", from: 78, to: 89, defaultOpen: false },
  ],
}
