// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const loopsAndLists = {
  title: "read_tracker.py",
  code: `import time                                 # time 模块：让程序"等一会儿"

import pymotion as pm


def main():
    """连上后先看一次五路读数的结构，再读 10 轮存进列表，最后逐轮打印。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            tracker_line_data = robot.line_tracker()          # 第一次读，只为看结构

            print("五路传感器的数据结构：")
            print("{")
            print(f'  "is_detected": {tracker_line_data.is_detected},')  # 五路是否压到黑线
            print(f'  "state": "{tracker_line_data.state}",')            # 状态文字
            print(f'  "valid": {tracker_line_data.valid},')              # 数据能不能用
            print(f'  "age": {tracker_line_data.age}')                   # 数据有多旧
            print("}")

            rows = []                                       # 空列表，存每一轮的读数
            for i in range(10):                             # 计数循环，跑 10 轮
                tracker_line_data = robot.line_tracker()
                if tracker_line_data.valid:                 # 有效才存进列表
                    rows.append(list(tracker_line_data.is_detected))
                time.sleep(0.3)                             # 在这个位置等 0.3 秒

            for row in rows:                                # 遍历列表，逐行打印 10 轮记录
                print(row)

    except pm.lite.LiteError as exc:
        print(f"连接失败（{exc}）")


if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def main():", from: 6, to: 31, defaultOpen: true },
  ],
}
