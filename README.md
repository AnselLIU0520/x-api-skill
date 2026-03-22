# x-api-skill for OpenClaw

Search tweets, monitor keywords, and analyze X (Twitter) accounts — directly from your OpenClaw assistant.

[中文文档](README_CN.md)

---

## What You Can Do

- **Search tweets** — find recent posts by keyword, hashtag, or phrase
- **Monitor accounts** — get follower counts, engagement metrics, recent posts
- **Extract trends** — pull top hashtags and terms from any topic
- **Build pipelines** — use tweet data as input for summaries, translations, or analysis

---

## Step 1: Get X API Access

You need a free X Developer account to use this skill.

### 1.1 Apply for Developer Access

1. Go to [developer.x.com](https://developer.x.com) and sign in with your X account
2. Click **"Sign up"** → select **"Free"** tier (sufficient for reading tweets)
3. Fill in the use case form — describe what you want to build (e.g. "personal research tool to monitor AI topics")
4. Submit and wait for approval (usually instant for free tier)

### 1.2 Create a Project and App

1. In the Developer Portal, go to **Projects & Apps** → **New Project**
2. Give it a name (e.g. "OpenClaw Research")
3. Select **"Exploring the API"** as your use case
4. Create a new App inside the project

### 1.3 Get Your Bearer Token

1. Inside your App, go to **"Keys and Tokens"** tab
2. Under **"Bearer Token"**, click **"Generate"** (or **"Regenerate"** if one exists)
3. **Copy the token immediately** — it won't be shown again
4. Store it somewhere safe (password manager recommended)

> ⚠️ Never share your Bearer Token. It grants read access to the X API under your account.

---

## Step 2: Install the Skill

### Prerequisites

- **Node.js 18+** — check with `node --version`
  - Windows: download from [nodejs.org](https://nodejs.org) or run `winget install OpenJS.NodeJS`
  - macOS: `brew install node` or download from [nodejs.org](https://nodejs.org)
  - Linux: `sudo apt install nodejs npm` (Ubuntu/Debian) or `sudo dnf install nodejs` (Fedora)

### Install

**Windows (PowerShell):**
```powershell
cd $env:USERPROFILE\.openclaw\workspace\skills\x-api
npm install
```

**macOS / Linux:**
```bash
cd ~/.openclaw/workspace/skills/x-api
npm install
```

---

## Step 3: Configure Your Token

Create a `.env` file in the skill directory:

**Windows (PowerShell):**
```powershell
cd $env:USERPROFILE\.openclaw\workspace\skills\x-api
Copy-Item .env.example .env
notepad .env
```

**macOS / Linux:**
```bash
cd ~/.openclaw/workspace/skills/x-api
cp .env.example .env
nano .env   # or: open -e .env (macOS), gedit .env (Linux)
```

Edit the file and set your token:
```
X_BEARER_TOKEN=your_bearer_token_here
```

Save and close.

---

## Step 4: Test the Connection

```bash
node scripts/quick_test.js
```

Expected output:
```
Testing X API connection...
✅ Connected — got 10 tweets
Sample: OpenAI just released...
```

If it fails, see [Troubleshooting](#troubleshooting) below.

---

## Step 5: Run Examples

### Monitor keywords — find top tweets on a topic
```bash
node examples/monitor.js
```
Searches for `AI`, `LLM`, `machine learning` and prints the most-liked tweets.

To customize keywords, edit `examples/monitor.js`:
```javascript
const KEYWORDS = ['your', 'keywords', 'here'];
const MIN_LIKES = 50;  // minimum likes threshold
```

### Analyze accounts — get follower and engagement stats
```bash
node examples/analyze.js
```
Prints follower count and average likes for `@OpenAI`, `@AnthropicAI`, `@GoogleAI`.

To analyze different accounts, edit `examples/analyze.js`:
```javascript
const ACCOUNTS = ['elonmusk', 'sama', 'karpathy'];
```

### Extract terms — pull trending hashtags and abbreviations
```bash
node examples/extract.js
```
Searches tweets about `machine learning AI` and lists the top 20 recurring terms and hashtags.

---

## Using This Skill with OpenClaw

Once installed, you can ask your OpenClaw assistant to use this skill in natural language. No coding required.

### How It Works

OpenClaw reads the `SKILL.md` file to understand what this skill does, then calls the appropriate scripts when you ask for something related to X/Twitter data.

### Example Prompts

**Search and summarize:**
> "Search for the latest tweets about GPT-5 and give me a summary"

> "What are people saying about the stock market crash today on X?"

> "Find the top 5 most-liked tweets about Anthropic this week"

**Monitor accounts:**
> "What has @OpenAI tweeted recently?"

> "Compare the follower counts of @OpenAI, @AnthropicAI, and @GoogleAI"

> "Show me @karpathy's latest tweets"

**Extract trends:**
> "What hashtags are trending in the AI space right now?"

> "Extract the most common terms from recent tweets about crypto"

**Build vocabulary / research:**
> "Search tweets from tech influencers and extract English terms I should learn"

> "Find tweets about machine learning and list the technical jargon used"

### Setting Up Credentials in OpenClaw

The easiest way is to tell your assistant directly (in your private main session):

> "Remember my X API Bearer Token: [your token]"

Your assistant will store it in memory and use it automatically when running this skill. Alternatively, set it in the `.env` file as described in Step 3.

### Skill Location

OpenClaw looks for skills in:
- **Windows:** `%USERPROFILE%\.openclaw\workspace\skills\x-api\`
- **macOS/Linux:** `~/.openclaw/workspace/skills/x-api/`

Make sure `SKILL.md` is present in the root of the skill directory — that's what OpenClaw reads to discover the skill.

---

## Use in Your Own Scripts

```javascript
require('dotenv').config();
const XAPIClient = require('./lib/client');

const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  proxy: process.env.HTTPS_PROXY  // optional, see Proxy section
});

// Search tweets
const result = await client.searchTweets('ChatGPT', { maxResults: 100 });
result.data.forEach(t => console.log(t.text));

// Get a user's profile
const { data: user } = await client.getUserByUsername('OpenAI');
console.log(`Followers: ${user.public_metrics.followers_count}`);

// Get a user's recent tweets
const tweets = await client.getUserTweets(user.id, { maxResults: 20 });
```

### Full API Reference

#### `searchTweets(query, options)`
Search recent tweets (last 7 days).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxResults` | number | 10 | Results per request (10–100) |
| `fields` | string | `text,created_at,public_metrics,author_id` | Tweet fields to return |
| `sinceId` | string | — | Only return tweets newer than this ID |

#### `getUserByUsername(username)`
Get a user's profile. Returns name, bio, follower count, verified status.

#### `getUserTweets(userId, options)`
Get a user's recent tweets (excludes retweets and replies).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxResults` | number | 10 | Results per request (5–100) |

#### `getTweet(tweetId)`
Get a single tweet by ID.

#### `sleep(ms?)`
Wait between requests. Default: 1200ms. Use to avoid rate limits in loops.

---

## Proxy Setup

If `api.twitter.com` is blocked on your network (e.g. mainland China), you need a proxy.

**Option A — TUN mode (recommended):** Enable TUN/virtual NIC mode in your proxy client (Clash, Mihomo, etc.). No configuration needed — all traffic is routed automatically.

**Option B — HTTP proxy via env var:**
```
# .env
HTTPS_PROXY=http://127.0.0.1:<your_proxy_port>
```

To find your proxy port: check your proxy client's settings (usually labeled "HTTP Port" or "Mixed Port").

---

## Rate Limits

X API free tier limits:

| What | Limit |
|------|-------|
| Tweets read | 500,000 / month |
| Search requests | ~1 req/sec |
| User lookups | 300 / 15 min |

The client adds a **1200ms delay** between requests by default. To change it:
```javascript
const client = new XAPIClient({
  bearerToken: process.env.X_BEARER_TOKEN,
  delayMs: 2000  // 2 seconds between requests
});
```

---

## Troubleshooting

**`Error: X_BEARER_TOKEN not set`**
→ Make sure `.env` exists in the skill directory and contains your token.

**`HTTP 401`**
→ Token is invalid or expired. Go to developer.x.com → your App → Keys and Tokens → Regenerate Bearer Token.

**`HTTP 429`**
→ Rate limit hit. Increase `delayMs` or reduce `maxResults`.

**Connection timeout / socket hang up**
→ Your network blocks `api.twitter.com`. Set up a proxy (see [Proxy Setup](#proxy-setup)).

**`Cannot find module 'https-proxy-agent'`**
→ Run `npm install` in the skill directory.

---

## Security

- `.env` is listed in `.gitignore` — your token won't be committed to Git
- Never paste your Bearer Token in chat, code comments, or public files
- Rotate your token periodically at developer.x.com
- The free tier is read-only — this skill cannot post tweets

---

## License

MIT
