// Example: Analyze account metrics for a list of users
require('dotenv').config();
const XAPIClient = require('../lib/client');

const ACCOUNTS = ['OpenAI', 'AnthropicAI', 'GoogleAI'];

(async () => {
  const client = new XAPIClient({
    bearerToken: process.env.X_BEARER_TOKEN,
    proxy: process.env.HTTPS_PROXY
  });

  for (const username of ACCOUNTS) {
    try {
      const { data: user } = await client.getUserByUsername(username);
      await client.sleep();
      const tweets = await client.getUserTweets(user.id, { maxResults: 20 });
      const items = tweets.data || [];
      const avgLikes = items.length
        ? (items.reduce((s, t) => s + (t.public_metrics?.like_count || 0), 0) / items.length).toFixed(0)
        : 0;

      console.log(`@${user.username}`);
      console.log(`  Followers: ${user.public_metrics.followers_count.toLocaleString()}`);
      console.log(`  Avg likes (last ${items.length}): ${avgLikes}`);
    } catch (err) {
      console.error(`@${username}: ${err.message}`);
    }
    await client.sleep();
  }
})();
