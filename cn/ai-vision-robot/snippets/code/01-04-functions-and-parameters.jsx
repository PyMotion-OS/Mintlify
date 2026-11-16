// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const functionsAndParameters = {
  title: "battery_check.py",
  code: `import time

import pymotion as pm

LOW = 10.5                                 # 告警电压：低于它就要充电（伏特）
FULL = 12.5                                # 标称电压：低于它算"一般"


def check_V(V):
    """判断电压属于哪一档，直接打印结论。

    V 是电压数值；读不到时 SDK 给的是 None（Python 表示"没有值"）。
    """
    if V is None:                                     # 读不到电压
        print("电压: 读不到（None）")
    elif V < LOW:                                     # 低于告警电压
        print(f"电压: {V:.2f} V，偏低")
    elif V < FULL:                                    # 低于标称电压
        print(f"电压: {V:.2f} V，一般")
    else:                                             # 其余都算充足
        print(f"电压: {V:.2f} V，充足")


def main():
    """连上后读三次电压，每读一次立刻判一次。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            for i in range(3):                          # 连读三次
                power_data = robot.power()              # 读一次电源数据
                check_V(power_data.voltage)             # 判断交给函数，主流程只管读
                time.sleep(0.5)

    except pm.lite.LiteError as exc:
        print(f"连接失败（{exc}）")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def check_V():", from: 9, to: 21, defaultOpen: false },
    { label: "def main():", from: 24, to: 34, defaultOpen: true },
  ],
}
