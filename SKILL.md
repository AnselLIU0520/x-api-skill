---
name: x-api
description: Lightweight X (Twitter) API v2 client with proxy support and rate limiting. Search tweets, get user profiles, fetch timelines. Works on Windows/macOS/Linux.
user-invocable: true
version: 1.1.0
author: OpenClaw Community
license: MIT
---

# x-api Skill

## Quick Start

```bash
cd skills/x-api && npm install
cp .env.example .env   # set X_BEARER_TOKEN
node scripts/quick_test.js
```

## Usage

```javascript
require('dotenv').config();
const XAPIClient = require('./lib/client');

const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  proxy: process.env.HTTPS_PROXY  // optional
});

const result = await client.searchTweets('AI', { maxResults: 10 });
```

## Proxy

Set `HTTPS_PROXY` in `.env`, or enable TUN mode in your proxy client.

## Files

```
x-api/
├── lib/client.js              # Core API client
├── scripts/
│   ├── quick_test.js          # Quick connection test
│   └── test_connection.js     # Full connectivity test
├── examples/
│   ├── monitor.js             # Monitor keywords
│   ├── analyze.js             # Analyze accounts
│   └── extract.js             # Extract terms/hashtags
├── .env.example               # Credential template
├── README.md                  # English docs
└── README_CN.md               # Chinese docs
```

## Security

- Never hardcode credentials — use `.env` or environment variables
- `.env` is in `.gitignore` by default
- Rotate tokens regularly at developer.x.com
