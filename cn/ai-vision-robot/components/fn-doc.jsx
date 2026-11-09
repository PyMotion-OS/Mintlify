// fn-doc.jsx — 函数伪代码浮层（T1 demo6 用）
//
// 用法：正文说明里放
//   <FnDoc items={[{ label: "run()", doc: "读一帧\n├─ 没读到 → 回中\n└─ 读到了 → 转动" }]} />
// hover（或点击，触屏用）函数名 → 浮层显示伪代码，absolute 定位不影响布局。
//
// 约束：named export、hooks 预注入不 import、无第三方包、纯内联 style。

export const FnDoc = ({ items }) => {
  const [active, setActive] = useState(null);

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "8px", verticalAlign: "baseline" }}>
      {items.map((item, idx) => (
        <span key={item.label} style={{ position: "relative", display: "inline-block" }}>
          <span
            onMouseEnter={() => setActive(idx)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(active === idx ? null : idx)}
            style={{
              padding: "2px 8px",
              borderRadius: "5px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#79c0ff",
              border: "1px solid rgba(121, 192, 255, 0.45)",
              backgroundColor: active === idx ? "rgba(121, 192, 255, 0.15)" : "transparent",
              userSelect: "none",
            }}
          >
            {item.label}
          </span>
          {active === idx && (
            <span
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                zIndex: 50,
                display: "block",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "#0d1117",
                color: "#c9d1d9",
                border: "1px solid rgba(128,128,128,0.4)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "12.5px",
                whiteSpace: "pre",
                minWidth: "240px",
                maxWidth: "440px",
              }}
            >
              {item.doc}
            </span>
          )}
        </span>
      ))}
    </span>
  );
};
