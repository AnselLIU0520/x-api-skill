#!/usr/bin/env node
/**
 * 简单评论测试 - 直接使用OAuth 1.0a
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');

// 直接测试评论API
async function testCommentDirectly() {
  const tweetId = '2036639953329996213';
  const comment = 'Direct test comment';
  
  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';
  
  // OAuth 1.0a参数
  const oauthParams = {
    oauth_consumer_key: process.env.X_CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.X_ACCESS_TOKEN,
    oauth_version: '1.0'
  };
  
  // 请求体
  const body = JSON.stringify({
    text: comment,
    reply: {
      in_reply_to_tweet_id: tweetId
    }
  });
  
  console.log('请求体:', body);
  
  // 构建签名基础字符串
  const baseString = buildBaseString(method, url, oauthParams, {});
  
  // 签名密钥
  const signingKey = `${encodeURIComponent(process.env.X_CONSUMER_SECRET)}&${encodeURIComponent(process.env.X_ACCESS_TOKEN_SECRET)}`;
  
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
  
  console.log('Authorization头:', authHeader.substring(0, 100) + '...');
  
  // 发送请求
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  
  // 代理设置
  if (process.env.HTTPS_PROXY) {
    const { HttpsProxyAgent } = require('https-proxy-agent');
    options.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
  }
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        console.log('响应头:', res.headers);
        
        try {
          const json = JSON.parse(data);
          console.log('响应体:', JSON.stringify(json, null, 2));
        } catch {
          console.log('原始响应:', data);
        }
        
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildBaseString(method, url, oauthParams, bodyParams) {
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
  
  // 合并所有参数
  const allParams = { ...oauthParams };
  
  // 排序并编码
  const encodedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(encodedParams)}`;
}

// 测试v1.1 API
async function testV11Comment() {
  console.log('\n🔍 测试v1.1 API评论');
  
  const tweetId = '2036639953329996213';
  const comment = 'Test via v1.1 API';
  const url = `https://api.twitter.com/1.1/statuses/update.json`;
  
  const params = {
    status: comment,
    in_reply_to_status_id: tweetId
  };
  
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${queryString}`;
  
  console.log('v1.1 API URL:', fullUrl);
  
  // 这里需要实现OAuth 1.0a签名
  // 暂时跳过，先测试其他方法
}

// 测试是否可以使用v2 API的quote功能代替评论
async function testQuoteInstead() {
  console.log('\n🔍 测试引用推文代替评论');
  
  const tweetId = '2036639953329996213';
  const comment = 'Testing quote tweet functionality';
  const url = 'https://api.twitter.com/2/tweets';
  
  const body = JSON.stringify({
    text: comment,
    quote_tweet_id: tweetId
  });
  
  console.log('引用推文请求体:', body);
  
  // 实现类似上面的OAuth签名
  // 暂时跳过
}

// 主函数
async function main() {
  console.log('🔍 直接评论API测试');
  console.log('='.repeat(60));
  
  try {
    await testCommentDirectly();
  } catch (error) {
    console.error('测试失败:', error.message);
  }
  
  console.log('\n💡 建议:');
  console.log('1. 检查Access Token是否有评论权限');
  console.log('2. 尝试使用v1.1 API: /1.1/statuses/update.json');
  console.log('3. 考虑使用引用推文(quote)代替评论');
  console.log('4. 检查推文是否允许回复');
}

if (require.main === module) {
  main().catch(console.error);
}