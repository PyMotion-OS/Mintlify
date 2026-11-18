// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const morphologyAndContours = {
  title: "morphology_and_contours.py",
  code: `from pathlib import Path

import cv2
import numpy as np

from target_mask import make_target_mask    # 吸收 4.4/4.3，按选择返回灰度或 HSV 黑白掩膜


# --- 本页可调整的参数 ---
TARGET_TYPE = "blue"                       # 可选 gray、blue、green 或 yellow

# 形态学核是在掩膜上逐块移动的小方格；边长越大，每次参与运算的周围像素越多，清理效果越强
KERNEL_SIZE = 3                             # 形态学核边长，单位像素
MIN_AREA = 500                              # 有效轮廓最小面积，小于它的轮廓会被忽略

# --- 共用配置（一般不用动）---
BASE_DIR = Path(__file__).parent
IMAGE_PATH = BASE_DIR / "camera_frame.jpg"


# 读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片
def load_image():
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(IMAGE_PATH, dtype=np.uint8)
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)


# 缩放图片副本，再在屏幕指定位置显示
def show_image(title, image, x, y, scale):
    """缩放图片副本，再在屏幕指定位置显示。"""
    display_image = cv2.resize(image, None, fx=scale, fy=scale)
    cv2.imshow(title, display_image)
    cv2.moveWindow(title, x, y)


def main():
    """选择灰度或 HSV 掩膜，再显示开闭运算和有效轮廓。"""
    image = load_image()                                    # 例程固定读取上面的 IMAGE_PATH
    target_mask = make_target_mask(image, TARGET_TYPE)      # 按选择得到灰度或 HSV 黑白掩膜

    # 第一步：np.ones() 创建 KERNEL_SIZE × KERNEL_SIZE 的全 1 数组，np.uint8 表示每个值是 0—255 的整数
    # 这个数组作为形态学核，决定开闭运算每次检查周围多大的像素范围
    kernel = np.ones((KERNEL_SIZE, KERNEL_SIZE), np.uint8)

    # 第二步：开运算先腐蚀白色区域：核内只要有黑色像素，中心就记为黑色；再恢复保留下来的白色区域
    opened_mask = cv2.morphologyEx(target_mask, cv2.MORPH_OPEN, kernel)
    # 闭运算先扩大白色区域：核内只要有白色像素，中心就记为白色；再恢复轮廓并留下填好的小缺口
    closed_mask = cv2.morphologyEx(opened_mask, cv2.MORPH_CLOSE, kernel)

    # 第三步：findContours() 取得每块相连白色区域的轮廓
    contours, _ = cv2.findContours(closed_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    valid_contours = []                                     # 新建列表，准备保存面积足够大的轮廓
    for contour in contours:                                # 依次取得每个轮廓
        if cv2.contourArea(contour) >= MIN_AREA:            # contourArea() 返回轮廓围住的像素面积
            valid_contours.append(contour)                  # 把达到面积下限的轮廓加入列表

    # closed_mask 是单通道黑白图，转成 BGR 三通道后才能在上面画橘色轮廓
    contour_image = cv2.cvtColor(closed_mask, cv2.COLOR_GRAY2BGR)

    # 参数 -1 表示画出列表中的全部轮廓，(0, 140, 255) 是 BGR 橘黄色，4 是线宽
    cv2.drawContours(contour_image, valid_contours, -1, (0, 140, 255), 4)
    print(f"全部轮廓: {len(contours)}")
    print(f"有效轮廓: {len(valid_contours)}")

    show_image("1 - Target Mask", target_mask, 20, 20, 0.45)
    show_image("2 - After Opening", opened_mask, 620, 20, 0.45)
    show_image("3 - After Closing", closed_mask, 20, 380, 0.45)
    show_image("4 - Valid Contours", contour_image, 620, 380, 0.45)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_image():", from: 22, to: 25, defaultOpen: false },
    { label: "def show_image(title, image, x, y, scale):", from: 29, to: 33, defaultOpen: false },
  ],
}
