/**
 * 搜索关键词配置
 * 固定复用，不随意扩展，避免过载
 */

module.exports = {
  // 中文关键词
  chinese: [
    'AI大模型',
    'AGI',
    'LLM', 
    'GPT',
    'AI创业',
    'AI融资',
    '大模型更新',
    'AI政策',
    'AIGC',
    '大模型技术进展',
    '生成式AI',
    '人工智能',
    '机器学习',
    '深度学习',
    '自然语言处理'
  ],
  
  // 英文关键词
  english: [
    'AI',
    'artificial intelligence',
    'machine learning',
    'deep learning',
    'large language model',
    'generative AI',
    'AI startup',
    'AI funding',
    'AI investment',
    'AI research',
    'AI development',
    'AI technology',
    'AI innovation',
    'AI applications',
    'AI future'
  ],
  
  // 组合关键词（用于高级搜索）
  combined: [
    'AI model training',
    'AI model deployment',
    'AI business applications',
    'AI industry trends',
    'AI market analysis',
    'AI competitive landscape',
    'AI adoption challenges',
    'AI implementation strategies',
    'AI ROI measurement',
    'AI ethical considerations'
  ],
  
  // 获取所有关键词
  getAllKeywords() {
    return [...this.chinese, ...this.english, ...this.combined];
  },
  
  // 获取随机关键词（用于避免重复搜索）
  getRandomKeywords(count = 5) {
    const allKeywords = this.getAllKeywords();
    const shuffled = [...allKeywords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },
  
  // 根据语言获取关键词
  getKeywordsByLanguage(lang) {
    const languages = {
      'zh': this.chinese,
      'en': this.english,
      'all': this.getAllKeywords()
    };
    
    return languages[lang] || this.english;
  },
  
  // 构建搜索查询
  buildSearchQuery(keywords, options = {}) {
    const {
      language = 'en',
      excludeRetweets = true,
      excludeReplies = false,
      fromAccounts = []
    } = options;
    
    let queryParts = [];
    
    // 添加关键词
    if (Array.isArray(keywords)) {
      queryParts.push(`(${keywords.join(' OR ')})`);
    } else {
      queryParts.push(keywords);
    }
    
    // 语言过滤
    if (language) {
      queryParts.push(`lang:${language}`);
    }
    
    // 排除转推
    if (excludeRetweets) {
      queryParts.push('-is:retweet');
    }
    
    // 排除回复
    if (excludeReplies) {
      queryParts.push('-is:reply');
    }
    
    // 指定账号
    if (fromAccounts.length > 0) {
      const accountQueries = fromAccounts.map(account => `from:${account}`);
      queryParts.push(`(${accountQueries.join(' OR ')})`);
    }
    
    return queryParts.join(' ');
  }
};