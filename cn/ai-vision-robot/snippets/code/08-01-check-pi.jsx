// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const checkPi = {
  title: "check_pi.py",
  code: `import glob
import os
import platform
import shutil
import sys
from pathlib import Path

import pymotion as pm


# --- 本例程可调整的参数 ---
TEMP_WARN = 75.0                           # 温度达到 75℃ 时显示过热提醒
MIN_FREE_GB = 2.0                          # 存储剩余不足 2GB 时显示空间不足


# 读取树莓派处理器温度，读取不到时返回 None
def read_temperature():
    """读取树莓派处理器温度，读取不到时返回 None。"""
    temperature_file = Path("/sys/class/thermal/thermal_zone0/temp")
    try:
        return int(temperature_file.read_text().strip()) / 1000  # 系统文件以千分之一摄氏度保存温度，除以 1000 得到 ℃
    except (OSError, ValueError):
        return None


def main():
    """检查树莓派、Python、SDK、USB、温度、存储和图形会话。"""
    # 第一步：查看实际系统和 Python 路径，确认使用的是准备好的运行环境
    print(f"系统: {platform.system()} {platform.machine()}")  # 显示系统名称和处理器架构，不根据文件夹名称猜测设备
    print(f"Python: {sys.version.split()[0]} ({sys.executable})")  # 显示真正运行此文件的解释器版本和路径
    print(f"SDK: {pm.lite.__version__}")

    if sys.prefix == sys.base_prefix:                       # 虚拟环境路径与基础解释器路径相同，表示没有加载虚拟环境
        print("虚拟环境: 未加载")
    else:
        print(f"虚拟环境: {sys.prefix}")

    # 第二步：只列出系统已经发现的串口，本例程不连接机器人
    usb_devices = []
    for pattern in ("/dev/ttyACM*", "/dev/ttyUSB*"):
        usb_devices.extend(glob.glob(pattern))              # glob() 用 * 匹配串口文件，extend() 把找到的路径加入列表
    if usb_devices:
        print(f"Robot USB: {', '.join(sorted(usb_devices))}")
    else:
        print("Robot USB: 未发现")

    # 第三步：温度与存储决定能否持续运行；没有温度文件时保持 None
    temperature = read_temperature()
    if temperature is None:
        print("处理器温度: None")
    elif temperature >= TEMP_WARN:
        print(f"处理器温度: {temperature:.1f} ℃，过热")
    else:
        print(f"处理器温度: {temperature:.1f} ℃，正常")

    free_gb = shutil.disk_usage(Path(__file__).parent).free / 1024 ** 3  # 查询例程所在磁盘，把剩余字节换算成 GB
    if free_gb < MIN_FREE_GB:
        print(f"存储剩余: {free_gb:.1f} GB，空间不足")
    else:
        print(f"存储剩余: {free_gb:.1f} GB")

    # 第四步：查看当前终端是否连接桌面；只登录终端时，后面的 OpenCV 窗口可能无法打开
    display = os.environ.get("WAYLAND_DISPLAY")             # 读取桌面会话的环境变量，没有设置时返回 None
    if display is None:
        display = os.environ.get("DISPLAY")                 # 兼容使用 X11 的桌面环境
    if display is None:
        print("图形会话: 未加载")
    else:
        print(f"图形会话: {display}")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def read_temperature():", from: 17, to: 23, defaultOpen: false },
  ],
}
