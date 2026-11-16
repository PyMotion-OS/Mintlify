# -*- coding: utf-8 -*-
"""源码 → 页面代码 snippet 同步工具（长期维护）。

作用：把 SDK lessons 里的例程源码同步成 snippets/code/*.jsx（页面 CodeFold 的数据源）。
变换口径（与 SOP §2 一致，仅此两种）：
  1. 删「共用配置」块（TRANSPORT/TIMEOUT 常量），connect 参数内联 transport="wifi", timeout=15.0
  2. 其余逐字照抄源码（注释/print/docstring 全保留）
folds 用 ast 自动算行号，label 用完整签名行，def main 默认展开。

用法：改完源码后  python scripts/sync_snippets.py
新增页面：在 JOBS 里加一行 (源码路径, snippet 文件名, 导出名, 标题)
"""
import ast
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]              # pymotion使用手册大全/
SNIP = REPO / "cn/ai-vision-robot/snippets/code"
SDK = Path(r"D:\mjj-work\03-项目\pymotion_lite_-sdk\pymotion_SDK_dev\pymotion_lite\03-vision-car-course\lessons")

JOBS = [
    # (lessons 下的源码相对路径, snippet 文件名, 导出名, 页面标题里的文件名)
    ("01_python_basics/07_servo_move.py", "01-07-servo-move.jsx", "servoMove", "servo_move.py"),
    ("02_realtime_motion/09_servo_position/09_servo_position.py", "02-02-servo-position.jsx", "servoPosition", "servo_position.py"),
]

HEADER = re.compile(r"^# --- 共用配置[^\n]*\nTRANSPORT[^\n]*\nTIMEOUT[^\n]*\n", re.M)


def transform(src: str) -> str:
    s = HEADER.sub("", src)                                   # 删共用配置块
    s = s.replace(
        "pm.lite.connect(transport=TRANSPORT, timeout=TIMEOUT)",
        'pm.lite.connect(transport="wifi", timeout=15.0)',
    )
    s = re.sub(r"\n{4,}", "\n\n\n", s)                        # 空行收敛到 2
    return s.rstrip("\n")


def folds_of(code: str):
    out = []
    src_lines = code.splitlines()
    for node in ast.parse(code).body:
        if isinstance(node, ast.FunctionDef):
            sig = src_lines[node.lineno - 1].strip()          # 完整签名行
            out.append((sig, node.lineno, node.end_lineno, node.name == "main"))
    return out


for rel, fname, export, title in JOBS:
    code = transform((SDK / rel).read_text(encoding="utf-8"))
    assert "`" not in code and "${" not in code, f"{rel} 含反引号或 ${{，模板串不安全"
    # 模板串里 \n、\t 等仍是转义符：反斜杠必须翻倍，否则 Python 字符串里的 \n 会变成真换行
    code_js = code.replace("\\", "\\\\")
    lines = [
        "// 由 scripts/sync_snippets.py 从 SDK lessons 源码生成（connect 已内联，反斜杠已转义）；改代码请改源码后重跑脚本",
        f"export const {export} = {{",
        f'  title: "{title}",',
        "  code: `" + code_js + "`,",
        "  folds: [",
    ]
    for label, a, b, op in folds_of(code):
        lines.append(f"    {{ label: {json.dumps(label, ensure_ascii=False)}, from: {a}, to: {b}, defaultOpen: {'true' if op else 'false'} }},")
    lines += ["  ],", "}"]
    (SNIP / fname).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK {fname}: {len(code.splitlines())} 行, {len(folds_of(code))} 个 fold")
