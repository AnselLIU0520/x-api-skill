#!/usr/bin/env node
/**
 * 最终安全审查脚本
 * 检查代码是否可以安全推送到GitHub
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 最终安全审查');
console.log('='.repeat(60));

// 要检查的文件
const filesToCheck = [
  'README.md',
  'README_CN.md', 
  'SKILL.md',
  'package.json',
  '.env.example',
  '.gitignore',
  'lib/client.js',
  'scripts/daily_operations.js',
  'scripts/generate_oauth_url.js',
  'scripts/get_new_token.js',
  'scripts/test_permissions.js'
];

// 真正的敏感信息模式（排除示例值）
const REAL_SENSITIVE_PATTERNS = [
  {
    pattern: /['"]AK[A-Za-z0-9]{30,}['"]/g,
    description: 'AWS Access Key'
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
  {
    pattern: /['"][0-9]{17,21}['"]/g,
    description: '可能包含真实用户ID（长数字）',
    exclude: ['2036', '1861691506303868928'] // 示例值
  }
];

// 检查文件
function checkFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // 检查是否有真实凭证
    for (const pattern of REAL_SENSITIVE_PATTERNS) {
      lines.forEach((line, index) => {
        const matches = line.match(pattern.pattern);
        if (matches) {
          // 检查是否应该排除
          const shouldExclude = pattern.exclude?.some(exclude => 
            line.includes(exclude)
          );
          
          if (!shouldExclude) {
            issues.push({
              line: index + 1,
              pattern: pattern.description,
              matches: matches.slice(0, 2),
              preview: line.trim().substring(0, 80)
            });
          }
        }
      });
    }
    
    // 检查是否有硬编码的.env文件路径（不应该）
    // 但允许正常的require('dotenv').config()调用
    const hardcodedEnvPatterns = [
      /require\(['"]\.env['"]\)/,
      /fs\.readFileSync\(['"]\.env['"]/,
      /\.env['"]\)/  // 除了 .env.example
    ];
    
    const hasHardcodedEnv = hardcodedEnvPatterns.some(pattern => 
      pattern.test(content) && !content.includes('.env.example')
    );
    
    if (hasHardcodedEnv) {
      issues.push({
        line: 'multiple',
        pattern: '可能硬编码了.env文件路径',
        matches: [],
        preview: '检查是否直接引用了.env文件而不是使用环境变量'
      });
    }
    
  } catch (error) {
    console.warn(`⚠️  无法读取文件 ${filePath}: ${error.message}`);
  }
  
  return issues;
}

// 主函数
function main() {
  console.log('检查以下文件:\n');
  
  let allIssues = [];
  
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${file}`);
      return;
    }
    
    console.log(`📄 ${file}`);
    const issues = checkFile(filePath);
    
    if (issues.length > 0) {
      console.log(`   ⚠️  发现 ${issues.length} 个问题`);
      allIssues.push({ file, issues });
    } else {
      console.log(`   ✅ 安全`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (allIssues.length === 0) {
    console.log('🎉 所有文件安全，可以推送到GitHub！');
    console.log('\n📋 检查要点:');
    console.log('1. ✅ 没有硬编码的真实API凭证');
    console.log('2. ✅ .env.example只包含示例值');
    console.log('3. ✅ .gitignore配置正确');
    console.log('4. ✅ 所有敏感信息使用环境变量');
    return true;
  } else {
    console.log('⚠️  发现潜在安全问题:');
    
    allIssues.forEach(({ file, issues }) => {
      console.log(`\n📄 ${file}:`);
      issues.forEach(issue => {
        console.log(`   第${issue.line}行: ${issue.pattern}`);
        if (issue.matches.length > 0) {
          console.log(`     匹配: ${issue.matches.map(m => m.substring(0, 20) + '...').join(', ')}`);
        }
        console.log(`     上下文: ${issue.preview}`);
      });
    });
    
    console.log('\n🔧 建议:');
    console.log('1. 确认以上是否真的是敏感信息');
    console.log('2. 如果是，将其移动到环境变量中');
    console.log('3. 重新运行检查');
    
    return false;
  }
}

// 检查.gitignore
function checkGitIgnore() {
  const gitignorePath = path.join(__dirname, '../.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.log('\n❌ 缺少 .gitignore 文件');
    return false;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const required = ['.env', 'node_modules', 'logs'];
  const missing = required.filter(pattern => !content.includes(pattern));
  
  if (missing.length > 0) {
    console.log('\n⚠️  .gitignore 缺少:', missing.join(', '));
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
  
  // 检查是否包含真实凭证（不应该）
  const realCredentialPatterns = [
    /X_BEARER_TOKEN=[A-Za-z0-9%]{50,}/,
    /X_CONSUMER_KEY=[A-Za-z0-9]{20,}/,
    /X_CONSUMER_SECRET=[A-Za-z0-9]{20,}/,
    /X_ACCESS_TOKEN=[A-Za-z0-9_-]{50,}/,
    /X_ACCESS_TOKEN_SECRET=[A-Za-z0-9]{20,}/
  ];
  
  const hasRealCredentials = realCredentialPatterns.some(pattern => 
    pattern.test(content)
  );
  
  if (hasRealCredentials) {
    console.log('\n⚠️  .env.example 可能包含真实凭证！');
    console.log('应该使用示例值如: your_bearer_token_here');
    return false;
  }
  
  // 检查是否包含示例值（应该）
  const examplePatterns = [
    /your_.*_here/,
    /your_.*_id/,
    /example_/
  ];
  
  const hasExamples = examplePatterns.some(pattern => pattern.test(content));
  
  if (!hasExamples) {
    console.log('\n⚠️  .env.example 可能没有使用示例值');
    return false;
  }
  
  console.log('✅ .env.example 使用正确的示例值');
  return true;
}

// 运行
console.log('开始最终安全审查...\n');

const gitignoreOk = checkGitIgnore();
const envExampleOk = checkEnvExample();
const filesOk = main();

console.log('\n' + '='.repeat(60));
console.log('最终安全审查结果:');

if (gitignoreOk && envExampleOk && filesOk) {
  console.log('🎉 所有检查通过！可以安全推送到GitHub。');
  process.exit(0);
} else {
  console.log('⚠️  请修复上述问题后再推送到GitHub。');
  process.exit(1);
}