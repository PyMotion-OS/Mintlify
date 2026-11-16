// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const classAndWith = {
  title: "safe_motors.py",
  code: `import pymotion as pm

PORT_LEFT = 3                              # 左轮接 M3 口
PORT_RIGHT = 4                             # 右轮接 M4 口
RPM = 30                                   # 转速：转/分钟，正数向前


class SafeMotors:
    """两路电机的包装：进 with 时停一次，出 with 时再停一次。"""

    def __init__(self, robot):
        """创建对象时执行：把机器人的电机组记下来。"""
        self.motors = robot.motors

    def __enter__(self):
        """进 with 时执行：先停一次，再把电机组交给 as 后面的名字。"""
        self.motors.stop()
        return self.motors

    def __exit__(self, exc_type, exc_value, traceback):     # Python 自动传这三个参数
        """出 with 时执行：停一次电机。"""
        self.motors.stop()


def main():
    """同一个动作写两遍：一遍自己写 stop，一遍交给 SafeMotors。"""

    with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
        with robot.control():                               # 先拿控制权
            # 写法一：不用类——停、发、停，三步都得自己写，忘一步就出事
            robot.motors.stop()                             # 跑前停一次
            robot.motors.set_speeds({PORT_LEFT: RPM, PORT_RIGHT: RPM}, duration=2)  # 前进 2 秒
            robot.motors.stop()                             # 收尾停一次

            # 写法二：用类——进出 with 自动停，中间只写动作
            with SafeMotors(robot) as motors:
                motors.set_speeds({PORT_LEFT: RPM, PORT_RIGHT: RPM}, duration=2)


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def main():", from: 25, to: 37, defaultOpen: true },
  ],
}
