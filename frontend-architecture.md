# 卡片生成器前端架构方案

## 一、项目概述

卡片生成器是一个面向用户的在线工具，允许用户通过AI模型生成、预览和下载不同风格的卡片。系统支持三种格式输出（图片、SVG、HTML）并提供多用户权限系统。项目集成OpenRouter API以提供智能卡片内容生成能力，支持流式输出AI生成结果。

## 二、技术选型

- **开发语言**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **样式方案**: 自定义CSS，响应式设计
- **构建工具**: 不使用前端构建工具，保持原生开发
- **部署平台**: Cloudflare Pages

## 三、项目目录结构

```
frontend/
├── public/                # 静态资源
│   ├── images/            # 图片资源
│   └── favicon.ico        # 网站图标
├── src/                   # 源代码
│   ├── css/               # 样式文件
│   │   ├── normalize.css  # CSS重置
│   │   ├── style.css      # 主样式
│   │   └── responsive.css # 响应式样式
│   ├── js/                # JavaScript文件
│   │   ├── api.js         # API调用封装
│   │   ├── auth.js        # 认证功能
│   │   ├── card.js        # 卡片生成功能
│   │   ├── ui.js          # UI控制功能
│   │   ├── ai.js          # AI生成功能和流式处理
│   │   ├── templates.js   # AI提示词模板
│   │   ├── config.js      # 环境配置
│   │   └── main.js        # 主入口脚本
│   ├── index.html         # 主页/登录页面
│   ├── dashboard.html     # 用户控制台页面
│   └── card-generator.html # 卡片生成页面
├── .env.development       # 开发环境变量
└── .env.production        # 生产环境变量
```

## 四、页面架构

### 1. 首页/登录页 (index.html)

**功能职责**:
- 展示产品介绍和特点
- 提供用户登录表单
- 提供用户注册表单
- 忘记密码功能
- 展示卡片示例和AI能力

**组件**:
- 登录表单
- 注册表单
- 密码重置表单
- 产品介绍区
- AI生成卡片示例展示

**状态交互**:
- 切换登录/注册表单
- 表单验证
- 认证状态管理

### 2. 用户控制台 (dashboard.html)

**功能职责**:
- 显示用户信息和会员状态
- 展示用户创建的卡片历史
- 提供卡片管理功能(预览、下载、删除)
- 显示配额使用情况

**组件**:
- 用户信息面板
- 会员状态面板
- 卡片历史列表
- 使用统计图表

**状态交互**:
- 加载用户卡片历史
- 卡片管理操作
- 根据会员级别显示不同功能

### 3. 卡片生成器 (card-generator.html)

**功能职责**:
- 提供卡片创建表单
- AI内容生成与流式显示
- 实时预览生成的卡片
- 支持不同格式的下载
- 管理生成配额
- AI参数控制

**组件**:
- 卡片创建表单
- AI提示词编辑器
- AI生成参数控制面板
- 风格选择器
- 格式选择器
- 流式内容输出区域
- 预览区域
- 下载功能

**状态交互**:
- 表单数据收集
- 格式切换逻辑
- 预览刷新
- 下载处理

## 五、核心JavaScript模块职责

### 1. api.js - API接口封装

**职责**:
- 封装所有与后端API的通信
- 处理认证令牌管理
- 统一错误处理
- 支持不同类型响应(JSON/Blob/Text)
- 支持流式响应处理

**主要函数**:
- `login(credentials)` - 用户登录
- `register(userData)` - 用户注册
- `getUserInfo()` - 获取用户信息
- `getCards()` - 获取卡片列表
- `createCard(cardData)` - 创建卡片
- `getCardPreview(id, format)` - 获取卡片预览
- `downloadCard(id, format)` - 下载卡片
- `fetchStream(endpoint, options, onChunk)` - 处理流式响应

### 2. auth.js - 认证管理

**职责**:
- 管理用户认证状态
- 处理登录/注册/登出流程
- 存储和检索认证信息

**主要函数**:
- `init()` - 初始化认证状态
- `login(email, password)` - 登录处理
- `register(name, email, password)` - 注册处理
- `logout()` - 登出处理
- `isAuthenticated()` - 检查认证状态
- `getAuthToken()` - 获取认证令牌

### 3. card.js - 卡片生成功能

**职责**:
- 管理卡片创建流程
- 处理不同格式的预览和下载
- 管理当前卡片状态

**主要函数**:
- `createCard(data)` - 创建卡片
- `getPreview(id, format)` - 获取预览
- `showPreview(data, format)` - 显示预览
- `downloadCard(id, format)` - 下载卡片

### 4. ai.js - AI内容生成模块

**职责**:
- 封装对AI服务的调用
- 处理流式生成响应
- 管理AI生成参数
- 处理模板与提示词

