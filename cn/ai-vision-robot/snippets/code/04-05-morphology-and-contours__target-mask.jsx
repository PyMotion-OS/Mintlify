// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const targetMask = {
  title: "target_mask.py",
  code: `import cv2


# --- 掩膜参数 ---
ROI_LEFT, ROI_RIGHT = 0.15, 0.85           # 与 4.4/4.3 使用相同 ROI
ROI_TOP, ROI_BOTTOM = 0.15, 0.85           # 上下各忽略原图高度的 15%
GRAY_LIMIT = 130                           # gray 选中灰度不高于 130 的暗色区域

# HSV 依次保存颜色、浓淡和明暗，每种颜色分别给出下限和上限
COLOR_RANGES = {
    "blue": ((95, 80, 60), (135, 255, 255)),
    "green": ((35, 80, 60), (85, 255, 255)),
    "yellow": ((20, 80, 60), (35, 255, 255)),
}


# 吸收 4.4：裁剪 ROI，转成灰度图，再返回按亮暗筛选的黑白掩膜
def make_gray_mask(image, left, top, right, bottom):
    """吸收 4.4：裁剪 ROI，转成灰度图，再返回按亮暗筛选的黑白掩膜。"""
    roi_image = image[top:bottom, left:right]                # 按 [上:下, 左:右] 裁剪 ROI
    gray_image = cv2.cvtColor(roi_image, cv2.COLOR_BGR2GRAY) # 把 BGR 颜色值合成一个亮度值
    _, gray_mask = cv2.threshold(gray_image, GRAY_LIMIT, 255, cv2.THRESH_BINARY_INV)
    return gray_mask


# 吸收 4.5：裁剪 ROI，转成 HSV 图片，再返回按颜色筛选的黑白掩膜
def make_color_mask(image, left, top, right, bottom, target_color):
    """吸收 4.5：裁剪 ROI，转成 HSV 图片，再返回按颜色筛选的黑白掩膜。"""
    roi_image = image[top:bottom, left:right]                # 按 [上:下, 左:右] 裁剪 ROI
    hsv_image = cv2.cvtColor(roi_image, cv2.COLOR_BGR2HSV)   # 把 BGR 转成颜色、浓淡和明暗分开的 HSV
    color_low, color_high = COLOR_RANGES[target_color]      # 根据名称取出这种颜色的 HSV 上下限
    return cv2.inRange(hsv_image, color_low, color_high)     # 颜色范围内变白，其余变黑


# 按目标类型返回灰度或 HSV 方式得到的黑白掩膜
def make_target_mask(image, target_type="blue"):
    """按目标类型返回灰度或 HSV 方式得到的黑白掩膜。"""
    if target_type not in ("gray", "blue", "green", "yellow"):
        raise ValueError("目标类型只能是 gray、blue、green 或 yellow")

    height, width = image.shape[:2]
    left, right = round(width * ROI_LEFT), round(width * ROI_RIGHT)
    top, bottom = round(height * ROI_TOP), round(height * ROI_BOTTOM)
    if target_type == "gray":
        return make_gray_mask(image, left, top, right, bottom)
    return make_color_mask(image, left, top, right, bottom, target_type)`,
  folds: [
    { label: "def make_gray_mask(image, left, top, right, bottom):", from: 18, to: 23, defaultOpen: false },
    { label: "def make_color_mask(image, left, top, right, bottom, target_color):", from: 27, to: 32, defaultOpen: false },
    { label: "def make_target_mask(image, target_type=\"blue\"):", from: 36, to: 46, defaultOpen: false },
  ],
}
