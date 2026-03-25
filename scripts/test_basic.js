#!/usr/bin/env node
/**
 * 基础功能测试
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const XAPIClient = require('../lib/client');

const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  consumerKey: process.env.X_CONSUMER_KEY,
  consumerSecret: process.env.X_CONSUMER_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

async function testBasicFunctions() {
  console.log('🔍 基础功能测试');
  console.log('='.repeat(60));
  
  // 测试搜索
  console.log('1. 测试搜索功能...');
  try {
    const searchResult = await client.searchTweets('AI', 2);
    console.log(`✅ 搜索成功: HTTP ${searchResult.status}`);
    console.log(`   找到 ${searchResult.data?.meta?.result_count || 0} 条结果`);
  } catch (error) {
    console.log(`❌ 搜索失败: ${error.message}`);
  }
  
  await client.sleep(1000);
  
  // 测试点赞
  console.log('\n2. 测试点赞功能...');
  const testTweetId = '2036639953329996213'; // 我们的原创推文
  try {
    const likeResult = await client.likeTweet(testTweetId);
    console.log(`✅ 点赞成功: HTTP ${likeResult.status}`);
    
    // 取消点赞
    await client.sleep(1000);
    const unlikeResult = await client.delete(`/2/users/${process.env.X_USER_ID}/likes/${testTweetId}`);
    console.log(`✅ 取消点赞成功: HTTP ${unlikeResult.status}`);
  } catch (error) {
    console.log(`❌ 点赞失败: ${error.message}`);
  }
  
  await client.sleep(1000);
  
  // 测试转发
  console.log('\n3. 测试转发功能...');
  try {
    const retweetResult = await client.retweet(testTweetId);
    console.log(`✅ 转发成功: HTTP ${retweetResult.status}`);
    
    // 取消转发
    await client.sleep(1000);
    const unretweetResult = await client.delete(`/2/users/${process.env.X_USER_ID}/retweets/${testTweetId}`);
    console.log(`✅ 取消转发成功: HTTP ${unretweetResult.status}`);
  } catch (error) {
    console.log(`❌ 转发失败: ${error.message}`);
  }
  
  await client.sleep(1000);
  
  // 测试发推
  console.log('\n4. 测试发推功能...');
  try {
    const testTweet = `功能测试 ${Date.now()} - 自动化测试`;
    const tweetResult = await client.postTweet(testTweet);
    console.log(`✅ 发推成功: HTTP ${tweetResult.status}`);
    
    if (tweetResult.data?.data?.id) {
      const tweetId = tweetResult.data.data.id;
      console.log(`   推文ID: ${tweetId}`);
      
      // 删除测试推文
      await client.sleep(1000);
      const deleteResult = await client.delete(`/2/tweets/${tweetId}`);
      console.log(`✅ 删除推文成功: HTTP ${deleteResult.status}`);
    }
  } catch (error) {
    console.log(`❌ 发推失败: ${error.message}`);
  }
  
  await client.sleep(1000);
  
  // 测试评论
  console.log('\n5. 测试评论功能...');
  try {
    const comment = '测试评论功能';
    const commentResult = await client.replyToTweet(comment, testTweetId);
    console.log(`✅ 评论成功: HTTP ${commentResult.status}`);
    
    if (commentResult.data?.data?.id) {
      const commentId = commentResult.data.data.id;
      console.log(`   评论ID: ${commentId}`);
      
      // 删除评论
      await client.sleep(1000);
      const deleteCommentResult = await client.delete(`/2/tweets/${commentId}`);
      console.log(`✅ 删除评论成功: HTTP ${deleteCommentResult.status}`);
    }
  } catch (error) {
    console.log(`❌ 评论失败: ${error.message}`);
    
    // 详细分析错误
    if (error.status === 401) {
      console.log('   🔍 401错误分析:');
      console.log('   - 可能Access Token权限不足');
      console.log('   - 可能需要v1.1 API而不是v2');
      console.log('   - 可能OAuth签名有问题');
    }
    
    if (error.data) {
      console.log(`   错误详情: ${JSON.stringify(error.data)}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('测试完成！');
}

if (require.main === module) {
  testBasicFunctions().catch(console.error);
}