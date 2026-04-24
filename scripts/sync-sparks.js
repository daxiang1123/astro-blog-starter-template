#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SPARKS_JSON = path.join(REPO_ROOT, 'src/data/sparks.json');
const SOURCE_MD = '/Users/wangjc/dailywork/00_每日工作/灵感时刻.md';

const TAG_MAP = {
  用户洞察: 'tag-insight',
  产品灵感: 'tag-product',
  商业模式: 'tag-biz',
  成长规律: 'tag-growth',
};

function parseMd(content) {
  const entries = [];
  // 匹配格式：- YYYY-MM-DD HH:MM 内容 #标签
  const lineRe = /^-\s+(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}\s+([\s\S]*?)(?=\n-\s+\d{4}-\d{2}-\d{2}|\n*$)/gm;
  let match;
  while ((match = lineRe.exec(content)) !== null) {
    const date = match[1];
    const raw = match[2].trim();

    // 提取行内 #标签，支持多行尾部
    const tags = [];
    const tagRe = /#([一-龥\w]+)/g;
    let tagMatch;
    while ((tagMatch = tagRe.exec(raw)) !== null) {
      const t = tagMatch[1];
      if (t in TAG_MAP) tags.push(t);
    }

    // 去掉标签、多余空白，保留正文
    const text = raw
      .replace(/#[一-龥\w]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 5) {
      entries.push({ date, tags, text });
    }
  }
  return entries;
}

function makeKey(entry) {
  return `${entry.date}::${entry.text.slice(0, 30)}`;
}

function main() {
  if (!fs.existsSync(SOURCE_MD)) {
    console.error(`[sync-sparks] 找不到源文件: ${SOURCE_MD}`);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(SOURCE_MD, 'utf8');
  const parsed = parseMd(mdContent);

  const existing = JSON.parse(fs.readFileSync(SPARKS_JSON, 'utf8'));
  const existingKeys = new Set(existing.map(makeKey));

  const newEntries = parsed.filter(e => !existingKeys.has(makeKey(e)));

  if (newEntries.length === 0) {
    console.log('[sync-sparks] 没有新条目，跳过。');
    return;
  }

  // 新条目插到头部，保持倒序
  const updated = [...newEntries, ...existing];
  fs.writeFileSync(SPARKS_JSON, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`[sync-sparks] 新增 ${newEntries.length} 条，写入 sparks.json`);

  try {
    execSync(`git -C "${REPO_ROOT}" add src/data/sparks.json`, { stdio: 'inherit' });
    execSync(
      `git -C "${REPO_ROOT}" commit -m "sparks: 自动同步 ${newEntries.length} 条新灵感"`,
      { stdio: 'inherit' }
    );
    execSync(`git -C "${REPO_ROOT}" push`, { stdio: 'inherit' });
    console.log('[sync-sparks] 已推送到 GitHub，Cloudflare 将自动部署。');
  } catch (err) {
    console.error('[sync-sparks] git 操作失败:', err.message);
    process.exit(1);
  }
}

main();
