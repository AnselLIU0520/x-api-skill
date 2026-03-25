#!/usr/bin/env node
/**
 * 使用PIN码获取Access Token
 * 在用户授权后，使用7位PIN码交换Access Token和Secret
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const crypto = require('crypto');
const https = require('https');
const { URL, URLSearchParams } = require('url');
const fs = require('fs');
const path = require('path');

console.log('🔑 OAuth 1.0a Access Token获取工具');
console.log('='.repeat(60));

// 检查参数
if (process.argv.length < 3) {
  console.error('❌ 使用方法: node get_new_token.js <PIN码>');
  console.error('   例如: node get_new_token.js 1234567');
  process.exit(1);
}

const pinCode = process.argv[2];

if (!/^\d{7}$/.test(pinCode)) {
  console.error('❌ PIN码必须是7位数字');
  console.error(`   你输入的是: "${pinCode}" (${pinCode.length}位)`);
  console.error('   请检查授权页面显示的7位数字PIN码');
  process.exit(1);
}

console.log(`✅ PIN码: ${pinCode}`);

// 检查必要环境变量
const requiredVars = ['X_CONSUMER_KEY', 'X_CONSUMER_SECRET'];
const missingVars = requiredVars.filter(v => !process.env[v] || process.env[v].length === 0);

if (missingVars.length > 0) {
  console.error('❌ 缺少必要的环境变量:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\n请在.env文件中配置这些变量');
  process.exit(1);
}

// 尝试从临时文件读取Request Token
let oauthToken, oauthTokenSecret;

try {
  const tempFile = path.join(__dirname, '../temp_oauth_token.json');
  if (fs.existsSync(tempFile)) {
    const tempData = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
    oauthToken = tempData.oauth_token;
    oauthTokenSecret = tempData.oauth_token_secret;
    console.log('✅ 从临时文件读取Request Token');
  }
} catch (error) {
  console.log('⚠️  无法读取临时文件，需要手动输入Request Token');
}

// 如果没有临时文件，提示用户输入
if (!oauthToken) {
  console.log('\n📝 需要Request Token信息:');
  console.log('请从 generate_oauth_url.js 的输出中获取以下信息:');
  
  // 这里应该提示用户输入，但为了简化，我们假设有临时文件
  console.error('❌ 没有找到Request Token信息');
  console.error('请先运行: node scripts/generate_oauth_url.js');
  console.error('然后立即使用生成的PIN码运行此脚本');
  process.exit(1);
}

console.log(`Request Token: ${oauthToken.substring(0, 10)}...`);

// 使用PIN码获取Access Token
async function getAccessToken(pin, requestToken, requestTokenSecret) {
  console.log('\n🔐 正在使用PIN码交换Access Token...');
  
  const url = 'https://api.twitter.com/oauth/access_token';
  const method = 'POST';
  
  // OAuth参数
  const oauthParams = {
    oauth_consumer_key: process.env.X_CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    oauth_token: requestToken,
    oauth_verifier: pin
  };
  
  // 构建签名基础字符串
  const baseString = buildBaseString(method, url, oauthParams, {});
  
  // 签名密钥（Consumer Secret + Request Token Secret）
  const signingKey = `${encodeURIComponent(process.env.X_CONSUMER_SECRET)}&${encodeURIComponent(requestTokenSecret)}`;
  
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
          // 解析响应（格式: oauth_token=xxx&oauth_token_secret=xxx&user_id=xxx&screen_name=xxx）
          const params = new URLSearchParams(data);
          const accessToken = params.get('oauth_token');
          const accessTokenSecret = params.get('oauth_token_secret');
          const userId = params.get('user_id');
          const screenName = params.get('screen_name');
          
          if (accessToken && accessTokenSecret) {
            console.log('✅ Access Token获取成功！');
            console.log(`   oauth_token: ${accessToken}`);
            console.log(`   oauth_token_secret: ${accessTokenSecret.substring(0, 10)}...`);
            console.log(`   user_id: ${userId}`);
            console.log(`   screen_name: ${screenName}`);
            
            resolve({
              oauth_token: accessToken,
              oauth_token_secret: accessTokenSecret,
              user_id: userId,
              screen_name: screenName
            });
          } else {
            reject(new Error('无效的Access Token响应'));
          }
        } else {
          console.error('响应数据:', data);
          
          if (res.statusCode === 401) {
            reject(new Error('PIN码无效或已过期，请重新授权'));
          } else if (res.statusCode === 403) {
            reject(new Error('权限不足或Request Token无效'));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
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

// 更新.env文件
function updateEnvFile(accessToken, accessTokenSecret, userId) {
  const envFile = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envFile)) {
    console.error(`❌ .env文件不存在: ${envFile}`);
    console.error('请先复制.env.example为.env并配置基本参数');
    return false;
  }
  
  try {
    let envContent = fs.readFileSync(envFile, 'utf8');
    
    // 更新或添加Access Token相关变量
    const updates = {
      'X_ACCESS_TOKEN': accessToken,
      'X_ACCESS_TOKEN_SECRET': accessTokenSecret,
      'X_USER_ID': userId
    };
    
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (regex.test(envContent)) {
        // 替换现有值
        envContent = envContent.replace(regex, `${key}=${value}`);
        console.log(`✅ 更新 ${key}`);
      } else {
        // 添加新行
        envContent += `\n${key}=${value}`;
        console.log(`✅ 添加 ${key}`);
      }
    }
    
    // 保存文件
    fs.writeFileSync(envFile, envContent);
    console.log(`\n📁 .env文件已更新: ${envFile}`);
    
    // 删除临时文件
    const tempFile = path.join(__dirname, '../temp_oauth_token.json');
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log('🗑️  已删除临时Token文件');
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ 更新.env文件失败: ${error.message}`);
    return false;
  }
}

// 验证新Token
async function verifyNewToken(accessToken, accessTokenSecret) {
  console.log('\n🔍 验证新Token权限...');
  
  // 简单测试：尝试获取用户信息
  const url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
  const method = 'GET';
  
  // OAuth参数
  const oauthParams = {
    oauth_consumer_key: process.env.X_CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0'
  };
  
  // 构建签名基础字符串
  const baseString = buildBaseString(method, url, oauthParams, {});
  
  // 签名密钥
  const signingKey = `${encodeURIComponent(process.env.X_CONSUMER_SECRET)}&${encodeURIComponent(accessTokenSecret)}`;
  
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
  
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'Authorization': authHeader
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
        if (res.statusCode === 200) {
          try {
            const userInfo = JSON.parse(data);
            console.log(`✅ Token验证成功: @${userInfo.screen_name}`);
            console.log(`   用户ID: ${userInfo.id_str}`);
            console.log(`   用户名: ${userInfo.name}`);
            resolve(true);
          } catch {
            console.log('✅ Token验证成功（无法解析用户信息）');
            resolve(true);
          }
        } else {
          console.log(`⚠️  Token验证返回HTTP ${res.statusCode}`);
          console.log(`   响应: ${data.substring(0, 100)}...`);
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      console.log('⚠️  Token验证网络错误');
      resolve(false);
    });
    
    req.end();
  });
}

// 显示后续步骤
function showNextSteps(success) {
  console.log('\n' + '='.repeat(60));
  
  if (success) {
    console.log('🎉 Access Token获取完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 运行权限测试验证所有功能:');
    console.log('   node scripts/test_permissions.js');
    console.log('\n2. 测试日常运营（预览模式）:');
    console.log('   node scripts/daily_operations.js --dry-run');
    console.log('\n3. 正式执行日常运营:');
    console.log('   node scripts/daily_operations.js');
    console.log('\n🔧 如果仍有写入权限问题:');
    console.log('   - 确认X开发者后台应用权限为"Read and Write"');
    console.log('   - 检查应用是否在"开发者门户"中激活');
  } else {
    console.log('⚠️  Access Token获取可能有问题');
    console.log('\n🔍 问题排查:');
    console.log('1. 确认X开发者后台应用权限为"Read and Write"');
    console.log('2. 确认应用在"开发者门户"中处于激活状态');
    console.log('3. 重新运行完整授权流程:');
    console.log('   node scripts/generate_oauth_url.js');
    console.log('   然后立即授权并使用新PIN码');
    console.log('\n📞 如果问题持续:');
    console.log('   检查X开发者后台的"User authentication settings"');
    console.log('   确保OAuth 1.0a已启用且回调URL正确');
  }
  
  console.log('\n' + '='.repeat(60));
}

// 主函数
async function main() {
  try {
    console.log('开始Access Token获取流程...\n');
    
    // 1. 获取Access Token
    const accessTokenData = await getAccessToken(pinCode, oauthToken, oauthTokenSecret);
    
    // 2. 更新.env文件
    const envUpdated = updateEnvFile(
      accessTokenData.oauth_token,
      accessTokenData.oauth_token_secret,
      accessTokenData.user_id
    );
    
    if (!envUpdated) {
      console.error('\n❌ 无法更新.env文件，请手动更新:');
      console.error(`   X_ACCESS_TOKEN=${accessTokenData.oauth_token}`);
      console.error(`   X_ACCESS_TOKEN_SECRET=${accessTokenData.oauth_token_secret}`);
      console.error(`   X_USER_ID=${accessTokenData.user_id}`);
    }
    
    // 3. 验证新Token（可选）
    await verifyNewToken(accessTokenData.oauth_token, accessTokenData.oauth_token_secret);
    
    // 4. 显示后续步骤
    showNextSteps(true);
    
  } catch (error) {
    console.error('\n❌ 获取Access Token失败:');
    console.error(`   错误: ${error.message}`);
    
    if (error.message.includes('PIN码无效')) {
      console.error('\n🔍 可能原因:');
      console.error('   1. PIN码输入错误');
      console.error('   2. PIN码已过期（Request Token有效期很短）');
      console.error('   3. 授权未完成或已取消');
      console.error('\n💡 解决方案:');
      console.error('   重新运行: node scripts/generate_oauth_url.js');
      console.error('   然后立即授权并使用新PIN码');
    }
    
    showNextSteps(false);
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
  getAccessToken,
  updateEnvFile
};