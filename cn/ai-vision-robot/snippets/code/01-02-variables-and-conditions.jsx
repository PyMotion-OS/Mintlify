// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const variablesAndConditions = {
  title: "check_distance.py",
  code: `import pymotion as pm

STOP = 200                                 # 判断阈值：200 毫米以内算"过近"


def main():
    """连接后读一次距离，判断这次读数属于哪一档。"""
    try:
        with pm.lite.connect(transport="wifi", timeout=15.0) as robot:
            ultrasonic_data = robot.ultrasonic()            # 读一次超声波数据

            print("超声波传感器的数据结构：")                            # 完整字段，一个不省
            print("{")
            print(f'  "distance": {ultrasonic_data.distance},')        # 距离，毫米
            print(f'  "state": "{ultrasonic_data.state}",')            # 状态文字
            print(f'  "valid": {ultrasonic_data.valid},')              # 这条数据能不能用
            print(f'  "age": {ultrasonic_data.age}')                   # 数据有多旧，单位秒
            print("}")

            # valid=False 时没有 distance 可用，必须先查它再做判断
            if not ultrasonic_data.valid:
                print(f"未知: None（{ultrasonic_data.state}）")
            elif ultrasonic_data.distance < STOP:                      # 比阈值小就是过近
                print(f"过近: {ultrasonic_data.distance:.0f} mm")
            else:                                                      # 其余都算正常
                print(f"正常: {ultrasonic_data.distance:.0f} mm")

    except pm.lite.LiteError as exc:
        print(f"连接失败（{exc}）")


if __name__ == "__main__":
    main()`,
  folds: [

  ],
}
