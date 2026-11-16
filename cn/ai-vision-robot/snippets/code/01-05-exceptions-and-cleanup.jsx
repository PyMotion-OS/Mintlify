// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const exceptionsAndCleanup = {
  title: "watch_status.py",
  code: `import time

import pymotion as pm


def read_status(robot):
    """读一次状态，把整包 8 个字段全打出来。"""
    status = robot.status()                      # 读一次状态
    print("{")
    print(f'  "device_id": "{status.device_id}",')          # 设备编号
    print(f'  "state": "{status.state}",')                  # 设备当前状态
    print(f'  "lease_active": {status.lease_active},')      # 是否持有控制权（1.6 会用到）
    print(f'  "estop_latched": {status.estop_latched},')    # 急停是否锁存：按下会一直锁着
    print(f'  "estop_reason": "{status.estop_reason}",')    # 急停原因，没触发是空字符串
    print(f'  "fault_latched": {status.fault_latched},')    # 故障是否锁存
    print(f'  "fault_reason": "{status.fault_reason}",')    # 故障原因
    print(f'  "age": {status.age}')                         # 数据有多旧
    print("}")


def main():
    """连上以后每秒读一次；中途 Ctrl-C 或断网，都由 finally 收尾。"""
    robot = pm.lite.connect(transport="wifi", timeout=15.0)  # 注意：没有 with

    try:
        for i in range(20):                                 # 连续读 20 轮
            read_status(robot)
            time.sleep(1.0)                                 # 每轮停 1 秒
    except KeyboardInterrupt:                               # Ctrl-C 也是异常，可以接住
        print("被 Ctrl-C 打断")
    except pm.lite.LiteError as exc:                        # 只接 SDK 冒出来的错
        print(f"出错（{exc}）")
    finally:
        robot.close()                                       # 不管上面怎么结束，这里都会执行


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def read_status(robot):", from: 6, to: 18, defaultOpen: false },
    { label: "def main():", from: 21, to: 34, defaultOpen: true },
  ],
}
