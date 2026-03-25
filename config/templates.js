/**
 * 内容模板配置
 * 用于生成原创推文和评论
 */

module.exports = {
  // 原创推文模板（必须以问句结尾）
  originalTweets: [
    "Today's {topic} developments suggest {insight}. What's the most underrated implication for {sector}?",
    "Noticed {trend} accelerating across multiple sources. How does this change the {domain} landscape?",
    "The convergence of {tech1} and {tech2} is creating new opportunities in {field}. Who's best positioned to capture this?",
    "{Event} highlights the growing importance of {factor}. What barriers remain for wider adoption?",
    "Analysis of recent {industry} moves reveals {pattern}. What's the smartest play for startups right now?",
    "Observing shifts in {market}: {observation}. Which approach will prove most resilient?",
    "The debate around {issue} often misses {perspective}. What's the most constructive way forward?",
    "Data shows {finding} in {context}. How should this inform strategy for {audience}?",
    "Comparing {approach1} vs {approach2} for {goal}. What are the trade-offs decision-makers should consider?",
    "The evolution of {technology} is entering {phase}. What capabilities will differentiate leaders?"
  ],
  
  // 评论模板（简短、贴合、体现行业视角）
  commentTemplates: [
    "Interesting perspective. How do you see this impacting adoption timelines?",
    "This aligns with what we're seeing. The key question is scalability.",
    "Good point about this approach. The regulatory angle is often overlooked.",
    "The engagement metric here is telling. Would be curious about long-term trends.",
    "This raises important questions about implications. Market readiness is key.",
    "Appreciate the focus on this aspect. Implementation details will be critical.",
    "Helpful breakdown. The user experience dimension deserves more attention.",
    "Agree with this direction. Cross-functional alignment is often the hardest part.",
    "Valuable insights. The talent development piece is equally important.",
    "Well articulated. The ecosystem effects could be significant."
  ],
  
  // 话题填充词
  topicWords: {
    topics: [
      'AI/LLM',
      'generative AI', 
      'machine learning',
      'AI infrastructure',
      'AI applications',
      'model development',
      'AI research',
      'industry adoption',
      'startup ecosystem',
      'investment landscape'
    ],
    
    insights: [
      'accelerating innovation',
      'converging technologies',
      'increasing specialization',
      'growing maturity',
      'expanding use cases',
      'evolving standards',
      'shifting priorities',
      'emerging patterns',
      'changing dynamics',
      'maturing ecosystems'
    ],
    
    sectors: [
      'enterprise technology',
      'startup innovation',
      'research community',
      'developer tools',
      'product strategy',
      'investment thesis',
      'talent development',
      'policy framework',
      'market dynamics',
      'competitive landscape'
    ],
    
    trends: [
      'integration of AI tools',
      'automation adoption',
      'data quality focus',
      'model optimization',
      'edge deployment',
      'multimodal approaches',
      'agentic systems',
      'personalization at scale',
      'responsible AI',
      'open source collaboration'
    ]
  },
  
  // 工具方法
  getRandomOriginalTweet() {
    const template = this.originalTweets[Math.floor(Math.random() * this.originalTweets.length)];
    return this.fillTemplate(template);
  },
  
  getRandomComment() {
    return this.commentTemplates[Math.floor(Math.random() * this.commentTemplates.length)];
  },
  
  fillTemplate(template) {
    return template
      .replace('{topic}', this.getRandomWord(this.topicWords.topics))
      .replace('{insight}', this.getRandomWord(this.topicWords.insights))
      .replace('{sector}', this.getRandomWord(this.topicWords.sectors))
      .replace('{trend}', this.getRandomWord(this.topicWords.trends))
      .replace('{domain}', this.getRandomWord(this.topicWords.sectors))
      .replace('{tech1}', 'AI')
      .replace('{tech2}', this.getRandomWord(['automation', 'data', 'cloud', 'edge', 'IoT']))
      .replace('{field}', this.getRandomWord(this.topicWords.sectors))
      .replace('{Event}', this.getRandomWord(['Recent developments', 'Industry announcements', 'Platform updates']))
      .replace('{factor}', this.getRandomWord(['integration', 'usability', 'scalability', 'security']))
      .replace('{industry}', 'tech')
      .replace('{pattern}', this.getRandomWord(this.topicWords.insights))
      .replace('{market}', this.getRandomWord(this.topicWords.sectors))
      .replace('{observation}', this.getRandomWord(this.topicWords.insights))
      .replace('{issue}', this.getRandomWord(['adoption', 'regulation', 'ethics', 'talent']))
      .replace('{perspective}', this.getRandomWord(['implementation', 'scaling', 'sustainability']))
      .replace('{finding}', this.getRandomWord(this.topicWords.insights))
      .replace('{context}', this.getRandomWord(this.topicWords.sectors))
      .replace('{audience}', this.getRandomWord(['enterprises', 'startups', 'developers', 'investors']))
      .replace('{approach1}', this.getRandomWord(['centralized', 'open', 'proprietary']))
      .replace('{approach2}', this.getRandomWord(['decentralized', 'closed', 'collaborative']))
      .replace('{goal}', this.getRandomWord(['adoption', 'innovation', 'scaling']))
      .replace('{technology}', this.getRandomWord(this.topicWords.topics))
      .replace('{phase}', this.getRandomWord(['maturation', 'expansion', 'specialization']));
  },
  
  getRandomWord(wordList) {
    return wordList[Math.floor(Math.random() * wordList.length)];
  },
  
  // 确保以问句结尾
  ensureQuestionEnding(text) {
    const trimmed = text.trim();
    if (!trimmed.endsWith('?')) {
      return trimmed + '?';
    }
    return trimmed;
  }
};