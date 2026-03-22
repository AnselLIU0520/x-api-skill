// Quick connection test — run with: node scripts/quick_test.js
require('dotenv').config();
const XAPIClient = require('../lib/client');

const token = process.env.X_BEARER_TOKEN;
if (!token) {
  console.error('Error: X_BEARER_TOKEN not set');
  console.error('Create a .env file: X_BEARER_TOKEN=your_token_here');
  process.exit(1);
}

(async () => {
  const client = new XAPIClient({
    bearerToken: token,
    proxy: process.env.HTTPS_PROXY
  });

  console.log('Testing X API connection...');
  try {
    const result = await client.searchTweets('OpenAI', { maxResults: 10 });
    console.log(`✅ Connected — got ${result.data?.length || 0} tweets`);
    if (result.data?.[0]) console.log('Sample:', result.data[0].text.substring(0, 100));
  } catch (err) {
    console.error('❌ Failed:', err.message);
    if (err.status === 401) console.error('   → Check your Bearer Token');
    if (err.message.includes('timeout')) console.error('   → Check proxy/network settings');
  }
})();
