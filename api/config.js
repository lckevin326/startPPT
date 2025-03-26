// 文件路径: /api/config.js
// 这是Vercel serverless API路由

// 导入dotenv来加载环境变量(如果需要)
// 注意：Vercel通常通过管理面板设置环境变量
const dotenv = require('dotenv');

// 尝试加载.env文件(仅在开发环境)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// 导出处理函数
module.exports = (req, res) => {
  // 设置跨域头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 如果是OPTIONS请求(预检)，直接返回200
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只处理GET请求
  if (req.method === 'GET') {
    try {
      // 从环境变量获取配置
      const config = {
        openrouter: {
          apiUrl: process.env.OPENROUTER_API_URL,
          apiKey: process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_MODEL
        }
      };
      
      // 检查是否所有必要的配置都存在
      if (!config.openrouter.apiUrl || !config.openrouter.apiKey || !config.openrouter.model) {
        console.error('缺少必要的环境变量配置');
        return res.status(500).json({ error: '服务器配置错误' });
      }
      
      // 返回配置
      return res.status(200).json(config);
    } catch (error) {
      console.error('获取配置时出错:', error);
      return res.status(500).json({ error: '服务器内部错误' });
    }
  } else {
    // 不支持其他HTTP方法
    return res.status(405).json({ error: '方法不允许' });
  }
};