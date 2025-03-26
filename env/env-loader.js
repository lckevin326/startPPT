// 环境变量加载器
// 该文件负责从服务器安全地获取配置信息并提供给应用程序使用

(function() {
    // 初始化配置对象
    window.OPENROUTER_CONFIG = {};

    // 从API获取配置
    // 这是安全的方式，服务器会处理环境变量并只返回前端需要的信息
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
                
                console.log('配置加载完成');
            } else {
                throw new Error('配置格式不正确');
            }
        })
        .catch(error => {
            console.error('加载配置时出错:', error);
            alert('无法加载应用配置，请确保服务器正常运行并配置了正确的环境变量');
        });
})();
