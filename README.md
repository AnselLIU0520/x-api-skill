# X Automated Operations Skill 2.0

<div align="center">

![X API](https://img.shields.io/badge/X%20API-v2-blue)
![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**AI大模型领域自动化运营工具 - 每日自动执行搜索、互动、发布、推送**

</div>

## 📋 功能概述

本技能用于自动化运营Twitter/X平台，特别针对AI大模型、科技投资领域，每日自动执行以下任务：

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
cp .env.example .env
```

编辑`.env`文件，填入以下凭证：

```env
# X API 凭证（从X开发者后台获取）
X_BEARER_TOKEN=your_bearer_token_here
X_CONSUMER_KEY=your_consumer_key_here
X_CONSUMER_SECRET=your_consumer_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here
X_USER_ID=your_user_id_here

# 可选配置
HTTPS_PROXY=http://127.0.0.1:17890  # 代理设置（如果需要）
FEISHU_WEBHOOK=your_webhook_url      # 飞书Webhook（用于推送日报）

# 运营配置
OPERATION_DELAY=2000    # 操作间隔（毫秒）
MAX_RETRIES=3           # 最大重试次数
VERBOSE_LOGGING=true    # 详细日志
```

## 🔑 获取X API权限（关键步骤）

### 步骤1：申请X开发者账号

1. 访问 [X开发者平台](https://developer.twitter.com)
2. 注册开发者账号（可能需要验证）
3. 创建新应用（Application）

### 步骤2：获取API凭证

创建应用后，在"Keys and tokens"标签页获取：

- **API Key and Secret** → `X_CONSUMER_KEY` 和 `X_CONSUMER_SECRET`
- **Bearer Token** → `X_BEARER_TOKEN` （需要点击"Generate"生成）

### 步骤3：设置应用权限（重要！）

**必须设置为"Read and Write"权限**：

1. 进入应用设置
2. 找到"App permissions"部分
3. 选择"Read and Write"（不能是"Read only"）
4. 保存更改

### 步骤4：获取Access Token（OAuth 1.0a）

1. 在"Keys and tokens"页面，找到"Authentication Tokens"部分
2. 点击"Generate"生成Access Token和Secret
3. 或者使用OAuth流程授权（推荐）

### 步骤5：OAuth授权流程（推荐）

使用本技能提供的OAuth工具：

```bash
# 1. 生成授权URL
node scripts/generate_oauth_url.js

# 2. 用浏览器打开生成的URL，授权应用
# 3. 获取PIN码
# 4. 使用PIN码获取Access Token
node scripts/get_new_token.js <PIN_CODE>
```

### 权限验证

运行权限测试脚本确保所有权限正常：

```bash
node scripts/test_permissions.js
```

✅ **成功标志**：所有测试通过，特别是"写入权限"测试

## 📖 使用指南

### 日常运营

执行完整的日常运营任务：

```bash
# 预览模式（不实际执行）
node scripts/daily_operations.js --dry-run

# 正式执行
node scripts/daily_operations.js

# 调试模式（详细日志）
node scripts/daily_operations.js --debug
```

### 自定义配置

编辑配置文件调整运营策略：

- `config/targets.js` - 目标账号配置
- `config/keywords.js` - 搜索关键词
- `config/templates.js` - 内容模板

### 定时执行

建议每日执行1-2次，避免频率限制：

```bash
# 使用cron定时执行（Linux/macOS）
0 9,17 * * * cd /path/to/skill && node scripts/daily_operations.js

# 使用Windows任务计划
# 创建每日9:00和17:00执行的任务
```

## 🔧 功能模块

### 1. 智能搜索 (`lib/client.js`)
- 支持X API v2搜索
- 智能评分和排序
- 避免重复和垃圾内容

### 2. 互动运营 (`scripts/daily_operations.js`)
- 点赞、转发、评论
- 智能间隔控制
- 错误重试机制

### 3. 内容生成 (`config/templates.js`)
- 智能话题分析
- 原创推文生成
- 评论模板库

### 4. 飞书集成
- 结构化日报
- 运营数据统计
- 执行结果通知

### 5. 工具脚本
- `scripts/test_permissions.js` - 权限诊断
- `scripts/test_comment.js` - 评论功能测试
- `scripts/test_basic.js` - 基础功能测试

## 🛠️ 故障排除

### 常见问题

#### Q1: 所有写入操作返回401错误
**原因**: Access Token没有写入权限
**解决**：
1. 确认应用权限为"Read and Write"
2. 重新获取Access Token
3. 运行`node scripts/test_permissions.js`验证

#### Q2: 评论功能失败
**原因**: X API对评论有额外限制
**解决**：
1. 运行`node scripts/test_comment.js`诊断
2. 确保推文允许回复
3. 优化评论内容（避免触发风控）

#### Q3: 频率限制（429错误）
**原因**: API调用太频繁
**解决**：
1. 增加`OPERATION_DELAY`值
2. 减少单次操作数量
3. 使用代理IP（可选）

#### Q4: 代理连接问题
**原因**: 网络环境限制
**解决**：
1. 配置正确的`HTTPS_PROXY`
2. 测试网络连接
3. 考虑使用其他代理方案

### 调试模式

启用详细日志：

```bash
# 设置环境变量
export VERBOSE_LOGGING=true

# 或直接运行
node scripts/daily_operations.js --debug
```

## 📁 项目结构

```
x-automated-operations-skill/
├── README.md                 # 本文档
├── SKILL.md                  # OpenClaw技能定义
├── package.json              # 依赖配置
├── .env.example              # 环境变量模板
├── .gitignore                # Git忽略配置
├── lib/
│   └── client.js             # X API客户端
├── config/
│   ├── targets.js            # 目标账号配置
│   ├── keywords.js           # 搜索关键词配置
│   └── templates.js          # 内容模板配置
├── scripts/
│   ├── daily_operations.js   # 主运营脚本
│   ├── test_permissions.js   # 权限测试
│   ├── test_comment.js       # 评论测试
│   ├── test_basic.js         # 基础测试
│   ├── generate_oauth_url.js # OAuth授权URL生成
│   └── get_new_token.js      # Access Token获取
├── references/               # 参考文档
└── logs/                     # 执行日志（自动生成）
```

## ⚠️ 注意事项

### 安全建议
1. **不要提交`.env`文件**到版本控制
2. 定期轮换API凭证
3. 使用环境变量存储敏感信息
4. 监控API使用量

### 合规使用
1. 遵守X API使用条款
2. 避免垃圾信息行为
3. 尊重用户隐私
4. 控制操作频率

### 最佳实践
1. 每日执行不超过2次
2. 互动目标控制在5条以内
3. 内容原创，避免抄袭
4. 定期更新配置和模板

## 📈 运营效果

### 预期成果
- 每日与AI领域关键账号互动
- 建立专业行业形象
- 获取领域最新动态
- 自动化运营节省时间

### 数据指标
- 互动成功率 > 80%
- 原创推文阅读量提升
- 粉丝增长（长期）
- 行业影响力建立

## 🔄 更新日志

### v2.0 (2026-03-25)
- 重构为模块化架构
- 增强错误处理和重试机制
- 添加完整权限诊断工具
- 优化内容生成模板
- 完善飞书日报推送

### v1.0 (初始版本)
- 基础搜索和互动功能
- 简单的原创内容生成
- 基础飞书集成

## 📞 支持与贡献

### 问题反馈
遇到问题请：
1. 查看"故障排除"章节
2. 运行测试脚本诊断
3. 提交Issue（附详细日志）

### 功能建议
欢迎提出改进建议：
- 更多互动策略
- 更好的内容模板
- 其他平台集成

### 安全报告
发现安全问题请私密报告。

---

**免责声明**: 本工具仅供学习和合规使用，使用者需遵守X平台规则和相关法律法规。不当使用可能导致账号受限。

**License**: MIT