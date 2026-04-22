# 大响的铲子铺 · 博客

个人博客，部署在 [recthem.com](https://recthem.com)，基于 Astro + Cloudflare Workers。

---

## 网站结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 个人介绍和定位 |
| 文章 | `/blog` | 主题文章列表 |
| 灵感流 | `/sparks` | 原始灵感记录，自动同步自 Obsidian |
| 关于 | `/about` | 背景经历和核心能力 |

---

## 内容更新方式

### 写文章

在 `src/content/blog/` 下新建 `.md` 文件：

```markdown
---
title: "文章标题"
description: "一句话描述"
pubDate: "Apr 23 2026"
---

正文...
```

然后 `git add . && git commit -m "新文章" && git push`，Cloudflare 自动部署。

### 灵感流（自动同步）

**不需要手动操作。** 只要在 Obsidian 的 `灵感时刻.md` 里写内容并保存，系统会自动同步到博客。

同步流程：

```
Obsidian 保存灵感时刻.md
    → WebDAV 同步到本地
    → launchd 检测文件变化
    → scripts/sync-sparks.js 解析新条目
    → 写入 src/data/sparks.json
    → git commit + push
    → Cloudflare 自动构建部署（约 1-2 分钟）
    → recthem.com/sparks 更新
```

灵感条目格式（Obsidian 里的写法）：

```
- 2026-04-23 14:30 今天的一个洞察... #用户洞察
```

支持的标签：`#用户洞察` `#产品灵感` `#商业模式` `#成长规律`

---

## 自动同步系统

| 组件 | 位置 | 说明 |
|------|------|------|
| 数据文件 | `src/data/sparks.json` | 所有灵感条目，按日期倒序 |
| 解析脚本 | `scripts/sync-sparks.js` | 解析 md、增量对比、git push |
| 文件监听 | `~/Library/LaunchAgents/com.daxiang.sparks-sync.plist` | macOS launchd，开机自启 |
| 源文件 | `/Users/wangjc/dailywork/00_每日工作/灵感时刻.md` | Obsidian 笔记库 |

**查看同步日志：**

```bash
tail -f /tmp/sparks-sync.log
```

**手动触发同步：**

```bash
node scripts/sync-sparks.js
```

**重新加载监听服务（修改 plist 后）：**

```bash
launchctl unload ~/Library/LaunchAgents/com.daxiang.sparks-sync.plist
launchctl load ~/Library/LaunchAgents/com.daxiang.sparks-sync.plist
```

---

## 本地开发

```bash
npm install
npm run dev        # 本地预览 localhost:4321
npm run build      # 构建
```

---

## 技术栈

- [Astro](https://astro.build) · 静态站点框架
- [Cloudflare Workers](https://workers.cloudflare.com) · 托管和部署
- macOS launchd · 本地文件监听
- Obsidian + WebDAV · 内容来源
