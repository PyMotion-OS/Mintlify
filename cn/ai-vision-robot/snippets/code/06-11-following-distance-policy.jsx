// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const followingDistancePolicy = {
  title: "following_distance_policy.py",
  code: `import cv2

from camera import Camera, log_message
from target_selection import find_unique_target  # 唯一目标观测函数，沿用39
# load_yolo_resources：加载模型和标签；detect_objects：检测；draw_follow_motion：绘制跟随意图
from yolo_detection import detect_objects, draw_follow_motion, load_yolo_resources


# --- 本例程可调整的参数 ---
CONFIDENCE = 0.25                          # 检测置信度门槛
W = 90                                     # 原地对准时的转向速度，单位度/秒


# 把目标框画面占比分成前进、减速和停止三档
def target_area_to_v(area_ratio):
    """把目标框画面占比分成前进、减速和停止三档。"""
    if area_ratio is None:
        return 0, "lost"                                    # 没有有效目标时停止，不沿用上一次远近
    if area_ratio >= 0.10:
        return 0, "stop"                                    # 框占画面达到10%时停止前进
    if area_ratio >= 0.04:
        return 40, "slow"                                   # 框占画面达到4%时减速，V为40毫米/秒
    return 70, "forward"                                    # 目标较远，V为70毫米/秒


# 先检查远近，再原地对准，最后返回前进速度、转向速度和状态
def choose_follow_motion(error_x, area_ratio, W=90):
    """先检查远近，再原地对准，最后返回前进速度、转向速度和状态。"""
    # error_x左负右正，area_ratio是框占比；W是转向速度，默认90度/秒
    if error_x is None or area_ratio is None:
        return 0, 0, "lost"                                 # 无有效目标时返回零意图
    v, state = target_area_to_v(area_ratio)                 # 远近分档函数，返回前进速度和状态
    if state == "stop":
        return 0, 0, state                                  # 太近时连原地转向也停止
    if error_x < -0.10:
        return 0, W, "left"                                 # 偏差超出中心10%，正W沿用29的原地左转
    if error_x > 0.10:
        return 0, -W, "right"                               # 偏差超出中心10%，负W表示原地右转
    return v, 0, state                                      # 已对准才使用远近决定的V，W为0


def main():
    """观察真实人物方向和远近对应的V/W，仅显示，不连接主动轮。"""
    try:
        _, model = load_yolo_resources()                    # 加载YOLO模型和标签，沿用32
        last_state, last_image = None, None
        with Camera() as camera:
            while True:
                if cv2.waitKey(100) == 27:                  # 每轮等待0.1秒，方便观察意图变化
                    break                                   # 结束观察循环，随后释放相机并关闭窗口
                # 第一步：取得有效新图，沿用39的唯一目标观测
                image = camera.latest()                     # 取得未过期图片，缺失或过期时返回None
                if image is None or image is last_image:
                    continue                                # 无有效新图时跳过检测与意图计算
                last_image = image
                detections, _ = detect_objects(model, image, CONFIDENCE)  # 检测物体，得到标准检测列表
                target_data = find_unique_target(detections, image.shape, "person")  # 选择唯一人物，取得偏差与画面占比

                # 第二步：调用上方策略函数；框占比是远近提示，不是毫米距离
                v, w, state = choose_follow_motion(target_data["error_x"], target_data["area_ratio"], W)  # 方向和远近换成V/W与状态
                if state != last_state:
                    log_message("INFO", "distance", f"跟随意图: {state}  V: {v} mm/s  W: {w} °/s")
                    last_state = state

                # 第三步：绘画交给YOLO工具，本例只显示，不下发电机命令
                marked_image = draw_follow_motion(image, target_data, v, w, state)  # 绘制目标、占比、运动意图与状态
                cv2.imshow("Following distance - Esc to close", marked_image)
    except KeyboardInterrupt:
        log_message("INFO", "distance", "Ctrl+C 主动结束")
    except (OSError, ValueError, cv2.error) as exc:
        log_message("ERROR", "distance", str(exc))
    finally:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def target_area_to_v(area_ratio):", from: 15, to: 23, defaultOpen: false },
    { label: "def choose_follow_motion(error_x, area_ratio, W=90):", from: 27, to: 39, defaultOpen: false },
  ],
}
