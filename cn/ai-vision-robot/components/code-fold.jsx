// code-fold.jsx — 编辑器式折叠代码块（T1 demo5 用）
//
// 用法：
//   <CodeFold
//     title="line_following.py"
//     folds={[{ label: "read_line_state()", from: 2, to: 6 }]}
//     code={`...`}   // 反引号模板字符串，整段代码
//   />
//
// 特点：代码是一片连续块，fold 指定的行区间渲染成一行可点击的折叠条，
// 点击展开/收起，与编辑器的 region 折叠一致。
// 内置轻量高亮（关键字/字符串/注释）+ 固定深色编辑器风格，
// 深浅主题下显示一致；不走 Mintlify 代码块管线。
//
// 约束：named export、hooks 预注入不 import、无第三方包。

const TOKEN_RE =
  /(#.*)|('[^']*'|"[^"]*")|\b(def|return|if|elif|else|for|while|import|from|as|with|in|not|and|or|None|True|False|class|try|except|finally|is|pass|break|continue|lambda)\b/g;

const tokenize = (line) => {
  const out = [];
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line))) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), k: 0 });
    out.push({ t: m[0], k: m[1] ? 3 : m[2] ? 2 : 1 });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ t: line.slice(last), k: 0 });
  return out;
};

const COLORS = ["#c9d1d9", "#ff7b72", "#a5d6ff", "#8b949e"]; // 0 普通 1 关键字 2 字符串 3 注释

const Line = ({ n, text }) => (
  <div style={{ display: "flex", minHeight: "20px", lineHeight: "20px" }}>
    <span
      style={{
        width: "3em",
        flexShrink: 0,
        textAlign: "right",
        paddingRight: "12px",
        color: "#4d5b66",
        userSelect: "none",
      }}
    >
      {n}
    </span>
    <span style={{ whiteSpace: "pre" }}>
      {tokenize(text).map((seg, i) => (
        <span key={i} style={{ color: COLORS[seg.k] }}>
          {seg.t}
        </span>
      ))}
    </span>
  </div>
);

export const CodeFold = ({ title = "", code, folds = [] }) => {
  const [open, setOpen] = useState(folds.map(() => false));
  const lines = code.replace(/\n$/, "").split("\n");

  // 把行序列切成 普通/fold 交替的块
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const idx = folds.findIndex((f) => f.from === i + 1);
    if (idx !== -1) {
      blocks.push({ type: "fold", idx, text: lines.slice(i, folds[idx].to) });
      i = folds[idx].to;
    } else {
      blocks.push({ type: "line", n: i + 1, text: lines[i] });
      i++;
    }
  }

  const foldRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    lineHeight: "20px",
    minHeight: "20px",
    color: "#79c0ff",
    userSelect: "none",
  };

  return (
    <div
      style={{
        margin: "16px 0",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid rgba(128,128,128,0.35)",
      }}
    >
      {title && (
        <div
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            color: "#8b949e",
            backgroundColor: "rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(128,128,128,0.25)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          padding: "10px 14px",
          backgroundColor: "#0d1117",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "13px",
          overflowX: "auto",
        }}
      >
        {blocks.map((b, bi) =>
          b.type === "line" ? (
            <Line key={bi} n={b.n} text={b.text} />
          ) : open[b.idx] ? (
            <div key={bi}>
              <div
                style={foldRowStyle}
                onClick={() =>
                  setOpen(open.map((v, j) => (j === b.idx ? false : v)))
                }
              >
                <span>▾</span>
                <span>{folds[b.idx].label}</span>
              </div>
              {b.text.map((t, li) => (
                <Line key={li} n={folds[b.idx].from + li} text={t} />
              ))}
            </div>
          ) : (
            <div
              key={bi}
              style={foldRowStyle}
              onClick={() =>
                setOpen(open.map((v, j) => (j === b.idx ? true : v)))
              }
            >
              <span>▸</span>
              <span>{folds[b.idx].label}</span>
              <span style={{ color: "#4d5b66" }}>
                … {b.text.length} 行已折叠，点击展开
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
