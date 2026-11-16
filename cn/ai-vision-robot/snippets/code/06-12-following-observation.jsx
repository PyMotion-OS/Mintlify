// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const followingObservation = {
  title: "following_observation.py",
  code: `import cv2

from camera import Camera, log_message
# find_unique_target：取得目标观测；choose_follow_motion：把方向和远近换成运动意图，吸收41
from target_selection import choose_follow_motion, find_unique_target
# load_yolo_resources：加载模型和标签；track_objects：模型自带编号跟踪；draw_follow_tracking：绘制跟随结果
from yolo_detection import draw_follow_tracking, load_yolo_resources, track_objects

# --- 本例程可调整的参数 ---
CONFIDENCE = 0.25                          # 检测置信度门槛
W = 90                                     # 原地对准时的转向速度，单位度/秒

def choose_target(tracks, selected_id, target_label):
    """首次只选择唯一指定类别，之后只寻找同一个跟踪编号。"""
    # 演化例程 33 的 choose_target：第一次由选最大人物改为只接受唯一人物
    candidates = []
    for track in tracks:
        if track["label"] == target_label:
            candidates.append(track)
    if selected_id is None and len(candidates) == 1:
        selected_id = candidates[0]["track_id"]
    for candidate in candidates:
        if candidate["track_id"] == selected_id:
            return candidate, selected_id                   # 锁定编号仍在画面中，返回同一个人物
    return None, selected_id

def main():
    """首次接受唯一人物，持续显示原编号的跟随意图，按R重新选择。"""
    try:
        _, model = load_yolo_resources()                    # 加载YOLO模型和标签，沿用32
        selected_id, last_image = None, None
        with Camera() as camera:
            while True:
                key = cv2.waitKey(100)                      # 每轮等待0.1秒并检查按键，不叠加sleep
                if key == 27:
                    break                                   # 结束观察，随后停止相机线程并关闭窗口
                if key == ord("r"):
                    selected_id = None                      # R清除编号，下一张新图重新等待唯一人物

                # 第一步：只处理有效的新图片，断流期间保留选择编号
                image = camera.latest()                     # 取得未过期图片，缺失或过期时返回None
                if image is None or image is last_image:
                    continue                                # 无有效新图时不重复跟踪，等待下一轮
                last_image = image

                # 第二步：沿用33的模型跟踪，再用本文件的演化规则选择人物
                tracks, _ = track_objects(model, image, CONFIDENCE)  # 模型自带跟踪，得到含track_id的结果
                target, selected_id = choose_target(tracks, selected_id, "person")  # 首次只接受唯一人物，之后只找原编号
                if target is None:
                    target_data = find_unique_target([], image.shape, "person")  # 空目标转成无效偏差与占比，后续策略归零
                else:
                    target_data = find_unique_target([target], image.shape, "person")  # 把选中人物整理成38的观测字段

                # 第三步：调用40已经展示的策略，原编号消失时V/W归零，不自动换人
                v, w, state = choose_follow_motion(target_data["error_x"], target_data["area_ratio"], W)  # 观测换成运动意图，本例不连接执行器
                marked_image = draw_follow_tracking(image, target_data, selected_id, v, w, state)  # 绘制目标编号、观测与V/W
                cv2.imshow("Following observation - R select, Esc close", marked_image)
    except KeyboardInterrupt:
        log_message("INFO", "follow", "Ctrl+C 主动结束")
    except (OSError, ValueError, cv2.error) as exc:
        log_message("ERROR", "follow", str(exc))
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def choose_target():", from: 13, to: 25, defaultOpen: false },
    { label: "def main():", from: 27, to: 63, defaultOpen: true },
  ],
}
