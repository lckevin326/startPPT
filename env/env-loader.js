// 环境变量加载器
// 该文件支持两种配置模式：本地模式和服务器模式

(function() {
    // 初始化配置对象 - 如果配置已经存在，说明config.js已加载
    window.OPENROUTER_CONFIG = window.OPENROUTER_CONFIG || {};

    // 检查是否在服务器环境（通过检查config.js是否已经设置了有效配置）
    const isServerEnvironment = !window.OPENROUTER_CONFIG.API_URL;
    
    // 自动判断配置模式：如果config.js已加载有效配置则使用本地模式，否则使用服务器模式
    // 也可以手动切换：local（本地模式）或server（服务器模式）
    const configMode = isServerEnvironment ? 'server' : 'local';
    
    console.log(`配置模式: ${configMode} (${isServerEnvironment ? '自动检测为服务器环境' : '自动检测为本地环境'})`);
    
    if (configMode === 'local') {
        // 本地模式：使用config.js中的配置
        console.log('使用本地配置');
    } else {
        // 服务器模式：从API获取配置
        console.log('使用服务器API配置');
        // 清空可能已存在的本地配置
        window.OPENROUTER_CONFIG = {};
        
        // 从API获取配置
        fetch('/api/config')
            .then(response => {
                if (!response.ok) {
                    console.error('无法从服务器获取配置信息');
                    throw new Error('配置加载失败');
                }
                return response.json();
            })
            .then(config => {
                // 设置OpenRouter配置
                if (config.openrouter) {
                    window.OPENROUTER_CONFIG.API_URL = config.openrouter.apiUrl;
                    window.OPENROUTER_CONFIG.API_KEY = config.openrouter.apiKey;
                    window.OPENROUTER_CONFIG.MODEL = config.openrouter.model;
                    
                    console.log('服务器配置加载完成');
                } else {
                    throw new Error('配置格式不正确');
                }
            })
            .catch(error => {
                console.error('加载配置时出错:', error);
                alert('无法加载服务器配置，请确保服务器正常运行并配置了正确的环境变量');
            });
    }
})();
