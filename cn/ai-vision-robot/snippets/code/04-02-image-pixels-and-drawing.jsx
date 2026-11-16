// 由 .tmp_gen/batch_code_snippets.py 生成；改代码直接改本文件模板串
export const imagePixelsAndDrawing = {
  title: "image_pixels_and_drawing.py",
  code: `from pathlib import Path                   # 用路径对象找到与例程放在一起的图片

import cv2                                 # 继续使用 OpenCV 解码和绘制图片
import numpy as np                         # 使用 NumPy 读取图片字节和定位像素

# --- 本例程可调整的参数 ---
POINT_X, POINT_Y = 960, 900                # 选中像素的坐标 (x, y)，x 位于水平中心，y 位于画面下方

# --- 共用配置（一般不用动）---
BASE_DIR = Path(__file__).parent           # 当前例程文件所在的文件夹
IMAGE_PATH = BASE_DIR / "camera_frame.jpg" # 摄像头取得的真实图片:当前例程文件所在的文件夹下的camera_frame.jpg

def load_image(path):
    """读取图片文件，再转换成 OpenCV 可以处理的 BGR 图片。"""
    image_bytes = np.fromfile(path, dtype=np.uint8)         # 把图片文件读成一组原始字节
    return cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)      # 把原始字节解码成 BGR 图片

def main():
    """读取图片，查看一个像素，并显示点、矩形和坐标轴。"""
    # 第一步：读取图片，取得尺寸、颜色通道和指定像素
    image = load_image(IMAGE_PATH)
    height, width, color_channels = image.shape             # 依次取得高、宽和通道数；通道数表示每个像素有几个颜色值

    # NumPy 数组按“行、列”定位，Y 对应行、X 对应列，所以像素坐标 (X, Y) 要写成 image[Y, X]
    pixel = image[POINT_Y, POINT_X].tolist()                # 取得这个像素的颜色，并转成 [蓝, 绿, 红] 列表

    print(f"图片尺寸: {width} × {height}")
    print(f"颜色通道: {color_channels}（每个像素有 {color_channels} 个颜色值，OpenCV 按 BGR 排列）")
    print(f"像素坐标: ({POINT_X}, {POINT_Y})  BGR: {pixel}")

    # 第二步：在指定像素处画红点，并把像素坐标和 BGR 值写在旁边
    # circle() 会直接在 image 上画圆，这里用红色实心圆放大标出选中的像素
    # 参数依次是图片、圆心像素坐标 (POINT_X, POINT_Y)、半径、BGR 颜色和线宽；-1 表示填满圆形
    cv2.circle(image, (POINT_X, POINT_Y), 8, (0, 0, 255), -1)

    # putText() 会直接在 image 上写字，这里把像素坐标和原始 BGR 显示在红点旁
    # 参数包括图片、文字、文字左下角的坐标位置、字体、字号、BGR 颜色和线宽
    cv2.putText(image, f"({POINT_X}, {POINT_Y})  BGR={pixel}", (POINT_X + 20, POINT_Y - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    # 第三步：使用左上角和右下角的像素坐标画出绿色矩形
    # rectangle() 的参数是图片、左上角 (710, 390)、右下角 (1210, 690)、BGR 颜色和线宽
    cv2.rectangle(image, (710, 390), (1210, 690), (0, 255, 0), 4)

    # 第四步：从图片左上角画出 X、Y 坐标轴并写上方向
    # arrowedLine() 会直接在 image 上画带箭头的线，这里从图片左上角画出两条坐标轴
    # 参数依次是图片、起点、终点、BGR 颜色和线宽；X 向右增加，Y 向下增加
    cv2.arrowedLine(image, (0, 0), (400, 0), (0, 255, 255), 8)
    cv2.arrowedLine(image, (0, 0), (0, 400), (0, 255, 255), 8)

    # 给坐标轴进行文字注释
    cv2.putText(image, "origin (0, 0)", (20, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(image, "+X", (410, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
    cv2.putText(image, "+Y", (20, 430), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)

    # 第五步：显示绘制结果，等待任意按键后关闭窗口
    cv2.imshow("Image Pixels and Drawing - Press Any Key", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()`,
  folds: [
    { label: "def load_image(path):", from: 13, to: 16, defaultOpen: false },
    { label: "def main():", from: 18, to: 58, defaultOpen: true },
  ],
}
