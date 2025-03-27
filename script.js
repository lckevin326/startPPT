// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async function() {
    // 检查配置是否正确加载
    if (!window.OPENROUTER_CONFIG) {
        alert('配置文件加载失败，请确保config.js文件存在且包含正确的配置信息');
        return;
    }

    // 初始化应用状态
    window.appState = {
        currentStylePreview: null,
        isGenerating: false,          // 是否正在生成内容
        hasGeneratedContent: false    // 是否已经生成过内容
    };

    try {
        // 初始化主题设置
        initTheme();
        
        // 设置事件监听器
        setupEventListeners();

        // 初始化分类选择器
        await initializeCategorySelector();

        console.log('应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
        alert('初始化失败: ' + error.message);
    }

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

        // 获取预览区域和流式输出区域
        const streamTextArea = document.getElementById('stream-text');
        const previewContent = document.getElementById('preview-content');
        
        // 重置文本区域，显示流式输出区域，隐藏预览内容
        if (streamTextArea) {
            streamTextArea.innerHTML = '<p>开始生成卡片内容...</p>';
            streamTextArea.style.display = 'block';
        }
        
        // 隐藏预览区域
        if (previewContent) {
            previewContent.style.display = 'none';
        }
        
        try {
            // 加载风格列表
            const styles = await loadStyleJSON();
            if (!styles) {
                throw new Error('无法加载风格列表');
            }
            
            // 获取选中的分类和风格
            const categoryStyles = getCategoryStyles(styles);
            if (!categoryStyles) {
                throw new Error('无法获取分类风格信息');
            }
            
            // 获取选中的风格对象
            const selectedStyle = styles.find(s => s.style === style || s.style_value === style);
            if (!selectedStyle) {
                throw new Error('无法找到选择的风格');
            }
            
            // 获取风格描述
            const styleDescription = selectedStyle.description || "无风格描述";
            
            // 从style.md中获取对应分类的提示词模板
            // 获取风格的分类
            const styleCategory = selectedStyle.cate;
            
            // 从style.md加载分类数据
            let categories = [];
            try {
                const styleResponse = await fetch('prompt/beautifulCard/style.md');
                if (!styleResponse.ok) {
                    throw new Error('无法加载分类文件');
                }
                categories = await styleResponse.json();
            } catch (error) {
                console.error('加载分类文件出错:', error);
                throw new Error('无法加载分类数据');
            }
            
            // 查找匹配的分类及其提示词模板
            const matchedCategory = categories.find(category => category.style === styleCategory);
            let promptTemplate = '';
            
            if (matchedCategory && matchedCategory.prompt) {
                promptTemplate = matchedCategory.prompt;
                console.log(`从分类 ${styleCategory} 中获取提示模板`);
            } else {
                // 如果找不到匹配的分类，使用第一个有效的提示词模板
                const defaultCategory = categories.find(c => c.prompt && c.prompt.trim() !== '');
                if (defaultCategory) {
                    promptTemplate = defaultCategory.prompt;
                    console.log(`未找到匹配分类，使用默认分类 ${defaultCategory.style} 的提示模板`);
                } else {
                    throw new Error('无法加载提示模板');
                }
            }
            
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
                        temperature: 0.7,  // 使用固定值
                        stream: true
                    };
                    
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
                                        
                                        // 仅当HTML未显示时更新流文本
                                        if (streamTextArea.style.display !== 'none') {
                                            // 更新文本区域
                                            if (content.includes('<html') || content.includes('<!DOCTYPE')) {
                                                // 显示流动文本
                                                streamTextArea.innerHTML = `<p>正在构建HTML内容...</p><pre>${escapeHtml(fullResponse.substring(0, 500))}${fullResponse.length > 500 ? '...' : ''}</pre>`;
                                            } else {
                                                // 可能是代码或其他内容，使用monospace显示
                                                streamTextArea.innerHTML = `<pre>${escapeHtml(fullResponse)}</pre>`;
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error('解析数据行时出错:', error, line);
                                }
                            }
                        }
                        
                        // 恢复按钮状态
                        generateBtn.disabled = false;
                        generateBtn.innerText = '生成卡片';
                        generateBtn.classList.remove('bg-gray-400');
                        generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                        generateBtn.style.cursor = 'pointer';
                        
                    } catch (error) {
                        streamTextArea.innerHTML += `<p style="color: red;">❌ 处理响应流时出错: ${error.message}</p>`;
                        
                        // 恢复按钮状态和应用状态
                        generateBtn.disabled = false;
                        generateBtn.innerText = '生成卡片';
                        generateBtn.classList.remove('bg-gray-400');
                        generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                        generateBtn.style.cursor = 'pointer';
                        window.appState.isGenerating = false;
                    }
                }
            } catch (error) {
                streamTextArea.innerHTML += `<p style="color: red;">❌ ${error.message}</p>`;
                
                // 恢复按钮状态和应用状态
                generateBtn.disabled = false;
                generateBtn.innerText = '生成卡片';
                generateBtn.classList.remove('bg-gray-400');
                generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                generateBtn.style.cursor = 'pointer';
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
            window.appState.isGenerating = false;
        }
    });

    // 添加回车快捷键
    textInput?.addEventListener('keydown', (e) => {
        // Ctrl+Enter 触发生成
        if (e.ctrlKey && e.key === 'Enter' && !window.appState.isGenerating) {
            e.preventDefault();
            generateBtn.click();
        }
    });
});

