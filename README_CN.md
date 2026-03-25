# X自动化运营技能 2.0

<div align="center">

![X API](https://img.shields.io/badge/X%20API-v2-blue)
![OpenClaw 技能](https://img.shields.io/badge/OpenClaw-技能-green)
![许可证](https://img.shields.io/badge/许可证-MIT-yellow)

**AI大模型领域自动化运营工具 - 每日自动执行搜索、互动、发布、推送**

</div>

## 📋 功能概述

本技能专为AI大模型、科技投资领域设计，每日自动执行Twitter/X平台运营任务：

- 🔍 **智能搜索** - 搜索AI领域三类目标账号的最新推文
- 🤝 **互动运营** - 自动点赞、转发、评论相关推文（各5条）
- ✍️ **内容创作** - 发布1条原创推文（以问句结尾）
- 📊 **日报推送** - 结构化日报推送到飞书
- 🔒 **安全可靠** - 完善的错误处理和频率控制

## 🚀 快速开始

### 1. 环境要求

- Node.js 16+ 
- OpenClaw 环境
- X开发者账号（需要API权限）

### 2. 安装依赖

```bash
cd skills/x-automated-operations-skill
npm install
```

### 3. 配置环境变量

复制`.env.example`为`.env`并填入你的凭证：

```bash
# 复制模板文件
cp .env.example .env

# 编辑配置文件（使用你喜欢的编辑器）
nano .env
# 或
code .env
```

编辑`.env`文件，填入以下凭证：

```env
# X API 凭证（从X开发者后台获取，下面会详细讲解）
X_BEARER_TOKEN=你的_bearer_token
X_CONSUMER_KEY=你的_consumer_key
X_CONSUMER_SECRET=你的_consumer_secret
X_ACCESS_TOKEN=你的_access_token
X_ACCESS_TOKEN_SECRET=你的_access_token_secret
X_USER_ID=你的_user_id

# 可选配置
HTTPS_PROXY=http://127.0.0.1:17890  # 代理设置（如果需要）
FEISHU_WEBHOOK=你的_webhook_url      # 飞书Webhook（用于推送日报）

# 运营配置
OPERATION_DELAY=2000    # 操作间隔（毫秒）
MAX_RETRIES=3           # 最大重试次数
VERBOSE_LOGGING=true    # 详细日志
```

## 🔑 获取X API权限（最关键的步骤！）

**注意：90%的问题都出在权限配置上！请仔细阅读本节。**

### 步骤1：申请X开发者账号

1. **访问** [X开发者平台](https://developer.twitter.com)
2. **注册**开发者账号（可能需要手机/邮箱验证）
3. **创建**新应用（Application）

### 步骤2：获取API凭证

创建应用后，在"Keys and tokens"标签页获取：

- **API Key and Secret** → 对应`.env`中的 `X_CONSUMER_KEY` 和 `X_CONSUMER_SECRET`
- **Bearer Token** → 对应 `X_BEARER_TOKEN` （需要点击"Generate"按钮生成）

### 步骤3：设置应用权限（最重要！）

**必须设置为"Read and Write"权限，不能是"Read only"**：

1. 进入应用设置（Settings）
2. 找到"App permissions"部分
3. **选择"Read and Write"**（关键步骤！）
4. 点击"Save"保存更改

**⚠️ 常见错误**：很多人这里选择了"Read only"，导致所有写入操作失败（401错误）。

### 步骤4：获取Access Token（OAuth 1.0a）

有两种方式：

**方式A：直接生成（简单但不推荐）**
1. 在"Keys and tokens"页面，找到"Authentication Tokens"部分
2. 点击"Generate"生成Access Token和Secret
3. 复制到`.env`文件中

**方式B：OAuth授权流程（推荐，更安全）**
使用本技能提供的OAuth工具：

```bash
# 1. 生成授权URL
node scripts/generate_oauth_url.js

# 输出类似：
# 请访问以下URL授权: https://api.twitter.com/oauth/authorize?oauth_token=xxxxxxxxxx
# 授权后获取7位PIN码

# 2. 用浏览器打开生成的URL，点击"Authorize app"授权应用
# 3. 授权后会显示7位数字PIN码，复制这个PIN码
# 4. 使用PIN码获取Access Token
node scripts/get_new_token.js 1234567  # 替换为你的PIN码

# 5. 脚本会自动更新.env文件中的Access Token和Secret
```

### 步骤5：获取User ID

1. 访问 [X ID Finder](https://tweeterid.com/)
2. 输入你的X用户名（如@AnselLiuYK）
3. 获取数字ID，填入`X_USER_ID`

### 权限验证测试

运行权限测试脚本确保所有权限正常：

```bash
node scripts/test_permissions.js
```

**✅ 成功标志**：
- 所有测试通过（特别是"写入权限"测试）
- 能够成功发布测试推文
- 能够成功点赞、转发

**❌ 失败标志**：
- 写入权限测试失败 → 应用权限没设对
- OAuth配置失败 → Access Token有问题
- 网络连接失败 → 代理或网络问题

## 📖 使用教程

### 日常运营执行

```bash
# 1. 预览模式（不实际执行，只显示操作计划）
node scripts/daily_operations.js --dry-run

# 输出示例：
# 🚀 X自动化运营 v2.0 [预览模式]
# 📊 搜索到15条AI相关推文
# 💡 计划点赞：5条
# 💡 计划转发：5条  
# 💡 计划评论：5条
# 💡 原创推文："Observing today's AI landscape..."

# 2. 正式执行（实际发布）
node scripts/daily_operations.js

# 3. 调试模式（详细日志）
node scripts/daily_operations.js --debug
```

### 自定义配置

根据你的需求调整配置文件：

**1. 目标账号配置** (`config/targets.js`)
```javascript
// AI大模型厂商官方账号
official: [
  'OpenAI',
  'AnthropicAI', 
  'GoogleAI',
  'Microsoft'
],

// 科技博主、AI领域KOL  
kols: [
  'sama',          // Sam Altman
  'karpathy',      // Andrej Karpathy
  'ylecun',        // Yann LeCun
  'AndrewYNg'      // Andrew Ng
],

// AI赛道CEO、投资人
leaders: [
  'gdb',           // Garry Tan
  'paulg',         // Paul Graham
  'naval'          // Naval Ravikant
]
```

**2. 搜索关键词** (`config/keywords.js`)
```javascript
// 中文关键词
chinese: [
  'AI大模型',
  'AGI',
  'LLM', 
  'GPT',
  'AI创业'
],

// 英文关键词  
english: [
  'AI',
  'artificial intelligence',
  'machine learning',
  'large language model'
]
```

**3. 内容模板** (`config/templates.js`)
```javascript
// 原创推文模板（自动以问句结尾）
originalTweets: [
  "Today's {topic} developments suggest {insight}. What's the most underrated implication for {sector}?",
  "Noticed {trend} accelerating across multiple sources. How does this change the {domain} landscape?"
],

// 评论模板
commentTemplates: [
  "Interesting perspective. How do you see this impacting adoption timelines?",
  "This aligns with what we're seeing. The key question is scalability."
]
```

### 定时执行配置

**Linux/macOS (使用cron)**：
```bash
# 编辑cron任务
crontab -e

# 添加以下行（每日9:00和17:00执行）
0 9,17 * * * cd /绝对路径/skills/x-automated-operations-skill && node scripts/daily_operations.js >> logs/cron.log 2>&1
```

**Windows (使用任务计划程序)**：
1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：每日 9:00 和 17:00
4. 操作：启动程序
   - 程序：`node.exe`
   - 参数：`scripts/daily_operations.js`
   - 起始位置：技能目录绝对路径

## 🔧 功能模块详解

### 1. 智能搜索模块
- **多关键词搜索**：自动组合多个相关关键词
- **智能过滤**：排除转推、回复、垃圾内容
- **评分排序**：根据互动量、新鲜度综合评分
- **去重处理**：避免重复互动同一内容

### 2. 互动运营模块
- **点赞**：选择高质量推文点赞
- **转发**：转发有价值的内容
- **评论**：智能生成相关评论（目前有限制）
- **频率控制**：自动间隔，避免触发限制

### 3. 内容生成模块
- **话题分析**：从搜索结果提取热门话题
- **原创生成**：基于模板生成专业内容
- **问句结尾**：所有原创推文以问题结束，促进互动

### 4. 飞书集成模块
- **日报推送**：结构化运营数据
- **执行统计**：成功/失败次数统计
- **话题趋势**：当日热门话题分析

### 5. 监控与日志
- **详细日志**：每次操作都有记录
- **错误追踪**：失败原因分析
- **执行记录**：JSON格式保存执行历史

## 🛠️ 故障排除指南

### 问题1：所有写入操作返回401错误
**症状**：点赞、转发、发推都失败，返回HTTP 401
**根本原因**：Access Token没有写入权限

**解决方案**：
```bash
# 1. 运行权限诊断
node scripts/test_permissions.js

# 2. 检查应用权限（必须为"Read and Write"）
#    登录X开发者后台 → 应用设置 → App permissions

# 3. 如果权限不对，修改为"Read and Write"后：
#    a. 重新生成Access Token
#    b. 或使用OAuth重新授权

# 4. 更新.env文件中的Access Token和Secret

# 5. 重新测试
node scripts/test_permissions.js
```

### 问题2：评论功能单独失败
**症状**：点赞、转发成功，但评论返回403/401
**原因**：X API对评论有额外限制

**解决方案**：
```bash
# 1. 运行评论诊断
node scripts/test_comment.js

# 2. 检查是否可以评论自己的推文
# 3. 优化评论策略：
#    - 只评论允许回复的推文
#    - 避免评论受保护的账号
#    - 优化评论内容（避免触发风控）

# 4. 降级方案：如果评论失败，改为点赞+转发
```

### 问题3：频率限制（429错误）
**症状**：操作几次后开始返回429错误
**原因**：API调用太频繁

**解决方案**：
```env
# 在.env文件中增加间隔时间
OPERATION_DELAY=5000  # 从2000增加到5000毫秒

# 减少单次操作数量
# 修改scripts/daily_operations.js中的MAX_INTERACTIONS
```

### 问题4：网络连接问题
**症状**：请求超时或无法连接
**原因**：网络环境限制

**解决方案**：
```env
# 1. 配置代理（如果需要）
HTTPS_PROXY=http://127.0.0.1:17890

# 2. 测试网络连接
curl -x http://127.0.0.1:17890 https://api.twitter.com

# 3. 调整超时时间
# 修改lib/client.js中的timeout值
```

### 问题5：Bearer Token无效
**症状**：搜索功能也失败，Bearer Token相关错误
**解决方案**：
1. 重新生成Bearer Token
2. 更新.env文件
3. 测试：`node scripts/test_bearer.js`

## 📊 运营效果优化

### 数据监控
- **每日检查**：飞书日报推送
- **每周复盘**：分析互动成功率
- **每月优化**：调整目标账号和关键词

### 效果评估指标
- ✅ **互动成功率**：目标 > 80%
- ✅ **原创推文互动**：点赞、转发数
- ✅ **账号增长**：粉丝数变化（长期）
- ✅ **行业影响力**：被目标账号回关/互动

### 持续优化建议
1. **每月更新**目标账号列表
2. **每周调整**搜索关键词
3. **每日检查**执行日志
4. **及时处理**失败操作

## ⚠️ 重要注意事项

### 安全规范
1. **绝对不要**提交`.env`文件到Git
2. **定期更换**API凭证（每3-6个月）
3. **使用环境变量**存储敏感信息
4. **监控API用量**，避免超额

### 合规使用
1. **遵守**X平台用户协议
2. **避免**垃圾信息行为
3. **尊重**其他用户
4. **控制**操作频率

### 最佳实践
1. **质量 > 数量**：精选内容，精准互动
2. **原创为主**：避免抄袭，体现专业
3. **持续优化**：根据效果调整策略
4. **人工审核**：定期检查自动化内容

## 🔄 更新日志

### v2.0 (2026-03-25) - 重大升级
- 🏗️ **架构重构**：模块化设计，易于维护和扩展
- 🛡️ **错误处理**：完善的重试机制和降级策略
- 🔍 **权限诊断**：完整的权限测试和问题诊断工具
- 🎨 **内容优化**：智能内容生成和话题分析
- 📈 **飞书增强**：结构化日报，数据可视化

### v1.0 (基础版本)
- ✅ 基础搜索和互动功能
- ✅ 简单内容生成
- ✅ 基础飞书集成

## 📞 技术支持

### 常见问题库
1. **权限问题** → 90%的问题在这里
2. **网络问题** → 配置代理
3. **频率限制** → 增加操作间隔
4. **内容风控** → 优化评论模板

### 获取帮助
1. **查看日志**：`logs/`目录下的执行记录
2. **运行诊断**：使用提供的测试脚本
3. **检查配置**：确认`.env`文件正确
4. **查阅文档**：本文档和代码注释

### 问题反馈模板
```markdown
**问题描述**：
**错误信息**：
**复现步骤**：
**环境信息**：
- 操作系统：
- Node版本：
- 执行命令：
- 日志文件：
**已尝试的解决方案**：
```

## 📁 项目结构说明

```
x-automated-operations-skill/
├── README.md                 # 英文文档
├── README_CN.md             # 中文文档（本文档）
├── SKILL.md                 # OpenClaw技能定义文件
├── package.json             # 依赖包配置
├── .env.example             # 环境变量模板（重要！）
├── .gitignore               # Git忽略配置
├── lib/
│   └── client.js            # X API客户端核心
├── config/
│   ├── targets.js           # 目标账号配置
│   ├── keywords.js          # 搜索关键词配置
│   └── templates.js         # 内容模板配置
├── scripts/
│   ├── daily_operations.js  # 主运营脚本（入口）
│   ├── test_permissions.js  # 权限诊断工具
│   ├── test_comment.js      # 评论功能测试
│   ├── test_basic.js        # 基础功能测试
│   ├── generate_oauth_url.js # OAuth授权URL生成
│   └── get_new_token.js     # Access Token获取
├── references/              # 参考文档和资料
│   ├── X_API_指南.md        # X API详细使用指南
│   └── 常见问题.md          # 常见问题解决方案
└── logs/                    # 执行日志目录（自动生成）
```

## 🎯 成功案例

### 案例1：AI投资机构运营
- **目标**：建立行业专业形象
- **策略**：重点关注AI创始人、投资人
- **效果**：3个月增长500+行业相关粉丝
- **关键**：精准互动 + 专业内容

### 案例2：技术博主自动化
- **目标**：节省运营时间，保持活跃度
- **策略**：每日自动互动+每周深度内容
- **效果**：运营时间减少70%，互动量提升
- **关键**：自动化基础运营 + 人工深度内容

## 💡 进阶使用技巧

### 1. 多账号管理
```bash
# 创建多个.env文件
.env.account1
.env.account2

# 使用不同环境变量执行
cp .env.account1 .env && node scripts/daily_operations.js
cp .env.account2 .env && node scripts/daily_operations.js
```

### 2. 自定义内容策略
```javascript
// 在config/templates.js中添加自定义模板
customTemplates: [
  "基于{data}的分析显示{trend}，这对{industry}意味着什么？",
  "{technology}的{development}正在改变{field}，最早落地的场景会是？"
]
```

### 3. 集成其他工具
- **数据分析**：将日志导入BI工具
- **内容规划**：结合内容日历
- **团队协作**：飞书机器人通知

---

**最后提醒**：自动化工具是辅助，不是替代。真正的价值在于：
1. **节省时间**：自动化重复操作
2. **保持活跃**：规律性互动
3. **数据驱动**：基于数据的优化
4. **专业形象**：持续输出有价值内容

**祝您运营顺利！有任何问题请参考本文档或提交Issue。**

**许可证**：MIT - 可自由使用和修改，请保留原作者信息。