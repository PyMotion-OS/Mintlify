// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const lineClassificationAndMotion = {
  title: "line_classification_and_motion.py",
  code: `import time

import pymotion as pm


# --- 本页可调整的参数 ---
V = 80                                     # 基础前进速度，毫米/秒
K = 25                                     # 转弯增益，每一格偏差增加 25 度/秒的 W
MAX_LINE_SENSORS = 3                       # 正常循迹线最多连续触发三个探头

# --- 共用配置（一般不用动）---
SENSOR_POSITIONS = (-2, -1, 0, 1, 2)       # 五个探头从左到右的位置

# --- 分类结果 ---
PATTERN_NAMES = {
    "line": "单段连续线",
    "lost": "没有探测到线",
    "wide": "连续图案过宽",
    "multiple": "探测到多段图案",
    "invalid": "数据无效",
}

# --- 第一部分：把五路数据分成专业、明确的观测结果 ---
def classify_pattern(sensor_states):
    """检查五路状态，找出探测位置，再返回图案分类和循迹线偏差。"""
    # 第一步：只有收到完整的五路数据，才能继续分类
    if sensor_states is None or len(sensor_states) != 5:
        return "invalid", None                              # 返回数据无效，偏差为空

    # 第二步：把探测到循迹线的探头换成位置
    detected_positions = []                                 # 新建空列表，准备保存探测位置
    for index in range(5):                                  # index 依次取 0、1、2、3、4
        if sensor_states[index]:                            # 取得相同编号的探头状态，True 时执行下一行
            detected_positions.append(SENSOR_POSITIONS[index])  # 把这个探头的位置加入列表

    detected_count = len(detected_positions)                # len() 得到探测位置的数量
    if detected_count == 0:
        return "lost", None                                 # 返回没有探测到线，偏差为空

    # 第三步：先判断是否为多段图案，再判断连续图案是否过宽
    first_position = detected_positions[0]                  # [0] 取得最左边的探测位置
    last_position = detected_positions[-1]                  # [-1] 取得最右边的探测位置
    continuous_count = last_position - first_position + 1   # 两端之间连续排列时应有的位置数量

    if continuous_count != detected_count:                  # 数量不同表示中间存在未探测位置
        return "multiple", None
    if detected_count > MAX_LINE_SENSORS:                   # 连续触发数量超过正常线宽
        return "wide", None

    # 第四步：用平均值求线的中心位置（质心法），单位是一个探头间距
    # 偏差为负表示线在左边，0 表示居中，正数表示线在右边；下一步用它计算 W
    line_offset = sum(detected_positions) / detected_count  # sum() 求和，再除以数量得到中心位置
    return "line", line_offset                              # 返回单段连续线和中心偏差


# --- 第二部分：把分类结果转成 V 和 W ---
def line_tracker_to_vw(sensor_states, v, k):
    """传入五路状态、基础 V 和增益 K，返回 V、W 和图案分类。"""
    # 调用上面的分类函数，得到图案分类和循迹线偏差
    pattern_type, line_offset = classify_pattern(sensor_states)  # sensor_states 是五路 True/False 状态
    if pattern_type != "line":                              # 只有单段连续线能够确定转弯方向
        return 0, 0, pattern_type                           # 其他图案返回 V=0、W=0

    # 使用比例控制计算 W，循迹线偏得越多，机器人转得越快
    w = k * (0 - line_offset)                               # 0 减偏差改变方向：负偏差得到正 W 左转
    return v, w, pattern_type                               # 返回基础 V、计算后的 W 和图案分类


def main():
    """获取五路循迹数据，在计算结果变化时打印分类、V 和 W。"""
    last_observation = None                                 # 用来保存上一轮观测，第一次还没有内容
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            while True:
                tracker_line_data = robot.line_tracker()
                # 传入真实五路状态、基础 V 和增益 K，得到计算后的 V、W 和分类
                v, w, pattern_type = line_tracker_to_vw(tracker_line_data.is_detected, V, K)
                # 把五路状态、分类、V 和 W 组成一轮完整观测，便于和上一轮比较
                current_observation = (tracker_line_data.is_detected, pattern_type, v, w)

                # 图案变化一次就打印
                if current_observation != last_observation:
                    print(
                        f"五路: {tracker_line_data.is_detected}\\n"
                        f"分类: {PATTERN_NAMES[pattern_type]}  "
                        f"V: {v:>2} mm/s  W: {w:>5} °/s"
                    )
                    last_observation = current_observation  # 把本轮观测留到下一轮比较

                time.sleep(0.35)                            # 每 0.35 秒观察一次计算结果

    except KeyboardInterrupt:
        print("Ctrl+C 结束观察")
    except pm.lite.LiteError as exc:
        print(f"出错: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def classify_pattern(sensor_states):", from: 24, to: 53, defaultOpen: false },
    { label: "def line_tracker_to_vw(sensor_states, v, k):", from: 57, to: 66, defaultOpen: false },
  ],
}
