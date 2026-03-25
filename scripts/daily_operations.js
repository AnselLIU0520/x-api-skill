#!/usr/bin/env node
/**
 * X自动化运营主脚本 v2.0
 * 每日执行AI大模型领域账号运营任务
 * 
 * 功能:
 * 1. 搜索三类目标账号的最新推文
 * 2. 执行点赞、转发、评论互动（各5条）
 * 3. 发布1条原创推文（以问句结尾）
 * 4. 推送结构化日报到飞书
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const XAPIClient = require('../lib/client');
const targets = require('../config/targets');
const keywords = require('../config/keywords');
const templates = require('../config/templates');

// 配置
const DRY_RUN = process.argv.includes('--dry-run');
const DEBUG = process.argv.includes('--debug');
const OPERATION_DELAY = parseInt(process.env.OPERATION_DELAY) || 2000;
const MAX_INTERACTIONS = 5;

const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  consumerKey: process.env.X_CONSUMER_KEY,
  consumerSecret: process.env.X_CONSUMER_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

// ── 日志工具 ──────────────────────────────────────────────────
class Logger {
  static info(message) {
    console.log(`📝 ${message}`);
  }
  
  static success(message) {
    console.log(`✅ ${message}`);
  }
  
  static warning(message) {
    console.log(`⚠️  ${message}`);
  }
  
  static error(message) {
    console.log(`❌ ${message}`);
  }
  
  static debug(message) {
    if (DEBUG) {
      console.log(`🐛 ${message}`);
    }
  }
}

// ── 搜索推文 ──────────────────────────────────────────────────
async function searchTweets() {
  Logger.info('搜索AI相关推文...');
  
  const allTweets = [];
  const searchKeywords = keywords.getRandomKeywords(5);
  
  for (const keyword of searchKeywords) {
    try {
      // 构建查询
      const query = keywords.buildSearchQuery(keyword, {
        language: 'en',
        excludeRetweets: true,
        excludeReplies: true
      });
      
      Logger.debug(`搜索查询: ${query}`);
      
      const data = await client.searchTweets(query, 15);
      
      if (data.data && data.data.length > 0) {
        // 添加元数据和评分
        data.data.forEach(tweet => {
          const metrics = tweet.public_metrics || {};
          const score = this.calculateTweetScore(tweet);
          
          allTweets.push({
            ...tweet,
            score,
            matchedKeyword: keyword
          });
        });
        
        Logger.debug(`关键词 "${keyword}" 找到 ${data.data.length} 条推文`);
      }
      
      // 避免频率限制
      await client.sleep(OPERATION_DELAY);
      
    } catch (error) {
      Logger.warning(`搜索关键词 "${keyword}" 失败: ${error.message}`);
    }
  }
  
  // 去重、评分、排序
  const uniqueTweets = this.deduplicateAndSortTweets(allTweets);
  
  Logger.success(`获取到 ${uniqueTweets.length} 条相关推文`);
  return uniqueTweets;
}

// 计算推文综合评分
function calculateTweetScore(tweet) {
  const metrics = tweet.public_metrics || {};
  
  // 基础评分公式
  let score = (metrics.like_count || 0) * 1;
  score += (metrics.retweet_count || 0) * 2;
  score += (metrics.reply_count || 0) * 1.5;
  score += (metrics.quote_count || 0) * 2.5;
  
  // 作者权威性加分（如果是目标账号）
  const authorUsername = tweet.author_id; // 注意：这里需要实际的用户名，不是ID
  // 在实际实现中，需要先获取作者信息
  
  // 新鲜度加分（最近发布的推文）
  const tweetTime = new Date(tweet.created_at);
  const now = new Date();
  const hoursOld = (now - tweetTime) / (1000 * 60 * 60);
  
  if (hoursOld < 1) score += 50;      // 1小时内
  else if (hoursOld < 6) score += 30; // 6小时内
  else if (hoursOld < 24) score += 10; // 24小时内
  
  return score;
}

// 去重和排序
function deduplicateAndSortTweets(tweets) {
  const uniqueTweets = [];
  const seenIds = new Set();
  
  for (const tweet of tweets) {
    if (!seenIds.has(tweet.id)) {
      seenIds.add(tweet.id);
      uniqueTweets.push(tweet);
    }
  }
  
  return uniqueTweets
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // 取前20条
}

// ── 执行互动 ──────────────────────────────────────────────────
async function performInteractions(tweets) {
  Logger.info(`执行互动任务（目标: ${MAX_INTERACTIONS}条）...`);
  
  const results = {
    liked: [],
    retweeted: [],
    replied: [],
    failed: []
  };
  
  let completedCount = 0;
  
  for (const tweet of tweets) {
    if (completedCount >= MAX_INTERACTIONS) break;
    
    const tweetId = tweet.id;
    const authorId = tweet.author_id;
    
    Logger.debug(`处理推文 ${tweetId} (作者: ${authorId})`);
    
    try {
      // 1. 点赞
      if (!DRY_RUN) {
        const likeResult = await client.likeTweet(tweetId);
        if (likeResult.status === 200 || likeResult.status === 201) {
          results.liked.push(tweetId);
          Logger.success(`点赞 ${tweetId}`);
        } else {
          results.failed.push({ tweetId, action: 'like', error: `HTTP ${likeResult.status}` });
          Logger.warning(`点赞失败 ${tweetId}`);
        }
      } else {
        results.liked.push(tweetId);
        Logger.info(`[DRY] 点赞 ${tweetId}`);
      }
      
      await client.sleep(OPERATION_DELAY);
      
      // 2. 转发
      if (!DRY_RUN) {
        const retweetResult = await client.retweet(tweetId);
        if (retweetResult.status === 200 || retweetResult.status === 201) {
          results.retweeted.push(tweetId);
          Logger.success(`转发 ${tweetId}`);
        } else {
          results.failed.push({ tweetId, action: 'retweet', error: `HTTP ${retweetResult.status}` });
          Logger.warning(`转发失败 ${tweetId}`);
        }
      } else {
        results.retweeted.push(tweetId);
        Logger.info(`[DRY] 转发 ${tweetId}`);
      }
      
      await client.sleep(OPERATION_DELAY);
      
      // 3. 评论（更保守的策略）
      // 先检查推文是否允许回复
      const canComment = await checkIfCanComment(tweet);
      
      if (canComment) {
        const comment = templates.getRandomComment();
        
        if (!DRY_RUN) {
          try {
            const replyResult = await client.replyToTweet(comment, tweetId);
            if (replyResult.status === 200 || replyResult.status === 201) {
              results.replied.push(tweetId);
              Logger.success(`评论 ${tweetId}`);
            } else {
              results.failed.push({ tweetId, action: 'reply', error: `HTTP ${replyResult.status}` });
              Logger.warning(`评论失败 ${tweetId} (HTTP ${replyResult.status})`);
            }
          } catch (commentError) {
            // 评论有更严格的限制，失败是常见的
            results.failed.push({ tweetId, action: 'reply', error: commentError.message });
            Logger.warning(`评论异常 ${tweetId}: ${commentError.message}`);
          }
        } else {
          results.replied.push(tweetId);
          Logger.info(`[DRY] 评论 ${tweetId}: ${comment.substring(0, 50)}...`);
        }
      } else {
        Logger.debug(`跳过评论 ${tweetId} (不可回复或限制)`);
      }
      
      completedCount++;
      await client.sleep(OPERATION_DELAY * 2); // 互动后额外等待
      
    } catch (error) {
      results.failed.push({ tweetId, action: 'all', error: error.message });
      Logger.error(`互动失败 ${tweetId}: ${error.message}`);
    }
  }
  
  return {
    results,
    total: completedCount,
    successRate: completedCount > 0 ? 
      (results.liked.length + results.retweeted.length + results.replied.length) / (completedCount * 3) : 0
  };
}

// 检查是否可以评论
async function checkIfCanComment(tweet) {
  // 简化检查：目前只检查是否非转推、非回复
  const text = tweet.text || '';
  
  // 如果是转推或回复，可能不能评论
  if (text.startsWith('RT ') || text.includes('@')) {
    return false;
  }
  
  // 检查推文指标：如果回复数很高，可能讨论已关闭
  const metrics = tweet.public_metrics || {};
  if (metrics.reply_count > 1000) {
    return false; // 热门讨论，可能有限制
  }
  
  return true;
}

// ── 发布原创推文 ──────────────────────────────────────────────
async function postOriginalTweet(tweets) {
  Logger.info('生成并发布原创推文...');
  
  // 分析今日话题趋势
  const trends = analyzeTrends(tweets);
  
  // 生成推文内容
  let tweetText = templates.getRandomOriginalTweet();
  tweetText = templates.ensureQuestionEnding(tweetText);
  
  Logger.info(`原创内容:\n${tweetText}\n`);
  
  if (DRY_RUN) {
    Logger.info('[DRY] 原创推文已生成（预览模式）');
    return { 
      success: true, 
      preview: tweetText,
      dryRun: true
    };
  }
  
  try {
    const result = await client.postTweet(tweetText);
    
    if (result.status === 200 || result.status === 201) {
      const tweetId = result.data?.data?.id;
      const tweetUrl = `https://x.com/i/web/status/${tweetId}`;
      
      Logger.success(`原创推文发布成功: ${tweetId}`);
      Logger.info(`推文链接: ${tweetUrl}`);
      
      return { 
        success: true, 
        tweetId,
        url: tweetUrl,
        preview: tweetText,
        trends
      };
    } else {
      Logger.error(`原创推文发布失败: HTTP ${result.status}`);
      return { 
        success: false, 
        error: `HTTP ${result.status}`,
        preview: tweetText 
      };
    }
  } catch (error) {
    Logger.error(`原创推文发布异常: ${error.message}`);
    return { 
      success: false, 
      error: error.message,
      preview: tweetText 
    };
  }
}

// 分析趋势
function analyzeTrends(tweets) {
  const trends = {
    topics: new Set(),
    keywords: new Map(),
    sentiment: 'neutral'
  };
  
  // 分析前10条推文
  const sampleTweets = tweets.slice(0, Math.min(10, tweets.length));
  
  sampleTweets.forEach(tweet => {
    const text = tweet.text.toLowerCase();
    
    // 检测话题
    if (text.includes('ai') || text.includes('llm') || text.includes('gpt')) {
      trends.topics.add('AI/LLM');
    }
    if (text.includes('agent') || text.includes('workflow')) {
      trends.topics.add('Agent Workflows');
    }
    if (text.includes('startup') || text.includes('funding')) {
      trends.topics.add('Startup Ecosystem');
    }
    if (text.includes('model') || text.includes('training')) {
      trends.topics.add('Model Development');
    }
    
    // 统计关键词
    if (tweet.matchedKeyword) {
      const count = trends.keywords.get(tweet.matchedKeyword) || 0;
      trends.keywords.set(tweet.matchedKeyword, count + 1);
    }
  });
  
  return {
    topics: Array.from(trends.topics),
    topKeywords: Array.from(trends.keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword),
    tweetCount: sampleTweets.length
  };
}

// ── 飞书推送 ──────────────────────────────────────────────────
async function pushToFeishu(payload) {
  const webhookUrl = process.env.FEISHU_WEBHOOK;
  
  if (!webhookUrl) {
    Logger.warning('未配置飞书Webhook，跳过推送');
    return { code: -1, msg: 'No webhook configured' };
  }
  
  if (DRY_RUN) {
    Logger.info('[DRY] 飞书日报已生成（预览模式）');
    return { code: 0, msg: 'dry_run' };
  }
  
  try {
    const message = buildFeishuMessage(payload);
    const result = await sendFeishuMessage(webhookUrl, message);
    
    if (result.code === 0) {
      Logger.success('飞书日报推送成功');
    } else {
      Logger.warning(`飞书推送返回非零码: ${result.msg}`);
    }
    
    return result;
  } catch (error) {
    Logger.error(`飞书推送失败: ${error.message}`);
    return { code: -1, msg: error.message };
  }
}

function buildFeishuMessage(payload) {
  const dateStr = new Date().toLocaleDateString('zh-CN');
  
  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: {
          tag: 'plain_text',
          content: `📊 X运营日报 v2.0 — ${dateStr}`
        },
        template: 'blue'
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n**模式**: ${DRY_RUN ? '预览' : '正式'}\n**状态**: ${payload.originalTweet.success ? '任务完成' : '部分完成'}`
          }
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**互动完成情况**\n✅ 点赞: ${payload.interactions.results.liked.length}/${payload.interactions.total}\n✅ 转发: ${payload.interactions.results.retweeted.length}/${payload.interactions.total}\n✅ 评论: ${payload.interactions.results.replied.length}/${payload.interactions.total}`
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**原创推文**\n${payload.originalTweet.preview.substring(0, 150)}${payload.originalTweet.preview.length > 150 ? '...' : ''}`
          }
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**今日热门话题**\n${payload.trends.topics.slice(0, 3).map((t, i) => `${i+1}. ${t}`).join('\n')}`
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**高频关键词**\n${payload.trends.topKeywords.slice(0, 3).map((k, i) => `${i+1}. ${k}`).join('\n')}`
          }
        }
      ]
    }
  };
}

async function sendFeishuMessage(webhookUrl, message) {
  const https = require('https');
  const data = JSON.stringify(message);
  
  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve(json);
        } catch {
          resolve({ code: -1, msg: 'Invalid JSON', raw: responseData });
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── 保存执行记录 ──────────────────────────────────────────────
function saveExecutionLog(payload, feishuResult) {
  if (DRY_RUN) return;
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `execution_${timestamp}.json`);
    
    const logData = {
      timestamp: new Date().toISOString(),
      payload: {
        ...payload,
        // 脱敏处理
        originalTweet: {
          ...payload.originalTweet,
          preview: payload.originalTweet.preview?.substring(0, 100) + '...'
        }
      },
      feishuResult,
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    Logger.info(`执行记录已保存: ${logFile}`);
    
  } catch (error) {
    Logger.warning(`保存日志失败: ${error.message}`);
  }
}

// ── 主函数 ────────────────────────────────────────────────────
async function main() {
  console.log(`🚀 X自动化运营 v2.0 ${DRY_RUN ? '[预览模式]' : ''}`);
  console.log(`执行时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('='.repeat(60));
  
  try {
    // 0. 检查权限（可选）
    if (DEBUG) {
      Logger.info('调试模式：检查API权限...');
      const permissionCheck = await client.checkPermissions();
      console.log('权限检查结果:', permissionCheck);
    }
    
    // 1. 搜索推文
    const tweets = await searchTweets();
    
    if (tweets.length === 0) {
      Logger.error('未找到符合条件的推文，任务终止');
      return;
    }
    
    // 2. 执行互动
    const interactions = await performInteractions(tweets);
    
    // 3. 发布原创推文
    const originalTweet = await postOriginalTweet(tweets);
    
    // 4. 分析趋势
    const trends = analyzeTrends(tweets);
    
    // 5. 准备数据
    const payload = {
      date: new Date().toISOString().split('T')[0],
      runTime: new Date().toISOString(),
      dryRun: DRY_RUN,
      tweetsCount: tweets.length,
      interactions,
      originalTweet,
      trends
    };
    
    // 6. 推送飞书
    const feishuResult = await pushToFeishu(payload);
    
    // 7. 保存记录
    saveExecutionLog(payload, feishuResult);
    
    // 8. 输出总结
    console.log('\n' + '='.repeat(60));
    console.log('🎯 任务完成总结');
    console.log('='.repeat(60));
    
    console.log(`📊 基本数据:`);
    console.log(`   搜索推文: ${tweets.length}条`);
    console.log(`   互动目标: ${MAX_INTERACTIONS}条`);
    console.log(`   完成互动: ${interactions.total}条`);
    
    console.log(`\n✅ 互动详情:`);
    console.log(`   点赞成功: ${interactions.results.liked.length}`);
    console.log(`   转发成功: ${interactions.results.retweeted.length}`);
    console.log(`   评论成功: ${interactions.results.replied.length}`);
    
    if (interactions.results.failed.length > 0) {
      console.log(`\n⚠️  失败操作: ${interactions.results.failed.length}个`);
      interactions.results.failed.slice(0, 3).forEach(fail => {
        console.log(`   - ${fail.tweetId}: ${fail.action} - ${fail.error}`);
      });
    }
    
    console.log(`\n✍️  原创发布:`);
    console.log(`   状态: ${originalTweet.success ? '成功' : '失败'}`);
    if (originalTweet.success && originalTweet.tweetId) {
      console.log(`   推文ID: ${originalTweet.tweetId}`);
      console.log(`   链接: ${originalTweet.url}`);
    }
    
    console.log(`\n📈 趋势分析:`);
    console.log(`   热门话题: ${trends.topics.join(', ')}`);
    console.log(`   高频关键词: ${trends.topKeywords.join(', ')}`);
    
    console.log(`\n📨 飞书推送: ${feishuResult.code === 0 ? '成功' : feishuResult.msg}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('任务执行完成 🎉');
    
  } catch (error) {
    Logger.error(`主流程异常: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 挂载工具方法到函数对象（用于测试）
searchTweets.calculateTweetScore = calculateTweetScore;
searchTweets.deduplicateAndSortTweets = deduplicateAndSortTweets;

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 未处理的异常:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  searchTweets,
  performInteractions,
  postOriginalTweet,
  analyzeTrends
};