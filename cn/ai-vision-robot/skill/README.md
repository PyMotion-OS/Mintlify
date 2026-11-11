# skill · SKILL 文件目录

全站唯一提供 SKILL 全文的地方：**写给 AI 工具（Claude Code、Cursor）看的 Robot 产品说明书**（模块一首页「让 AI 帮你操作 Robot」章节引用）。

- 文件：`SKILL.md`（独立 `.md` 文件，不进导航）
- **内容已真实化**：不再只是「产品简介 + 例程清单」，补了「环境配置（引用 Lite 手册 2.1/2.2/2.3 准确章节）+ Token 必填说明 + Robot 用 wifi 而 Lite 默认 usb 的区别 + 连接代码 + 例程清单（含每例程的 Python 概念与 Robot 能力两列）」，让 AI 拿到后真能照着手册配环境、写代码，不靠编
- **复制方式**：首页「让 AI 帮你操作 Robot」章节放了一个 `CopySkill` 按钮（组件 `components/copy-skill.jsx`），点击 fetch `SKILL.md` 原文并写进剪贴板，不跳转、不下载。这是最终交互形态
- 环境配置细节（装 SDK、配网、Token）的权威来源是 Lite 手册第 2 章，SKILL 只引用、不复制，避免两份维护
