# -*- coding: utf-8 -*-
"""源码 → 页面代码 snippet 同步工具（长期维护）。

作用：把 SDK lessons 里的例程源码同步成 snippets/code/*.jsx（页面 CodeFold 的数据源）。
变换口径（与 SOP §2 一致，仅此两种）：
  1. 删「共用配置」块（TRANSPORT/TIMEOUT 常量），connect 参数内联 transport="wifi", timeout=15.0
  2. 其余逐字照抄源码（注释/print/docstring 全保留）
folds 用 ast 自动算行号，label 用完整签名行，def main 默认展开。

用法：改完源码后  python scripts/sync_snippets.py
新增页面：在 JOBS 里加一行 (源码路径, snippet 文件名, 导出名, 标题)
"""
import ast
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]              # pymotion使用手册大全/
SNIP = REPO / "cn/ai-vision-robot/snippets/code"
SDK = Path(r"D:\mjj-work\03-项目\pymotion_lite_-sdk\pymotion_SDK_dev\pymotion_lite\03-vision-car-course\lessons")

JOBS = [
    ("01_python_basics/07_servo_move.py", "01-07-servo-move.jsx", "servoMove", "servo_move.py"),
    ("02_realtime_motion/08_motor_speed/08_motor_speed.py", "02-01-motor-speed.jsx", "motorSpeed", "motor_speed.py"),
    ("02_realtime_motion/09_servo_position/09_servo_position.py", "02-02-servo-position.jsx", "servoPosition", "servo_position.py"),
    ("02_realtime_motion/10_realtime_data_queue/10_realtime_data_queue.py", "02-03-realtime-data-queue.jsx", "realtimeDataQueue", "realtime_data_queue.py"),
    ("02_realtime_motion/12_keyboard_control/differential_drive.py", "02-04-differential-drive.jsx", "differentialDrive", "differential_drive.py"),
    ("02_realtime_motion/11_differential_drive/11_differential_drive.py", "02-04-differential-drive__drive-action.jsx", "driveAction", "drive_action.py"),
    ("02_realtime_motion/12_keyboard_control/12_keyboard_control.py", "02-05-keyboard-control.jsx", "keyboardControl", "keyboard_control.py"),
    ("02_realtime_motion/12_keyboard_control/differential_drive.py", "02-05-keyboard-control__differential-drive.jsx", "differentialDrive", "differential_drive.py"),
    ("03_ultrasonic_line_following/13_obstacle_stop/13_obstacle_stop.py", "03-01-obstacle-stop.jsx", "obstacleStop", "obstacle_stop.py"),
    ("03_ultrasonic_line_following/14_safe_stop/14_safe_stop.py", "03-02-safe-stop.jsx", "safeStop", "safe_stop.py"),
    ("03_ultrasonic_line_following/15_line_classification_and_motion/15_line_classification_and_motion.py", "03-03-line-classification-and-motion.jsx", "lineClassificationAndMotion", "line_classification_and_motion.py"),
    ("03_ultrasonic_line_following/16_line_following/16_line_following.py", "03-04-line-following.jsx", "lineFollowing", "line_following.py"),
    ("03_ultrasonic_line_following/16_line_following/differential_drive.py", "03-04-line-following__differential-drive.jsx", "differentialDrive", "differential_drive.py"),
    ("03_ultrasonic_line_following/16_line_following/line_control.py", "03-04-line-following__line-control.jsx", "lineControl", "line_control.py"),
    ("03_ultrasonic_line_following/17_safe_line_following/17_safe_line_following.py", "03-05-safe-line-following.jsx", "safeLineFollowing", "safe_line_following.py"),
    ("03_ultrasonic_line_following/17_safe_line_following/obstacle_policy.py", "03-05-safe-line-following__obstacle-policy.jsx", "obstaclePolicy", "obstacle_policy.py"),
    ("04_opencv_and_camera/18_camera_basics/18_camera_basics.py", "04-01-camera-basics.jsx", "cameraBasics", "camera_basics.py"),
    ("04_opencv_and_camera/19_image_pixels_and_drawing/19_image_pixels_and_drawing.py", "04-02-image-pixels-and-drawing.jsx", "imagePixelsAndDrawing", "image_pixels_and_drawing.py"),
    ("04_opencv_and_camera/20_roi_and_gray_mask/20_roi_and_gray_mask.py", "04-03-roi-and-gray-mask.jsx", "roiAndGrayMask", "roi_and_gray_mask.py"),
    ("04_opencv_and_camera/21_gray_and_color_masks/21_gray_and_color_masks.py", "04-04-gray-and-color-masks.jsx", "grayAndColorMasks", "gray_and_color_masks.py"),
    ("04_opencv_and_camera/22_morphology_and_contours/22_morphology_and_contours.py", "04-05-morphology-and-contours.jsx", "morphologyAndContours", "morphology_and_contours.py"),
    ("04_opencv_and_camera/22_morphology_and_contours/target_mask.py", "04-05-morphology-and-contours__target-mask.jsx", "targetMask", "target_mask.py"),
    ("04_opencv_and_camera/23_color_target_observation/23_color_target_observation.py", "04-06-color-target-observation.jsx", "colorTargetObservation", "color_target_observation.py"),
    ("04_opencv_and_camera/23_color_target_observation/target_contours.py", "04-06-color-target-observation__target-contours.jsx", "targetContours", "target_contours.py"),
    ("04_opencv_and_camera/24_live_color_target/24_live_color_target.py", "04-07-live-color-target.jsx", "liveColorTarget", "live_color_target.py"),
    ("04_opencv_and_camera/24_live_color_target/target_observation.py", "04-07-live-color-target__target-observation.jsx", "targetObservation", "target_observation.py"),
    ("04_opencv_and_camera/25_camera_age_and_reconnect/25_camera_age_and_reconnect.py", "04-08-camera-age-and-reconnect.jsx", "cameraAgeAndReconnect", "camera_age_and_reconnect.py"),
    ("04_opencv_and_camera/25_camera_age_and_reconnect/camera.py", "04-08-camera-age-and-reconnect__camera.jsx", "camera", "camera.py"),
    ("04_opencv_and_camera/26_visual_observation/26_visual_observation.py", "04-09-visual-observation.jsx", "visualObservation", "visual_observation.py"),
    ("05_visual_control/27_color_servo_tracking/27_color_servo_tracking.py", "05-01-color-servo-tracking.jsx", "colorServoTracking", "color_servo_tracking.py"),
    ("05_visual_control/28_qr_basics/28_qr_basics.py", "05-02-qr-basics.jsx", "qrBasics", "qr_basics.py"),
    ("05_visual_control/29_qr_centering/29_qr_centering.py", "05-03-qr-centering.jsx", "qrCentering", "qr_centering.py"),
    ("05_visual_control/29_qr_centering/qr_observation.py", "05-03-qr-centering__qr-observation.jsx", "qrObservation", "qr_observation.py"),
    ("05_visual_control/30_qr_station/30_qr_station.py", "05-04-qr-station.jsx", "qrStation", "qr_station.py"),
    ("06_yolo_and_ai/31_yolo_image_detection/31_yolo_image_detection.py", "06-01-yolo-image-detection.jsx", "yoloImageDetection", "yolo_image_detection.py"),
    ("06_yolo_and_ai/32_yolo_live_detection/32_yolo_live_detection.py", "06-02-yolo-live-detection.jsx", "yoloLiveDetection", "yolo_live_detection.py"),
    ("06_yolo_and_ai/32_yolo_live_detection/yolo_detection.py", "06-02-yolo-live-detection__yolo-detection.jsx", "yoloDetection", "yolo_detection.py"),
    ("06_yolo_and_ai/33_object_tracking/33_object_tracking.py", "06-03-object-tracking.jsx", "objectTracking", "object_tracking.py"),
    ("06_yolo_and_ai/34_face_detection/34_face_detection.py", "06-04-face-detection.jsx", "faceDetection", "face_detection.py"),
    ("06_yolo_and_ai/35_face_quality/35_face_quality.py", "06-05-face-quality.jsx", "faceQuality", "face_quality.py"),
    ("06_yolo_and_ai/35_face_quality/face_tools.py", "06-05-face-quality__face-tools.jsx", "faceTools", "face_tools.py"),
    ("06_yolo_and_ai/36_face_feature_comparison/36_face_feature_comparison.py", "06-06-face-feature-comparison.jsx", "faceFeatureComparison", "face_feature_comparison.py"),
    ("06_yolo_and_ai/36_face_feature_comparison/face_tools.py", "06-06-face-feature-comparison__face-tools.jsx", "faceTools", "face_tools.py"),
    ("06_yolo_and_ai/37_face_enrollment_and_recognition/37_face_enrollment_and_recognition.py", "06-07-face-enrollment-and-recognition.jsx", "faceEnrollmentAndRecognition", "face_enrollment_and_recognition.py"),
    ("06_yolo_and_ai/37_face_enrollment_and_recognition/face_tools.py", "06-07-face-enrollment-and-recognition__face-tools.jsx", "faceTools", "face_tools.py"),
    ("06_yolo_and_ai/38_face_greeting_project/38_face_greeting_project.py", "06-08-face-greeting-project.jsx", "faceGreetingProject", "face_greeting_project.py"),
    ("06_yolo_and_ai/39_lead_target_selection/39_lead_target_selection.py", "06-09-lead-target-selection.jsx", "leadTargetSelection", "lead_target_selection.py"),
    ("06_yolo_and_ai/40_yolo_target_centering/40_yolo_target_centering.py", "06-10-yolo-target-centering.jsx", "yoloTargetCentering", "yolo_target_centering.py"),
    ("06_yolo_and_ai/41_following_distance_policy/41_following_distance_policy.py", "06-11-following-distance-policy.jsx", "followingDistancePolicy", "following_distance_policy.py"),
    ("06_yolo_and_ai/42_following_observation/42_following_observation.py", "06-12-following-observation.jsx", "followingObservation", "following_observation.py"),
    ("07_integrated_projects/43_sensor_decision/43_sensor_decision.py", "07-01-sensor-decision.jsx", "sensorDecision", "sensor_decision.py"),
    ("07_integrated_projects/44_pc_vision_project/44_pc_vision_project.py", "07-02-pc-vision-project.jsx", "pcVisionProject", "pc_vision_project.py"),
    ("08_raspberry_pi/45_check_pi/45_check_pi.py", "08-01-check-pi.jsx", "checkPi", "check_pi.py"),
    ("08_raspberry_pi/46_run_line_following/46_run_line_following.py", "08-02-run-line-following.jsx", "runLineFollowing", "run_line_following.py"),
    ("08_raspberry_pi/47_show_robot_and_camera/47_show_robot_and_camera.py", "08-03-show-robot-and-camera.jsx", "showRobotAndCamera", "show_robot_and_camera.py"),
    ("08_raspberry_pi/48_measure_opencv/48_measure_opencv.py", "08-04-measure-opencv.jsx", "measureOpencv", "measure_opencv.py"),
    ("08_raspberry_pi/49_measure_yolo/49_measure_yolo.py", "08-05-measure-yolo.jsx", "measureYolo", "measure_yolo.py"),
]

