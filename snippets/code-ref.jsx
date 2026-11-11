// code-ref.jsx — 联动高亮组件（T1 demo4 用）
//
// 用法：页面先给代码块套一层 <div id="xxx">，再放：
//   <CodeRef target="xxx" items={[{ label: "init()", line: 5 }, { label: "run()", line: 12 }]} />
// 点击按钮 → 目标代码行高亮（内联 style，不动 docs.json 样式配置）。
//
// 约束（来自 spec v2.1 能力核实）：
// - 只能 named export，不能用 function 关键字声明导出
// - hooks 已预注入，不要自行 import
// - 不能引第三方包、不能 export default

export const CodeRef = ({ target, items }) => {
  const [active, setActive] = useState(null);

  const clearAll = (root) => {
    const lines = pickLines(root);
    lines.forEach((el) => {
      el.style.backgroundColor = "";
    });
  };

  const pickLines = (root) => {
    // Shiki 渲染的行选择器未实测，按可能性兜底：
    // 1) .line  2) [data-line]  3) pre 的直接子元素
    let lines = root.querySelectorAll(".line");
    if (lines.length) return lines;
    lines = root.querySelectorAll("[data-line]");
    if (lines.length) return lines;
    const pre = root.querySelector("pre");
    return pre ? pre.children : [];
  };

  const handleClick = (item, idx) => {
    const root = document.getElementById(target);
    if (!root) return;
    clearAll(root);
    const lines = pickLines(root);
    const el = lines[item.line - 1];
    if (el) el.style.backgroundColor = "rgba(250, 204, 21, 0.30)";
    setActive(idx);
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        margin: "8px 0 12px",
      }}
    >
      {items.map((item, idx) => {
        const isActive = idx === active;
        return (
          <button
            key={item.label}
            onClick={() => handleClick(item, idx)}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "inherit",
              border: isActive
                ? "1px solid rgba(234, 179, 8, 0.9)"
                : "1px solid rgba(128, 128, 128, 0.45)",
              backgroundColor: isActive
                ? "rgba(250, 204, 21, 0.25)"
                : "rgba(128, 128, 128, 0.12)",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