**主要函数**:
- `generateContent(prompt, params)` - 生成内容
- `streamContent(prompt, params, onChunk)` - 流式生成内容
- `handleStreamResponse(response, onChunk)` - 处理流式响应
- `getAvailableModels()` - 获取可用模型
- `saveGeneratedContent(content, cardId)` - 保存生成内容
- `cancelGeneration()` - 取消生成过程

### 5. templates.js - 提示词模板

**职责**:
- 管理预定义的提示词模板
- 提供模板插值功能
- 支持用户自定义模板

**主要函数**:
- `getTemplates()` - 获取所有模板
- `getTemplateById(id)` - 获取特定模板
- `applyTemplate(templateId, variables)` - 应用模板
- `saveCustomTemplate(template)` - 保存自定义模板

### 6. config.js - 环境配置

**职责**:
- 管理不同环境的配置
- 提供环境切换功能
- 存储应用常量

**主要属性和函数**:
- `environments` - 环境配置对象
- `currentEnv` - 当前环境
- `getConfig()` - 获取当前环境配置
- `switchEnvironment(env)` - 切换环境

### 7. ui.js - UI交互控制

**职责**:
- 管理DOM交互
- 处理UI状态变更
- 提供通用UI组件(加载器、提示消息等)
- 流式内容显示处理

**主要函数**:
- `showLoading()` - 显示加载指示器
- `hideLoading()` - 隐藏加载指示器
- `showToast(message, type)` - 显示消息提示
- `updateAuthUI()` - 更新认证相关UI
- `toggleForms()` - 切换表单显示
- `streamToElement(element, text, append)` - 流式更新DOM元素
- `highlightSyntax(element)` - 语法高亮处理
- `animateText(element, text, speed)` - 文本动画显示

### 8. main.js - 应用入口

**职责**:
- 初始化应用
- 设置事件监听器
- 页面加载逻辑
- 环境切换管理

**主要函数**:
- `init()` - 应用初始化
- `setupEventListeners()` - 设置事件监听
- `checkAuthState()` - 检查认证状态
- `initializeEnvironment()` - 初始化环境配置

## 六、页面交互流程

### 1. 用户认证流程

```
登录页面 → 输入凭证 → 认证成功 → 重定向到控制台
   ↑                      |
   └─────────────────────┘
           认证失败
```

### 2. AI辅助卡片创建流程

```
卡片生成页 → 填写表单 → 选择AI参数 → 启动AI生成 → 流式显示生成内容 → 用户确认/编辑 → 最终创建卡片 → 保存到用户历史记录中（只保存使用记录，不保存生成内容）
    ↑            |           |              |                |             |
    |            |           |              ↓                |             |
    |            |           |          更新UI状态           |             |
    |            |           |              |                |             |
    |            |           ↓              |                |             |
    |            |       检查配额-----------┘                |             |
    |            ↓                                           |             |
    └─────取消生成/修改参数──────────────────────────────────┘             |
                                                                          ↓
                                                                 预览 → 下载卡片
```

### 3. 会员权限检查流程

```
请求操作 → 检查会员级别 → 允许操作 → 执行操作
             |
             ↓  
         提示权限不足
```

## 七、本地与云端环境配置

### 本地开发环境

**启动方式**:
```bash
# 使用Browsersync启动项目，支持自动刷新
npx browser-sync start --server "frontend/src" --files "frontend/src/**/*.{html,css,js}" --port 3000
```

**环境配置**:
```javascript
// config.js
const environments = {
  development: {
    API_URL: 'http://localhost:8787',
    AI_ENDPOINT: 'https://dev-api.openrouter.ai/api/v1',
    LOG_LEVEL: 'debug'
  },
  production: {
    API_URL: 'https://api.card-generator.workers.dev',
    AI_ENDPOINT: 'https://api.openrouter.ai/api/v1',
    LOG_LEVEL: 'error'
  }
};

// 从localStorage或默认值获取当前环境
const currentEnv = localStorage.getItem('app_env') || 'production';
export const config = environments[currentEnv];

// 环境切换函数
export function switchEnvironment(env) {
  if (environments[env]) {
    localStorage.setItem('app_env', env);
    window.location.reload();
  }
}
```

**安全措施**:
- OpenRouter API密钥仅在后端存储和使用
- 敏感配置通过环境变量注入
- JWT存储在HttpOnly Cookie而非localStorage

## 八、响应式设计方案

**断点设计**:
- 桌面: 1200px以上
- 平板: 768px - 1199px
- 手机: 767px以下

**响应式策略**:
- 使用CSS媒体查询适配不同屏幕
- 使用相对单位(rem, %)定义尺寸
- 针对手机视图重排布局元素

## 九、跨浏览器兼容性

