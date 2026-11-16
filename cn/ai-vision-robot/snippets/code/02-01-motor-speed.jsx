// 由 .tmp_gen/gen_code_snippet.py 从页面抽取生成，改代码请改本文件的模板串
export const motorSpeed = {
  title: "motor_speed.py",
  code: `import time

import pymotion as pm

# --- 本例程可调整的参数 ---
PORT_MOTOR = 4                             # 选择主动轮：3 接 M3 左轮，4 接 M4 右轮
RPM = 30                                   # 目标转速，单位转/分；正数正转，负数反转

# --- 共用配置（一般不用动）---
MAX_RPM = 60                               # 允许的最高转速，单位转/分

def main():
    """给一个主动轮写速度命令，用 valid_for 和 sleep 配合观察"到期自动停机"。

    运行前请把小车架空：只有一个主动轮会转。
    """
    rpm = max(-MAX_RPM, min(MAX_RPM, RPM))                  # 把目标转速限制在正负 MAX_RPM 以内

    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            with robot.control():                           # 电机执行前需要获取控制权
                # 打开实时控制会话，只声明本课要用的一个电机端口
                with robot.realtime.open(command_targets={"motor_speeds": (PORT_MOTOR,)}) as session:

                    # valid_for=1.0：这条速度命令只活 1 秒，1 秒后设备自己停机
                    session.commands.motor_speeds.write(
                        {PORT_MOTOR: rpm},                  # 正转速度
                        valid_for=1.0,
                    )
                    print(f"正转: 端口 {PORT_MOTOR}，{rpm} 转/分，命令 1 秒后到期")
                    # sleep 比 valid_for 长：前 1 秒在转，后 1 秒已经停了
                    time.sleep(2.0)
                    print("第 1 秒已过，命令到期，轮子应已自动停下")

                    session.commands.motor_speeds.write(
                        {PORT_MOTOR: -rpm},                 # 反转速度
                        valid_for=2.0,                      # 这次命令能活 2 秒
                    )
                    print(f"反转: 端口 {PORT_MOTOR}，{-rpm} 转/分，命令 2 秒后到期")
                    time.sleep(1.0)                         # 只等 1 秒，命令还没过期
                    session.commands.motor_speeds.stop()    # 主动停机，不等剩下的 1 秒
                    print("主动 stop(): 只转了 1 秒就停")

    except pm.lite.LiteError as exc:
        print(f"出错: {type(exc).__name__}: {exc}")
    except KeyboardInterrupt:
        print("Ctrl+C 主动结束；退出 control 时会关闭 PWM 输出")

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def main():", from: 12, to: 47, defaultOpen: true },
  ],
}
