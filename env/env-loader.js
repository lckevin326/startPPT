// 环境变量加载器
// 该文件负责从.env文件加载配置并提供给应用程序使用

(function() {
    // 初始化配置对象
    window.OPENROUTER_CONFIG = {};

    // 从.env文件获取配置
    // 注意：这里使用异步方式获取.env文件内容，但由于网页环境限制，实际获取可能有限制
    // 在生产环境中，通常由服务器端处理.env文件并注入配置
    fetch('/env/.env')
        .then(response => {
            if (!response.ok) {
                console.error('无法加载.env文件，请确保.env文件存在并包含必要的配置');
                throw new Error('无法加载.env文件');
            }
            return response.text();
        })
        .then(envContent => {
            // 解析.env文件内容
            const envVars = parseEnvFile(envContent);
            
            // 设置配置
            window.OPENROUTER_CONFIG.API_URL = envVars.OPENROUTER_API_URL;
            window.OPENROUTER_CONFIG.API_KEY = envVars.OPENROUTER_API_KEY;
            window.OPENROUTER_CONFIG.MODEL = envVars.OPENROUTER_MODEL;
            
            console.log('环境变量加载完成');
        })
        .catch(error => {
            console.error('加载环境变量时出错:', error);
            alert('无法加载环境变量配置，请确保.env文件存在并包含必要的配置');
        });
    
    // 解析.env文件内容的辅助函数
    function parseEnvFile(content) {
        const result = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            // 忽略注释和空行
            if (line.trim().startsWith('#') || !line.trim()) {
                continue;
            }
            
            // 查找第一个等号位置
            const equalPos = line.indexOf('=');
            if (equalPos === -1) continue;
            
            // 提取键和值
            const key = line.substring(0, equalPos).trim();
            let value = line.substring(equalPos + 1).trim();
            
            // 如果值被引号包围，移除引号
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            
            result[key] = value;
        }
        
        return result;
    }
})();