**目标浏览器**:
- Chrome (最近2个版本)
- Firefox (最近2个版本)
- Safari (最近2个版本)
- Edge (最近2个版本)

**兼容性策略**:
- 使用标准化CSS(normalize.css)
- 避免使用实验性API
- 针对已知问题提供回退方案

## 十、部署流程

**1. 前端部署到Cloudflare Pages**:
```bash
# 推送代码到GitHub仓库
git push origin main

# Cloudflare Pages自动部署
# 或手动部署
npx wrangler pages publish frontend/src
```

**2. 环境变量配置**:
- 在Cloudflare Pages控制台设置环境变量
- 区分开发环境和生产环境变量

**3. 域名配置**:
- 设置自定义域名
- 配置SSL证书(Cloudflare自动提供)

## 十一、初始开发计划

### 第一阶段：项目搭建 (1-2天)
- 创建项目结构
- 设置基础样式
- 创建空白JavaScript模块
- 配置环境切换机制

### 第二阶段：认证功能 (2-3天)
- 实现登录/注册表单
- 连接认证API
- 实现会话管理
- 实现安全存储机制

### 第三阶段：基础卡片功能 (2-3天)
- 实现表单创建
- 实现基本预览功能
- 实现下载功能

### 第四阶段：AI生成功能 (3-5天)
- 实现AI提示词编辑器
- 配置OpenRouter API连接
- 实现流式响应处理
- 开发实时内容更新UI

### 第五阶段：用户控制台 (2-3天)
- 实现卡片历史
- 实现会员状态显示
- 实现使用统计
- AI使用记录展示

### 第六阶段：优化与安全 (2-3天)
- 添加输入验证和数据清洗
- 实现响应式设计
- 添加错误处理和恢复机制
- 实现敏感数据保护

## 十二、流式输出实现细节

### 1. 流式处理核心代码

```javascript
// ai.js
async function streamContent(prompt, params, onChunk, onComplete, onError) {
  try {
    const response = await fetch(`${config.API_URL}/api/ai/generate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ prompt, params }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 检查流响应
    if (!response.body) {
      throw new Error('ReadableStream not supported');
    }

    // 创建流式读取器
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    
    // 处理流数据
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete(accumulatedText);
        break;
      }
      
      // 解码并处理文本块
      const chunk = decoder.decode(value, { stream: true });
      accumulatedText += chunk;
      
      // 调用回调函数处理新文本块
      onChunk(chunk, accumulatedText);
    }
  } catch (error) {
    console.error('Stream error:', error);
    onError(error);
  }
}

// 在UI中使用流式输出
function handleGenerateClick() {
  const promptInput = document.getElementById('prompt-input').value;
  const outputElement = document.getElementById('ai-output');
  
  // 清空输出区域
  outputElement.textContent = '';
  
  // 显示正在生成指示器
  UI.showGenerating();
  
  // 流式生成内容
  AI.streamContent(
    promptInput,
    { model: 'gpt-4', temperature: 0.7 },
    // 每次收到新数据块时调用
    (chunk, fullText) => {
      UI.streamToElement(outputElement, chunk, true);
    },
    // 完成时调用
    (fullText) => {
      UI.hideGenerating();
      UI.highlightSyntax(outputElement);
      // 存储完整文本到表单
      document.getElementById('card-content').value = fullText;
    },
    // 出错时调用
    (error) => {
      UI.hideGenerating();
      UI.showToast(`生成错误: ${error.message}`, 'error');
    }
  );
}
```

### 2. 流式显示UI实现

```javascript
// ui.js
const UI = {
  // 其他方法...
  
  // 流式更新DOM元素
  streamToElement(element, text, append = true) {
    if (append) {
      element.textContent += text;
    } else {
      element.textContent = text;
    }
    
    // 自动滚动到底部
    element.scrollTop = element.scrollHeight;
  },
  
  // 显示"正在生成"指示器
  showGenerating() {
    const indicator = document.getElementById('generating-indicator');
    indicator.classList.remove('hidden');
    
    // 添加动画效果
    this.startTypewriterEffect(indicator);
  },
  
  // 隐藏"正在生成"指示器
  hideGenerating() {
    const indicator = document.getElementById('generating-indicator');
    indicator.classList.add('hidden');
    this.stopTypewriterEffect(indicator);
  },
  
  // 打字机效果
  startTypewriterEffect(element) {
    if (!element.dataset.text) {
      element.dataset.text = "正在生成";
    }
    
    let dotCount = 0;
    element.dataset.interval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      element.textContent = element.dataset.text + '.'.repeat(dotCount);
    }, 500);
  },
  
  stopTypewriterEffect(element) {
    if (element.dataset.interval) {
      clearInterval(parseInt(element.dataset.interval));
      element.dataset.interval = null;
    }
  }
};
```
