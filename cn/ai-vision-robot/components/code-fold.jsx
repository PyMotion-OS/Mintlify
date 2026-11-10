// code-fold.jsx — 编辑器式折叠代码块 v5
//
// 用法：
//   <CodeFold
//     title="line_following.py"
//     folds={[{ label: "read_line_state(data_queue)", from: 1, to: 5 }]}   // from..to 闭区间，必须是一个完整 def 块
//     docs={[{ label: "read_line_state", doc: "伪代码……" }]}               // 代码内（含折叠条）同名函数 hover 出伪代码
//     code={`...`} />
//
// v5 变更（2026-11-10 用户反馈）：
// 1. 行号修复：折叠区间 [from, to] 闭区间整体被折叠条替代；展开后不再渲染单独头行，
//    ▾ 直接落在区域首行的箭头列 —— 行号严格连续，不再出现重复编号
// 2. 折叠条配色：label 走正常 token（def 函数名 = func 色），只有「… N 行已折叠」后缀是注释灰
// 3. copy 兜底：clipboard API 不可用（非安全上下文）时退回 execCommand
// 4. tokenize 顺序：字符串先于注释判断，避免字符串里的 # 被误判
// 5. 列宽收紧：行号 paddingRight 8px，箭头列 1.4em
//
// 结构照搬原生（v3 结论）：外层 .code-block 灰框、顶栏 text-gray-400、
// 内层 bg-white dark:bg-codeblock(#0b0c0e)；token 双值配色来自 Shiki 实测，
// 暗色切换由官方 CSS 规则接管。约束：named export、hooks 预注入不 import、无第三方包。

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
  /('[^']*'|"[^"]*")|(#.*)|\b(def|return|if|elif|else|for|while|import|from|as|with|in|not|and|or|is|pass|break|continue|lambda|class|try|except|finally)\b|\b(None|True|False)\b/g;

const tokenize = (line) => {
  const out = [];
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line))) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), k: "plain" });
    const kind = m[1] ? "string" : m[2] ? "comment" : m[4] ? "const" : "keyword";
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

const FnHover = ({ text, doc }) => {
  const [pos, setPos] = useState(null);
  return (
    <span
      onMouseEnter={(e) => setPos(nearRect(e.currentTarget))}
      onMouseLeave={() => setPos(null)}
      onClick={(e) => setPos(pos ? null : nearRect(e.currentTarget))}
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

// 三列布局：行号 | 箭头(VSCode fold gutter) | 代码
const numCol = (w) => ({
  width: w,
  flexShrink: 0,
  textAlign: "right",
  paddingRight: "8px",
  userSelect: "none",
});

const arrowCol = (active) => ({
  width: "1.4em",
  flexShrink: 0,
  textAlign: "center",
  userSelect: "none",
  cursor: active ? "pointer" : "default",
});

const renderCode = (text, docs) =>
  splitDocs(text, docs).map((seg, i) =>
    seg.doc ? (
      <FnHover key={i} text={seg.t} doc={seg.doc} />
    ) : (
      tokenize(seg.t).map((s, j) => (
        <span key={`${i}-${j}`} style={PALETTE[s.k]}>
          {s.t}
        </span>
      ))
    )
  );

const Line = ({ n, text, w, docs, arrow, onFold }) => (
  <span className="line" style={{ display: "flex" }}>
    <span className="text-gray-400 dark:text-gray-600" style={numCol(w)}>
      {n}
    </span>
    <span
      style={arrowCol(!!arrow)}
      onClick={onFold}
      title={arrow ? (arrow === "▾" ? "点击收起" : "点击展开") : undefined}
    >
      {arrow ? <span style={{ color: "#6E7781" }}>{arrow}</span> : ""}
    </span>
    <span style={{ whiteSpace: "pre" }}>{renderCode(text, docs)}</span>
  </span>
);

// 折叠条：替代 [from, to] 整块。行号 = from，函数名按 token 正常配色，
// 「… N 行已折叠」后缀为注释灰；label 里命中 docs 的函数名同样可 hover。
const FoldRow = ({ n, label, hiddenCount, w, docs, onClick }) => (
  <span
    className="line"
    style={{ display: "flex" }}
    onClick={onClick}
  >
    <span className="text-gray-400 dark:text-gray-600" style={numCol(w)}>
      {n}
    </span>
    <span style={arrowCol(true)} title="点击展开">
      <span style={{ color: "#6E7781" }}>▸</span>
    </span>
    <span style={{ whiteSpace: "pre", cursor: "pointer" }}>
      {splitDocs(label, docs).map((seg, i) =>
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
      <span style={PALETTE.comment}>{` … ${hiddenCount} 行已折叠`}</span>
    </span>
  </span>
);

export const CodeFold = ({ title = "", code, folds = [], docs = [] }) => {
  const [open, setOpen] = useState(folds.map(() => false));
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const w = `${String(lines.length).length + 1}em`;

  // folds 的 from/to 为闭区间；区间互不重叠且各自覆盖一个完整 def 块
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const idx = folds.findIndex((f) => f.from === i + 1);
    if (idx !== -1) {
      const f = folds[idx];
      blocks.push({ type: "fold", idx, text: lines.slice(f.from - 1, f.to) });
      i = f.to;
    } else {
      blocks.push({ type: "line", n: i + 1, text: lines[i] });
      i++;
    }
  }

  const toggle = (idx) => setOpen(open.map((v, j) => (j === idx ? !v : v)));

  const copy = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(done).catch(done);
    } else {
      // 非安全上下文兜底
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(ta);
      done();
    }
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
                // 展开：正常渲染 [from, to] 全部行，▾ 落在首行箭头列，无独立头行 → 行号连续
                <span key={bi}>
                  {b.text.map((t, li) => (
                    <Line
                      key={li}
                      n={folds[b.idx].from + li}
                      text={t}
                      w={w}
                      docs={docs}
                      arrow={li === 0 ? "▾" : ""}
                      onFold={li === 0 ? () => toggle(b.idx) : undefined}
                    />
                  ))}
                </span>
              ) : (
                <FoldRow
                  key={bi}
                  n={folds[b.idx].from}
                  label={folds[b.idx].label}
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
