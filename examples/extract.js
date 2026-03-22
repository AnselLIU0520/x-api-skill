// Example: Extract terms/hashtags from tweets for vocabulary building
require('dotenv').config();
const XAPIClient = require('../lib/client');

(async () => {
  const client = new XAPIClient({
    bearerToken: process.env.X_BEARER_TOKEN,
    proxy: process.env.HTTPS_PROXY
  });

  const result = await client.searchTweets('machine learning AI', { maxResults: 100 });
  const tweets = result.data || [];

  // Extract hashtags and capitalized terms
  const terms = new Map();
  tweets.forEach(({ text }) => {
    (text.match(/#\w+/g) || []).forEach(tag => {
      const k = tag.toLowerCase();
      terms.set(k, (terms.get(k) || 0) + 1);
    });
    (text.match(/\b[A-Z]{2,8}\b/g) || []).forEach(abbr => {
      terms.set(abbr, (terms.get(abbr) || 0) + 1);
    });
  });

  const top = Array.from(terms.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log(`Top terms from ${tweets.length} tweets:\n`);
  top.forEach(([term, count]) => console.log(`  ${term}: ${count}`));
})();
