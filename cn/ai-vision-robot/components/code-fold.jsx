// code-fold.jsx — 编辑器式折叠代码块 v4
//
// 用法：
//   <CodeFold
//     title="line_following.py"
//     folds={[{ label: "read_line_state()  辅助函数", from: 2, to: 6 }]}
//     docs={[{ label: "read_line_state", doc: "伪代码……" }]}
//     code={`...`} />
//
// v4 变更（2026-11-09 用户反馈）：
// 1. 折叠箭头独立成一列，位于「行号 | 箭头 | 代码」之间（VSCode 布局）
// 2. docs 参数：代码内（含折叠条 label）出现的函数名可 hover/点击浮出伪代码；
//    浮层用 position:fixed（按 getBoundingClientRect 定位），不被 overflow-x-auto 裁剪
//
// 结构照搬原生（v3 结论）：外层 .code-block 灰框、顶栏 text-gray-400、
// 内层 bg-white dark:bg-codeblock(#0b0c0e) + 14px 圆角；token 双值配色
// 来自 Shiki 实测，暗色切换由官方 CSS 规则接管。
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

// ---------- 伪代码浮层（fixed 定位，不被 overflow 裁剪） ----------

const popupStyle = (pos) => ({
  position: "fixed",
  top: pos.top,
  left: pos.left,
  zIndex: 9999,
  padding: "10px 14px",
  borderRadius: "8px",
  backgroundColor: "#0d1117",
  color: "#c9d1d9",
  border: "1px solid rgba(128,128,128,0.4)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  fontFamily: "var(--font-paper-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: "12.5px",
  lineHeight: "18px",
  whiteSpace: "pre-wrap",
  minWidth: "240px",
  maxWidth: "440px",
  margin: 0,
});

const nearRect = (el) => {
  const r = el.getBoundingClientRect();
  return {
    top: Math.min(r.bottom + 6, window.innerHeight - 180),
    left: Math.max(8, Math.min(r.left, window.innerWidth - 460)),
  };
};

// 把一行文本按 docs 里的函数名切分；命中处渲染成可 hover 的 FnHover
const FnHover = ({ text, doc }) => {
  const [pos, setPos] = useState(null);
  return (
    <span
      onMouseEnter={(e) => setPos(nearRect(e.currentTarget))}
      onMouseLeave={() => setPos(null)}
      onClick={(e) =>
        setPos(pos ? null : nearRect(e.currentTarget))
      }
      style={{
        cursor: "pointer",
        borderRadius: "3px",
        backgroundColor: pos ? "rgba(130,80,208,0.14)" : "transparent",
        boxShadow: pos ? "0 0 0 1px rgba(130,80,208,0.35)" : "none",
        transition: "background-color 80ms",
      }}
    >
      {tokenize(text).map((seg, i) => (
        <span key={i} style={PALETTE[seg.k]}>{seg.t}</span>
      ))}
      {pos && <span style={popupStyle(pos)}>{doc}</span>}
    </span>
  );
};

const splitDocs = (text, docs) => {
  if (!docs || !docs.length) return [{ t: text }];
  const esc = docs.map((d) => d.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp("\\b(" + esc.join("|") + ")\\b", "g");
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    const hit = docs.find((d) => d.label === m[1]);
    out.push({ t: m[0], doc: hit ? hit.doc : null });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
};

// ---------- 行渲染 ----------

// 箭头列宽度（行号与代码之间，VSCode 的 fold gutter）
const ARROW_W = "1.6em";

const numCol = (w) => ({
  width: w,
  flexShrink: 0,
  textAlign: "right",
  paddingRight: "8px",
  userSelect: "none",
});

const arrowCol = () => ({
  width: ARROW_W,
  flexShrink: 0,
  textAlign: "center",
  userSelect: "none",
});

const Line = ({ n, text, w, docs }) => (
  <span className="line" style={{ display: "flex" }}>
    <span className="text-gray-400 dark:text-gray-600" style={numCol(w)}>
      {n}
    </span>
    <span style={arrowCol()} />
    <span style={{ whiteSpace: "pre" }}>
      {splitDocs(text, docs).map((seg, i) =>
        seg.doc ? (
          <FnHover key={i} text={seg.t} doc={seg.doc} />
        ) : (
          tokenize(seg.t).map((s, j) => (
            <span key={`${i}-${j}`} style={PALETTE[s.k]}>
              {s.t}
            </span>
          ))
        )
      )}
    </span>
  </span>
);

const FoldRow = ({ n, label, isOpen, hiddenCount, w, docs, onClick }) => (
  <span
    className="line"
    style={{ display: "flex", cursor: "pointer" }}
    onClick={onClick}
  >
    <span className="text-gray-400 dark:text-gray-600" style={numCol(w)}>
      {n}
    </span>
    <span style={{ ...arrowCol(), color: "#6E7781" }}>{isOpen ? "▾" : "▸"}</span>
    <span style={{ whiteSpace: "pre" }}>
      {isOpen && <span style={PALETTE.comment}>{label}</span>}
      {!isOpen &&
        splitDocs(label, docs).map((seg, i) =>
          seg.doc ? (
            <FnHover
              key={i}
              text={seg.t}
              doc={seg.doc}
            />
          ) : (
            <span key={i} style={PALETTE.comment}>{seg.t}</span>
          )
        )}
      {!isOpen && (
        <span style={PALETTE.comment}>{` … ${hiddenCount} 行已折叠`}</span>
      )}
    </span>
  </span>
);

export const CodeFold = ({ title = "", code, folds = [], docs = [] }) => {
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
                <Line key={bi} n={b.n} text={b.text} w={w} docs={docs} />
              ) : open[b.idx] ? (
                <span key={bi}>
                  <FoldRow
                    n={folds[b.idx].from}
                    label={folds[b.idx].label}
                    isOpen={true}
                    w={w}
                    docs={docs}
                    onClick={() => toggle(b.idx)}
                  />
                  {b.text.map((t, li) => (
                    <Line
                      key={li}
                      n={folds[b.idx].from + li}
                      text={t}
                      w={w}
                      docs={docs}
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
                  w={w}
                  docs={docs}
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
