// X (Twitter) API v2 Client
// Supports Bearer Token auth, optional proxy, and automatic rate limiting
const https = require('https');
const { URL } = require('url');

class XAPIClient {
  constructor(config = {}) {
    if (!config.bearerToken) throw new Error('bearerToken is required');
    this.bearerToken = config.bearerToken;
    this.baseURL = 'https://api.twitter.com/2';
    this.delayMs = config.delayMs || 1200; // safe default between requests

    // Proxy: explicit config > env vars (works with TUN mode too)
    const proxy = config.proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxy) {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      this.agent = new HttpsProxyAgent(proxy);
    }
  }

  async request(endpoint, params = {}) {
    const url = new URL(this.baseURL + endpoint);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.append(k, v);
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'x-api-skill/1.1'
        },
        ...(this.agent ? { agent: this.agent } : {}),
        timeout: 15000
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
            else {
              const err = new Error(`HTTP ${res.statusCode}`);
              err.status = res.statusCode;
              err.data = json;
              reject(err);
            }
          } catch (e) { reject(new Error('Invalid JSON response')); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
      req.end();
    });
  }

  // Search recent tweets (last 7 days)
  async searchTweets(query, options = {}) {
    return this.request('/tweets/search/recent', {
      query,
      max_results: options.maxResults || 10,
      'tweet.fields': options.fields || 'text,created_at,public_metrics,author_id',
      ...(options.sinceId ? { since_id: options.sinceId } : {})
    });
  }

  // Get user by username
  async getUserByUsername(username) {
    return this.request(`/users/by/username/${username}`, {
      'user.fields': 'description,public_metrics,verified,created_at'
    });
  }

  // Get user's recent tweets
  async getUserTweets(userId, options = {}) {
    return this.request(`/users/${userId}/tweets`, {
      max_results: options.maxResults || 10,
      'tweet.fields': 'text,created_at,public_metrics',
      exclude: 'retweets,replies'
    });
  }

  // Get a single tweet by ID
  async getTweet(tweetId) {
    return this.request(`/tweets/${tweetId}`, {
      'tweet.fields': 'text,created_at,public_metrics,author_id'
    });
  }

  // Helper: sleep between requests to respect rate limits
  sleep(ms) { return new Promise(r => setTimeout(r, ms || this.delayMs)); }
}

module.exports = XAPIClient;
