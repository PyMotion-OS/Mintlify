// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const keyboardControl = {
  title: "keyboard_control.py",
  code: `import tkinter as tk                       # Tkinter 用来创建键盘控制窗口

import pymotion as pm

from differential_drive import PORT_LEFT, PORT_RIGHT, drive  # 引用例程 11 演示的差速能力

# --- 本例程可调整的参数 ---
V = 106                                    # 前后方向的线速度，单位毫米/秒
W = 40                                     # 左右方向的角速度，单位度/秒

def run_window(commands):
    """用实时命令入口打开键盘窗口，并持续刷新双轮速度。"""
    window = tk.Tk()                                        # 创建一个窗口
    window.title("键盘遥控")                                # 设置窗口标题
    window.keys = set()                                     # 集合可以同时记录多个按键

    tip = tk.Label(                                         # 创建一段窗口提示文字
        window,
        text="点击窗口后按方向键；上下控制前后，左右控制转向，可以组合按键",
        padx=24,                                            # 文字左右各留 24 像素空白
        pady=24,                                            # 文字上下各留 24 像素空白
    )
    tip.pack()                                              # 把提示文字放进窗口

    # 在 run_window 内部定义 tick，供后面的 window.after() 定时调用
    def tick():
        """把按键合成当前目标，并按固定周期发送。"""
        v = 0                                                # 每轮从零重算，不会越按越快
        w = 0
        if "Up" in window.keys:
            v += V                                          # 上键提供 +V 的前进速度
        if "Down" in window.keys:
            v -= V                                          # 下键提供 -V 的后退速度
        if "Left" in window.keys:
            w += W                                          # 左键提供 +W 的左转速度
        if "Right" in window.keys:
            w -= W                                          # 右键提供 -W 的右转速度

        drive(commands, v, w)                               # 即使没有按键，也持续发送左右轮 0 RPM
        window.after(100, tick)                             # 100 毫秒后再次执行tick

    # 在 run_window 内部定义 on_press，供按键按下时调用
    def on_press(event):
        """记录按下的方向键；空格和 Esc 清空全部按键。"""
        if event.keysym in ("space", "Escape"):             # event.keysym 是本次按下的按键名称
            window.keys.clear()
            drive(commands, 0, 0)                           # 立即把左右轮目标改为 0 RPM
        elif event.keysym in ("Up", "Down", "Left", "Right"):
            window.keys.add(event.keysym)                   # 把刚按下的键加入集合

    # 在 run_window 内部定义 on_release，供按键松开时调用
    def on_release(event):
        """只移除已经松开的键，其他仍按住的键继续生效。"""
        window.keys.discard(event.keysym)                   # 把刚松开的键移出集合

    # 在 run_window 内部定义 on_focus_out，供窗口失去焦点时调用
    def on_focus_out(_event):
        """窗口失去焦点时清空全部按键。"""
        window.keys.clear()
        drive(commands, 0, 0)                               # 失去焦点时立即把左右轮目标改为 0 RPM

    window.bind("<KeyPress>", on_press)                     # 将按下事件绑定到 on_press
    window.bind("<KeyRelease>", on_release)                 # 将松开事件绑定到 on_release
    window.bind("<FocusOut>", on_focus_out)                 # 将失焦事件绑定到 on_focus_out
    window.after(100, tick)                                 # 100 毫秒后首次检查按键
    try:
        window.mainloop()                                   # 保持窗口运行并接收事件
    finally:
        commands.motor_speeds.stop()                        # 关窗退出实时控制前，最后主动停机一次

def main():
    """连接 → 拿控制权 → 开双轮通道 → 开窗口"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:

            with robot.control():                           # 拿控制权，退出时自动停止
                # 打开实时控制会话
                with robot.realtime.open(command_targets={"motor_speeds": (PORT_LEFT, PORT_RIGHT)}) as session:
                    run_window(session.commands)            # 传入实时会话的命令入口
    except Exception as exc:
        print(f"出错: {type(exc).__name__}: {exc}")

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def run_window():", from: 11, to: 69, defaultOpen: false },
    { label: "def main():", from: 71, to: 81, defaultOpen: true },
  ],
}