// 加载style.md文件内容 (实际是JSON格式)
async function loadStyleMD() {
    try {
        const response = await fetch('prompt/beautifulCard/style.md');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const text = await response.text();
        try {
            // 尝试直接解析为JSON
            return JSON.parse(text);
        } catch (parseError) {
            console.error('解析style.md为JSON失败:', parseError);
            // 如果解析失败，尝试作为Markdown解析
            return [];
        }
    } catch (error) {
        console.error('加载style.md文件失败:', error);
        return [];
    }
}

// 加载style.json文件内容
async function loadStyleJSON() {
    try {
        const response = await fetch('prompt/beautifulCard/style.json');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('加载style.json文件失败:', error);
        throw error;
    }
}

// 初始化分类选择器
async function initializeCategorySelector() {
    try {
        // 获取分类选择器容器
        const categorySelector = document.getElementById('category-selector');
        if (!categorySelector) {
            console.error('找不到分类选择器容器元素');
            return;
        }
        
        // 清空选择器
        categorySelector.innerHTML = '';
        
        // 从style.md加载所有风格数据
        const allStyles = await loadStyleMD();
        if (!allStyles || allStyles.length === 0) {
            console.error('从style.md加载风格数据失败');
            return;
        }
        
        console.log('从style.md加载的风格数据:', allStyles);
        
        // 只保留状态为1的风格
        const activeStyles = allStyles.filter(style => style.status === 1);
        console.log('状态为1的有效风格数量:', activeStyles.length);
        
        // 预定义分类与风格的映射关系
        const categoryMappings = {
            '知识卡片': ['card', '卡片', '知识'],
            '小红书': ['xhs', '小红书', '社交'],
            '微信公众号': ['wx', 'wechat', '微信', '公众号'],
            '演示文稿': ['ppt', '演示', '幻灯片']
        };
        
        // 为每个分类匹配相应的风格
        const categories = Object.keys(categoryMappings);
        const categoryHasStyles = {};
        
        // 检查每个分类是否有匹配的风格
        categories.forEach(category => {
            const keywords = categoryMappings[category];
            const matchedStyles = activeStyles.filter(style => {
                const styleValue = (style.style_value || '').toLowerCase();
                const styleName = (style.style || '').toLowerCase();
                
                return keywords.some(keyword => 
                    styleValue.includes(keyword.toLowerCase()) || 
                    styleName.includes(keyword.toLowerCase())
                );
            });
            
            categoryHasStyles[category] = matchedStyles.length > 0;
            console.log(`分类 "${category}" 匹配到 ${matchedStyles.length} 个风格`);
        });
        
        // 只显示有风格的分类
        const availableCategories = categories.filter(category => categoryHasStyles[category]);
        console.log('有可用风格的分类:', availableCategories);
        
        // 如果没有可用分类，显示所有预定义分类
        const displayCategories = availableCategories.length > 0 ? availableCategories : categories;
        
        // 添加分类选项
        displayCategories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.textContent = category;
            categoryItem.dataset.category = category;
            
            // 添加点击事件
            categoryItem.addEventListener('click', () => {
                // 移除之前选中项的选中状态
                document.querySelectorAll('.category-item.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 添加选中状态
                categoryItem.classList.add('selected');
                
                // 更新全局状态
                window.appState.currentCategory = category;
                console.log('已选择分类:', category);
                
                // 更新风格选择器，仅显示该分类的风格
                populateStyleSelector();
            });
            
            // 添加到容器
            categorySelector.appendChild(categoryItem);
        });
        
        // 默认选择第一个分类
        if (displayCategories.length > 0) {
            const firstCategory = categorySelector.querySelector('.category-item');
            if (firstCategory) {
                // 设置初始分类
                window.appState.currentCategory = displayCategories[0];
                console.log('默认选择分类:', displayCategories[0]);
                firstCategory.classList.add('selected');
                
                // 初始加载该分类下的风格
                populateStyleSelector();
            }
        }
    } catch (error) {
        console.error('初始化分类选择器失败:', error);
    }
}

