// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const lineControl = {
  title: "line_control.py",
  code: `MAX_LINE_SENSORS = 3                       # 正常循迹线最多连续触发三个探头
SENSOR_POSITIONS = (-2, -1, 0, 1, 2)       # 五个探头从左到右的位置
# 图案分类和显示名称放在一起，主程序引用时不用再重复定义
PATTERN_NAMES = {
    "line": "循迹",
    "lost": "丢线停机",
    "wide": "宽线停机",
    "multiple": "探测到多段图案",
    "invalid": "数据无效",
    "waiting": "等待数据",
}


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


def line_tracker_to_vw(sensor_states, v, k):
    """传入五路状态、基础 V 和增益 K，返回 V、W 和图案分类。"""
    # 调用上面的分类函数，得到图案分类和循迹线偏差
    pattern_type, line_offset = classify_pattern(sensor_states)  # sensor_states 是五路 True/False 状态
    if pattern_type != "line":                              # 只有单段连续线能够确定转弯方向
        return 0, 0, pattern_type                           # 其他图案返回 V=0、W=0

    # 使用比例控制计算 W，循迹线偏得越多，机器人转得越快
    w = k * (0 - line_offset)                               # 0 减偏差改变方向：负偏差得到正 W 左转
    return v, w, pattern_type                               # 返回基础 V、计算后的 W 和图案分类`,
  folds: [
    { label: "def classify_pattern():", from: 14, to: 43, defaultOpen: false },
    { label: "def line_tracker_to_vw():", from: 46, to: 55, defaultOpen: false },
  ],
}
