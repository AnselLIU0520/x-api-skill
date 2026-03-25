# x-automated-operations-skill

**版本**: 2.0  
**状态**: 生产就绪  
**最后更新**: 2026-03-24  
**作者**: 比比 (Bibi)  
**依赖**: Node.js, X API v2, Feishu Webhook

## 🎯 概述

X/Twitter自动化运营技能，专为AI大模型领域账号设计。基于实战经验重构，解决了权限、频率限制、内容质量等核心问题。

## 📋 核心功能

### 1. 每日自动化运营
- **信息搜集**: 搜索AI大模型厂商、科技博主、CEO/投资人的最新推文
- **内容发布**: 基于当日信息发布1条原创推文（以问句结尾）
- **互动操作**: 点赞、转发、评论各5条（仅限已关注账号）
- **信息同步**: 推送结构化日报到飞书

### 2. 智能优化
- **权限管理**: 自动检测和修复读写权限问题
- **频率控制**: 智能间隔避免触发风控
- **内容质量**: 原创内容生成，避免低质搬运
- **错误处理**: 完善的异常处理和重试机制

### 3. 监控与报告
- **执行日志**: 详细记录每次操作
- **性能指标**: 成功率、响应时间、频率使用
- **日报推送**: 结构化飞书日报

## 🚀 快速开始

### 环境配置
```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 配置X API凭证
# 获取以下凭证填入.env文件：
# - X_BEARER_TOKEN
# - X_CONSUMER_KEY, X_CONSUMER_SECRET  
# - X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
# - X_USER_ID
# - FEISHU_WEBHOOK (可选)

# 3. 安装依赖
npm install
```

### 基本使用
```bash
# 预览模式（不实际执行）
node scripts/daily_operations.js --dry-run

# 执行完整运营任务
node scripts/daily_operations.js

# 仅测试权限
node scripts/test_permissions.js

# 生成OAuth授权URL
node scripts/generate_oauth.js
```

## 🔧 配置说明

### 环境变量 (.env)
```env
# X API 凭证
X_BEARER_TOKEN=your_bearer_token
X_CONSUMER_KEY=your_consumer_key
X_CONSUMER_SECRET=your_consumer_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
X_USER_ID=your_user_id

# 代理设置（可选）
HTTPS_PROXY=http://127.0.0.1:17890

# 飞书集成（可选）
FEISHU_WEBHOOK=https://www.feishu.cn/flow/api/trigger-webhook/your_webhook_id_here
```

### 目标账号配置
编辑 `config/targets.js` 自定义搜索范围：
```javascript
module.exports = {
  // AI厂商官方账号
  official: ['OpenAI', 'AnthropicAI', 'GoogleAI', 'Microsoft'],
  
  // 科技博主/KOL
  kols: ['sama', 'karpathy', 'ylecun', 'AndrewYNg'],
  
  // CEO/投资人
  leaders: ['gdb', 'paulg', 'naval', 'cdixon']
};
```

### 关键词配置
编辑 `config/keywords.js` 自定义搜索关键词：
```javascript
module.exports = [
  'AI大模型', 'AGI', 'LLM', 'GPT',
  'AI创业', 'AI融资', '大模型更新',
  'AI政策', 'AIGC', '大模型技术进展'
];
```

## 📁 项目结构
```
x-automated-operations-skill/
├── SKILL.md                    # 技能文档
├── package.json               # 依赖配置
├── .env.example              # 环境变量模板
├── lib/                      # 核心库
│   ├── client.js            # X API客户端
│   ├── feishu.js           # 飞书客户端
│   └── utils.js            # 工具函数
├── scripts/                  # 执行脚本
│   ├── daily_operations.js  # 主运营脚本
│   ├── test_permissions.js # 权限测试
│   └── generate_oauth.js   # OAuth工具
├── config/                  # 配置文件
│   ├── targets.js          # 目标账号
│   ├── keywords.js         # 搜索关键词
│   └── templates.js        # 内容模板
├── logs/                   # 执行日志
└── references/            # 参考文档
    ├── X_API_GUIDE.md     # X API指南
    └── ERROR_HANDLING.md  # 错误处理指南
```

## ⚠️ 常见问题与解决方案

### 1. 权限问题 (401/403错误)
**症状**: 点赞、发推等写入操作失败
**原因**: Access Token只有读取权限
**解决方案**:
```bash
# 1. 检查当前权限
node scripts/test_permissions.js

# 2. 如果只有读取权限，需要：
#    a. 前往X开发者后台修改应用权限为"Read and Write"
#    b. 重新进行OAuth授权
#    c. 获取新的Access Token和Secret
#    d. 更新.env文件

# 3. 使用内置工具重新授权
node scripts/generate_oauth.js
```

### 2. 频率限制 (429错误)
**症状**: API返回429 Too Many Requests
**解决方案**:
- 脚本已内置智能间隔（1-2秒）
- 自动检测剩余请求次数
- 遇到限制时暂停并重试

### 3. 评论失败
**症状**: 评论返回错误但点赞/转发正常
**原因**: X平台对评论有额外限制
**解决方案**:
- 确保只评论已关注账号
- 评论内容简短、中立
- 避免重复评论相同内容

### 4. 代理连接问题
**症状**: 网络连接失败
**解决方案**:
```env
# 在.env中配置代理
HTTPS_PROXY=http://127.0.0.1:17890
```

## 📈 最佳实践

### 运营策略
1. **固定时间执行**: 每日固定时间执行，避免随机触发风控
2. **内容质量优先**: 原创内容 > 互动数量
3. **渐进式增加**: 从少量互动开始，逐步增加
4. **定期审核**: 每周检查执行效果，调整策略

### 技术优化
1. **错误重试**: 重要操作失败时自动重试
2. **日志记录**: 详细记录每次操作和结果
3. **性能监控**: 跟踪API响应时间和成功率
4. **备份恢复**: 定期备份配置，支持快速恢复

### 安全建议
1. **凭证安全**: 不要提交.env文件到版本控制
2. **权限最小化**: 只申请必要的API权限
3. **访问控制**: 限制脚本执行权限
4. **监控告警**: 设置异常操作告警

## 🔄 升级与维护

### 从v1.x升级到v2.0
1. 备份现有配置和日志
2. 安装新版本技能
3. 迁移环境变量（注意变量名变化）
4. 测试权限和基本功能
5. 逐步切换到新版本

### 定期维护任务
- 每月检查X API更新
- 每季度更新目标账号列表
- 每半年审查内容模板
- 每年评估整体运营策略

## 📚 学习资源

### 官方文档
- [X API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [OAuth 1.0a Guide](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- [Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)

### 实战经验
- [错误处理模式](references/ERROR_HANDLING.md)
- [权限管理指南](references/PERMISSION_GUIDE.md)
- [内容策略建议](references/CONTENT_STRATEGY.md)

## 🆘 技术支持

### 问题排查步骤
1. 检查日志文件 `logs/` 目录
2. 运行测试脚本 `node scripts/test_permissions.js`
3. 查看X开发者后台的应用状态
4. 检查网络连接和代理设置

### 获取帮助
- 查看 `references/` 目录中的指南
- 检查GitHub Issues（如有）
- 联系技能作者

---

**版本历史**
- v2.0 (2026-03-24): 基于实战经验完全重构，解决核心权限问题
- v1.0 (2026-03-22): 初始版本，基础功能

**许可证**: MIT  
**贡献**: 欢迎提交Issue和Pull Request