// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const leadTargetSelection = {
  title: "lead_target_selection.py",
  code: `import cv2

from camera import Camera, log_message
# load_yolo_resources：加载模型和标签；detect_objects：整理检测结果；draw_target：绘制唯一目标观测
from yolo_detection import detect_objects, draw_target, load_yolo_resources

# --- 本例程可调整的参数 ---
CONFIDENCE = 0.25                          # 检测置信度门槛

def find_unique_target(detections, image_shape, target_label):
    """筛选指定类别，返回唯一目标的状态、二维偏差、占比和检测框。"""
    # detections沿用32的检测列表；先按label筛出指定类别，再判断是否只有一个候选
    candidates = []
    for detection in detections:
        if detection["label"] == target_label:
            candidates.append(detection)

    # 无候选时用None表示无效观测，不能写0让后续误以为已经居中
    if len(candidates) == 0:
        return {"state": "lost", "error_x": None, "error_y": None, "area_ratio": None, "box": None}
    # 多候选时不猜测目标，ambiguous表示本帧无法选出唯一人物
    if len(candidates) > 1:
        return {"state": "ambiguous", "error_x": None, "error_y": None, "area_ratio": None, "box": None}

    x1, y1, x2, y2 = candidates[0]["box"]
    image_height, image_width = image_shape[:2]
    error_x = ((x1 + x2) / 2 - image_width / 2) / (image_width / 2)  # 左负右正，供左右居中使用
    error_y = ((y1 + y2) / 2 - image_height / 2) / (image_height / 2)  # 上负下正，供上下居中使用
    area_ratio = (x2 - x1) * (y2 - y1) / (image_width * image_height)  # 框占全图的比例，不是实际距离
    return {
        "state": "target",                                  # 只有一个指定类别目标时才允许后续调整
        "error_x": error_x,
        "error_y": error_y,
        "area_ratio": area_ratio,
        "box": candidates[0]["box"],
    }

def main():
    """从实时画面选择唯一目标，显示其二维偏差和画面占比。"""
    try:
        _, model = load_yolo_resources()                    # 加载YOLO模型和标签，沿用32
        last_state, last_image = None, None
        with Camera() as camera:
            while True:
                if cv2.waitKey(100) == 27:                  # 每轮等待0.1秒并检查Esc，包括无图时的循环
                    break                                   # 结束取图循环，随后释放相机并关闭窗口
                # 第一步：只处理有效的新图片
                image = camera.latest()                     # 取得0.5秒内的有效图片，否则返回None，沿用26
                if image is None or image is last_image:
                    continue                                # 无有效新图时跳过检测与显示，继续下一轮
                last_image = image

                # 第二步：调用本文件的选择函数，只接受唯一人物
                detections, _ = detect_objects(model, image, CONFIDENCE)  # 检测物体，得到标准检测列表
                target_data = find_unique_target(detections, image.shape, "person")  # 选择person类别，得到状态、偏差、占比和框
                if target_data["state"] != last_state:
                    log_message("INFO", "target", f"目标状态: {target_data['state']}")
                    last_state = target_data["state"]

                # 第三步：绘制代码收进yolo_detection，保留原有draw_detections
                marked_image = draw_target(image, target_data)  # 绘制参考中心、唯一目标框和观测字段
                cv2.imshow("Unique target - Esc to close", marked_image)
    except KeyboardInterrupt:
        log_message("INFO", "target", "Ctrl+C 主动结束")
    except (OSError, ValueError, cv2.error) as exc:
        log_message("ERROR", "target", str(exc))
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def find_unique_target():", from: 10, to: 36, defaultOpen: false },
    { label: "def main():", from: 38, to: 68, defaultOpen: true },
  ],
}
