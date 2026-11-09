// code-fold.jsx — 编辑器式折叠代码块 v2（抄官方 Shiki 双主题作业）
//
// 用法：
//   <CodeFold
//     title="line_following.py"
//     folds={[{ label: "read_line_state()", from: 2, to: 6 }]}
//     code={`...`}   // 反引号模板字符串
//   />
//
// 抄法（2026-11-09 抓线上 SSR DOM + 官方 CSS 得出）：
// 1. 根元素挂 class "shiki code-block-background"，内联 color / --shiki-dark、
//    background-color / --shiki-dark-bg 双值 —— 官方规则
//    html.dark .shiki span{color:var(--shiki-dark)} 会自动接管暗色切换
// 2. token 配色 = shiki-themes github-light-default dark-plus 实测值
// 3. 字体用官方 --font-paper-mono 变量；行元素 class="line"
//
// 折叠条融入代码流：占一行、带行号、注释样式，收起时行号连续不跳号。
// 约束：named export、hooks 预注入不 import、无第三方包。

// 双值写法：返回带 --shiki-dark 的 style 对象
const C = (light, dark) => ({ color: light, "--shiki-dark": dark });

const PALETTE = {
  plain: C("#1F2328", "#D4D4D4"),
  keyword: C("#CF222E", "#C586C0"),
  func: C("#8250DF", "#DCDCAA"),
  const: C("#0550AE", "#569CD6"),
  string: C("#0A3069", "#CE9178"),
  comment: C("#6E7781", "#6A9955"),
  gutter: C("#8B949E", "#4E5866"),
};

const TOKEN_RE =
  /(#.*)|('[^']*'|"[^"]*")|\b(def|return|if|elif|else|for|while|import|from|as|with|in|not|and|or|is|pass|break|continue|lambda|class|try|except|finally)\b|\b(None|True|False)\b/g;

const tokenize = (line) => {
  const out = [];
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line))) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), k: "plain" });
    const kind = m[1] ? "comment" : m[2] ? "string" : m[4] ? "const" : "keyword";
    out.push({ t: m[0], k: kind });
    // def/class 后紧跟的函数名：官方染成紫色
    if (m[3] === "def" || m[3] === "class") {
      const rest = line.slice(m.index + m[0].length);
      const fn = rest.match(/^\s+([A-Za-z_]\w*)/);
      if (fn) {
        out.push({ t: rest.slice(0, fn[0].length - fn[1].length), k: "plain" });
        out.push({ t: fn[1], k: "func" });
        last = m.index + m[0].length + fn[0].length;
      }
    }
    last = Math.max(last, m.index + m[0].length);
  }
  if (last < line.length) out.push({ t: line.slice(last), k: "plain" });
  return out;
};

const GUTTER = (gutterWidth) => ({
  ...PALETTE.gutter,
  width: gutterWidth,
  flexShrink: 0,
  textAlign: "right",
  paddingRight: "16px",
  userSelect: "none",
});

const Line = ({ n, text, gutterWidth }) => (
  <span className="line" style={{ display: "flex" }}>
    <span style={GUTTER(gutterWidth)}>{n}</span>
    <span style={{ whiteSpace: "pre" }}>
      {tokenize(text).map((seg, i) => (
        <span key={i} style={PALETTE[seg.k]}>
          {seg.t}
        </span>
      ))}
    </span>
  </span>
);

const FoldRow = ({ n, label, isOpen, hiddenCount, gutterWidth, onClick }) => (
  <span
    className="line"
    style={{ display: "flex", cursor: "pointer" }}
    onClick={onClick}
  >
    <span style={GUTTER(gutterWidth)}>{n}</span>
    <span style={{ whiteSpace: "pre", ...PALETTE.comment }}>
      {isOpen ? "▾" : "▸"} {label}
      {!isOpen ? ` … ${hiddenCount} 行已折叠` : ""}
    </span>
  </span>
);

export const CodeFold = ({ title = "", code, folds = [] }) => {
  const [open, setOpen] = useState(folds.map(() => false));
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const gutterWidth = `${String(lines.length).length + 1}em`;

  // 行序列 → 普通/fold 交替块
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

  const toggle = (idx) =>
    setOpen(open.map((v, j) => (j === idx ? !v : v)));

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="shiki code-block-background"
      style={{
        margin: "16px 0",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid rgba(127,127,127,0.25)",
        backgroundColor: "#ffffff",
        "--shiki-dark-bg": "#0B0C0E",
        ...PALETTE.plain,
        fontFamily:
          'var(--font-paper-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
        fontSize: "13.5px",
      }}
    >
      {/* 顶栏：文件名 + 复制（对齐原生代码块头部） */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 14px",
          borderBottom: "1px solid rgba(127,127,127,0.18)",
          ...PALETTE.comment,
        }}
      >
        <span style={{ fontSize: "12.5px" }}>{title}</span>
        <button
          onClick={copy}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "12.5px",
            padding: "2px 6px",
            borderRadius: "6px",
            ...PALETTE.comment,
          }}
        >
          {copied ? "✓ 已复制" : "复制"}
        </button>
      </div>

      {/* 代码区 */}
      <div style={{ padding: "10px 14px", overflowX: "auto", lineHeight: "1.55" }}>
        {blocks.map((b, bi) =>
          b.type === "line" ? (
            <Line key={bi} n={b.n} text={b.text} gutterWidth={gutterWidth} />
          ) : open[b.idx] ? (
            <span key={bi}>
              <FoldRow
                n={folds[b.idx].from}
                label={folds[b.idx].label}
                isOpen={true}
                gutterWidth={gutterWidth}
                onClick={() => toggle(b.idx)}
              />
              {b.text.map((t, li) => (
                <Line
                  key={li}
                  n={folds[b.idx].from + li}
                  text={t}
                  gutterWidth={gutterWidth}
                />
              ))}
            </span>
          ) : (
            <FoldRow
              key={bi}
              n={folds[b.idx].from}
              label={folds[b.idx].label}
              isOpen={false}
              hiddenCount={b.text.length}
              gutterWidth={gutterWidth}
              onClick={() => toggle(b.idx)}
            />
          )
        )}
      </div>
    </div>
  );
};
