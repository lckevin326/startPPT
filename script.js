// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async function() {
    // 检查配置是否正确加载
    if (!window.OPENROUTER_CONFIG) {
        alert('配置文件加载失败，请确保config.js文件存在且包含正确的配置信息');
        return;
    }

    // 加载风格列表并初始化选择器
    await loadStyleJSON()
        .then(styles => {
            populateStyleSelector(styles);
        })
        .catch(error => {
            alert('加载风格列表失败: ' + error.message);
        });

    // 初始化主题设置
    initTheme();
    
    // 设置快捷键
    setupEventListeners();

    // 获取DOM元素
    const textInput = document.getElementById('text-input');
    const styleSelector = document.getElementById('style-selector');
    const generateBtn = document.getElementById('generate-btn');
    const previewContent = document.getElementById('preview-content');
    const streamTextArea = document.getElementById('stream-text');

    // 给生成按钮添加点击事件
    generateBtn.addEventListener('click', async () => {
        const text = textInput?.value || '';
        const style = styleSelector?.value || 'beautifulCard';
        
        // 确保用户输入了文本
        if (!text.trim()) {
            alert('请输入内容再生成卡片');
            return;
        }

        // 禁用生成按钮并更改文本
        generateBtn.disabled = true;
        generateBtn.innerText = '生成中...';
        generateBtn.classList.add('bg-gray-400');
        generateBtn.classList.remove('bg-primary-600', 'hover:bg-primary-700');
        generateBtn.style.cursor = 'not-allowed';

        // 重置文本区域
        if (streamTextArea) {
            streamTextArea.innerHTML = '<p>开始生成卡片内容...</p>';
        }
        
        // 重置预览区域
        if (previewContent) {
            previewContent.innerHTML = '';
        }
        
        try {
            // 获取提示模板内容
            const promptTemplate = await loadStyleTemplate();
            if (!promptTemplate) {
                throw new Error('无法加载提示模板');
            }
            
            // 加载风格列表
            const styles = await loadStyleJSON();
            if (!styles) {
                throw new Error('无法加载风格列表');
            }
            
            // 获取风格描述
            const styleDescription = getStyleDescription(style, styles);
            
            // 格式化日期和时间
            const date = getCurrentBeijingDate();
            
            // 创建完整的提示词
            let fullPrompt = promptTemplate
                .replace('{{输入主题}}', text)
                .replace('{{设计风格}}', styleDescription)
                .replace('{{日期}}', date);
            
            // 显示处理状态
            if (streamTextArea) {
                streamTextArea.innerHTML = '<p>构建提示词...</p>';
            }
            
            try {
                // 向OpenRouter API发送请求
                if (streamTextArea) {
                    streamTextArea.innerHTML += `<p>正在处理请求...</p>`;
                    
                    // 构建请求体
                    const requestBody = {
                        model: window.OPENROUTER_CONFIG.MODEL,
                        messages: [
                            {
                                role: 'user',
                                content: fullPrompt
                            }
                        ],
                        max_tokens: 4000,
                        temperature: 0.7,
                        stream: true
                    };
                    
                    // 打印请求信息到控制台
                    // console.log('OpenRouter API请求信息:');
                    // console.log('- URL:', window.OPENROUTER_CONFIG.API_URL);
                    // console.log('- 模型:', window.OPENROUTER_CONFIG.MODEL);
                    // console.log('- 提示词占位符替换:');
                    // console.log('  - 输入主题:', text);
                    // console.log('  - 设计风格:', styleDescription);
                    // console.log('  - 日期:', date);
                    // console.log('- 请求体结构:', JSON.stringify({
                    //     model: requestBody.model,
                    //     messages: [{role: 'user', content: fullPrompt}],
                    //     max_tokens: requestBody.max_tokens,
                    //     temperature: requestBody.temperature,
                    //     stream: requestBody.stream
                    // }, null, 2));
                    
                    const response = await fetch(window.OPENROUTER_CONFIG.API_URL, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${window.OPENROUTER_CONFIG.API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });

                    if (!response.ok) {
                        let errorMessage = `API请求失败: ${response.status} ${response.statusText}`;
                        const responseText = await response.text();
                        
                        try {
                            const errorData = JSON.parse(responseText);
                            errorMessage += ` - ${errorData.error?.message || JSON.stringify(errorData)}`;
                        } catch (e) {
                            errorMessage += ` - 响应内容: ${responseText}`;
                        }
                        throw new Error(errorMessage);
                    }
                    
                    // 流式响应处理
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let partialData = '';
                    let fullResponse = '';
                    
                    // 显示处理状态
                    streamTextArea.innerHTML = `<p>正在接收数据流...</p>`;
                    
                    try {
                        // 读取流数据
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                // 流结束后，显示最终HTML预览
                                displayFinalHTML(fullResponse, document.getElementById('preview-content'), true);
                                break;
                            }
                            
                            const chunk = decoder.decode(value);
                            partialData += chunk;
                            
                            // 处理数据行
                            const lines = partialData.split('\n');
                            partialData = lines.pop() || ''; // 保留最后一个不完整的行
                            
                            for (const line of lines) {
                                if (line.trim() === '') continue;
                                if (!line.startsWith('data:')) continue;
                                
                                const data = line.substring(5).trim();
                                if (data === '[DONE]') continue;
                                
                                try {
                                    const parsedData = JSON.parse(data);
                                    const content = parsedData.choices?.[0]?.delta?.content || '';
                                    
                                    if (content) {
                                        fullResponse += content;
                                        
                                        // 更新流文本区域
                                        if (streamTextArea) {
                                            // 使用转义后的HTML进行显示，避免渲染标签
                                            streamTextArea.innerHTML = `<pre>${escapeHtml(fullResponse)}</pre>`;
                                            streamTextArea.scrollTop = streamTextArea.scrollHeight;
                                        }
                                        
                                        // 在流式生成过程中，只更新流式输出，不更新预览
                                        displayFinalHTML(fullResponse, document.getElementById('preview-content'), false);
                                    }
                                } catch (e) {
                                    // 处理解析错误
                                }
                            }
                        }
                    } catch (streamError) {
                        streamTextArea.innerHTML += `<p style="color: red;">❌ 读取响应流时出错: ${streamError.message}</p>`;
                    }
                    
                    // 恢复按钮状态
                    generateBtn.disabled = false;
                    generateBtn.innerText = '生成卡片';
                    generateBtn.classList.remove('bg-gray-400');
                    generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                    generateBtn.style.cursor = 'pointer';
                }
            } catch (error) {
                streamTextArea.innerHTML += `<p style="color: red;">❌ ${error.message}</p>`;
                
                // 恢复按钮状态
                generateBtn.disabled = false;
                generateBtn.innerText = '生成卡片';
                generateBtn.classList.remove('bg-gray-400');
                generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                generateBtn.style.cursor = 'pointer';
            }
        } catch (error) {
            alert('发生错误: ' + error.message);
            
            // 恢复按钮状态
            generateBtn.disabled = false;
            generateBtn.innerText = '生成卡片';
            generateBtn.classList.remove('bg-gray-400');
            generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
            generateBtn.style.cursor = 'pointer';
        }
    });

    // 添加回车快捷键
    textInput?.addEventListener('keydown', (e) => {
        // Ctrl+Enter 触发生成
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            generateBtn.click();
        }
    });
});

