// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const obstaclePolicy = {
  title: "obstacle_policy.py",
  code: `STOP_DISTANCE = 100                         # 100毫米内停止
SLOW_DISTANCE = 300                         # 100～300毫米内减速
# 避障判断和显示名称放在一起，主程序只接收最终状态
OBSTACLE_NAMES = {
    "clear": "未测到障碍",
    "normal": "距离正常",
    "slow": "靠近减速",
    "stop": "遇障停机",
    "invalid": "数据无效",
    "waiting": "等待数据",
}


def ultrasonic_to_vw(ultrasonic_data, v, w):
    """根据超声波状态和距离保持、减半或归零 V/W，并返回避障状态。"""
    if ultrasonic_data.state == "no_echo":                 # 本例程把无回波作为未测到障碍，保持原来的 V/W
        return v, w, "clear"

    if not ultrasonic_data.valid:                           # 其他不可用状态把 V/W 归零
        return 0, 0, "invalid"

    if ultrasonic_data.distance <= STOP_DISTANCE:          # 距离过近时 V/W 归零
        return 0, 0, "stop"

    if ultrasonic_data.distance < SLOW_DISTANCE:           # 进入减速区间时 V/W 都减半
        return v / 2, w / 2, "slow"

    return v, w, "normal"                                   # 距离较远时保持原来的 V/W`,
  folds: [
    { label: "def ultrasonic_to_vw():", from: 14, to: 28, defaultOpen: false },
  ],
}
