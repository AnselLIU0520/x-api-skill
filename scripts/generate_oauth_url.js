#!/usr/bin/env node
/**
 * OAuth 1.0a授权URL生成工具
 * 生成用户授权URL，用于获取具有读写权限的Access Token
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const crypto = require('crypto');
const https = require('https');
const { URL, URLSearchParams } = require('url');

console.log('🔑 OAuth 1.0a授权URL生成工具');
console.log('='.repeat(60));

// 检查必要环境变量
const requiredVars = ['X_CONSUMER_KEY', 'X_CONSUMER_SECRET'];
const missingVars = requiredVars.filter(v => !process.env[v] || process.env[v].length === 0);

if (missingVars.length > 0) {
  console.error('❌ 缺少必要的环境变量:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\n请在.env文件中配置这些变量');
  process.exit(1);
}

console.log('✅ 环境变量检查通过');
console.log(`Consumer Key: ${process.env.X_CONSUMER_KEY.substring(0, 10)}...`);
console.log(`Consumer Secret: ${process.env.X_CONSUMER_SECRET.substring(0, 10)}...`);

// OAuth 1.0a获取Request Token
async function getRequestToken() {
  console.log('\n🔐 正在获取Request Token...');
  
  const url = 'https://api.twitter.com/oauth/request_token';
  const method = 'POST';
  const callback = 'oob'; // out-of-band，用于获取PIN码
  
  // OAuth参数
  const oauthParams = {
    oauth_consumer_key: process.env.X_CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    oauth_callback: callback
  };
  
  // 构建签名基础字符串
  const baseString = buildBaseString(method, url, oauthParams, {});
  
  // 签名密钥（只有Consumer Secret，还没有Token Secret）
  const signingKey = `${encodeURIComponent(process.env.X_CONSUMER_SECRET)}&`;
  
  // 计算签名
  const signature = crypto.createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');
  
  oauthParams.oauth_signature = signature;
  
  // 构建Authorization头
  const authHeader = 'OAuth ' + Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
    .join(', ');
  
  // 发送请求
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    // 代理设置
    if (process.env.HTTPS_PROXY) {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      options.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          // 解析响应（格式: oauth_token=xxx&oauth_token_secret=xxx&oauth_callback_confirmed=true）
          const params = new URLSearchParams(data);
          const oauthToken = params.get('oauth_token');
          const oauthTokenSecret = params.get('oauth_token_secret');
          const callbackConfirmed = params.get('oauth_callback_confirmed');
          
          if (oauthToken && oauthTokenSecret && callbackConfirmed === 'true') {
            console.log('✅ Request Token获取成功');
            console.log(`   oauth_token: ${oauthToken}`);
            console.log(`   oauth_token_secret: ${oauthTokenSecret.substring(0, 10)}...`);
            
            resolve({
              oauth_token: oauthToken,
              oauth_token_secret: oauthTokenSecret
            });
          } else {
            reject(new Error('无效的Request Token响应'));
          }
        } else {
          console.error('响应数据:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function buildBaseString(method, url, oauthParams, extraParams) {
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  
  // 合并所有参数
  const allParams = { ...oauthParams, ...extraParams };
  
  // 排序并编码
  const encodedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(encodedParams)}`;
}

// 生成授权URL
function generateAuthUrl(oauthToken) {
  const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;
  
  console.log('\n🔗 授权URL生成成功！');
  console.log('='.repeat(60));
  console.log(`请用浏览器访问以下URL进行授权:`);
  console.log(`\n${authUrl}\n`);
  console.log('='.repeat(60));
  
  return authUrl;
}

// 显示使用说明
function showInstructions(oauthToken, oauthTokenSecret) {
  console.log('\n📋 后续步骤:');
  console.log('1. 用浏览器打开上面的URL');
  console.log('2. 登录你的X账号（如果需要）');
  console.log('3. 点击"Authorize app"授权应用');
  console.log('4. 授权后会显示7位数字PIN码');
  console.log('5. 复制这个PIN码');
  console.log('\n📝 保存以下信息（用于debug）:');
  console.log(`   oauth_token: ${oauthToken}`);
  console.log(`   oauth_token_secret: ${oauthTokenSecret.substring(0, 10)}...`);
  console.log(`   生成时间: ${new Date().toISOString()}`);
  
  console.log('\n🔧 获取Access Token:');
  console.log('授权后运行以下命令获取Access Token:');
  console.log(`node scripts/get_new_token.js <你的PIN码>`);
  
  console.log('\n⏰ 注意:');
  console.log('- Request Token有效期很短，请立即授权');
  console.log('- PIN码只显示一次，请立即复制');
  console.log('- 如果超时，需要重新运行此脚本');
}

// 保存Token到临时文件（可选）
function saveTempToken(oauthToken, oauthTokenSecret) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const tempFile = path.join(__dirname, '../temp_oauth_token.json');
    const data = {
      oauth_token: oauthToken,
      oauth_token_secret: oauthTokenSecret,
      generated_at: new Date().toISOString(),
      consumer_key: process.env.X_CONSUMER_KEY.substring(0, 10) + '...'
    };
    
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    console.log(`\n📁 Request Token已保存到: ${tempFile}`);
    console.log('（此文件仅用于debug，获取Access Token后会自动删除）');
    
  } catch (error) {
    console.log('⚠️  无法保存临时文件，但不影响后续流程');
  }
}

// 主函数
async function main() {
  try {
    console.log('开始OAuth 1.0a授权流程...\n');
    
    // 1. 获取Request Token
    const requestToken = await getRequestToken();
    
    // 2. 生成授权URL
    const authUrl = generateAuthUrl(requestToken.oauth_token);
    
    // 3. 保存临时Token（可选）
    saveTempToken(requestToken.oauth_token, requestToken.oauth_token_secret);
    
    // 4. 显示使用说明
    showInstructions(requestToken.oauth_token, requestToken.oauth_token_secret);
    
    // 5. 提示权限检查
    console.log('\n🔍 权限检查提醒:');
    console.log('在X开发者后台，请确保应用权限为"Read and Write"');
    console.log('如果还是"Read only"，即使授权也无法写入！');
    console.log('\n🎯 完成后，使用PIN码运行: node scripts/get_new_token.js <PIN码>');
    
  } catch (error) {
    console.error('\n❌ 获取Request Token失败:');
    console.error(`   错误: ${error.message}`);
    
    if (error.message.includes('403')) {
      console.error('\n🔍 可能原因:');
      console.error('   1. Consumer Key/Secret 无效');
      console.error('   2. 应用权限设置有问题');
      console.error('   3. 需要先在X开发者后台创建应用');
    } else if (error.message.includes('网络') || error.message.includes('timeout')) {
      console.error('\n🔍 网络问题，请检查:');
      console.error('   1. 网络连接是否正常');
      console.error('   2. 代理设置是否正确');
      console.error('   3. 是否可以访问api.twitter.com');
    }
    
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
  getRequestToken,
  generateAuthUrl
};