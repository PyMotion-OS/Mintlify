// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const faceGreetingProject = {
  title: "face_greeting_project.py",
  code: `import time

import cv2
import pymotion as pm

from camera import Camera, log_message
# 引用的人脸方法：
# create_face_detector：初始化人脸检测器
# create_face_recognizer：初始化人脸特征识别器
# get_quality_face：检测并筛选唯一合格的人脸
# get_face_feature：提取人脸的128个特征数值
# load_feature_file：读取登记代号和对应特征
# identify_face：比较特征，返回匹配代号和相似度
# draw_face_tracking：显示识别结果、人脸框和对准标记
from face_tools import create_face_detector, create_face_recognizer, draw_face_tracking, get_face_feature, get_quality_face, identify_face, load_feature_file
from servo_control import error_to_angle, move_servos, reset_servos  # 复用26的偏差调角、角度限制和舵机执行

# --- 本例程可调整的参数 ---
K = 5                                      # 偏差为1时每轮调整5°，数值越大跟随动作越强
REQUIRED_MATCHES = 20                      # 累计识别到user01满20张新图片后点头并结束

def track_face(commands, raw_face, image_shape, person_name, up_down_angle, left_right_angle):
    """把已登记人脸的位置换成双舵机角度，发送后返回两个安全角度。"""
    # raw_face是YuNet人脸数组，image_shape是图片尺寸；两个angle参数是当前舵机角度，单位为度
    if person_name == "unknown":
        return up_down_angle, left_right_angle              # 未登记的人不带动镜头，返回原角度
    face_x, face_y, face_width, face_height = raw_face[:4]  # [:4]取前四项：左上角x、y，以及框的宽、高
    image_height, image_width = image_shape[:2]
    center = (round(face_x + face_width / 2), round(face_y + face_height / 2))
    error_x = (center[0] - image_width / 2) / (image_width / 2)  # 横向距离除以半幅宽度，左负右正
    error_y = (center[1] - image_height / 2) / (image_height / 2)  # 纵向距离除以半幅高度，上负下正
    up_down_angle = error_to_angle(error_y, up_down_angle, K)  # 偏差换成角度：上下与纵向偏差同号，沿用27
    left_right_angle = error_to_angle(error_x, left_right_angle, -K)  # 偏差换成角度：左右与横向偏差反号，沿用27
    return move_servos(commands, up_down_angle, left_right_angle)  # 限制并发送双舵机角度，返回两个安全角度

def nod_camera(commands, up_down_angle, left_right_angle):
    """围绕当前上下角度点头两次，保持左右角度，最后回到当前姿态。"""
    # 两个角度来自track_face的返回值；每次偏移10°，超出范围时由move_servos限制
    move_servos(commands, up_down_angle - 10, left_right_angle)  # 第一次抬头，左右保持当前角度
    time.sleep(0.2)                                         # 等待动作完成，0.2秒小于命令的0.3秒有效期
    move_servos(commands, up_down_angle + 10, left_right_angle)  # 第一次低头
    time.sleep(0.2)
    move_servos(commands, up_down_angle - 10, left_right_angle)  # 第二次抬头
    time.sleep(0.2)
    move_servos(commands, up_down_angle + 10, left_right_angle)  # 第二次低头
    time.sleep(0.2)
    move_servos(commands, up_down_angle, left_right_angle)  # 回到点头前瞄准人脸的姿态
    time.sleep(0.2)                                         # 留出回位时间，再让外层退出会话并关闭输出

def run(camera, commands, up_down_angle, left_right_angle):
    """持续对准已登记人脸，累计识别到user01达到次数后点头并结束。"""
    detector = create_face_detector()                       # 初始化人脸检测器，用于查找人脸框和关键点
    recognizer = create_face_recognizer()                   # 初始化特征识别器，用于提取和比较人脸特征
    names, features = load_feature_file()                   # 读取登记文件，得到代号和特征，沿用37
    if not names:
        print("登记内容: 为空，请先用例程 36 准备 common/faces.npz")
        return                                              # 结束run，外层with随后释放会话和连接

    last_image = None
    count = 0                                               # 累计识别user01目标成功次数，达到 REQUIRED_MATCHES 后打招呼
    while True:
        if cv2.waitKey(100) == 27:                          # 每轮等待100毫秒并检查按键，舵机调整最多约10次/秒
            return                                          # Esc结束run，外层with随后释放实时会话、连接和相机

        # 第一步：只处理新的有效图片，避免对同一张图片重复累计角度
        image = camera.latest()                             # 沿用26，图片缺失或超过0.5秒时返回None
        if image is None or image is last_image:
            continue                                        # 无有效新图时跳过识别与调角，等待下一轮
        last_image = image

        # 第二步：沿用35的质量判断和36的身份匹配，只让已登记的人脸带动镜头
        raw_face = get_quality_face(detector, image)        # 检测并筛选人脸，返回唯一合格人脸的框和关键点
        if raw_face is None:
            draw_face_tracking(image, None, "no valid face", None)  # 显示无合格人脸的状态，保持镜头角度
            continue                                        # 无脸、多人或质量不合格时保持角度，继续等待新图
        query_feature = get_face_feature(detector, recognizer, image, raw_face=raw_face)  # 提取128个人脸特征，使用已有结果不重复检测
        person_name, score = identify_face(recognizer, query_feature, names, features)  # 比较登记特征，得到匹配代号和相似度

        # 第三步：调用本文件上方的函数，用已登记人脸的位置控制双舵机
        up_down_angle, left_right_angle = track_face(commands, raw_face, image.shape, person_name, up_down_angle, left_right_angle)  # 按人脸位置调角，返回新的上下和左右角度

        # 第四步：原来的绘制与显示代码收进face_tools.draw_face_tracking
        draw_face_tracking(image, raw_face, person_name, score)  # 显示代号、分数、人脸框、中心和画面对准标记

        # 第五步：只有user01的新图片才计数，达到次数后围绕当前追踪角度点头
        if person_name == "user01":
            count += 1
        if count >= REQUIRED_MATCHES:
            nod_camera(commands, up_down_angle, left_right_angle)  # 围绕本轮调角后的姿态点头两次并回位
            break                                           # 结束run的循环，返回main并释放外层with持有的资源

def main():
    """连接相机、复位双舵机，追踪人脸并在累计识别后点头结束。"""
    try:
        with Camera() as camera:
            with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
                with robot.control():
                    up_down_angle, left_right_angle = reset_servos(robot)  # 沿用27，复位并取得上下、左右起始角度
                    # 打开实时控制会话
                    with robot.realtime.open(command_targets={"pwm_position_servos": (4, 5)}) as session:
                        run(camera, session.commands, up_down_angle, left_right_angle)
    except KeyboardInterrupt:
        log_message("INFO", "face", "Ctrl+C 主动结束")
    except (OSError, ValueError, KeyError, cv2.error, pm.lite.LiteError) as exc:
        log_message("ERROR", "face", str(exc))
    finally:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def track_face():", from: 22, to: 34, defaultOpen: false },
    { label: "def nod_camera():", from: 36, to: 48, defaultOpen: false },
    { label: "def run():", from: 50, to: 90, defaultOpen: false },
    { label: "def main():", from: 92, to: 107, defaultOpen: true },
  ],
}
