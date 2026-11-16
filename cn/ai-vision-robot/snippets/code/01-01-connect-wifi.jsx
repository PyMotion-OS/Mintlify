// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const connectWifi = {
  title: "hello_robot.py",
  code: `import sys
from pathlib import Path

import pymotion as pm

TRANSPORT = "wifi"   # 连接方式
TIMEOUT = 15.0       # 连接最长等待时间（秒）


def main():
    # 打印环境 → 连接 → 读设备信息；with 块结束自动断开
    print(f"Python: {sys.version.split()[0]} ({sys.executable})")
    print(f"SDK:    {pm.lite.__version__} ({Path(pm.__file__).resolve()})")
    print()

    try:
        with pm.lite.connect(transport=TRANSPORT, timeout=TIMEOUT) as robot:
            print(f"设备  ID: {robot.connection.device_id}")   # 机器人的网络身份证
            print(f"传输方式: {robot.connection.transport}")   # 实际用的连接方式
    except pm.lite.LiteError as exc:
        # LiteError 是 SDK 的统一报错类型，本模块所有失败都由它报告
        print(f"连接失败（{exc}）")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def main():", from: 10, to: 22, defaultOpen: true },
  ],
}
