# AI 工作报告生成器

> 告别「明明干了很多活，坐下来却写不出来」的痛苦。

一键把零散的工作记录变成结构清晰、措辞专业的 **日报 / 周报 / 月报**。

## ✨ 功能

- 📅 **日报** / 📋 **周报** / 📊 **月报** — 顶部 Tab 一键切换
- ⚡ **流式生成** — SSE 实时输出，边生成边预览
- 🗄️ **SQLite 持久化** — 报告自动保存，支持历史查看和删除
- 🤖 **9 家国产模型** — DeepSeek / 通义千问 / 智谱AI / Moonshot / 讯飞星火 / 腾讯混元 / 文心一言 / MiniMax / 小米MiMo
- 📋 **一键复制 / 下载** — 导出 Markdown 格式
- 🔐 **API Key 本地存储** — 仅存浏览器本地

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 | 全栈框架（App Router） |
| React 19 | 前端 UI |
| TypeScript | 类型安全 |
| Tailwind CSS v4 | 样式 |
| better-sqlite3 | 服务端 SQLite 持久化 |
| AI APIs | SSE 流式生成（9 家国产模型） |

## 🚀 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 📁 项目结构

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/[provider]/route.ts   # AI 代理（解决 CORS）
│   │   │   └── reports/route.ts         # 报告 CRUD
│   │   ├── page.tsx                     # 主页面
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Workbench.tsx                # 输入区
│   │   ├── Preview.tsx                  # 预览区
│   │   ├── SettingsModal.tsx            # 设置弹窗
│   │   └── HistoryList.tsx              # 历史报告
│   ├── services/
│   │   ├── ai.ts                        # AI 调用
│   │   ├── providers.ts                 # 厂商配置
│   │   └── reports.ts                   # 报告 API
│   ├── lib/
│   │   └── db.ts                        # SQLite 初始化
│   └── types/
│       └── index.ts
├── data/
│   └── reports.db                       # SQLite 数据库（自动创建）
└── package.json
```

## 📄 License

MIT
