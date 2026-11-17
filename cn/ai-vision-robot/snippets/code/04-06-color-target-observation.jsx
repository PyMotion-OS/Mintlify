// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const colorTargetObservation = {
  title: "color_target_observation.py",
  code: `from pathlib import Path

import cv2
import numpy as np

from target_contours import find_target_contours  # 吸收 4.5，返回清理后掩膜、有效轮廓和 ROI


# --- 本页可调整的参数 ---
TARGET_TYPE = "blue"                       # 可选 gray、blue、green 或 yellow
CENTER_X = 0.50                            # 目标对齐位置在画面宽度 50%
CENTER_Y = 0.50                            # 目标对齐位置在画面高度 50%

# --- 共用配置（一般不用动）---
BASE_DIR = Path(__file__).parent
IMAGE_PATH = BASE_DIR / "camera_frame.jpg"


# 读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片
def load_image(path):
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(path, dtype=np.uint8)
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)


# 计算目标中心相对画面指定位置的横向和纵向偏差
def center_to_error(center, image_shape):
    """计算目标中心相对画面指定位置的横向和纵向偏差。"""
    height, width = image_shape[:2]                         # image.shape 前两项依次是高度和宽度
    reference_x = round(width * CENTER_X)                   # 宽度乘比例，得到横向参考位置
    reference_y = round(height * CENTER_Y)                  # 高度乘比例，得到纵向参考位置
    error_x = (center[0] - reference_x) / (width / 2)       # 目标在左为负，在右为正
    error_y = (center[1] - reference_y) / (height / 2)      # 目标在上为负，在下为正
    return error_x, error_y


# 选择灰度或 HSV 目标，返回状态、中心、面积和二维偏差
def find_target(image, target_type="blue"):
    """选择灰度或 HSV 目标，返回状态、中心、面积和二维偏差。"""
    # 第一步：引用 4.5，得到清理后的黑白掩膜、有效轮廓和 ROI
    target_mask, valid_contours, roi = find_target_contours(image, target_type)
    left, top, right, bottom = roi

    # 第二步：没有有效轮廓时返回 lost，并保持数据包字段不变
    if not valid_contours:
        return {
            "state": "lost",                                # 后续先检查是否找到目标
            "center": None,                                 # 后续绘图和居中控制使用的原图坐标
            "area": 0,                                      # 后续距离判断使用的目标像素面积
            "error_x": None,                                # 后续左右居中控制使用的归一化偏差
            "error_y": None,                                # 后续上下居中控制使用的归一化偏差
            "mask": target_mask,                            # 后续显示使用的清理后黑白掩膜
            "contour": None,                                # 后续绘图使用的 ROI 内目标轮廓
            "roi": roi,                                    # 后续绘图使用的处理区域像素坐标
        }

    # 第三步：选择面积最大的有效轮廓，用轮廓矩计算这片区域的质心
    # max() 返回面积最大的轮廓
    target_contour = max(valid_contours, key=cv2.contourArea)
    moments = cv2.moments(target_contour)                   # m00 是面积，m10/m01 是横向/纵向坐标累计值
    # 横向累计值除以面积得到质心 x，再加 ROI 左边坐标
    center_x = left + round(moments["m10"] / moments["m00"])
    # 纵向累计值除以面积得到质心 y，再加 ROI 顶部坐标
    center_y = top + round(moments["m01"] / moments["m00"])

    # 第四步：把质心交给居中函数，得到约 -1 到 +1 的横向和纵向偏差
    error_x, error_y = center_to_error((center_x, center_y), image.shape)
    return {
        "state": "target",                                  # 后续先检查是否找到目标
        "center": (center_x, center_y),                     # 后续绘图和居中控制使用的原图坐标
        "area": round(moments["m00"]),                      # 后续距离判断使用的目标像素面积
        "error_x": error_x,                                 # 后续左右居中控制使用的归一化偏差
        "error_y": error_y,                                 # 后续上下居中控制使用的归一化偏差
        "mask": target_mask,                                # 后续显示使用的清理后黑白掩膜
        "contour": target_contour,                          # 后续绘图使用的 ROI 内目标轮廓
        "roi": roi,                                        # 后续绘图使用的处理区域像素坐标
    }


# 复制原图，再用基础图形标出处理区域、参考中心和目标位置
def draw_target_marks(image, target_data):
    """复制原图，再用基础图形标出处理区域、参考中心和目标位置。"""
    marked_image = image.copy()                             # copy() 复制出新图片，后续绘制不会修改 image
    reference_x = round(image.shape[1] * CENTER_X)
    reference_y = round(image.shape[0] * CENTER_Y)
    left, top, right, bottom = target_data["roi"]

    # 青蓝色矩形表示处理区域，两条白线交点表示横向和纵向偏差都为 0
    cv2.rectangle(marked_image, (left, top), (right - 1, bottom - 1), (217, 199, 0), 4)
    cv2.line(marked_image, (reference_x, top), (reference_x, bottom - 1), (255, 255, 255), 3)
    cv2.line(marked_image, (left, reference_y), (right - 1, reference_y), (255, 255, 255), 3)
    if target_data["state"] == "target":
        # offset 把 ROI 内的橘黄色轮廓平移到原图位置
        cv2.drawContours(marked_image, [target_data["contour"]], -1, (0, 140, 255), 4, offset=(left, top))
        # 红点表示目标中心
        cv2.circle(marked_image, target_data["center"], 10, (0, 0, 255), -1)
        # 琥珀色箭头从参考中心指向目标中心，同时表示左右和上下偏差
        cv2.arrowedLine(marked_image, (reference_x, reference_y), target_data["center"], (0, 176, 255), 4)
    return marked_image


# 缩放图片副本，再在屏幕指定位置显示
def show_image(title, image, x, y, scale):
    """缩放图片副本，再在屏幕指定位置显示。"""
    cv2.imshow(title, cv2.resize(image, None, fx=scale, fy=scale))
    cv2.moveWindow(title, x, y)


def main():
    """选择灰度或 HSV 方式找到最大目标，并标出二维偏差。"""
    image = load_image(IMAGE_PATH)
    target_data = find_target(image, TARGET_TYPE)           # 返回目标状态、中心、面积和二维偏差
    marked_image = draw_target_marks(image, target_data)    # 返回画有基础观测标记的原图副本

    print(f"目标状态: {target_data['state']}")
    print(f"目标中心: {target_data['center']}")
    print(f"目标面积: {target_data['area']}")
    print(f"横向偏差: {target_data['error_x']}")
    print(f"纵向偏差: {target_data['error_y']}")
    show_image("Target Observation", marked_image, 20, 20, 0.45)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_image(path):", from: 20, to: 23, defaultOpen: false },
    { label: "def center_to_error(center, image_shape):", from: 27, to: 34, defaultOpen: false },
    { label: "def find_target(image, target_type=\"blue\"):", from: 38, to: 77, defaultOpen: false },
    { label: "def draw_target_marks(image, target_data):", from: 81, to: 99, defaultOpen: false },
    { label: "def show_image(title, image, x, y, scale):", from: 103, to: 106, defaultOpen: false },
  ],
}
