#!/usr/bin/env node
/**
 * 测试Bearer Token
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');

async function testBearerToken() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  
  console.log('🔍 测试Bearer Token');
  console.log('='.repeat(60));
  console.log(`Token长度: ${bearerToken?.length || 0}`);
  console.log(`Token前20位: ${bearerToken?.substring(0, 20)}...`);
  
  // 测试搜索API
  const query = encodeURIComponent('AI');
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=5`;
  
  const options = {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'TestClient/1.0'
    }
  };
  
  // 代理设置
  if (process.env.HTTPS_PROXY) {
    const { HttpsProxyAgent } = require('https-proxy-agent');
    options.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
  }
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        
        try {
          const json = JSON.parse(data);
          console.log('响应:');
          console.log(JSON.stringify(json, null, 2));
          
          if (res.statusCode === 200) {
            console.log('\n✅ Bearer Token有效！');
            console.log(`找到 ${json.meta?.result_count || 0} 条结果`);
          } else {
            console.log('\n❌ Bearer Token无效或有问题');
            console.log(`错误: ${json.detail || json.title || '未知错误'}`);
          }
        } catch {
          console.log('原始响应:', data);
        }
        
        resolve();
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// 测试OAuth 1.0a
async function testOAuth() {
  console.log('\n\n🔐 测试OAuth 1.0a配置');
  console.log('='.repeat(60));
  
  const requiredVars = [
    'X_CONSUMER_KEY',
    'X_CONSUMER_SECRET', 
    'X_ACCESS_TOKEN',
    'X_ACCESS_TOKEN_SECRET'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const present = value && value.length > 0;
    console.log(`${present ? '✅' : '❌'} ${varName}: ${present ? '已设置' : '缺失'}`);
    
    if (!present) allPresent = false;
  }
  
  if (!allPresent) {
    console.log('\n⚠️  缺少必要的OAuth凭证');
    return;
  }
  
  console.log('\n✅ OAuth凭证配置完整');
  console.log(`Consumer Key: ${process.env.X_CONSUMER_KEY.substring(0, 10)}...`);
  console.log(`Access Token: ${process.env.X_ACCESS_TOKEN.substring(0, 10)}...`);
}

// 检查应用权限
async function checkAppPermissions() {
  console.log('\n\n🔑 应用权限检查建议');
  console.log('='.repeat(60));
  
  console.log(`
根据测试结果分析：

1. **Bearer Token工作正常** - 可以读取数据
2. **OAuth写入全部失败** - 所有写入操作返回401

**可能原因：**

🔴 **应用权限问题（最可能）**
   - 应用可能仍然只有"Read"权限
   - 需要前往X开发者后台确认权限设置
   - 可能需要重新创建应用

🔴 **Access Token问题**
   - 虽然重新授权，但Token可能还是旧的
   - 需要完全重新生成Access Token
   - 可能需要撤销所有现有Token

🔴 **OAuth签名问题**
   - 签名算法可能有问题
   - 时间戳可能不同步
   - 参数编码可能有问题

**建议操作：**

1. 登录X开发者后台 (https://developer.twitter.com)
2. 检查应用权限是否为"Read and Write"
3. 如果还是"Read"，修改为"Read and Write"
4. 重新进行OAuth授权流程
5. 获取全新的Access Token和Secret
6. 更新.env文件中的凭证
  `);
}

if (require.main === module) {
  testBearerToken()
    .then(testOAuth)
    .then(checkAppPermissions)
    .catch(console.error);
}