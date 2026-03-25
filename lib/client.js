/**
 * X API Client v2.0
 * 基于实战经验重构，包含完善的错误处理和权限管理
 */

const crypto = require('crypto');
const https = require('https');
const { URLSearchParams } = require('url');

class XAPIClient {
  constructor(config) {
    this.bearerToken = config.bearerToken;
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.accessToken = config.accessToken;
    this.accessTokenSecret = config.accessTokenSecret;
    this.proxyUrl = process.env.HTTPS_PROXY;
    
    this.baseURL = 'https://api.twitter.com';
    this.timeout = 30000;
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  // ── 核心HTTP方法 ──────────────────────────────────────────────
  
  async _request(method, path, data = null, oauth = false) {
    let attempts = 0;
    
    while (attempts < this.retryCount) {
      try {
        const url = `${this.baseURL}${path}`;
        const options = await this._buildRequestOptions(method, url, data, oauth);
        
        return await this._makeRequest(options, data);
      } catch (error) {
        attempts++;
        
        // 检查是否需要重试
        const shouldRetry = this._shouldRetry(error, attempts);
        if (!shouldRetry) throw error;
        
        // 等待后重试
        await this.sleep(this.retryDelay * attempts);
        console.log(`🔁 重试 ${attempts}/${this.retryCount}: ${path}`);
      }
    }
    
    throw new Error(`请求失败，已重试 ${this.retryCount} 次`);
  }

  async _buildRequestOptions(method, url, data, oauth) {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'XAutomatedOperations/2.0'
      },
      timeout: this.timeout
    };
    
    // OAuth 1.0a签名
    if (oauth) {
      const authHeader = this._buildOAuthHeader(method, url, data);
      options.headers.Authorization = authHeader;
      options.headers['Content-Type'] = 'application/json';
    } else {
      // Bearer Token认证
      options.headers.Authorization = `Bearer ${this.bearerToken}`;
    }
    
    // 代理设置
    if (this.proxyUrl) {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      options.agent = new HttpsProxyAgent(this.proxyUrl);
    }
    
    return options;
  }

  async _makeRequest(options, data) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: null
          };
          
          try {
            if (responseData) {
              result.data = JSON.parse(responseData);
            }
          } catch (e) {
            result.raw = responseData;
          }
          
          // 处理错误状态码
          if (res.statusCode >= 400) {
            const error = new Error(`HTTP ${res.statusCode}`);
            error.status = res.statusCode;
            error.data = result.data || result.raw;
            error.headers = res.headers;
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      if (data && options.method !== 'GET') {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  _shouldRetry(error, attempt) {
    // 429频率限制应该重试
    if (error.status === 429) return true;
    
    // 网络错误可以重试
    if (error.message.includes('timeout') || error.message.includes('ECONN')) {
      return true;
    }
    
    // 最多重试3次
    return attempt < this.retryCount;
  }

  // ── OAuth 1.0a签名 ───────────────────────────────────────────
  
  _buildOAuthHeader(method, url, bodyParams = {}) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // 基础OAuth参数
    const oauthParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: this.accessToken,
      oauth_version: '1.0'
    };
    
    // 合并所有参数用于签名
    const allParams = { ...oauthParams };
    for (const [key, value] of params) {
      allParams[key] = value;
    }
    
    // 添加body参数（如果有）
    if (bodyParams && Object.keys(bodyParams).length > 0) {
      Object.entries(bodyParams).forEach(([key, value]) => {
        allParams[key] = typeof value === 'object' ? JSON.stringify(value) : value;
      });
    }
    
    // 构建签名基础字符串
    const baseString = this._buildBaseString(method, url, allParams);
    
    // 生成签名密钥
    const signingKey = `${encodeURIComponent(this.consumerSecret)}&${encodeURIComponent(this.accessTokenSecret)}`;
    
    // 计算签名
    const signature = crypto.createHmac('sha1', signingKey)
      .update(baseString)
      .digest('base64');
    
    oauthParams.oauth_signature = signature;
    
    // 构建Authorization头
    const headerParams = Object.entries(oauthParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ');
    
    return `OAuth ${headerParams}`;
  }

  _buildBaseString(method, url, params) {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    
    // 排序并编码参数
    const encodedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(encodedParams)}`;
  }

  // ── 简化的公共方法 ─────────────────────────────────────────────
  
  async get(path, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullPath = query ? `${path}?${query}` : path;
    return this._request('GET', fullPath);
  }

  async post(path, data = {}) {
    return this._request('POST', path, data, true);
  }

  async delete(path) {
    return this._request('DELETE', path, null, true);
  }

  // ── API端点封装 ───────────────────────────────────────────────
  
  async searchTweets(query, maxResults = 10) {
    const encodedQuery = encodeURIComponent(query);
    const path = `/2/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=public_metrics,author_id,created_at,context_annotations&expansions=author_id`;
    return this.get(path);
  }

  async postTweet(text, options = {}) {
    const data = { text };
    
    if (options.replyTo) {
      data.reply = { in_reply_to_tweet_id: options.replyTo };
    }
    
    if (options.quoteTweet) {
      data.quote_tweet_id = options.quoteTweet;
    }
    
    return this.post('/2/tweets', data);
  }

  async likeTweet(tweetId) {
    const userId = process.env.X_USER_ID;
    if (!userId) throw new Error('X_USER_ID not set in .env');
    return this.post(`/2/users/${userId}/likes`, { tweet_id: tweetId });
  }

  async retweet(tweetId) {
    const userId = process.env.X_USER_ID;
    if (!userId) throw new Error('X_USER_ID not set in .env');
    return this.post(`/2/users/${userId}/retweets`, { tweet_id: tweetId });
  }

  async replyToTweet(text, tweetId) {
    return this.postTweet(text, { replyTo: tweetId });
  }

  async getUserInfo(userId) {
    return this.get(`/2/users/${userId}?user.fields=id,name,username,description,profile_image_url,public_metrics`);
  }

  async getMe() {
    return this.get('/2/users/me?user.fields=id,name,username,description');
  }

  // ── 工具方法 ──────────────────────────────────────────────────
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ── 权限检查方法 ──────────────────────────────────────────────
  
  async checkPermissions() {
    console.log('🔍 检查API权限...');
    
    const tests = [
      { name: '读取权限', test: async () => await this.searchTweets('test', 1) },
      { name: '用户信息', test: async () => await this.getMe() }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          success: true,
          status: result.status
        });
        console.log(`✅ ${test.name}: 正常`);
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          error: error.message,
          status: error.status
        });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
      
      await this.sleep(500);
    }
    
    return results;
  }

  async testWritePermission() {
    console.log('✍️  测试写入权限...');
    
    try {
      // 尝试发布测试推文（稍后删除）
      const testTweet = `权限测试 ${Date.now()} - 自动化测试`;
      const result = await this.postTweet(testTweet);
      
      if (result.status === 200 || result.status === 201) {
        const tweetId = result.data?.data?.id;
        console.log(`✅ 写入权限正常，测试推文ID: ${tweetId}`);
        
        // 返回推文ID以便清理
        return { 
          success: true, 
          tweetId,
          message: '有写入权限，可以执行点赞、发推等操作'
        };
      } else {
        return {
          success: false,
          message: `写入测试失败: HTTP ${result.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '写入权限不足，需要检查应用权限设置'
      };
    }
  }
}

module.exports = XAPIClient;