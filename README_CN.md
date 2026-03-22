# x-api-skill for OpenClaw

在 OpenClaw 助手中搜索推文、监控关键词、分析 X (Twitter) 账号。

[English Documentation](README.md)

---

## 你能做什么

- **搜索推文** — 按关键词、话题标签或短语查找最新推文
- **监控账号** — 获取粉丝数、互动数据、最新发帖
- **提取趋势** — 从任意话题中提取热门标签和术语
- **构建流程** — 将推文数据用于摘要、翻译或分析

---

## 第一步：申请 X API 访问权限

使用本 Skill 需要一个免费的 X 开发者账号。

### 1.1 申请开发者权限

1. 访问 [developer.x.com](https://developer.x.com)，用你的 X 账号登录
2. 点击 **"Sign up"** → 选择 **"Free"**（免费版，读取推文足够用）
3. 填写用途说明表单，描述你的使用场景（例如："个人研究工具，用于监控 AI 领域动态"）
4. 提交申请，免费版通常即时审批

### 1.2 创建项目和应用

1. 在开发者后台，进入 **Projects & Apps** → **New Project**
2. 填写项目名称（例如："OpenClaw Research"）
3. 用途选择 **"Exploring the API"**
4. 在项目内创建一个新 App

### 1.3 获取 Bearer Token

1. 进入你的 App，点击 **"Keys and Tokens"** 标签页
2. 在 **"Bearer Token"** 下，点击 **"Generate"**（或 **"Regenerate"**）
3. **立即复制 Token** — 页面关闭后不会再显示
4. 妥善保存（推荐存入密码管理器）

> ⚠️ 不要分享你的 Bearer Token。它代表你的账号对 X API 的读取权限。

---

## 第二步：安装 Skill

### 前置要求

- **Node.js 18+** — 用 `node --version` 检查版本
  - Windows：从 [nodejs.org](https://nodejs.org) 下载，或运行 `winget install OpenJS.NodeJS`
  - macOS：`brew install node`，或从 [nodejs.org](https://nodejs.org) 下载
  - Linux（Ubuntu/Debian）：`sudo apt install nodejs npm`
  - Linux（Fedora）：`sudo dnf install nodejs`

### 安装依赖

**Windows（PowerShell）：**
```powershell
cd $env:USERPROFILE\.openclaw\workspace\skills\x-api
npm install
```

**macOS / Linux：**
```bash
cd ~/.openclaw/workspace/skills/x-api
npm install
```

---

## 第三步：配置 Token

在 Skill 目录下创建 `.env` 文件：

**Windows（PowerShell）：**
```powershell
cd $env:USERPROFILE\.openclaw\workspace\skills\x-api
Copy-Item .env.example .env
notepad .env
```

**macOS / Linux：**
```bash
cd ~/.openclaw/workspace/skills/x-api
cp .env.example .env
nano .env   # 或：open -e .env（macOS），gedit .env（Linux）
```

编辑文件，填入你的 Token：
```
X_BEARER_TOKEN=你的_bearer_token
```

保存并关闭。

---

## 第四步：测试连接

```bash
node scripts/quick_test.js
```

成功输出示例：
```
Testing X API connection...
✅ Connected — got 10 tweets
Sample: OpenAI just released...
```

如果失败，请查看下方[常见问题](#常见问题)。

---

## 第五步：运行示例

### 监控关键词 — 查找某话题的热门推文
```bash
node examples/monitor.js
```
搜索 `AI`、`LLM`、`machine learning`，输出点赞数最高的推文。

自定义关键词，编辑 `examples/monitor.js`：
```javascript
const KEYWORDS = ['你的', '关键词'];
const MIN_LIKES = 50;  // 最低点赞数门槛
```

### 分析账号 — 获取粉丝和互动数据
```bash
node examples/analyze.js
```
输出 `@OpenAI`、`@AnthropicAI`、`@GoogleAI` 的粉丝数和平均点赞数。

自定义账号，编辑 `examples/analyze.js`：
```javascript
const ACCOUNTS = ['elonmusk', 'sama', 'karpathy'];
```

### 提取术语 — 获取热门标签和缩写
```bash
node examples/extract.js
```
搜索 `machine learning AI` 相关推文，列出出现频率最高的 20 个术语和话题标签。

---

## 在 OpenClaw 中使用本 Skill

安装完成后，你可以直接用自然语言让 OpenClaw 助手调用本 Skill，无需写代码。

### 工作原理

OpenClaw 读取 `SKILL.md` 了解本 Skill 的功能，当你提出与 X/Twitter 数据相关的需求时，自动调用对应脚本。

### 示例指令

**搜索和总结：**
> "搜索最新的 GPT-5 相关推文，给我一个总结"

> "今天 X 上大家在说股市崩盘的什么？"

> "找出本周关于 Anthropic 点赞数最高的 5 条推文"

**监控账号：**
> "@OpenAI 最近发了什么推文？"

> "对比一下 @OpenAI、@AnthropicAI 和 @GoogleAI 的粉丝数"

> "给我看看 @karpathy 的最新推文"

**提取趋势：**
> "AI 领域现在有哪些热门话题标签？"

> "从最近的加密货币推文中提取最常见的术语"

**词汇学习 / 研究：**
> "搜索科技博主的推文，提取我应该学习的英语术语"

> "找关于机器学习的推文，列出其中用到的专业术语"

### 在 OpenClaw 中配置凭证

最简单的方式是直接告诉你的助手（在私人主会话中）：

> "记住我的 X API Bearer Token：[你的 token]"

助手会将其存入记忆，运行本 Skill 时自动使用。也可以按第三步的说明写入 `.env` 文件。

### Skill 路径

OpenClaw 在以下位置查找 Skill：
- **Windows：** `%USERPROFILE%\.openclaw\workspace\skills\x-api\`
- **macOS/Linux：** `~/.openclaw/workspace/skills/x-api/`

确保 Skill 根目录下存在 `SKILL.md` 文件，这是 OpenClaw 识别 Skill 的入口。

---

## 在自己的脚本中使用

```javascript
require('dotenv').config();
const XAPIClient = require('./lib/client');

const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  proxy: process.env.HTTPS_PROXY  // 可选，见代理配置
});

// 搜索推文
const result = await client.searchTweets('ChatGPT', { maxResults: 100 });
result.data.forEach(t => console.log(t.text));

// 获取用户资料
const { data: user } = await client.getUserByUsername('OpenAI');
console.log(`粉丝数：${user.public_metrics.followers_count}`);

// 获取用户最新推文
const tweets = await client.getUserTweets(user.id, { maxResults: 20 });
```

### API 参考

#### `searchTweets(query, options)`
搜索最近推文（最近7天）。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxResults` | number | 10 | 每次返回条数（10–100） |
| `fields` | string | `text,created_at,public_metrics,author_id` | 返回的推文字段 |
| `sinceId` | string | — | 只返回比此 ID 更新的推文 |

#### `getUserByUsername(username)`
获取用户资料，包含名称、简介、粉丝数、认证状态。

#### `getUserTweets(userId, options)`
获取用户最新推文（不含转推和回复）。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxResults` | number | 10 | 每次返回条数（5–100） |

#### `getTweet(tweetId)`
按 ID 获取单条推文。

#### `sleep(ms?)`
请求间等待。默认 1200ms，用于循环中避免触发限速。

---

## 代理配置

如果你的网络无法直接访问 `api.twitter.com`（如中国大陆），需要配置代理。

**方式 A — TUN 模式（推荐）：** 在代理客户端（Clash、Mihomo 等）中开启 TUN 模式。无需任何配置，所有流量自动路由。

**方式 B — HTTP 代理环境变量：**
```
# .env
HTTPS_PROXY=http://127.0.0.1:<你的代理端口>
```

查找代理端口：打开代理客户端的设置，通常标注为"HTTP 端口"或"混合端口"。

---

## 速率限制

X API 免费版限制：

| 内容 | 限制 |
|------|------|
| 推文读取 | 50万条 / 月 |
| 搜索请求 | 约 1次/秒 |
| 用户查询 | 300次 / 15分钟 |

客户端默认每次请求间隔 **1200ms**。如需调整：
```javascript
const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  delayMs: 2000  // 2秒间隔
});
```

---

## 常见问题

**`Error: X_BEARER_TOKEN not set`**
→ 确认 Skill 目录下存在 `.env` 文件，且包含你的 Token。

**`HTTP 401`**
→ Token 无效或已过期。前往 developer.x.com → 你的 App → Keys and Tokens → 重新生成 Bearer Token。

**`HTTP 429`**
→ 触发速率限制。增大 `delayMs` 或减小 `maxResults`。

**连接超时 / socket hang up**
→ 网络屏蔽了 `api.twitter.com`。请配置代理（见[代理配置](#代理配置)）。

**`Cannot find module 'https-proxy-agent'`**
→ 在 Skill 目录下运行 `npm install`。

---

## 安全说明

- `.env` 已加入 `.gitignore`，Token 不会被提交到 Git
- 不要在聊天、代码注释或公开文件中粘贴 Bearer Token
- 建议定期在 developer.x.com 轮换 Token
- 免费版为只读权限，本 Skill 无法发布推文

---

## 许可证

MIT