// 获取当前分类下的风格
function getCategoryStyles(styles) {
    const category = window.appState.currentCategory;
    if (!category || !styles) return [];
    
    // 返回指定分类下的风格
    return styles.filter(style => 
        style.cate === category
    );
}

// 填充风格选择器
async function populateStyleSelector() {
    const styleGrid = document.getElementById('style-grid');
    if (!styleGrid) {
        console.error('找不到风格选择器容器元素');
        return;
    }
    
    // 清空选择器
    styleGrid.innerHTML = '';
    
    try {
        // 获取当前选中的分类
        const selectedCategory = window.appState.currentCategory;
        if (!selectedCategory) {
            console.warn('没有选择任何分类');
            return;
        }
        
        console.log('当前选择的分类:', selectedCategory);
        
        // 从style.json加载所有风格数据
        const allStyles = await loadStyleJSON();
        if (!allStyles || allStyles.length === 0) {
            console.error('从style.json加载风格数据失败');
            styleGrid.innerHTML = '<div class="p-4 text-center text-gray-500">加载风格数据失败</div>';
            return;
        }
        
        // 根据当前分类过滤风格（使用cate字段）
        const filteredStyles = allStyles.filter(style => {
            return style.cate === selectedCategory;
        });
        
        console.log(`分类 "${selectedCategory}" 下的风格数量:`, filteredStyles.length);
        
        // 如果没有风格，返回
        if (filteredStyles.length === 0) {
            console.warn(`当前分类 ${selectedCategory} 下没有可用的风格`);
            styleGrid.innerHTML = `<div class="p-4 text-center text-gray-500">当前分类下没有可用的风格</div>`;
            return;
        }
        
        // 添加风格选项（3:5比例的宫格显示）
        filteredStyles.forEach(style => {
            const gridItem = document.createElement('div');
            gridItem.className = 'style-item';
            gridItem.dataset.style = style.style_value;
            
            // 创建图片容器
            const imgContainer = document.createElement('div');
            imgContainer.className = 'style-img-container';
            
            // 创建图片元素
            const img = document.createElement('img');
            img.className = 'style-preview-img';
            
            // 设置图片源（优先使用reference_image，如果不存在则使用默认图片）
            if (style.chinese_reference_image) {
                img.src = style.chinese_reference_image;
                img.alt = style.style;
            } else {
                img.src = 'assets/default-style.png';
                img.alt = '默认风格图片';
            }
            
            // 图片加载失败时显示替代图像
            img.onerror = function() {
                console.warn(`风格图片加载失败: ${style.style}`);
                this.src = 'assets/default-style.png';
                this.alt = '默认风格图片';
            };
            
            // 创建风格名称标签（放在图片下方）
            const styleLabel = document.createElement('div');
            styleLabel.className = 'style-label';
            styleLabel.textContent = style.style;
            
            // 将图片添加到容器
            imgContainer.appendChild(img);
            
            // 将图片容器和标签添加到卡片
            gridItem.appendChild(imgContainer);
            gridItem.appendChild(styleLabel);
            
            // 添加点击事件
            gridItem.addEventListener('click', () => {
                // 移除之前选中项的选中状态
                document.querySelectorAll('.style-item.selected').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 添加选中状态
                gridItem.classList.add('selected');
                
                // 显示该风格的示例
                console.log('已选择风格:', style.style);
                previewStyleExample(style.style_value, filteredStyles);
            });
            
            // 添加到风格网格
            styleGrid.appendChild(gridItem);
        });
        
        // 默认选择第一个风格
        if (filteredStyles.length > 0) {
            const firstItem = styleGrid.querySelector('.style-item');
            if (firstItem) {
                firstItem.click();
            }
        }
    } catch (error) {
        console.error('加载风格数据失败:', error);
        styleGrid.innerHTML = `<div class="p-4 text-center text-gray-500">加载风格数据失败: ${error.message}</div>`;
    }
}

