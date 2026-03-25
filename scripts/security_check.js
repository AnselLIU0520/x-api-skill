#!/usr/bin/env node
/**
 * 安全审查脚本
 * 检查代码中是否有硬编码的敏感信息
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 安全审查工具');
console.log('='.repeat(60));

// 敏感信息模式
const SENSITIVE_PATTERNS = [
  // X API凭证模式
  { 
    pattern: /['"][A-Za-z0-9]{25,}['"]/g, 
    description: '可能包含API Key或Token',
    checkFiles: ['.js', '.json', '.md']
  },
  {
    pattern: /Bearer\s+[A-Za-z0-9%]{50,}/g,
    description: '可能包含Bearer Token',
    checkFiles: ['.js', '.json', '.md']
  },
  {
    pattern: /oauth_token=['"][A-Za-z0-9_-]{50,}['"]/g,
    description: '可能包含OAuth Token',
    checkFiles: ['.js', '.json', '.md']
  },
  {
    pattern: /consumer_(key|secret)=['"][A-Za-z0-9]{20,}['"]/g,
    description: '可能包含Consumer Key/Secret',
    checkFiles: ['.js', '.json', '.md']
  },
  {
    pattern: /access_token=['"][A-Za-z0-9_-]{50,}['"]/g,
    description: '可能包含Access Token',
    checkFiles: ['.js', '.json', '.md']
  },
  // 用户ID模式
  {
    pattern: /\d{18,}/g,
    description: '可能包含用户ID（长数字）',
    checkFiles: ['.js', '.json', '.md'],
    excludePatterns: [/Date\.now\(\)/, /\d{13,}/] // 排除时间戳
  },
  // URL中的敏感信息
  {
    pattern: /https?:\/\/[^'"\s]*token=[^'"\s]+/g,
    description: 'URL中可能包含Token',
    checkFiles: ['.js', '.json', '.md']
  },
  // 飞书Webhook
  {
    pattern: /feishu\.cn\/flow\/api\/trigger-webhook\/[A-Za-z0-9]+/g,
    description: '可能包含飞书Webhook ID',
    checkFiles: ['.js', '.json', '.md']
  }
];

// 要忽略的文件和目录
const IGNORE_PATHS = [
  'node_modules',
  '.git',
  'logs',
  '.env',
  '.env.local',
  '.env.*',
  'temp_oauth_token.json'
];

// 要检查的文件扩展名
const CHECK_EXTENSIONS = ['.js', '.json', '.md', '.txt', '.yml', '.yaml'];

// 递归扫描目录
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    // 检查是否应该忽略
    const shouldIgnore = IGNORE_PATHS.some(ignore => {
      if (ignore.includes('*')) {
        const regex = new RegExp(ignore.replace(/\*/g, '.*'));
        return regex.test(fullPath);
      }
      return fullPath.includes(ignore);
    });
    
    if (shouldIgnore) {
      console.log(`⏭️  忽略: ${fullPath}`);
      continue;
    }
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, results);
    } else {
      const ext = path.extname(file);
      if (CHECK_EXTENSIONS.includes(ext)) {
        const fileResults = checkFile(fullPath);
        if (fileResults.length > 0) {
          results.push({
            file: fullPath,
            issues: fileResults
          });
        }
      }
    }
  }
  
  return results;
}

// 检查单个文件
function checkFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const pattern of SENSITIVE_PATTERNS) {
      const { checkFiles } = pattern;
      const ext = path.extname(filePath);
      
      if (checkFiles.includes(ext) || checkFiles.includes('*')) {
        // 检查每一行
        lines.forEach((line, index) => {
          const matches = line.match(pattern.pattern);
          if (matches) {
            // 检查是否应该排除
            const shouldExclude = pattern.excludePatterns?.some(exclude => 
              exclude.test(line)
            );
            
            if (!shouldExclude) {
              issues.push({
                line: index + 1,
                pattern: pattern.description,
                matches: matches.slice(0, 3), // 只显示前3个匹配
                preview: line.trim().substring(0, 100) + (line.length > 100 ? '...' : '')
              });
            }
          }
        });
      }
    }
  } catch (error) {
    console.warn(`⚠️  无法读取文件 ${filePath}: ${error.message}`);
  }
  
  return issues;
}

