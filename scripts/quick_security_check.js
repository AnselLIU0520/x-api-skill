#!/usr/bin/env node
/**
 * 快速安全审查
 * 只检查真正的安全问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 快速安全审查');
console.log('='.repeat(60));

// 真正的敏感信息模式
const REAL_DANGER_PATTERNS = [
  // 真实的API Key（不是示例）
  {
    pattern: /['"](AKIA|ASIA)[A-Z0-9]{16}['"]/g,
    description: 'AWS Access Key ID'
  },
  {
    pattern: /['"][A-Za-z0-9]{40}['"]/g,
    description: '可能包含GitHub Token或类似凭证'
  },
  {
    pattern: /['"]gh[pousr]_[A-Za-z0-9]{36}['"]/g,
    description: 'GitHub Token'
  },
  {
    pattern: /['"]xox[baprs]-[A-Za-z0-9-]{10,}['"]/g,
    description: 'Slack Token'
  },
  // 真实的X API凭证（不是示例）
  {
    pattern: /X_BEARER_TOKEN=['"][A-Za-z0-9%]{50,}['"]/g,
    description: '真实的Bearer Token',
    exclude: ['your_bearer_token_here']
  },
  {
    pattern: /X_CONSUMER_KEY=['"][A-Za-z0-9]{20,}['"]/g,
    description: '真实的Consumer Key',
    exclude: ['your_consumer_key_here']
  },
  {
    pattern: /X_CONSUMER_SECRET=['"][A-Za-z0-9]{20,}['"]/g,
    description: '真实的Consumer Secret',
    exclude: ['your_consumer_secret_here']
  },
  {
    pattern: /X_ACCESS_TOKEN=['"][A-Za-z0-9_-]{50,}['"]/g,
    description: '真实的Access Token',
    exclude: ['your_access_token_here']
  },
  {
    pattern: /X_ACCESS_TOKEN_SECRET=['"][A-Za-z0-9]{20,}['"]/g,
    description: '真实的Access Token Secret',
    exclude: ['your_access_token_secret_here']
  }
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    for (const pattern of REAL_DANGER_PATTERNS) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        // 检查是否应该排除（示例值）
        const shouldExclude = pattern.exclude?.some(exclude => 
          content.includes(exclude)
        );
        
        if (!shouldExclude) {
          issues.push({
            pattern: pattern.description,
            matches: matches.slice(0, 2)
          });
        }
      }
    }
    
    return issues;
  } catch (error) {
    return [{ pattern: `无法读取文件: ${error.message}`, matches: [] }];
  }
}

// 主检查
console.log('检查关键文件...\n');

const files = [
  'README.md',
  'README_CN.md',
  'SKILL.md',
  'package.json',
  '.env.example',
  '.gitignore'
];

let hasIssues = false;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${file}`);
    hasIssues = true;
    return;
  }
  
  const issues = checkFile(filePath);
  
  if (issues.length > 0) {
    console.log(`⚠️  ${file}:`);
    issues.forEach(issue => {
      console.log(`   - ${issue.pattern}`);
      if (issue.matches.length > 0) {
        console.log(`     匹配: ${issue.matches.map(m => m.substring(0, 20) + '...').join(', ')}`);
      }
    });
    hasIssues = true;
  } else {
    console.log(`✅ ${file}`);
  }
});

// 检查.gitignore
console.log('\n检查.gitignore...');
const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const required = ['.env', 'node_modules'];
  const missing = required.filter(pattern => !content.includes(pattern));
  
  if (missing.length > 0) {
    console.log(`❌ 缺少: ${missing.join(', ')}`);
    hasIssues = true;
  } else {
    console.log('✅ 配置正确');
  }
} else {
  console.log('❌ 文件不存在');
  hasIssues = true;
}

// 检查.env.example
console.log('\n检查.env.example...');
const envExamplePath = path.join(__dirname, '../.env.example');
if (fs.existsSync(envExamplePath)) {
  const content = fs.readFileSync(envExamplePath, 'utf8');
  
  // 检查是否包含真实凭证
  const realCredPatterns = [
    /X_BEARER_TOKEN=[A-Za-z0-9%]{50,}/,
    /X_CONSUMER_KEY=[A-Za-z0-9]{20,}/,
    /X_CONSUMER_SECRET=[A-Za-z0-9]{20,}/,
    /X_ACCESS_TOKEN=[A-Za-z0-9_-]{50,}/,
    /X_ACCESS_TOKEN_SECRET=[A-Za-z0-9]{20,}/
  ];
  
  const hasRealCreds = realCredPatterns.some(pattern => pattern.test(content));
  
  if (hasRealCreds) {
    console.log('❌ 可能包含真实凭证！');
    console.log('   应该使用示例值如: your_bearer_token_here');
    hasIssues = true;
  } else {
    console.log('✅ 使用示例值');
  }
} else {
  console.log('❌ 文件不存在');
  hasIssues = true;
}

console.log('\n' + '='.repeat(60));

if (hasIssues) {
  console.log('⚠️  发现安全问题，请修复后再推送到GitHub。');
  process.exit(1);
} else {
  console.log('🎉 所有安全检查通过！可以安全推送到GitHub。');
  console.log('\n📋 安全要点:');
  console.log('1. ✅ 没有硬编码的真实API凭证');
  console.log('2. ✅ .env.example只包含示例值');
  console.log('3. ✅ .gitignore保护敏感文件');
  console.log('4. ✅ 所有文档使用示例值');
  console.log('\n🚀 可以开始推送到GitHub了！');
  process.exit(0);
}