#!/usr/bin/env node
/**
 * 评论功能诊断工具
 * 专门测试X API评论功能的各种限制和问题
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

console.log('🔍 评论功能诊断工具');
console.log('='.repeat(60));

// 测试用例
const testCases = [
  {
    name: '简单评论测试',
    tweetId: '2036639953329996213', // 我们刚才发布的原创推文
    comment: '测试评论功能 - 诊断工具'
  },
  {
    name: '简短评论测试',
    tweetId: '2036639953329996213',
    comment: 'Interesting perspective.'
  },
  {
    name: '带表情评论测试',
    tweetId: '2036639953329996213',
    comment: '👍 Good point!'
  },
  {
    name: '问题式评论测试',
    tweetId: '2036639953329996213',
    comment: 'How do you see this impacting adoption?'
  }
];

async function testCommentFunctionality() {
  console.log('开始评论功能测试...\n');
  
  for (const testCase of testCases) {
    console.log(`🧪 测试: ${testCase.name}`);
    console.log(`   推文ID: ${testCase.tweetId}`);
    console.log(`   评论内容: "${testCase.comment}"`);
    console.log('-'.repeat(40));
    
    try {
      const result = await client.replyToTweet(testCase.comment, testCase.tweetId);
      
      if (result.status === 200 || result.status === 201) {
        console.log(`✅ 评论成功!`);
        console.log(`   状态码: ${result.status}`);
        console.log(`   响应: ${JSON.stringify(result.data?.data || result.data)}`);
        
        if (result.data?.data?.id) {
          console.log(`   评论ID: ${result.data.data.id}`);
          
          // 测试是否可以删除评论
          console.log('   测试删除评论...');
          try {
            const deleteResult = await client.delete(`/2/tweets/${result.data.data.id}`);
            if (deleteResult.status === 200) {
              console.log('   ✅ 评论删除成功');
            } else {
              console.log(`   ⚠️ 评论删除失败: HTTP ${deleteResult.status}`);
            }
          } catch (deleteError) {
            console.log(`   ⚠️ 删除异常: ${deleteError.message}`);
          }
        }
      } else {
        console.log(`❌ 评论失败: HTTP ${result.status}`);
        console.log(`   错误详情: ${JSON.stringify(result.data || result.raw)}`);
        
        // 分析常见错误
        if (result.status === 403) {
          console.log('   🔍 分析: 403错误通常表示权限不足或内容被拒绝');
          console.log('   可能原因:');
          console.log('     - 推文关闭了回复功能');
          console.log('     - 账号被屏蔽');
          console.log('     - 内容触发了风控');
        } else if (result.status === 401) {
          console.log('   🔍 分析: 401错误表示认证问题');
          console.log('   可能原因:');
          console.log('     - Access Token权限不足');
          console.log('     - Token已过期');
        } else if (result.status === 429) {
          console.log('   🔍 分析: 429错误表示频率限制');
          console.log('   建议: 增加操作间隔时间');
        }
      }
      
    } catch (error) {
      console.log(`💥 评论异常: ${error.message}`);
      
      if (error.data) {
        console.log(`   错误详情: ${JSON.stringify(error.data)}`);
      }
      
      // 分析错误类型
      if (error.message.includes('Cannot reply to a protected Tweet')) {
        console.log('   🔍 分析: 推文受保护，无法回复');
      } else if (error.message.includes('You are not allowed to reply to this Tweet')) {
        console.log('   🔍 分析: 没有回复此推文的权限');
      } else if (error.message.includes('Tweet is not found')) {
        console.log('   🔍 分析: 推文不存在或已被删除');
      }
    }
    
    console.log('\n');
    await client.sleep(3000); // 测试间延迟
  }
}

// 测试是否可以评论自己的推文 vs 他人的推文
async function testOwnVsOthers() {
  console.log('\n🔍 测试：评论自己的推文 vs 他人的推文');
  console.log('='.repeat(40));
  
  // 先获取自己的用户信息
  try {
    const meResult = await client.getMe();
    const myUserId = meResult.data?.data?.id;
    console.log(`我的用户ID: ${myUserId}`);
    
    // 搜索一些推文进行测试
    const searchResult = await client.searchTweets('AI', 5);
    
    if (searchResult.data?.data) {
      const tweets = searchResult.data.data;
      
      for (const tweet of tweets.slice(0, 3)) {
        const isMyTweet = tweet.author_id === myUserId;
        console.log(`\n📊 推文分析:`);
        console.log(`   推文ID: ${tweet.id}`);
        console.log(`   作者ID: ${tweet.author_id}`);
        console.log(`   是否我的推文: ${isMyTweet ? '是' : '否'}`);
        console.log(`   内容: ${tweet.text.substring(0, 50)}...`);
        
        // 尝试评论
        const comment = isMyTweet ? '测试评论自己的推文' : '测试评论他人推文';
        
        try {
          const replyResult = await client.replyToTweet(comment, tweet.id);
          console.log(`   评论结果: ${replyResult.status === 200 ? '成功' : `失败 (HTTP ${replyResult.status})`}`);
          
          // 如果成功，删除评论
          if (replyResult.status === 200 && replyResult.data?.data?.id) {
            await client.delete(`/2/tweets/${replyResult.data.data.id}`);
            console.log('   已清理测试评论');
          }
        } catch (replyError) {
          console.log(`   评论异常: ${replyError.message}`);
        }
        
        await client.sleep(3000);
      }
    }
    
  } catch (error) {
    console.log(`获取用户信息失败: ${error.message}`);
  }
}

// 测试评论限制
async function testCommentLimitations() {
  console.log('\n🔍 测试评论限制条件');
  console.log('='.repeat(40));
  
  const limitations = [
    {
      name: '超长评论',
      comment: 'A'.repeat(280) + '超长测试',
      expectedError: '可能超过字符限制'
    },
    {
      name: '空评论',
      comment: '',
      expectedError: '内容为空'
    },
    {
      name: '纯链接评论',
      comment: 'https://example.com',
      expectedError: '可能被识别为垃圾信息'
    },
    {
      name: '重复评论',
      comment: '测试测试测试测试测试',
      expectedError: '内容重复'
    }
  ];
  
  // 使用一个测试推文
  const testTweetId = '2036639953329996213';
  
  for (const limitation of limitations) {
    console.log(`\n🧪 测试: ${limitation.name}`);
    console.log(`   内容: "${limitation.comment.substring(0, 50)}${limitation.comment.length > 50 ? '...' : ''}"`);
    
    try {
      const result = await client.replyToTweet(limitation.comment, testTweetId);
      
      if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ 意外成功!`);
        
        // 清理
        if (result.data?.data?.id) {
          await client.delete(`/2/tweets/${result.data.data.id}`);
        }
      } else {
        console.log(`   ❌ 失败: HTTP ${result.status}`);
        console.log(`   符合预期: ${limitation.expectedError}`);
      }
    } catch (error) {
      console.log(`   💥 异常: ${error.message}`);
      console.log(`   符合预期: ${limitation.expectedError}`);
    }
    
    await client.sleep(2000);
  }
}

// 生成评论优化建议
function generateRecommendations() {
  console.log('\n💡 评论功能优化建议');
  console.log('='.repeat(60));
  
  console.log(`
基于测试结果，建议采取以下策略：

1. **评论前检查**
   - 检查推文是否允许回复
   - 检查推文作者是否设置了隐私保护
   - 检查推文是否已关闭评论

2. **内容优化**
   - 保持评论简短（< 100字符）
   - 避免纯链接或重复内容
   - 使用自然、有意义的回复
   - 避免触发风控的关键词

3. **频率控制**
   - 评论间隔至少5秒
   - 每小时评论不超过20条
   - 避免短时间内评论同一作者

4. **错误处理**
   - 对403错误进行特殊处理
   - 对429错误进行退避重试
   - 记录失败原因以便分析

5. **降级策略**
   - 如果评论失败，改为点赞+转发
   - 如果无法评论他人，只评论自己的推文
   - 如果所有评论都失败，只执行点赞和转发
  `);
}

// 主函数
async function main() {
  console.log('开始评论功能全面诊断...\n');
  
  try {
    // 1. 基础功能测试
    await testCommentFunctionality();
    
    // 2. 对比测试
    await testOwnVsOthers();
    
    // 3. 限制测试
    await testCommentLimitations();
    
    // 4. 生成建议
    generateRecommendations();
    
    console.log('\n🎯 诊断完成！');
    console.log('根据测试结果优化评论策略。');
    
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
  testCommentFunctionality,
  testOwnVsOthers,
  testCommentLimitations
};