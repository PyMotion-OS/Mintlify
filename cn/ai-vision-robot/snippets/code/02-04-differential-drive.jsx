// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const differentialDrive = {
  title: "differential_drive.py",
  code: `import math

# --- 机器人尺寸 ---
R = 33.75                                  # 轮子半径，毫米（直径 67.5）
D = 160.0                                  # 左右轮间距，毫米

# --- 共用配置（一般不用动）---
PORT_LEFT, PORT_RIGHT = 3, 4               # 左轮接 M3，右轮接 M4
MAX_RPM = 60                               # 单轮转速上限


def limit_rpm(left, right):
    """同尺度限幅：超过单轮上限就两边一起缩小，弯道形状不变；返回值已取整"""
    fast = max(abs(left), abs(right))                       # 两轮里转得最快的那个
    if fast > MAX_RPM:                                      # 超过上限才需要缩
        scale = MAX_RPM / fast                              # 缩小的比例
        left = left * scale                                 # 左轮按同一比例缩小
        right = right * scale                               # 右轮按同一比例缩小
    return round(left), round(right)                        # 电机只收整数，四舍五入


def vw_to_rpm(v, w):
    """差速映射：前进速度和转弯快慢 → 左右轮的转速（RPM）

    左轮线速度 = 前进速度 - 角速度 × 轮间距 ÷ 2
    右轮线速度 = 前进速度 + 角速度 × 轮间距 ÷ 2
    轮转速 = 轮线速度 × 60 ÷ (2 × π × 轮子半径)
    算完先限幅、再取整，然后返回
    """
    w = math.radians(w)                                     # 重点：度/秒 → 弧度/秒
    c = 2 * math.pi * R                                     # 轮子转一圈走多远，毫米
    left_v = v - w * D / 2                                  # 左轮线速度，毫米/秒
    right_v = v + w * D / 2                                 # 右轮线速度，毫米/秒
    return limit_rpm(left_v * 60 / c, right_v * 60 / c)     # 线速度换成转速，再限幅


def drive(commands, v, w, valid_for=0.35):
    """沿用例程11的差速能力，把线速度和角速度设为左右主动轮转速。"""
    # commands 是实时会话的命令入口；v 毫米/秒，w 度/秒，valid_for 是命令有效期
    left, right = vw_to_rpm(v, w)                           # 得到限幅取整后的左右轮转速
    commands.motor_speeds.write(                            # 选择其中的电机速度命令
        {PORT_LEFT: left, PORT_RIGHT: right},               # 设定左右主动轮的目标转速
        valid_for=valid_for,                                # 大于 0.1 秒发送周期；定时发送中断后会自动停机
    )
    return left, right                                      # 主程序继续使用两个转速`,
  folds: [
    { label: "def limit_rpm(left, right):", from: 12, to: 19, defaultOpen: false },
    { label: "def vw_to_rpm(v, w):", from: 22, to: 34, defaultOpen: false },
    { label: "def drive(commands, v, w, valid_for=0.35):", from: 37, to: 45, defaultOpen: false },
  ],
}