// 获取当前选中的风格
function getSelectedStyle() {
    const selectedStyleElem = document.querySelector('.style-item.selected');
    if (!selectedStyleElem) return null;
    
    return selectedStyleElem.dataset.style;
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

// 初始化主题设置 - 只使用浅色主题
function initTheme() {
    // 强制使用浅色主题
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
    
    // 更新图标（如果存在）
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = 'dark_mode';
        // 隐藏主题切换按钮，因为我们只使用浅色主题
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.style.display = 'none';
        }
    }
}

// 设置事件监听
function setupEventListeners() {
    const textInput = document.getElementById('text-input');
    const generateBtn = document.getElementById('generate-btn');
    
    // 点击生成按钮事件
    generateBtn?.addEventListener('click', () => {
        handleGenerate();
    });
    
    // 文本框按下Ctrl+Enter事件
    textInput?.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
        }
    });
    
    // 移除主题切换快捷键
    // 不再监听Alt+T快捷键
}

// 主题切换函数 - 现在此函数不做任何切换，永远保持浅色主题
function toggleTheme() {
    // 强制使用浅色主题
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
    
    // 可选：显示一个提示，告诉用户系统只支持浅色主题
    console.log('系统已设置为仅使用浅色主题');
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

// 从内容中提取HTML代码
function extractHTML(content) {
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
                        font-size: 16px;
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
    return htmlContent;
}

// 显示HTML内容在容器中
function displayHTML(html, container) {
    if (!container) return;
    
    try {
        // 创建一个包装div元素来确保内容居中显示
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'w-full h-full flex justify-center items-center p-4';
        
        // 创建一个iframe元素来显示HTML内容
        const iframe = document.createElement('iframe');
        iframe.className = 'w-full h-full border-0';
        iframe.style.height = '600px'; // 设置固定高度
        iframe.style.margin = '0 auto'; // 水平居中
        iframe.style.display = 'block'; // 块级显示
        iframe.style.backgroundColor = 'transparent';
        
        // 添加iframe到wrapper div
        wrapperDiv.appendChild(iframe);
        
        // 清空容器并添加wrapper
        container.innerHTML = '';
        container.appendChild(wrapperDiv);
        
        // 设置iframe内容
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
        
        console.log('HTML内容已加载到iframe中');
    } catch (error) {
        console.error('显示HTML内容时出错:', error);
        container.innerHTML = `<div class="p-4 text-red-500">显示HTML内容时出错: ${error.message}</div>`;
    }
}

// 预览风格示例
async function previewStyleExample(styleName, styles) {
    try {
        // 如果正在生成卡片，不进行预览切换
        if (window.appState.isGenerating) {
            console.log('正在生成卡片，暂时无法预览其他风格');
            return;
        }
        
        // 如果已经生成了内容，需要确认是否切换风格
        if (window.appState.hasGeneratedContent) {
            if (!confirm('切换风格将丢失当前生成的卡片内容，确定要切换吗？')) {
                // 用户取消切换，恢复之前选中的风格
                const previousStyle = window.appState.currentStylePreview?.style_value;
                if (previousStyle) {
                    // 恢复之前的选中状态
                    document.querySelectorAll('.style-item.selected').forEach(item => {
                        item.classList.remove('selected');
                    });
                    const previousItem = document.querySelector(`.style-item[data-style="${previousStyle}"]`);
                    if (previousItem) {
                        previousItem.classList.add('selected');
                    }
                }
                return;
            }
            
            // 用户确认切换，清除已生成的内容
            window.appState.hasGeneratedContent = false;
        }
        
        if (!styleName) {
            console.error('没有提供风格名称');
            return;
        }
        
        console.log('预览风格:', styleName);
        
        // 找到对应的风格对象
        const styleObject = styles.find(s => s.style_value === styleName);
        if (!styleObject) {
            console.error('找不到风格对象:', styleName);
            return;
        }
        
        // 保存当前预览的风格
        window.appState.currentStylePreview = styleObject;
        
        // 获取预览区域和流式输出区域
        const previewStage = document.getElementById('preview-stage');
        const streamText = document.getElementById('stream-text');
        const previewContent = document.getElementById('preview-content');
        
        // 隐藏流式输出区域，显示预览内容区域
        if (streamText) streamText.style.display = 'none';
        if (previewContent) previewContent.style.display = 'block';
        
        // 使用chinese_example字段加载HTML示例
        if (styleObject.chinese_example) {
            try {
                // 加载HTML示例文件
                const response = await fetch(styleObject.chinese_example);
                
                // 确保获取到响应
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                
                // 解析HTML内容
                const htmlContent = await response.text();
                
                // 显示HTML内容
                if (previewContent) {
                    previewContent.innerHTML = htmlContent;
                    previewContent.style.display = 'block';
                }
                
                console.log('成功加载预览HTML:', styleObject.chinese_example);
            } catch (error) {
                console.error('加载预览HTML失败:', error);
                // 加载失败时显示替代内容
                displayFallbackPreview(styleObject, previewContent);
            }
        } else {
            console.warn('风格对象没有chinese_example字段:', styleObject.style);
            // 显示替代内容
            displayFallbackPreview(styleObject, previewContent);
        }
    } catch (error) {
        console.error('预览风格示例失败:', error);
    }
}

// 显示备用预览内容
function displayFallbackPreview(styleObject, container) {
    if (!container) return;
    
    // 使用风格信息创建预览内容
    let previewContent = '';
    
    // 显示风格名称
    previewContent += `<div class="p-4">
        <h3 class="font-bold text-xl mb-4">${styleObject.style}</h3>`;
    
    // 如果有图片，显示图片
    if (styleObject.chinese_reference_image || styleObject.english_reference_image) {
        const imagePath = styleObject.chinese_reference_image || styleObject.english_reference_image;
        previewContent += `<div class="mb-4">
            <img class="max-w-full h-auto rounded" src="${imagePath}" alt="${styleObject.style}" />
        </div>`;
    }
    
    // 如果有描述，显示描述
    if (styleObject.description) {
        previewContent += `<div class="mt-4">
            <h4 class="font-semibold mb-2">风格描述:</h4>
            <div class="bg-gray-100 p-3 rounded text-sm">${styleObject.description.substring(0, 200)}...</div>
        </div>`;
    }
    
    // 显示分类信息
    previewContent += `<div class="mt-4">
        <span class="inline-block px-2 py-1 text-xs rounded bg-blue-500 text-white">
            分类: ${styleObject.cate || '未分类'}
        </span>
    </div>`;
    
    previewContent += '</div>';
    
    // 显示预览内容
    container.innerHTML = previewContent;
    container.style.display = 'block';
}

// 显示最终HTML内容
function displayFinalHTML(content, container, isComplete = false) {
    // 获取流式输出和预览元素
    const streamText = document.getElementById('stream-text');
    const previewContent = document.getElementById('preview-content');
    
    if (!container) return;
    
    try {
        // 提取HTML代码
        let htmlCode = extractHTML(content);
        
        if (htmlCode && htmlCode.trim()) {
            // 设置HTML预览
            container.innerHTML = htmlCode;
            
            // 显示预览内容，隐藏流式输出
            if (streamText) streamText.style.display = 'none';
            if (previewContent) previewContent.style.display = 'block';
            
            // 如果生成完成，更新应用状态
            if (isComplete) {
                // 恢复生成按钮状态
                const generateBtn = document.getElementById('generate-btn');
                if (generateBtn) {
                    generateBtn.disabled = false;
                    generateBtn.innerText = '生成卡片';
                    generateBtn.classList.remove('bg-gray-400');
                    generateBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
                    generateBtn.style.cursor = 'pointer';
                }
                
                // 更新应用状态
                window.appState.isGenerating = false;
                window.appState.hasGeneratedContent = true;
                
                console.log('卡片生成完成，已启用风格切换确认');
            }
        } else {
            console.warn('无法提取HTML代码');
            // 展示原始响应
            container.innerHTML = `<div class="p-4">
                <h3 class="font-semibold text-lg mb-2">生成结果</h3>
                <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto">${escapeHtml(content)}</pre>
            </div>`;
        }
    } catch (error) {
        console.error('显示HTML预览时出错:', error);
        container.innerHTML = `<div class="p-4 text-red-500">显示预览时出错: ${error.message}</div>`;
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
