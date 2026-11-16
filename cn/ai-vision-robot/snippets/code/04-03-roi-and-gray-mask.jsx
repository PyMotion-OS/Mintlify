// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const roiAndGrayMask = {
  title: "roi_and_gray_mask.py",
  code: `from pathlib import Path

import cv2
import numpy as np

# --- 本例程可调整的参数 ---
ROI_LEFT, ROI_RIGHT = 0.15, 0.85            # ROI 使用原图中间 70% 的宽度
ROI_TOP, ROI_BOTTOM = 0.15, 0.85            # ROI 使用原图中间 70% 的高度
GRAY_LIMIT = 130                            # 灰度不高于 130 的像素在掩膜中变成白色

# --- 共用配置（一般不用动）---
BASE_DIR = Path(__file__).parent
IMAGE_PATH = BASE_DIR / "camera_frame.jpg"

def load_image(path):
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(path, dtype=np.uint8)
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

def draw_roi(image, left, top, right, bottom):
    """复制原图，在副本上画出 ROI 并返回。"""
    marked_image = image.copy()                             # 复制后绘制，不修改后续处理的 image
    cv2.rectangle(marked_image, (left, top), (right - 1, bottom - 1), (217, 199, 0), 4)
    return marked_image

def make_gray_mask(image, left, top, right, bottom, gray_limit):
    """依次裁剪 ROI、转成灰度图，再得到按亮暗筛选的黑白掩膜。"""
    # 第一步：数组按 [上:下, 左:右] 裁剪，新图左上角重新成为 (0, 0)
    roi_image = image[top:bottom, left:right]

    # 第二步：COLOR_BGR2GRAY 把每个像素的三个 BGR 颜色值合成一个亮度值
    gray_image = cv2.cvtColor(roi_image, cv2.COLOR_BGR2GRAY)

    # 第三步：THRESH_BINARY_INV 把不高于阈值的像素设为 255 白色，其余设为 0 黑色
    _, gray_mask = cv2.threshold(gray_image, gray_limit, 255, cv2.THRESH_BINARY_INV)
    return roi_image, gray_image, gray_mask                  # 按处理顺序返回三张中间图片

def show_image(title, image, x, y, scale):
    """缩放图片副本，再在屏幕指定位置显示。"""
    # resize() 只缩放用于显示的副本，fx 和 fy 是宽度与高度的缩放比例
    display_image = cv2.resize(image, None, fx=scale, fy=scale)
    cv2.imshow(title, display_image)
    cv2.moveWindow(title, x, y)                             # 把窗口左上角移到屏幕像素坐标 (x, y)

def main():
    """依次显示 ROI、裁剪图、灰度图、黑白掩膜和轮廓。"""
    image = load_image(IMAGE_PATH)
    height, width = image.shape[:2]                         # image.shape 前两项依次是图片高度和宽度

    # 第一步：把 ROI 比例换成原图中的像素坐标，并使用draw_roi画出区域
    left, right = round(width * ROI_LEFT), round(width * ROI_RIGHT)
    top, bottom = round(height * ROI_TOP), round(height * ROI_BOTTOM)
    marked_image = draw_roi(image, left, top, right, bottom)

    # 第二步：依次得到裁剪图、灰度图和黑白掩膜
    roi_image, gray_image, gray_mask = make_gray_mask(image, left, top, right, bottom, GRAY_LIMIT)

    # 第三步：黑白掩膜中每块相连的白色区域，都可以变成一条轮廓
    contours, _ = cv2.findContours(gray_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour_image = cv2.cvtColor(gray_mask, cv2.COLOR_GRAY2BGR)  # 转成 BGR 三通道后才能画橘色轮廓
    # drawContours() 把 contours 画到 contour_image；-1 表示全部轮廓，后两个参数是 BGR 颜色和线宽
    cv2.drawContours(contour_image, contours, -1, (0, 140, 255), 4) # 给所有的轮廓画上颜色

    # 自制函数show_image() 的参数依次是窗口标题、图片、窗口坐标 x/y 和显示比例
    show_image("1 - Original Image with ROI", marked_image, 20, 20, 0.45)
    show_image("2 - Cropped ROI", roi_image, 920, 20, 0.40)
    show_image("3 - ROI Gray Image", gray_image, 920, 320, 0.40)
    show_image("4 - ROI Gray Mask", gray_mask, 920, 620, 0.40)
    show_image("5 - Gray Mask Contours", contour_image, 20, 620, 0.40)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_image():", from: 15, to: 18, defaultOpen: false },
    { label: "def draw_roi():", from: 20, to: 24, defaultOpen: false },
    { label: "def make_gray_mask():", from: 26, to: 36, defaultOpen: false },
    { label: "def show_image():", from: 38, to: 43, defaultOpen: false },
    { label: "def main():", from: 45, to: 71, defaultOpen: true },
  ],
}
