// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本
export const realtimeDataQueue = {
  title: "realtime_data_queue.py",
  code: `import time
from pprint import pprint                  # 让字典按结构换行显示

import pymotion as pm



def main():
    """接收两种传感数据，发送一次双轮速度并打印数据结构。"""
    ultrasonic_data = None                                  # 定义超声波数据
    tracker_line_data = None                                # 定义五路循迹数据

    with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
        with robot.control():
            # 打开实时控制会话；read() 取出并移除一条数据，队列为空时等待新数据
            with robot.realtime.open(
                data_sources=("ultrasonic", "line_tracker") # 同时接收超声波和五路循迹数据
            ) as session:

                # while 在条件为真时会重复：当超声波数据为空或者五路数据为空时，继续进入循环
                while ultrasonic_data is None or tracker_line_data is None:
                    # 主动取出持续进入队列的下一条数据；队列为空时最多等待 1 秒
                    sensor_data = session.data.read(timeout=1.0)
                    if sensor_data is None:                 # 上一行读取的数据为空则返回报错
                        raise TimeoutError("没有收齐超声波和五路循迹数据")

                    # 根据数据来源，保存对应的最新数据
                    if sensor_data.source == "ultrasonic":
                        ultrasonic_data = sensor_data
                    elif sensor_data.source == "line_tracker":
                        tracker_line_data = sensor_data               

    print("data_queue.read() 返回的超声波结构:")
    pprint(
        {
            "source": ultrasonic_data.source,
            "data": {
                "valid": ultrasonic_data.data.valid,
                "state": ultrasonic_data.data.state,
                "age": ultrasonic_data.data.age,
                "distance": ultrasonic_data.data.distance,
            },
            "sequence": ultrasonic_data.sequence,
            "received_monotonic": ultrasonic_data.received_monotonic,
            "age": ultrasonic_data.age,
        },
        width=120,                                          # 每行最多 120 个字符，减少不必要的换行
        sort_dicts=False,                                   # 按上面的字段顺序显示
    )

    print("data_queue.read() 返回的五路循迹结构:")
    pprint(
        {
            "source": tracker_line_data.source,
            "data": {
                "valid": tracker_line_data.data.valid,
                "state": tracker_line_data.data.state,
                "age": tracker_line_data.data.age,
                "is_detected": tracker_line_data.data.is_detected,
            },
            "sequence": tracker_line_data.sequence,
            "received_monotonic": tracker_line_data.received_monotonic,
            "age": tracker_line_data.age,
        },
        width=120,
        sort_dicts=False,
    )


if __name__ == "__main__":
    main()`,
  folds: [
  ],
}
