// code-fold.jsx — 编辑器式折叠代码块 v3（结构性对齐原生，不是近似配色）
//
// 用法：
//   <CodeFold title="line_following.py"
//             folds={[{ label: "read_line_state()", from: 2, to: 6 }]}
//             code={`...`} />
//
// 抄法（2026-11-09 抓线上 SSR DOM + 官方 CSS）：
// 1. 结构照搬原生：外层 .code-block（bg-gray-50 / dark:bg-white/5、border-gray-950/10、
//    p-0.5、rounded-2xl）→ 顶栏（text-gray-400、rounded-t-[14px]、pl-4 pr-2.5 py-1）
//    → 内层代码面板（bg-white / dark:bg-codeblock=#0b0c0e、rounded-xt=14px）
// 2. 颜色全部走官方 Tailwind class / CSS 变量（--gray-*、--shiki-*），不自造近似灰
// 3. token 双值：color + --shiki-dark，暗色由官方规则
//    html.dark .shiki span{color:var(--shiki-dark)} 接管
// 4. 行元素 class="line"，字体 var(--font-paper-mono)
//
// 折叠条：融入代码流、带行号、注释灰样式，收起时行号连续。
// 约束：named export、hooks 预注入不 import、无第三方包。

const C = (light, dark) => ({ color: light, "--shiki-dark": dark });

// Shiki github-light-default / dark-plus 实测配色（与原生 token 完全一致）
const PALETTE = {
  plain: C("#1F2328", "#D4D4D4"),
  keyword: C("#CF222E", "#C586C0"),
  func: C("#8250DF", "#DCDCAA"),
  const: C("#0550AE", "#569CD6"),
  string: C("#0A3069", "#CE9178"),
  comment: C("#6E7781", "#6A9955"),
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

const gutterStyle = (w) => ({
  width: w,
  flexShrink: 0,
  textAlign: "right",
  paddingRight: "16px",
  userSelect: "none",
});

const Line = ({ n, text, w }) => (
  <span className="line" style={{ display: "flex" }}>
    <span className="text-gray-400 dark:text-gray-600" style={gutterStyle(w)}>
      {n}
    </span>
    <span style={{ whiteSpace: "pre" }}>
      {tokenize(text).map((seg, i) => (
        <span key={i} style={PALETTE[seg.k]}>
          {seg.t}
        </span>
      ))}
    </span>
  </span>
);

const FoldRow = ({ n, label, isOpen, hiddenCount, w, onClick }) => (
  <span
    className="line"
    style={{ display: "flex", cursor: "pointer" }}
    onClick={onClick}
  >
    <span className="text-gray-400 dark:text-gray-600" style={gutterStyle(w)}>
      {n}
    </span>
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
  const w = `${String(lines.length).length + 1}em`;

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

  const toggle = (idx) => setOpen(open.map((v, j) => (j === idx ? !v : v)));

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="code-block not-prose rounded-2xl relative min-w-0 bg-gray-50 dark:bg-white/5 text-gray-950 dark:text-gray-50 border border-gray-950/10 dark:border-white/10 p-0.5"
      style={{ margin: "16px 0" }}
      data-has-header=""
    >
      {/* 顶栏：结构与 class 照搬原生 code-block-header */}
      <div className="flex text-gray-400 text-xs rounded-t-[14px] leading-6 font-medium pl-4 pr-2.5 py-1">
        <div className="grow-0 flex items-center gap-1.5 text-gray-700 dark:text-gray-300 min-w-0">
          <span className="truncate min-w-0" title={title}>
            {title}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-end gap-1.5">
          <button
            onClick={copy}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md px-1.5 py-0.5 bg-transparent border-0 cursor-pointer"
          >
            {copied ? "✓ 已复制" : "复制"}
          </button>
        </div>
      </div>

      {/* 代码面板：原生 code-block-root 的 bg-white / dark:bg-codeblock(#0b0c0e) */}
      <div
        className="shiki code-block-background bg-white dark:bg-codeblock rounded-xt text-sm leading-6"
        style={{
          backgroundColor: "#ffffff",
          "--shiki-dark-bg": "#0B0C0E",
          ...PALETTE.plain,
        }}
      >
        <div className="py-3.5 px-4 overflow-x-auto">
          <div
            className="font-mono whitespace-pre leading-6"
            style={{ fontFamily: "var(--font-paper-mono, ui-monospace, SFMono-Regular, Menlo, monospace)" }}
          >
            {blocks.map((b, bi) =>
              b.type === "line" ? (
                <Line key={bi} n={b.n} text={b.text} w={w} />
              ) : open[b.idx] ? (
                <span key={bi}>
                  <FoldRow
                    n={folds[b.idx].from}
                    label={folds[b.idx].label}
                    isOpen={true}
                    w={w}
                    onClick={() => toggle(b.idx)}
                  />
                  {b.text.map((t, li) => (
                    <Line key={li} n={folds[b.idx].from + li} text={t} w={w} />
                  ))}
                </span>
              ) : (
                <FoldRow
                  key={bi}
                  n={folds[b.idx].from}
                  label={folds[b.idx].label}
                  isOpen={false}
                  hiddenCount={b.text.length}
                  w={w}
                  onClick={() => toggle(b.idx)}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
