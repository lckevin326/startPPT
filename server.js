const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 引入dotenv模块加载环境变量
try {
    require('dotenv').config({ path: path.join(__dirname, 'env', '.env') });
} catch (err) {
    console.error('dotenv模块未安装或环境变量加载失败，请运行 npm install dotenv');
    console.error('确保在env/.env文件中设置了必要的环境变量');
}

// 端口配置
const PORT = 3000;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 解析请求URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 默认加载index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // 处理API配置请求 - 安全地返回前端需要的配置
    if (pathname === '/api/config') {
        handleConfigRequest(req, res);
        return;
    }
    
    // 如果是以/generate开头的请求，这是模拟的API端点
    if (pathname.startsWith('/generate')) {
        handleGenerateRequest(req, res, parsedUrl);
        return;
    }
    
    // 获取文件的绝对路径
    const filePath = path.join(__dirname, pathname);
    
    // 获取文件扩展名
    const extname = path.extname(filePath);
    
    // 设置默认的MIME类型
    let contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found');
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // 成功响应
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 处理生成卡片的API请求
function handleGenerateRequest(req, res, parsedUrl) {
    // 解析查询参数
    const queryParams = new URLSearchParams(parsedUrl.query);
    const topic = queryParams.get('topic') || '';
    const requirement = queryParams.get('requirement') || '';
    const points = queryParams.get('points') || '';
    
    console.log(`接收到生成请求: 主题=${topic}, 需求=${requirement}, 要点=${points}`);
    
    // 设置SSE头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    
    // 模拟流式输出
    let i = 0;
    const tokens = [
        "我正在思考如何为您生成一个关于 ",
        topic,
        " 的卡片。\n\n",
        "您的需求是: ",
        requirement,
        "\n\n首先，我会分析关键要点:\n",
        points ? points : "- 这是自动生成的要点1\n- 这是自动生成的要点2\n- 这是自动生成的要点3",
        "\n\n正在生成HTML模板...\n",
        "添加样式...\n",
        "优化布局...\n",
        "完成！以下是生成的卡片HTML代码:\n\n",
        "```html\n<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>" + topic + " 卡片</title>\n  <style>\n    body {\n      font-family: 'Inter', sans-serif;\n      line-height: 1.5;\n      color: #333;\n      background-color: #f9f9f9;\n      margin: 0;\n      padding: 0;\n    }\n    .card {\n      max-width: 500px;\n      margin: 40px auto;\n      background: white;\n      border-radius: 12px;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.1);\n      overflow: hidden;\n    }\n    .card-header {\n      background: linear-gradient(135deg, #3b82f6, #2563eb);\n      color: white;\n      padding: 20px;\n      font-weight: 600;\n      font-size: 24px;\n    }\n    .card-body {\n      padding: 24px;\n    }\n    .card-points {\n      margin: 20px 0;\n    }\n    .card-points li {\n      margin-bottom: 12px;\n      position: relative;\n      padding-left: 24px;\n    }\n    .card-points li:before {\n      content: '';\n      width: 8px;\n      height: 8px;\n      background: #3b82f6;\n      border-radius: 50%;\n      position: absolute;\n      left: 0;\n      top: 8px;\n    }\n    .card-footer {\n      background: #f1f5f9;\n      padding: 15px 24px;\n      font-size: 14px;\n      color: #64748b;\n      text-align: center;\n    }\n    @media (prefers-color-scheme: dark) {\n      body {\n        background-color: #121212;\n        color: #e0e0e0;\n      }\n      .card {\n        background: #1e1e1e;\n      }\n      .card-header {\n        background: linear-gradient(135deg, #1d4ed8, #1e40af);\n      }\n      .card-footer {\n        background: #262626;\n        color: #9ca3af;\n      }\n    }\n  </style>\n</head>\n<body>\n  <div class=\"card\">\n    <div class=\"card-header\">\n      " + topic + "\n    </div>\n    <div class=\"card-body\">\n      <p>" + requirement + "</p>\n      <ul class=\"card-points\">\n" + (points ? points.split('\n').map(point => `        <li>${point.trim().replace(/^[-*]\s*/, '')}</li>`).join('\n') : "        <li>这是自动生成的要点1</li>\n        <li>这是自动生成的要点2</li>\n        <li>这是自动生成的要点3</li>") + "\n      </ul>\n    </div>\n    <div class=\"card-footer\">\n      由AI智能生成 - " + new Date().toLocaleDateString() + "\n    </div>\n  </div>\n</body>\n</html>\n```"
    ];
    
    const interval = setInterval(() => {
        if (i < tokens.length) {
            // 发送当前token
            res.write(`data: ${JSON.stringify({ content: tokens[i] })}\n\n`);
            i++;
        } else {
            // 发送结束事件
            res.write(`event: end\ndata: ${JSON.stringify({ content: tokens.join('') })}\n\n`);
            clearInterval(interval);
            res.end();
        }
    }, 300);
    
    // 客户端关闭连接时清除interval
    req.on('close', () => {
        clearInterval(interval);
    });
}

// 处理API配置请求
function handleConfigRequest(req, res) {
    // 安全地返回前端需要的配置
    const config = {
        // OpenRouter配置
        openrouter: {
            apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
            apiKey: process.env.OPENROUTER_API_KEY || '',
            model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free'
        }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
}

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`在浏览器中访问上面的地址来查看卡片生成器应用`);
});
