// Test API connectivity and auth — run with: node scripts/test_connection.js
require('dotenv').config();
const XAPIClient = require('../lib/client');

(async () => {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) { console.error('X_BEARER_TOKEN not set'); process.exit(1); }

  const client = new XAPIClient({ bearerToken: token, proxy: process.env.HTTPS_PROXY });

  const tests = [
    { name: 'Search tweets', fn: () => client.searchTweets('AI', { maxResults: 10 }) },
    { name: 'Get user', fn: () => client.getUserByUsername('OpenAI') }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${t.name}: ${err.message}`);
    }
    await client.sleep();
  }

  console.log(`\n${passed}/${tests.length} tests passed`);
  process.exit(passed === tests.length ? 0 : 1);
})();
