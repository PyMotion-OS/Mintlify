// copy-skill.jsx — 点击复制 SKILL 全文按钮
//
// 用法：页面 import 后放：
//   <CopySkill src="/cn/ai-vision-robot/skill/SKILL.md" />
// 点击按钮 → fetch 该路径的原始 Markdown 文本 → 写进剪贴板，按钮短暂变成「已复制」。
//
// 为什么用 src 而不是内嵌 text：SKILL 全文较长且含特殊字符，内嵌进 mdx props 易错、
// 且要维护两份；用 src 让按钮直接读 SKILL.md 原文，内容只有一份。
//
// 约束（同 code-ref.jsx）：
// - 只能 named export
// - hooks 已预注入，不要自行 import
// - 不能引第三方包、不能 export default

export const CopySkill = ({ src }) => {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCopy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("fetch failed");
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // 失败时静默回退，避免按钮卡死；用户可手动打开 SKILL 页复制
      setCopied(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "8px 18px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: busy ? "default" : "pointer",
        fontFamily: "inherit",
        color: "#ffffff",
        border: "1px solid transparent",
        backgroundColor: copied ? "#059669" : "#0d9488",
        opacity: busy ? 0.7 : 1,
        transition: "background-color 0.2s",
        margin: "4px 0 12px",
      }}
    >
      {copied ? "已复制，去粘贴给 AI" : busy ? "复制中…" : "点击复制 SKILL 全文"}
    </button>
  );
};
