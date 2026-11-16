// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const safeStop = {
  title: "safe_stop.py",
  code: `import threading                           # 导入线程工具
import time

import pymotion as pm

# --- 本例程可调整的参数 ---
RUN_SECONDS = 20.0                         # 最长运行时间，单位秒

# --- 共用配置（一般不用动）---
PORT_LEFT, PORT_RIGHT = 3, 4               # 左轮接 M3，右轮接 M4

def listen_keyboard(is_running):
    """输入 stop 后把列表中的运行标记改为 False。"""
    try:
        # [0] 取得列表中的第一个值；这个值为 True 时继续等待输入
        while is_running[0]:
            # input() 得到终端一行文字，strip() 去掉两端空白，lower() 改为小写，便于和 stop 比较
            if input().strip().lower() == "stop":
                is_running[0] = False                       # 修改共用列表，主线程也会看到 False

    # ctrl c后输入端关闭，input()冒出EOFError异常：输入端关闭或不可用，在此捕获异常并安静地结束监听线程，如果不捕获任其继续冒出，终端会打印此异常
    except EOFError:
        return

def main():
    """连接机器人，运行双轮，等待时间到期 或 输入stop 或 Ctrl+C 或 断开网络 双轮会自动停止。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():
                # 实时会话的 with 结束时，会停止本会话控制的双轮
                with robot.realtime.open(command_targets={"motor_speeds": (PORT_LEFT, PORT_RIGHT)}) as session:
                    # Python 里的每个值都是对象；True 不能修改内部内容，线程里重新赋值只会改变函数内的参数名
                    # 列表可以修改内部内容，两个线程拿到同一个列表后，都能看到 is_running[0] 的变化
                    is_running = [True]                     # 第一个值是两个线程共用的运行标记

                    # target 指定线程调用的函数，args 把同一个列表交给监听线程，不会另建一个列表
                    # daemon=True 表示主程序结束时一同结束监听线程
                    keyboard_thread = threading.Thread(target=listen_keyboard, args=(is_running,), daemon=True)
                    keyboard_thread.start()                 # start() 启动上面创建的监听线程

                    print("输入 stop 后按 Enter 主动停机；到达运行时间也会自动停机。")

                    # time.monotonic() 是一个持续增加的秒数，第一次调用得到开始秒数，加上最长运行时间得到结束秒数
                    end_time = time.monotonic() + RUN_SECONDS
                    # is_running[0] 会被监听线程改为 False，使循环提前结束；时间到期也会结束循环
                    while is_running[0] and time.monotonic() < end_time:
                        # 每条速度指令在设备端保持 0.35 秒；断网后无法刷新，双轮会自动停止
                        session.commands.motor_speeds.write({PORT_LEFT: 30, PORT_RIGHT: 30}, valid_for=0.35)
                        time.sleep(0.1)

    except KeyboardInterrupt:
        print("结果: Ctrl+C 主动停机")
    except Exception as exc:
        print(f"出错: {type(exc).__name__}: {exc}")

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def listen_keyboard(is_running):", from: 12, to: 23, defaultOpen: false },
    { label: "def main():", from: 25, to: 54, defaultOpen: true },
  ],
}
