// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const targetContours = {
  title: "target_contours.py",
  code: `import cv2
import numpy as np


# --- 目标轮廓参数 ---
ROI_LEFT, ROI_RIGHT = 0.15, 0.85           # 只在画面中间 70% 的宽度内寻找目标
ROI_TOP, ROI_BOTTOM = 0.15, 0.85           # 只在画面中间 70% 的高度内寻找目标
GRAY_LIMIT = 130                           # gray 选中灰度不高于 130 的暗色区域
KERNEL_SIZE = 3                            # 形态学核边长，单位像素
MIN_AREA = 1500                            # 小于 1500 平方像素的轮廓作为干扰忽略

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
    return closed_mask, valid_contours, (left, top, right, bottom)`,
  folds: [
    { label: "def make_gray_mask(image, left, top, right, bottom):", from: 21, to: 26, defaultOpen: false },
    { label: "def make_color_mask(image, left, top, right, bottom, target_color):", from: 30, to: 35, defaultOpen: false },
    { label: "def find_target_contours(image, target_type=\"blue\"):", from: 39, to: 67, defaultOpen: false },
  ],
}
