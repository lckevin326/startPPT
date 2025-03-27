// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async function() {
    // 检查配置是否正确加载
    if (!window.OPENROUTER_CONFIG) {
        alert('配置文件加载失败，请确保config.js文件存在且包含正确的配置信息');
        return;
    }

    // 全局状态变量
    window.appState = {
        isGenerating: false,    // 是否正在生成内容
        hasGeneratedContent: false,  // 是否已经生成了内容
        currentStylePreview: null  // 当前预览的风格
    };

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
    const styleGrid = document.getElementById('style-grid');
    const generateBtn = document.getElementById('generate-btn');
    const previewContent = document.getElementById('preview-content');
    const streamTextArea = document.getElementById('stream-text');

    // 给生成按钮添加点击事件
    generateBtn.addEventListener('click', async () => {
        const text = textInput?.value || '';
        const style = getSelectedStyle();
        
        // 确保用户输入了文本
        if (!text.trim()) {
            alert('请输入内容再生成卡片');
            return;
        }

        // 设置生成状态
        window.appState.isGenerating = true;
        window.appState.hasGeneratedContent = false;

        // 禁用生成按钮并更改文本
        generateBtn.disabled = true;
        generateBtn.innerText = '生成中...';
        generateBtn.classList.add('bg-gray-400');
        generateBtn.classList.remove('bg-primary-600', 'hover:bg-primary-700');
        generateBtn.style.cursor = 'not-allowed';

        // 重置文本区域
        if (streamTextArea) {
            streamTextArea.innerHTML = '<p>开始生成卡片内容...</p>';
            streamTextArea.style.display = 'block';
        }
        
        // 隐藏预览区域
        if (previewContent) {
            previewContent.style.display = 'none';
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
                                
                                // 更新生成状态
                                window.appState.isGenerating = false;
                                window.appState.hasGeneratedContent = true;
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
                        streamTextArea.innerHTML += `<p style="color: red;">❌ 流式处理错误: ${streamError.message}</p>`;
                        
                        // 恢复按钮状态和应用状态
                        generateBtn.disabled = false;
                        generateBtn.innerText = '生成卡片';
                        generateBtn.classList.remove('bg-gray-400');
                        generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                        generateBtn.style.cursor = 'pointer';
                        
                        // 重置生成状态
                        window.appState.isGenerating = false;
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
                
                // 恢复按钮状态和应用状态
                generateBtn.disabled = false;
                generateBtn.innerText = '生成卡片';
                generateBtn.classList.remove('bg-gray-400');
                generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                generateBtn.style.cursor = 'pointer';
                
                // 重置生成状态
                window.appState.isGenerating = false;
            }
        } catch (error) {
            alert('发生错误: ' + error.message);
            
            // 恢复按钮状态和应用状态
            generateBtn.disabled = false;
            generateBtn.innerText = '生成卡片';
            generateBtn.classList.remove('bg-gray-400');
            generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
            generateBtn.style.cursor = 'pointer';
            
            // 重置生成状态
            window.appState.isGenerating = false;
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
    // 获取流式输出和预览元素
    const streamTextArea = document.getElementById('stream-text');
    const previewContent = document.getElementById('preview-content');
    
    // 如果是流式生成中，只显示流式输出，隐藏预览
    if (!isComplete) {
        if (streamTextArea) streamTextArea.style.display = 'block';
        if (previewContent) previewContent.style.display = 'none';
        return;
    }
    
    // 尝试从回复内容中提取HTML代码
    let htmlContent = content;
    
    // 尝试提取```html ```或<html></html>之间的内容
    const htmlRegex = /```html\s+([\s\S]*?)\s+```|<html[\s\S]*?>([\s\S]*?)<\/html>/i;
    const match = content.match(htmlRegex);
    
    if (match) {
        // 使用第一个非空的捕获组
        htmlContent = match[1] || match[2] || content;
    } else {
        // 如果没有找到HTML标记，尝试查找```与```之间的内容
        const codeBlockRegex = /```(?:html)?\s+([\s\S]*?)\s+```/i;
        const codeMatch = content.match(codeBlockRegex);
        if (codeMatch && codeMatch[1]) {
            htmlContent = codeMatch[1];
        }
    }
    
    // 添加必要的HTML包装
    if (!htmlContent.trim().startsWith('<')) {
        htmlContent = '<div>' + htmlContent + '</div>';
    }
    
    if (!htmlContent.trim().startsWith('<html')) {
        htmlContent = `
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;
    }
    
    console.log("提取的HTML内容:", htmlContent);
    
    // 生成完成后，隐藏流式输出，显示预览
    if (streamTextArea) streamTextArea.style.display = 'none';
    if (previewContent) previewContent.style.display = 'block';
    
    // 使用公共函数显示HTML
    displayHTML(htmlContent, container);
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
    const styleGrid = document.getElementById('style-grid');
    if (!styleGrid || !styles) return;
    
    // 清空选择器
    styleGrid.innerHTML = '';
    
    // 记录当前选中的样式
    let selectedStyle = null;
    
    // 添加风格选项
    styles.forEach(style => {
        // 创建宫格项
        const gridItem = document.createElement('div');
        gridItem.className = 'style-grid-item';
        gridItem.dataset.style = style.style;
        gridItem.dataset.styleValue = style.style_value;
        
        // 创建图片元素
        const img = document.createElement('img');
        img.className = 'style-grid-item-img';
        
        // 正确处理图片路径，添加相对路径前缀
        let imagePath = style.chinese_reference_image;
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
            imagePath = './' + imagePath; // 添加相对路径前缀
        }
        
        img.src = imagePath; // 从JSON文件中读取图片路径
        img.alt = style.style;
        
        // 内嵌的占位图数据
        const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMzMzIiB2aWV3Qm94PSIwIDAgMjAwIDMzMyIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMzMiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSIzMCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Q0EzQUYiPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        
        img.onerror = function() {
            // 图片加载失败时显示占位图
            this.src = placeholderImage;
            console.error(`图片加载失败: ${imagePath}`);
        };
        
        gridItem.appendChild(img);
        
        // 创建标签
        const label = document.createElement('div');
        label.className = 'style-grid-item-label';
        
        // 创建文本元素，用于滚动
        const textSpan = document.createElement('span');
        textSpan.className = 'style-grid-item-text';
        textSpan.textContent = style.style;
        label.appendChild(textSpan);
        
        gridItem.appendChild(label);
        
        // 添加点击事件
        gridItem.addEventListener('click', () => {
            // 移除之前选中项的选中状态
            document.querySelectorAll('.style-grid-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            
            // 添加选中状态
            gridItem.classList.add('selected');
            selectedStyle = style;
            
            // 预览风格示例
            previewStyleExample(style.style, styles);
        });
        
        // 检测文本是否需要滚动效果
        gridItem.addEventListener('mouseenter', checkTextOverflow);
        // 初始时也检测一次
        setTimeout(() => checkTextOverflow({currentTarget: gridItem}), 100);
        
        // 添加到容器
        styleGrid.appendChild(gridItem);
    });
    
    // 默认选择第一个风格
    if (styles.length > 0) {
        const firstItem = styleGrid.querySelector('.style-grid-item');
        if (firstItem) {
            firstItem.click();
        }
    }
}

// 检测文本是否溢出并应用相应的类
function checkTextOverflow(event) {
    const gridItem = event.currentTarget;
    const textSpan = gridItem.querySelector('.style-grid-item-text');
    
    // 检查文本是否溢出
    const isOverflowing = textSpan.scrollWidth > textSpan.clientWidth;
    
    // 根据是否溢出添加或移除no-scroll类
    if (isOverflowing) {
        textSpan.classList.remove('no-scroll');
    } else {
        textSpan.classList.add('no-scroll');
    }
}

// 获取当前选中的风格
function getSelectedStyle() {
    const selectedItem = document.querySelector('.style-grid-item.selected');
    return selectedItem ? selectedItem.dataset.style : null;
}

// 获取指定风格的描述
function getStyleDescription(styleName, styles) {
    if (!styles || !styleName) return "无";
    const style = styles.find(s => s.style === styleName || s.style_value === styleName);
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
        
        // 检查iframe内容是否为特殊风格（如未来科技风格）
        const isFuturisticTech = iframeDoc.title && 
                              (iframeDoc.title.includes('未来科技') || 
                               iframeDoc.title.includes('Futuristic'));
        
        // 如果是未来科技风格，不修改其主题
        if (isFuturisticTech) {
            console.log('检测到未来科技风格，保留原始主题');
            return;
        }
        
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

// 预览风格示例HTML
async function previewStyleExample(style, styles) {
    // 如果没有风格或风格列表，则不执行任何操作
    if (!style || !styles) return;
    
    // 查找选中的风格对象
    const styleObj = styles.find(s => s.style === style || s.style_value === style);
    if (!styleObj) return;
    
    // 获取风格示例HTML路径
    let examplePath = styleObj.chinese_example;
    if (!examplePath) return;
    
    // 处理路径，添加相对路径前缀
    if (!examplePath.startsWith('http') && !examplePath.startsWith('/')) {
        examplePath = './' + examplePath;
    }
    
    console.log("尝试加载HTML预览:", examplePath);
    
    // 获取预览容器
    const previewContent = document.getElementById('preview-content');
    const streamTextArea = document.getElementById('stream-text');
    
    // 如果正在生成内容，则不执行预览操作
    if (window.appState.isGenerating) return;
    
    try {
        // 如果有已生成的内容，则显示确认对话框
        if (window.appState.hasGeneratedContent) {
            if (!confirm('选择风格后，将替换右侧生成的内容，是否继续？')) {
                return; // 用户取消，保持当前内容
            }
        }
        
        // 加载风格示例HTML
        const response = await fetch(examplePath);
        if (!response.ok) {
            throw new Error(`无法加载示例HTML: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // 隐藏流式输出，显示预览
        if (streamTextArea) streamTextArea.style.display = 'none';
        if (previewContent) {
            previewContent.style.display = 'block';
            displayHTML(html, previewContent);
        }
        
        // 更新当前预览的风格
        window.appState.currentStylePreview = style;
        
    } catch (error) {
        console.error('预览风格示例时出错:', error);
        alert(`预览风格示例失败: ${error.message}`);
    }
}

// 显示HTML内容在容器中
function displayHTML(html, container) {
    if (!container) return;
    
    // 清空预览容器
    container.innerHTML = '';
    
    // 创建iframe以安全地渲染HTML
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '800px'; // 初始设置更大的高度
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';
    iframe.style.overflow = 'visible'; // 允许内容溢出
    
    // 添加iframe到预览容器
    container.appendChild(iframe);
    
    // 为iframe写入内容
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    // 检查当前预览的风格，如果是特定风格则不应用主题切换
    const currentStyle = window.appState.currentStylePreview;
    const preserveOriginalStyle = currentStyle === '未来科技风格 (Futuristic Tech)' || 
                               html.includes('未来科技') || 
                               html.includes('futuristic-tech');
    
    // 只有在不需要保留原始样式时才应用主题
    if (!preserveOriginalStyle) {
        updateIframeTheme(iframe);
    } else {
        console.log('保留风格原始样式，不应用主题切换');
    }
    
    // 自动调整iframe高度以匹配内容
    setTimeout(() => {
        try {
            // 获取iframe中文档的完整高度
            const height = iframeDoc.body.scrollHeight;
            iframe.style.height = height + 'px'; // 设置iframe高度为内容实际高度
        } catch (e) {
            console.error('调整iframe高度时出错:', e);
        }
    }, 500); // 给予足够时间让内容渲染完成
}