// 生成报告
function generateReport(results) {
  console.log('\n📋 安全审查报告');
  console.log('='.repeat(60));
  
  if (results.length === 0) {
    console.log('✅ 未发现硬编码的敏感信息！');
    return;
  }
  
  console.log(`发现 ${results.length} 个文件可能包含敏感信息:\n`);
  
  let totalIssues = 0;
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   发现 ${result.issues.length} 个问题:`);
    
    result.issues.forEach(issue => {
      console.log(`   - 第${issue.line}行: ${issue.pattern}`);
      if (issue.matches.length > 0) {
        console.log(`     匹配: ${issue.matches.map(m => m.substring(0, 20) + '...').join(', ')}`);
      }
      console.log(`     上下文: ${issue.preview}`);
    });
    
    totalIssues += result.issues.length;
    console.log();
  });
  
  console.log(`总计: ${totalIssues} 个潜在安全问题`);
  
  console.log('\n💡 建议操作:');
  console.log('1. 检查以上文件，确认是否确实包含敏感信息');
  console.log('2. 如果包含，将其移动到环境变量中');
  console.log('3. 使用 .env 文件存储敏感信息');
  console.log('4. 将 .env 添加到 .gitignore');
  console.log('5. 只提交 .env.example 作为模板');
}

// 检查.gitignore
function checkGitIgnore() {
  const gitignorePath = path.join(__dirname, '../.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.log('\n⚠️  缺少 .gitignore 文件');
    return false;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const requiredPatterns = [
    '.env',
    '.env.local',
    '.env.*',
    'node_modules',
    'logs/',
    'temp_oauth_token.json'
  ];
  
  const missing = requiredPatterns.filter(pattern => 
    !content.includes(pattern.replace('*', ''))
  );
  
  if (missing.length > 0) {
    console.log('\n⚠️  .gitignore 缺少必要配置:');
    missing.forEach(pattern => console.log(`   - ${pattern}`));
    return false;
  }
  
  console.log('\n✅ .gitignore 配置正确');
  return true;
}

// 检查.env.example
function checkEnvExample() {
  const envExamplePath = path.join(__dirname, '../.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    console.log('\n❌ 缺少 .env.example 文件');
    return false;
  }
  
  const content = fs.readFileSync(envExamplePath, 'utf8');
  
  // 检查是否包含示例值而不是真实凭证
  const suspiciousPatterns = [
    /X_BEARER_TOKEN=[A-Za-z0-9%]{50,}/,
    /X_CONSUMER_KEY=[A-Za-z0-9]{20,}/,
    /X_CONSUMER_SECRET=[A-Za-z0-9]{20,}/,
    /X_ACCESS_TOKEN=[A-Za-z0-9_-]{50,}/,
    /X_ACCESS_TOKEN_SECRET=[A-Za-z0-9]{20,}/
  ];
  
  const hasRealCredentials = suspiciousPatterns.some(pattern => 
    pattern.test(content)
  );
  
  if (hasRealCredentials) {
    console.log('\n⚠️  .env.example 可能包含真实凭证！');
    console.log('请确保使用示例值如: your_bearer_token_here');
    return false;
  }
  
  console.log('✅ .env.example 配置正确（使用示例值）');
  return true;
}

// 建议的安全改进
function suggestImprovements() {
  console.log('\n🔧 安全改进建议');
  console.log('='.repeat(60));
  
  console.log(`
1. **环境变量管理**
   - 所有敏感信息存储在 .env 文件中
   - 使用 dotenv 加载环境变量
   - 不要将 .env 提交到版本控制

2. **代码审查**
   - 定期运行本安全审查脚本
   - 在CI/CD流水线中加入安全检查
   - 使用pre-commit钩子防止提交敏感信息

3. **凭证轮换**
   - 定期更换API凭证（每3-6个月）
   - 使用OAuth动态获取Access Token
   - 监控凭证使用情况

4. **访问控制**
   - 最小权限原则：只申请必要权限
   - 分离生产/测试环境凭证
   - 使用不同的应用处理不同功能

5. **日志安全**
   - 日志中不要记录完整Token
   - 敏感信息使用掩码（如 token_xxxx）
   - 定期清理日志文件
  `);
}

// 主函数
function main() {
  console.log('开始安全审查...\n');
  
  const skillDir = path.join(__dirname, '..');
  console.log(`扫描目录: ${skillDir}`);
  
  // 1. 扫描代码
  const results = scanDirectory(skillDir);
  
  // 2. 生成报告
  generateReport(results);
  
  // 3. 检查.gitignore
  checkGitIgnore();
  
  // 4. 检查.env.example
  checkEnvExample();
  
  // 5. 建议改进
  suggestImprovements();
  
  console.log('\n' + '='.repeat(60));
  console.log('安全审查完成！');
  
  if (results.length > 0) {
    console.log('⚠️  请修复发现的问题后再推送到GitHub');
    process.exit(1);
  } else {
    console.log('✅ 代码安全，可以推送到GitHub');
  }
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('审查过程出错:', error);
    process.exit(1);
  });
}

module.exports = {
  scanDirectory,
  checkFile,
  checkGitIgnore,
  checkEnvExample
};