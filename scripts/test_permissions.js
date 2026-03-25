#!/usr/bin/env node
/**
 * X API权限测试脚本
 * 用于诊断权限问题，特别是写入权限
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const XAPIClient = require('../lib/client');

console.log('🔍 X API权限诊断工具 v2.0');
console.log('='.repeat(60));

// 检查环境变量
console.log('\n📋 环境变量检查:');
const requiredVars = [
  'X_BEARER_TOKEN',
  'X_CONSUMER_KEY', 
  'X_CONSUMER_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_TOKEN_SECRET',
  'X_USER_ID'
];

let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const hasValue = value && value.length > 0;
  const status = hasValue ? '✅' : '❌';
  
  console.log(`${status} ${varName}: ${hasValue ? '已设置' : '缺失'} (长度: ${value?.length || 0})`);
  
  if (!hasValue && varName !== 'X_ACCESS_TOKEN_SECRET') {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️  缺失必要环境变量: ${missingVars.join(', ')}`);
  console.log('请在 .env 文件中配置这些变量');
}

// 检查代理设置
if (process.env.HTTPS_PROXY) {
  console.log(`\n🔗 代理设置: ${process.env.HTTPS_PROXY}`);
} else {
  console.log('\n🔗 代理设置: 未配置（直接连接）');
}

console.log('\n' + '='.repeat(60));

// 创建客户端
const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  consumerKey: process.env.X_CONSUMER_KEY,
  consumerSecret: process.env.X_CONSUMER_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

// 测试权限
async function testAllPermissions() {
  console.log('\n🔐 开始权限测试...');
  
  const tests = [
    { name: 'Bearer Token有效性', fn: testBearerToken },
    { name: 'OAuth 1.0a配置', fn: testOAuthConfig },
    { name: '读取权限', fn: testReadPermission },
    { name: '写入权限', fn: testWritePermission },
    { name: '用户信息访问', fn: testUserInfo }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 测试: ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await test.fn();
      results.push({
        name: test.name,
        ...result
      });
      
      if (result.success) {
        console.log(`✅ ${test.name}: 成功`);
        if (result.details) {
          console.log(`   详情: ${result.details}`);
        }
      } else {
        console.log(`❌ ${test.name}: 失败`);
        console.log(`   原因: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.log(`💥 ${test.name}: 异常`);
      console.log(`   错误: ${error.message}`);
      
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }
    
    // 测试间延迟
    await client.sleep(1000);
  }
  
  return results;
}

// 测试Bearer Token
async function testBearerToken() {
  try {
    // 简单搜索测试
    const result = await client.searchTweets('test', 1);
    
    if (result.status === 200) {
      return {
        success: true,
        details: `API响应正常，找到${result.data?.meta?.result_count || 0}条结果`
      };
    } else {
      return {
        success: false,
        error: `HTTP ${result.status}`,
        details: result.data?.detail || '未知错误'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.data?.detail || '请求失败'
    };
  }
}

// 测试OAuth配置
async function testOAuthConfig() {
  const consumerKey = process.env.X_CONSUMER_KEY;
  const accessToken = process.env.X_ACCESS_TOKEN;
  
  if (!consumerKey || !accessToken) {
    return {
      success: false,
      error: '缺少Consumer Key或Access Token'
    };
  }
  
  // 检查Access Token格式
  const isValidFormat = accessToken.includes('-') && accessToken.length > 20;
  
  return {
    success: isValidFormat,
    details: isValidFormat ? 
      `格式正确 (${accessToken.substring(0, 10)}...)` : 
      'Access Token格式可能有问题'
  };
}

// 测试读取权限
async function testReadPermission() {
  try {
    const result = await client.getMe();
    
    if (result.status === 200 && result.data?.data) {
      const user = result.data.data;
      return {
        success: true,
        details: `用户: ${user.name} (@${user.username})`,
        userInfo: user
      };
    } else {
      return {
        success: false,
        error: `HTTP ${result.status}`,
        details: '无法获取用户信息'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: '用户信息访问失败'
    };
  }
}

// 测试写入权限
async function testWritePermission() {
  try {
    console.log('   测试写入权限（将发布测试推文）...');
    
    const testTweet = `权限测试 ${Date.now()} - 自动化诊断工具`;
    const result = await client.postTweet(testTweet);
    
    if (result.status === 200 || result.status === 201) {
      const tweetId = result.data?.data?.id;
      
      return {
        success: true,
        details: `写入权限正常，测试推文ID: ${tweetId}`,
        tweetId,
        tweetUrl: `https://x.com/i/web/status/${tweetId}`
      };
    } else {
      return {
        success: false,
        error: `HTTP ${result.status}`,
        details: result.data?.detail || '发推失败'
      };
    }
  } catch (error) {
    // 检查是否是权限错误
    let errorType = '未知错误';
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorType = '权限不足 (可能只有读取权限)';
    } else if (error.message.includes('403')) {
      errorType = '访问被拒绝';
    }
    
    return {
      success: false,
      error: error.message,
      details: `写入测试失败: ${errorType}`
    };
  }
}

// 测试用户信息
async function testUserInfo() {
  const userId = process.env.X_USER_ID;
  
  if (!userId) {
    return {
      success: false,
      error: '未设置X_USER_ID'
    };
  }
  
  try {
    const result = await client.getUserInfo(userId);
    
    if (result.status === 200 && result.data?.data) {
      const user = result.data.data;
      return {
        success: true,
        details: `用户信息正常: ${user.username}`,
        user: user
      };
    } else {
      return {
        success: false,
        error: `HTTP ${result.status}`,
        details: '无法获取指定用户信息'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: '用户信息查询失败'
    };
  }
}

// 生成诊断报告
function generateDiagnosticReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 诊断报告');
  console.log('='.repeat(60));
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`测试通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  // 分类统计
  const readTests = results.filter(r => 
    r.name.includes('Bearer') || r.name.includes('读取') || r.name.includes('用户信息')
  );
  const writeTests = results.filter(r => r.name.includes('写入'));
  const configTests = results.filter(r => r.name.includes('OAuth'));
  
  console.log(`\n📖 读取权限: ${readTests.filter(t => t.success).length}/${readTests.length}`);
  console.log(`✍️  写入权限: ${writeTests.filter(t => t.success).length}/${writeTests.length}`);
  console.log(`⚙️  配置检查: ${configTests.filter(t => t.success).length}/${configTests.length}`);
  
  // 失败分析
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n⚠️  失败测试分析:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.error || test.details}`);
    });
  }
  
  // 建议
  console.log('\n💡 建议:');
  
  const hasReadButNoWrite = 
    results.some(r => r.name.includes('读取') && r.success) &&
    results.some(r => r.name.includes('写入') && !r.success);
  
  if (hasReadButNoWrite) {
    console.log('   1. 应用可能只有"Read"权限，需要改为"Read and Write"');
    console.log('   2. 前往X开发者后台检查应用权限设置');
    console.log('   3. 重新进行OAuth授权获取新的Access Token');
  }
  
  const missingVars = requiredVars.filter(v => !process.env[v] || process.env[v].length === 0);
  if (missingVars.length > 0) {
    console.log(`   1. 缺少环境变量: ${missingVars.join(', ')}`);
    console.log('   2. 请检查.env文件配置');
  }
  
  const hasOAuthConfigIssue = configTests.some(t => !t.success);
  if (hasOAuthConfigIssue) {
    console.log('   1. OAuth配置有问题，检查Consumer Key/Secret');
    console.log('   2. 检查Access Token格式和有效期');
  }
  
  // 如果所有测试都通过
  if (failedTests.length === 0) {
    console.log('   ✅ 所有权限正常，可以开始运营任务');
    
    // 查找测试推文ID
    const writeTest = results.find(r => r.name.includes('写入') && r.success);
    if (writeTest && writeTest.tweetId) {
      console.log(`   📝 测试推文已发布，请手动删除: ${writeTest.tweetUrl}`);
    }
  }
}

// 主函数
async function main() {
  console.log('开始全面权限诊断...\n');
  
  try {
    const results = await testAllPermissions();
    generateDiagnosticReport(results);
    
    // 总结
    console.log('\n' + '='.repeat(60));
    const allPassed = results.every(r => r.success);
    
    if (allPassed) {
      console.log('🎉 所有权限测试通过！系统就绪。');
    } else {
      console.log('🔧 存在权限问题，请根据建议修复。');
      console.log('修复后重新运行此脚本验证。');
    }
    
  } catch (error) {
    console.error('❌ 诊断过程异常:', error.message);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main().catch(error => {
    console.error('未处理的错误:', error);
    process.exit(1);
  });
}

module.exports = {
  testAllPermissions,
  generateDiagnosticReport
};