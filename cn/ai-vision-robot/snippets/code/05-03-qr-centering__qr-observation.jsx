// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const qrObservation = {
  title: "qr_observation.py",
  code: `from pathlib import Path

import cv2
import numpy as np


# 吸收 5.2 的二维码生成能力和配置，本页未调用时也保留
QR_TEXT = "GREETING"                       # 这段文字会被写入二维码
QR_SCALE = 32                              # 生成约900像素的大图，方便手机展示和摄像头识别
OUTPUT_DIR = Path(__file__).parent / "cards"
OUTPUT_PATH = OUTPUT_DIR / f"{QR_TEXT}.png" # /继续拼接二维码文件名


# 把文字生成二维码并保存为图片
def create_qr(text):
    """把文字生成二维码并保存为图片。"""
    encoder = cv2.QRCodeEncoder_create()                    # 创建二维码生成对象
    qr_image = encoder.encode(text)                         # 把文字编码成黑白二维码图片
    # 四周补4像素白边，让识别器能够分清二维码的外边界
    qr_image = cv2.copyMakeBorder(qr_image, 4, 4, 4, 4, cv2.BORDER_CONSTANT, value=255)
    # 最近邻放大不会在黑白方块之间生成模糊的过渡颜色
    qr_image = cv2.resize(qr_image, None, fx=QR_SCALE, fy=QR_SCALE, interpolation=cv2.INTER_NEAREST)

    OUTPUT_DIR.mkdir(exist_ok=True)                         # cards已经存在时保持不变
    cv2.imencode(".png", qr_image)[1].tofile(OUTPUT_PATH)   # 编码后写入文件，兼容中文路径


# 识别一个二维码，返回文字、四角、中心、面积比例和二维偏差
def find_qr(image):
    """识别一个二维码，返回文字、四角、中心、面积比例和二维偏差。"""
    # 创建二维码检测对象并直接识别，返回文字、四角坐标和拉正后的二维码
    text, points, _ = cv2.QRCodeDetector().detectAndDecode(image)
    if not text or points is None:
        return {
            "text": None,
            "points": None,
            "center": None,
            "area_ratio": 0.0,
            "error_x": None,
            "error_y": None,
        }

    corners = points.reshape(4, 2)                         # (1,4,2)改成四行x/y坐标
    center = corners.mean(axis=0)                          # 四个角点的平均位置就是二维码中心
    center_x, center_y = round(center[0]), round(center[1])
    height, width = image.shape[:2]
    area_ratio = abs(cv2.contourArea(corners.astype(np.float32))) / (width * height)

    return {
        "text": text,
        "points": corners,
        "center": (center_x, center_y),
        "area_ratio": area_ratio,                         # 二维码面积占整张图片的比例
        "error_x": (center_x - width / 2) / (width / 2),  # 左边为负，右边为正
        "error_y": (center_y - height / 2) / (height / 2), # 上边为负，下边为正
    }


# 复制原图，再标出二维码边框、中心和二维偏差
def draw_qr_marks(image, qr_data):
    """复制原图，再标出二维码边框、中心和二维偏差。"""
    marked_image = image.copy()
    height, width = image.shape[:2]
    image_center = (round(width / 2), round(height / 2))

    if qr_data["points"] is not None:
        corners = qr_data["points"].round().astype(int)
        cv2.polylines(marked_image, [corners], True, (255, 200, 0), 4) # 连接四个角并闭合边框
        cv2.circle(marked_image, qr_data["center"], 9, (0, 0, 255), -1)
        cv2.arrowedLine(marked_image, image_center, qr_data["center"], (0, 176, 255), 3)

    text = f"QR={qr_data['text']}  X={qr_data['error_x']}  Y={qr_data['error_y']}"
    cv2.rectangle(marked_image, (15, 15), (720, 70), (32, 32, 32), -1)
    cv2.putText(marked_image, text, (30, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 176, 255), 2)
    return marked_image`,
  folds: [
    { label: "def create_qr(text):", from: 15, to: 25, defaultOpen: false },
    { label: "def find_qr(image):", from: 29, to: 56, defaultOpen: false },
    { label: "def draw_qr_marks(image, qr_data):", from: 60, to: 75, defaultOpen: false },
  ],
}
