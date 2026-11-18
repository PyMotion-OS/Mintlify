// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const grayAndColorMasks = {
  title: "gray_and_color_masks.py",
  code: `from pathlib import Path

import cv2
import numpy as np


# --- 本页可调整的参数 ---
ROI_LEFT, ROI_RIGHT = 0.15, 0.85            # 与 4.4 使用相同 ROI
ROI_TOP, ROI_BOTTOM = 0.15, 0.85            # 上下各忽略原图高度的 15%
BLUE_LOW = (95, 80, 60)                    # 蓝色 HSV 范围下限
BLUE_HIGH = (135, 255, 255)                # 蓝色 HSV 范围上限

# --- 共用配置（一般不用动）---
BASE_DIR = Path(__file__).parent
IMAGE_PATH = BASE_DIR / "camera_frame.jpg"


# 读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片
def load_image(path):
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(path, dtype=np.uint8)
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)


# 复制原图，在副本上画出 ROI 并返回
def draw_roi(image, left, top, right, bottom):
    """复制原图，在副本上画出 ROI 并返回。"""
    marked_image = image.copy()
    cv2.rectangle(marked_image, (left, top), (right - 1, bottom - 1), (217, 199, 0), 4)
    return marked_image


# 裁剪 ROI，按 HSV 颜色范围返回选中的画面和黑白掩膜
def make_color_mask(image, left, top, right, bottom, color_low, color_high):
    """裁剪 ROI，按 HSV 颜色范围返回选中的画面和黑白掩膜。"""
    roi_image = image[top:bottom, left:right]

    # H 表示颜色种类，S 表示颜色浓淡，V 表示明暗；OpenCV 中 H 为 0—179，S/V 为 0—255
    hsv_image = cv2.cvtColor(roi_image, cv2.COLOR_BGR2HSV)
    # inRange() 把范围内的像素变白，其余像素变黑
    color_mask = cv2.inRange(hsv_image, color_low, color_high)

    # bitwise_and() 只保留掩膜中白色位置对应的原图像素
    selected_image = cv2.bitwise_and(roi_image, roi_image, mask=color_mask)
    return roi_image, selected_image, color_mask


# 缩放图片副本，再在屏幕指定位置显示
def show_image(title, image, x, y, scale):
    """缩放图片副本，再在屏幕指定位置显示。"""
    display_image = cv2.resize(image, None, fx=scale, fy=scale)
    cv2.imshow(title, display_image)
    cv2.moveWindow(title, x, y)


def main():
    """依次显示 ROI、蓝色掩膜、选中区域和轮廓。"""
    image = load_image(IMAGE_PATH)
    height, width = image.shape[:2]
    left, right = round(width * ROI_LEFT), round(width * ROI_RIGHT)
    top, bottom = round(height * ROI_TOP), round(height * ROI_BOTTOM)
    marked_image = draw_roi(image, left, top, right, bottom)

    # 第一步：使用同一个 ROI，得到裁剪图、选中的蓝色画面和黑白掩膜
    roi_image, selected_image, color_mask = make_color_mask(image, left, top, right, bottom, BLUE_LOW, BLUE_HIGH)

    # 第二步：黑白掩膜中每块相连的白色区域，都可以变成一条轮廓
    contours, _ = cv2.findContours(color_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour_image = cv2.cvtColor(color_mask, cv2.COLOR_GRAY2BGR)  # 转成 BGR 三通道后才能画橘色轮廓
    cv2.drawContours(contour_image, contours, -1, (0, 140, 255), 4)

    show_image("1 - Original Image with ROI", marked_image, 20, 20, 0.45)
    show_image("2 - Cropped ROI", roi_image, 920, 20, 0.40)
    show_image("3 - Selected Blue Area", selected_image, 920, 320, 0.40)
    show_image("4 - Blue Mask", color_mask, 920, 620, 0.40)
    show_image("5 - Blue Mask Contours", contour_image, 20, 620, 0.40)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_image(path):", from: 19, to: 22, defaultOpen: false },
    { label: "def draw_roi(image, left, top, right, bottom):", from: 26, to: 30, defaultOpen: false },
    { label: "def make_color_mask(image, left, top, right, bottom, color_low, color_high):", from: 34, to: 45, defaultOpen: false },
    { label: "def show_image(title, image, x, y, scale):", from: 49, to: 53, defaultOpen: false },
  ],
}
