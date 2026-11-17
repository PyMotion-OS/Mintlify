// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const faceQuality = {
  title: "face_quality.py",
  code: `import cv2

# face_tools.py 吸收 6.4 已经学过的人脸检测和绘制，本文件只展开质量判断
from face_tools import create_face_detector, draw_faces, load_image, observe_faces


# --- 本页可调整的参数 ---
MIN_FACE_SIZE = 80                         # 人脸框的宽和高都至少为 80 像素
MIN_BRIGHTNESS = 45                        # 平均亮度低于 45 时认为人脸区域过暗
MAX_BRIGHTNESS = 210                       # 平均亮度高于 210 时认为人脸区域过亮
MIN_SHARPNESS = 100.0                      # 清晰度低于 100 时认为人脸区域模糊


# 依次检查人脸完整度、尺寸、亮度和清晰度，再返回检查数据和原因
def check_face_quality(image, face):
    """依次检查人脸完整度、尺寸、亮度和清晰度，再返回检查数据和原因。"""
    face_x, face_y, face_width, face_height = face["box"]
    image_height, image_width = image.shape[0], image.shape[1]
    # 人脸框左上角不能出界，右下角也不能超过图片的宽和高
    
    if face_x < 0 or face_y < 0 or face_x + face_width > image_width or face_y + face_height > image_height:
        # 后两个 None 表示亮度和清晰度还没有检查
        return False, None, None, "人脸不完整，请让整张脸进入图片"
    if face_width < MIN_FACE_SIZE or face_height < MIN_FACE_SIZE:
        # 尺寸不合格时不再计算亮度和清晰度
        return False, None, None, "人脸太小，请靠近摄像头"

    # 第一步：取出人脸框内的像素；图片切片不会改变原图
    face_image = image[face_y:face_y + face_height, face_x:face_x + face_width]
    # 第二步：resize() 返回一张 112×112 的新图片，让不同大小的人脸使用同一组质量阈值
    standard_face = cv2.resize(face_image, (112, 112))
    # 第三步：把 BGR 彩色图片转换成灰度图片，每个像素只保留一个 0～255 的亮度值
    gray_face = cv2.cvtColor(standard_face, cv2.COLOR_BGR2GRAY)
    brightness = float(gray_face.mean())                    # mean() 计算全部像素的平均亮度
    # 第四步：Laplacian() 找出相邻像素的亮度变化；CV_64F 保留计算中的小数和负数
    edges = cv2.Laplacian(gray_face, cv2.CV_64F)
    # 第五步：var() 计算边缘数值的变化程度；清晰图片的边缘变化通常更大
    sharpness = float(edges.var())

    reasons = []                                            # 同一张人脸可能同时过暗和模糊
    if brightness < MIN_BRIGHTNESS:
        reasons.append("人脸过暗")
    if brightness > MAX_BRIGHTNESS:
        reasons.append("人脸过亮")
    if sharpness < MIN_SHARPNESS:
        reasons.append("人脸模糊")
    if reasons:
        reason = "、".join(reasons)                         # join() 用顿号连接全部不合格原因
        return False, brightness, sharpness, f"{reason}，请重新拍摄"
    return True, brightness, sharpness, "人脸质量合格，可以进入后续特征提取"


def main():
    """检测图片中的人脸，再判断数量、完整度、尺寸、亮度和清晰度是否适合后续使用。"""
    image = load_image()                                    # 图片路径随 6.4 的读取函数放在 face_tools.py
    detector = create_face_detector()
    faces = observe_faces(detector, image)                  # 引用 6.4 的三个稳定字段
    marked_image = draw_faces(image, faces)

    # 后续人脸特征只能对应一个人，因此图片中必须恰好检测到一张人脸
    if len(faces) != 1:
        print(f"质量判断: 不合格，人脸数量应为 1，当前为 {len(faces)}")
        cv2.imshow("Face quality - press any key", marked_image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        return                                              # 结束 main，不再检查后面的质量条件

    face = faces[0]                                         # 已确认只有一张人脸，第 0 项就是这张人脸
    # check_face_quality() 依次返回是否合格、平均亮度、清晰度和原因
    is_good, brightness, sharpness, reason = check_face_quality(image, face)
    face_width = face["box"][2]                             # box 第 2 项是人脸框宽度
    face_height = face["box"][3]                            # box 第 3 项是人脸框高度
    print(f"检测置信度: {face['confidence']:.3f}")
    print(f"人脸尺寸: {face_width} x {face_height}")
    if brightness is None:
        print("平均亮度: 未检查")
        print("清晰度: 未检查")
    else:
        print(f"平均亮度: {brightness:.1f}")
        print(f"清晰度: {sharpness:.1f}")
    print(f"质量判断: {reason}")

    if is_good:
        color = (0, 200, 0)
        quality_text = "quality: pass"
    else:
        color = (0, 0, 255)
        quality_text = "quality: retry"
    cv2.putText(marked_image, quality_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    cv2.imshow("Face quality - press any key", marked_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def check_face_quality(image, face):", from: 15, to: 50, defaultOpen: false },
  ],
}