HEADER = re.compile(r"^# --- 共用配置[^\n]*\nTRANSPORT[^\n]*\nTIMEOUT[^\n]*\n", re.M)


def transform(src: str) -> str:
    s = HEADER.sub("", src)                                   # 删共用配置块
    s = s.replace(
        "pm.lite.connect(transport=TRANSPORT, timeout=TIMEOUT)",
        'pm.lite.connect(transport="wifi", timeout=15.0)',
    )
    s = re.sub(r"\n{4,}", "\n\n\n", s)                        # 空行收敛到 2
    return s.rstrip("\n")


def folds_of(code: str):
    out = []
    src_lines = code.splitlines()
    for node in ast.walk(ast.parse(code)):                # 含函数内的内嵌函数
        if isinstance(node, ast.FunctionDef) and node.name != "main":
            sig = src_lines[node.lineno - 1].rstrip()     # 完整签名行（内嵌函数带原缩进）
            out.append((sig, node.lineno, node.end_lineno, node.name == "main"))
    return sorted(out, key=lambda t: t[1])


for rel, fname, export, title in JOBS:
    code = transform((SDK / rel).read_text(encoding="utf-8"))
    assert "`" not in code and "${" not in code, f"{rel} 含反引号或 ${{，模板串不安全"
    # 模板串里 \n、\t 等仍是转义符：反斜杠必须翻倍，否则 Python 字符串里的 \n 会变成真换行
    code_js = code.replace("\\", "\\\\")
    lines = [
        "// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本",
        f"export const {export} = {{",
        f'  title: "{title}",',
        "  code: `" + code_js + "`,",
        "  folds: [",
    ]
    for label, a, b, op in folds_of(code):
        lines.append(f"    {{ label: {json.dumps(label, ensure_ascii=False)}, from: {a}, to: {b}, defaultOpen: {'true' if op else 'false'} }},")
    lines += ["  ],", "}"]
    (SNIP / fname).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK {fname}: {len(code.splitlines())} 行, {len(folds_of(code))} 个 fold")
