/**
 * 目标账号配置
 * 定义三类需要关注的账号：AI厂商、科技博主、CEO/投资人
 * 请根据实际关注情况更新此配置
 */

module.exports = {
  // AI大模型厂商官方账号
  official: [
    'OpenAI',
    'AnthropicAI', 
    'GoogleAI',
    'Microsoft',
    'cohere',
    'huggingface',
    'stabilityai',
    'midjourney',
    'MetaAI',
    'xai'
  ],
  
  // 头部科技博主、AI领域垂直KOL
  kols: [
    'sama',          // Sam Altman
    'karpathy',      // Andrej Karpathy
    'ylecun',        // Yann LeCun
    'AndrewYNg',     // Andrew Ng
    'swyx',          // Shawn Wang
    'jeremyphoward', // Jeremy Howard
    'ch402',         // 陈沙克
    'dair_aip',      // DAIR.AI
    'emollick',      // Ethan Mollick
    'quantumobile'   // AI研究者
  ],
  
  // AI赛道重要CEO、知名投资人
  leaders: [
    'gdb',           // Garry Tan
    'paulg',         // Paul Graham
    'naval',         // Naval Ravikant
    'cdixon',        // Chris Dixon
    'balajis',       // Balaji Srinivasan
    'eladgil',       // Elad Gil
    'shl',           // Sam Lessin
    'rabois',        // Keith Rabois
    'patrickc',      // Patrick Collison
    'tferriss'       // Tim Ferriss
  ],
  
  // 获取所有账号的用户名列表
  getAllUsernames() {
    return [...this.official, ...this.kols, ...this.leaders];
  },
  
  // 检查用户名是否在目标列表中
  isTargetAccount(username) {
    const allAccounts = this.getAllUsernames();
    return allAccounts.some(account => 
      account.toLowerCase() === username.toLowerCase()
    );
  },
  
  // 根据类型获取账号
  getAccountsByType(type) {
    const types = {
      'official': this.official,
      'kols': this.kols, 
      'leaders': this.leaders,
      'all': this.getAllUsernames()
    };
    
    return types[type] || [];
  }
};