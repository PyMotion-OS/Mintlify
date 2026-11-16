// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const yoloTargetCentering = {
  title: "yolo_target_centering.py",
  code: `import cv2
import pymotion as pm

from camera import Camera, log_message
# reset_servos：复位并返回双角度；error_to_angle：偏差换角度；move_servos：限幅并发送角度
from servo_control import error_to_angle, move_servos, reset_servos
from target_selection import find_unique_target  # 唯一目标观测函数，吸收39
# load_yolo_resources：加载模型和标签；detect_objects：检测；draw_servo_tracking：绘制目标和舵机角度
from yolo_detection import detect_objects, draw_servo_tracking, load_yolo_resources

# --- 本例程可调整的参数 ---
CONFIDENCE = 0.25                          # 检测置信度门槛
K = 5                                      # 偏差为1时每轮调整5°

def follow_target(commands, target_data, up_down_angle, left_right_angle):
    """把目标偏差换成双舵机角度，下发后返回两个安全角度。"""
    # target_data沿用39的error_x/error_y；当前角度来自复位或上一轮返回值，单位为度
    up_down_angle = error_to_angle(target_data["error_y"], up_down_angle, K)  # 偏差换角度：上下与纵向偏差同号，沿用27/38
    left_right_angle = error_to_angle(target_data["error_x"], left_right_angle, -K)  # 偏差换角度：左右与横向偏差反号
    # 无目标时偏差为None，进入死区时偏差较小，上面的方法都会保留当前角度
    return move_servos(commands, up_down_angle, left_right_angle)  # 限制并下发S4/S5角度，返回两个安全角度

def run(camera, commands, up_down_angle, left_right_angle):
    """取图、检测唯一人物，再用双舵机追随并显示角度。"""
    _, model = load_yolo_resources()                        # 加载YOLO模型和标签，沿用32
    last_image = None
    while True:
        if cv2.waitKey(100) == 27:                          # 每轮等待0.1秒；控制间隔还包括推理耗时
            return                                          # 结束run，外层with随后释放实时会话、控制权、连接和相机

        # 第一步：只使用有效的新图片，不对同一张图片重复调角
        image = camera.latest()                             # 取得未过期的图片；缺失或过期时返回None，沿用26
        if image is None or image is last_image:
            continue                                        # 等待新图，不重复累计角度
        last_image = image

        # 第二步：检测并选择唯一人物，沿用39的标准观测字段
        detections, _ = detect_objects(model, image, CONFIDENCE)  # 检测物体，得到标准检测列表
        target_data = find_unique_target(detections, image.shape, "person")  # 选择唯一人物，无人或多人时偏差为None

        # 第三步：调用本文件的追随函数，复用26/37已讲的角度计算和执行
        up_down_angle, left_right_angle = follow_target(commands, target_data, up_down_angle, left_right_angle)  # 调整并返回当前上下、左右角度
        marked_image = draw_servo_tracking(image, target_data, up_down_angle, left_right_angle)  # 绘制目标、参考中心和双角度
        cv2.imshow("YOLO servo centering - Esc to close", marked_image)

def main():
    """连接相机、复位双舵机，取得会话后追随唯一人物。"""
    try:
        with Camera() as camera:
            with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
                with robot.control():
                    up_down_angle, left_right_angle = reset_servos(robot)  # 复位双舵机，取得实际起始角度，沿用27
                    # 打开实时控制会话
                    with robot.realtime.open(command_targets={"pwm_position_servos": (4, 5)}) as session:
                        run(camera, session.commands, up_down_angle, left_right_angle)
    except KeyboardInterrupt:
        log_message("INFO", "servo", "Ctrl+C 主动结束")
    except (OSError, ValueError, cv2.error, pm.lite.LiteError) as exc:
        log_message("ERROR", "servo", str(exc))
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def follow_target(commands, target_data, up_down_angle, left_right_angle):", from: 15, to: 21, defaultOpen: false },
    { label: "def run(camera, commands, up_down_angle, left_right_angle):", from: 23, to: 44, defaultOpen: false },
    { label: "def main():", from: 46, to: 61, defaultOpen: true },
  ],
}
