// Example: Monitor keywords and print high-engagement tweets
require('dotenv').config();
const XAPIClient = require('../lib/client');

const KEYWORDS = ['AI', 'LLM', 'machine learning'];
const MIN_LIKES = 50;

(async () => {
  const client = new XAPIClient({
    bearerToken: process.env.X_BEARER_TOKEN,
    proxy: process.env.HTTPS_PROXY
  });

  for (const keyword of KEYWORDS) {
    console.log(`\n--- ${keyword} ---`);
    try {
      const result = await client.searchTweets(keyword, {
        maxResults: 100,
        fields: 'text,public_metrics,author_id'
      });
      const top = (result.data || [])
        .filter(t => t.public_metrics?.like_count >= MIN_LIKES)
        .sort((a, b) => b.public_metrics.like_count - a.public_metrics.like_count)
        .slice(0, 3);

      top.forEach(t => console.log(`[${t.public_metrics.like_count} likes] ${t.text.substring(0, 120)}`));
      if (!top.length) console.log('No tweets above threshold');
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
    await client.sleep();
  }
})();
