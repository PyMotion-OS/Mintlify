// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const targetObservation = {
  title: "target_observation.py",
  code: `import cv2
import numpy as np


# --- 目标观测参数 ---
ROI_LEFT, ROI_RIGHT = 0.15, 0.85           # 只在画面中间 70% 的宽度内寻找目标
ROI_TOP, ROI_BOTTOM = 0.15, 0.85           # 只在画面中间 70% 的高度内寻找目标
GRAY_LIMIT = 130                           # gray 选中灰度不高于 130 的暗色区域
KERNEL_SIZE = 3                            # 形态学核边长，单位像素
MIN_AREA = 1500                            # 小于 1500 平方像素的轮廓作为干扰忽略
CENTER_X = 0.50                            # 目标对齐位置在画面宽度 50%
CENTER_Y = 0.50                            # 目标对齐位置在画面高度 50%

# HSV 依次保存颜色、浓淡和明暗，每种颜色分别给出下限和上限
COLOR_RANGES = {
    "blue": ((95, 80, 60), (135, 255, 255)),
    "green": ((35, 80, 60), (85, 255, 255)),
    "yellow": ((20, 80, 60), (35, 255, 255)),
}


# 吸收 4.3：裁剪 ROI，转成灰度图，再返回按亮暗筛选的黑白掩膜
def make_gray_mask(image, left, top, right, bottom):
    """吸收 4.3：裁剪 ROI，转成灰度图，再返回按亮暗筛选的黑白掩膜。"""
    roi_image = image[top:bottom, left:right]                # 按 [上:下, 左:右] 裁剪 ROI
    gray_image = cv2.cvtColor(roi_image, cv2.COLOR_BGR2GRAY) # 把 BGR 颜色值合成一个亮度值
    _, gray_mask = cv2.threshold(gray_image, GRAY_LIMIT, 255, cv2.THRESH_BINARY_INV)
    return gray_mask


# 吸收 4.4：裁剪 ROI，转成 HSV 图片，再返回按颜色筛选的黑白掩膜
def make_color_mask(image, left, top, right, bottom, target_color):
    """吸收 4.4：裁剪 ROI，转成 HSV 图片，再返回按颜色筛选的黑白掩膜。"""
    roi_image = image[top:bottom, left:right]                # 按 [上:下, 左:右] 裁剪 ROI
    hsv_image = cv2.cvtColor(roi_image, cv2.COLOR_BGR2HSV)   # 把 BGR 转成颜色、浓淡和明暗分开的 HSV
    color_low, color_high = COLOR_RANGES[target_color]      # 根据名称取出这种颜色的 HSV 上下限
    return cv2.inRange(hsv_image, color_low, color_high)     # 颜色范围内变白，其余变黑


# 按目标类型生成掩膜，完成开闭运算，再返回清理后掩膜、有效轮廓和 ROI
def find_target_contours(image, target_type="blue"):
    """按目标类型生成掩膜，完成开闭运算，再返回清理后掩膜、有效轮廓和 ROI。"""
    if target_type not in ("gray", "blue", "green", "yellow"):
        raise ValueError("目标类型只能是 gray、blue、green 或 yellow")

    height, width = image.shape[:2]
    left, right = round(width * ROI_LEFT), round(width * ROI_RIGHT)
    top, bottom = round(height * ROI_TOP), round(height * ROI_BOTTOM)
    if target_type == "gray":
        target_mask = make_gray_mask(image, left, top, right, bottom)
    else:
        target_mask = make_color_mask(image, left, top, right, bottom, target_type)

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
    return closed_mask, valid_contours, (left, top, right, bottom)


# 吸收 4.6：计算目标中心相对画面指定位置的横向和纵向偏差
def center_to_error(center, image_shape):
    """吸收 4.6：计算目标中心相对画面指定位置的横向和纵向偏差。"""
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
    return marked_image`,
  folds: [
    { label: "def make_gray_mask(image, left, top, right, bottom):", from: 23, to: 28, defaultOpen: false },
    { label: "def make_color_mask(image, left, top, right, bottom, target_color):", from: 32, to: 37, defaultOpen: false },
    { label: "def find_target_contours(image, target_type=\"blue\"):", from: 41, to: 69, defaultOpen: false },
    { label: "def center_to_error(center, image_shape):", from: 73, to: 80, defaultOpen: false },
    { label: "def find_target(image, target_type=\"blue\"):", from: 84, to: 123, defaultOpen: false },
    { label: "def draw_target_marks(image, target_data):", from: 127, to: 145, defaultOpen: false },
  ],
}
