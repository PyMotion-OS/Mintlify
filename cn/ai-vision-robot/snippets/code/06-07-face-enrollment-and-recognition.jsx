// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const faceEnrollmentAndRecognition = {
  title: "face_enrollment_and_recognition.py",
  code: `from pathlib import Path

import cv2
import numpy as np

from camera import Camera, log_message
from face_tools import compare_face_features, create_face_detector, create_face_recognizer, draw_faces, get_face_feature  # 吸收例程 36 的特征能力，显示结果交给 draw_faces

# --- 本例程可调整的参数 ---
MATCH_THRESHOLD = 0.50                     # 最佳相似度不足此值时显示 unknown

# --- 共用配置（一般不用动）---
FEATURE_FILE = Path(__file__).parents[1] / "common" / "faces.npz"

def load_feature_file():
    """读取本地 NPZ 中的匿名代号和人脸特征；文件不存在时返回空列表。"""
    if not FEATURE_FILE.exists():
        return [], []                                       # 没有登记内容时，交给主函数提示准备特征文件
    # NPZ 是装有多个 NumPy 数组的文件；allow_pickle=False 只读取文字和数字数组
    with np.load(FEATURE_FILE, allow_pickle=False) as feature_file:
        names = feature_file["names"].tolist()              # names 第 i 项对应 features 第 i 行
        features = list(feature_file["features"])           # 每一行保存同一人的 128 个特征
    return names, features

def identify_face(recognizer, query_feature, names, features, threshold):
    """逐一比较查询特征与已登记特征，返回最高分代号和相似度。"""
    if not names:
        return "unknown", 0.0                               # 空库没有可比较特征，等待登记
    best_name, best_score = "unknown", -1.0
    for index in range(len(names)):                         # 1:N 表示一组查询特征与 N 组登记特征分别比较
        score = compare_face_features(recognizer, features[index], query_feature)
        if score > best_score:
            best_name, best_score = names[index], score     # 每次只保留目前最高分及其对应代号
    if best_score < threshold:
        return "unknown", best_score                        # 分数不足时拒绝匹配，仍返回真实分数供观察
    return best_name, best_score

def main():
    """读取登记文件，在视频中识别人脸，显示并打印匹配到的代号。"""
    try:
        # 第一步：复用 35 的模型与特征函数，再读取已登记的代号和对应特征
        detector = create_face_detector()
        recognizer = create_face_recognizer()
        names, features = load_feature_file()
        if not names:
            print("登记内容: 为空，请先用例程 36 准备 common/faces.npz")
            return                                          # 结束 main，随后执行 finally 关闭窗口

        last_name = None
        with Camera() as camera:
            while True:
                if cv2.waitKey(20) == 27:
                    break                                   # 结束视频循环，随后停止相机线程并关闭窗口
                image = camera.latest()                     # 第二步：沿用 32，只取得最新有效图片
                if image is None:
                    continue                                # 没有有效图片时跳过识别，继续等待

                # 第三步：提取当前人脸特征，匹配后取回 35 保存的代号；不是重新设置 PERSON_NAME
                query_feature = get_face_feature(detector, recognizer, image)
                if query_feature is None:
                    person_name, score = "no valid face", None
                    message = "人脸状态: 请让一张清晰完整的人脸进入画面"
                else:
                    person_name, score = identify_face(recognizer, query_feature, names, features, MATCH_THRESHOLD)
                    message = f"识别代号: {person_name}  相似度: {score:.3f}"
                if person_name != last_name:
                    print(message)                          # 第一次和代号变化时打印，不逐帧刷屏
                    last_name = person_name

                # 第四步：在水印下方显示识别结果；本例程只读共用特征文件
                cv2.imshow("Face recognition - Esc to close", draw_faces(image, person_name, score))
    except KeyboardInterrupt:
        log_message("INFO", "face", "Ctrl+C 主动结束")
    except (OSError, ValueError, KeyError, cv2.error) as exc:
        log_message("ERROR", "face", str(exc))
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_feature_file():", from: 15, to: 23, defaultOpen: false },
    { label: "def identify_face(recognizer, query_feature, names, features, threshold):", from: 25, to: 36, defaultOpen: false },
    { label: "def main():", from: 38, to: 77, defaultOpen: true },
  ],
}