// 显示最终HTML内容
function displayFinalHTML(content, container, isComplete = false) {
    // 尝试从回复内容中提取HTML代码
    let htmlContent = content;
    
    // 尝试提取```html ```或<html></html>之间的内容
    const htmlPattern = /```html\s+([\s\S]*?)\s+```|<html[\s\S]*?>([\s\S]*?)<\/html>/i;
    const match = content.match(htmlPattern);
    
    if (match) {
        // 使用第一个非空的捕获组
        htmlContent = match[1] || match[2] || content;
    }
    
    // 获取流式输出和预览元素
    const streamTextArea = document.getElementById('stream-text');
    const previewContent = document.getElementById('preview-content');
    
    // 如果是流式生成中，只显示流式输出，隐藏预览
    if (!isComplete) {
        if (streamTextArea) streamTextArea.style.display = 'block';
        if (previewContent) previewContent.style.display = 'none';
        return;
    }
    
    // 生成完成后，隐藏流式输出，显示预览
    if (streamTextArea) streamTextArea.style.display = 'none';
    if (previewContent) previewContent.style.display = 'block';
    
    // 清空预览容器
    if (container) {
        container.innerHTML = '';
        
        // 创建iframe以安全地渲染HTML
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '500px';
        iframe.style.border = 'none';
        iframe.style.background = 'transparent';
        
        // 添加iframe到预览容器
        container.appendChild(iframe);
        
        // 为iframe写入内容
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        
        // 自动调整iframe高度
        setTimeout(() => {
            try {
                const height = iframeDoc.body.scrollHeight;
                iframe.style.height = (height + 20) + 'px';
            } catch (e) {
                // 处理高度调整错误
            }
        }, 100);
        
        // 同步iframe的主题
        updateIframeTheme(iframe);
    }
}

// 加载style.json文件的内容
async function loadStyleJSON() {
    try {
        const response = await fetch('prompt/beautifulCard/style.json');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw new Error('加载风格列表失败: ' + error.message);
    }
}

// 填充风格选择器
function populateStyleSelector(styles) {
    const styleSelector = document.getElementById('style-selector');
    if (!styleSelector || !styles) return;
    
    // 清空选择器
    styleSelector.innerHTML = '';
    
    // 添加风格选项
    styles.forEach(style => {
        const option = document.createElement('option');
        option.value = style.style;  
        option.textContent = style.style;  
        styleSelector.appendChild(option);
    });
}

// 获取指定风格的描述
function getStyleDescription(styleName, styles) {
    if (!styles || !styleName) return "无";
    const style = styles.find(s => s.style === styleName);
    return style ? style.description : "无";
}

// 加载style.txt模板
async function loadStyleTemplate() {
    try {
        const response = await fetch('prompt/beautifulCard/style.txt');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const text = await response.text();
        return text;
    } catch (error) {
        throw new Error('加载提示模板失败: ' + error.message);
    }
}

// 获取当前北京时间 (yyyy-MM-dd 格式)
function getCurrentBeijingDate() {
    const now = new Date();
    const utc8Date = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    
    const year = utc8Date.getUTCFullYear();
    const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utc8Date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// 添加主题切换功能
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// 初始化主题设置
function initTheme() {
    // 检查本地存储
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    // 设置初始主题
    if (darkMode) {
        document.documentElement.classList.add('dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
    } else {
        document.documentElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 主题切换按钮事件
    themeToggle?.addEventListener('click', toggleTheme);
    
    // 添加Alt+T快捷键
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

// 切换主题
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
        html.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
    } else {
        html.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
        if (themeIcon) themeIcon.textContent = 'light_mode';
    }
    
    // 更新所有iframe的主题
    document.querySelectorAll('iframe').forEach(iframe => {
        updateIframeTheme(iframe);
    });
}

// 更新iframe主题
function updateIframeTheme(iframe) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const isDark = document.documentElement.classList.contains('dark');
        
        // 更新iframe的类
        if (isDark) {
            iframeDoc.documentElement.classList.add('dark');
        } else {
            iframeDoc.documentElement.classList.remove('dark');
        }
        
        // 尝试添加或更新CSS变量
        let style = iframeDoc.getElementById('theme-vars');
        if (!style) {
            style = iframeDoc.createElement('style');
            style.id = 'theme-vars';
            iframeDoc.head.appendChild(style);
        }
        
        // 设置基本的亮/暗模式变量
        style.textContent = isDark ? 
            `:root {
                --bg-color: #1f2937;
                --text-color: #f3f4f6;
                --border-color: #4b5563;
                --card-bg: #374151;
            }` : 
            `:root {
                --bg-color: #ffffff;
                --text-color: #1f2937;
                --border-color: #e5e7eb;
                --card-bg: #f9fafb;
            }`;
    } catch (e) {
        // iframe可能尚未加载完成，忽略错误
    }
}

// HTML转义函数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
