# 卡片生成器后端架构方案

## 一、项目概述

卡片生成器后端服务是一个基于 Node.js 的 API 服务，负责处理用户认证、卡片生成与管理、会员权限控制等功能。后端采用 Cloudflare Workers 部署，数据存储使用 Neon PostgreSQL 数据库。系统集成OpenRouter API用于智能卡片内容生成，支持流式响应传递给前端。

## 二、技术选型

- **运行环境**: Cloudflare Workers (无服务器)
- **开发语言**: JavaScript (Node.js兼容)
- **数据库**: Neon PostgreSQL
- **认证方式**: JWT (JSON Web Tokens)
- **API类型**: RESTful API + 流式响应接口
- **AI集成**: OpenRouter API (支持多种大型语言模型)
- **环境管理**: 多环境配置(开发/生产)

## 三、项目目录结构

```
backend/
├── src/
│   ├── controllers/        # 控制器
│   │   ├── authController.js   # 认证控制器
│   │   ├── cardController.js   # 卡片控制器
│   │   ├── userController.js   # 用户控制器
│   │   └── aiController.js     # AI生成控制器
│   ├── middleware/         # 中间件
│   │   ├── authMiddleware.js   # 认证中间件
│   │   ├── errorMiddleware.js  # 错误处理中间件
│   │   ├── quotaMiddleware.js  # 配额检查中间件
│   │   ├── rateLimitMiddleware.js # 请求限制中间件
│   │   └── streamMiddleware.js # 流式响应中间件
│   ├── models/             # 数据模型
│   │   ├── User.js             # 用户模型
│   │   ├── Card.js             # 卡片模型
│   │   ├── Membership.js       # 会员模型
│   │   └── AIGeneration.js     # AI生成记录模型
│   ├── services/           # 业务服务
│   │   ├── authService.js      # 认证服务
│   │   ├── cardService.js      # 卡片服务
│   │   ├── membershipService.js # 会员服务
│   │   └── aiService.js        # AI生成服务
│   ├── utils/              # 工具函数
│   │   ├── database.js         # 数据库连接
│   │   ├── jwtUtils.js         # JWT工具
│   │   ├── responseUtils.js    # 响应格式化
│   │   ├── streamUtils.js      # 流处理工具
│   │   ├── securityUtils.js    # 安全工具
│   │   └── configUtils.js      # 配置工具
│   ├── config/             # 配置文件
│   │   ├── development.js      # 开发环境配置
│   │   ├── production.js       # 生产环境配置
│   │   └── index.js            # 配置加载器
│   ├── routes.js           # 路由定义
│   └── index.js            # 应用入口
├── prisma/                 # Prisma ORM
│   ├── schema.prisma       # 数据库模式
│   └── migrations/         # 迁移文件
├── wrangler.toml           # Cloudflare Workers配置
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
└── package.json            # 项目依赖
```

## 四、API路由设计

### 认证相关接口

| 方法   | 路径                 | 描述         | 权限    |
|--------|---------------------|--------------|---------|
| POST   | /api/auth/register  | 用户注册     | 无需认证 |
| POST   | /api/auth/login     | 用户登录     | 无需认证 |
| POST   | /api/auth/forgot    | 忘记密码     | 无需认证 |
| POST   | /api/auth/reset     | 重置密码     | 特殊令牌 |
| GET    | /api/auth/me        | 获取当前用户 | 需认证   |

### 卡片相关接口

| 方法   | 路径                         | 描述         | 权限    |
|--------|------------------------------|--------------|---------|
| POST   | /api/cards                   | 创建卡片     | 需认证   |
| GET    | /api/cards                   | 获取卡片列表 | 需认证   |
| GET    | /api/cards/:id               | 获取单个卡片 | 需认证   |
| DELETE | /api/cards/:id               | 删除卡片     | 需认证   |
| GET    | /api/cards/:id/preview       | 卡片预览     | 需认证   |
| GET    | /api/cards/:id/download      | 下载卡片     | 需认证   |

### 会员相关接口

| 方法   | 路径                      | 描述             | 权限    |
|--------|---------------------------|------------------|---------|
| GET    | /api/membership           | 获取会员信息     | 需认证   |
| GET    | /api/membership/usage     | 获取使用统计     | 需认证   |
| POST   | /api/membership/upgrade   | 升级会员         | 需认证   |

### AI生成相关接口

| 方法   | 路径                        | 描述             | 权限    | 特性    |
|--------|----------------------------|------------------|---------|---------|
| POST   | /api/ai/generate           | 生成内容         | 需认证   | -       |
| POST   | /api/ai/generate/stream    | 流式生成内容     | 需认证   | 流式响应 |
| GET    | /api/ai/models             | 获取可用模型     | 需认证   | -       |
| GET    | /api/ai/templates          | 获取提示词模板   | 需认证   | -       |
| GET    | /api/ai/history            | 获取生成历史     | 需认证   | -       |
| POST   | /api/ai/estimate           | 估算生成成本     | 需认证   | -       |

### 系统与配置相关接口

| 方法   | 路径                        | 描述             | 权限     |
|--------|----------------------------|------------------|----------|
| GET    | /api/system/health         | 系统健康检查     | 无需认证  |
| GET    | /api/system/config         | 获取客户端配置   | 需认证    |
| GET    | /api/system/status         | 系统状态信息     | 需管理员  |

## 五、数据库模型设计

### User 模型

```prisma
model User {
  id             Int            @id @default(autoincrement())
  email          String         @unique
  password       String?        // 哈希后的密码
  name           String?
  createdAt      DateTime       @default(now())
  lastLogin      DateTime?
  isActive       Boolean        @default(true)
  membership     Membership?
  cards          Card[]
  downloads      Download[]
  aiGenerations  AIGeneration[]
}
```

### Membership 模型

```prisma
model Membership {
  id                Int       @id @default(autoincrement())
  userId            Int       @unique
  user              User      @relation(fields: [userId], references: [id])
  tier              String    @default("free") // "free", "premium", "pro"
  startDate         DateTime  @default(now())
  endDate           DateTime?
  autoRenew         Boolean   @default(false)
  aiGenerationLimit Int       @default(5)  // 每日AI生成次数限制
}
```

### Card 模型

```prisma
model Card {
  id             Int            @id @default(autoincrement())
  userId         Int
  user           User           @relation(fields: [userId], references: [id])
  title          String
  content        String
  style          String?
  scenario       String?
  format         String         @default("image") // "image", "svg", "html"
  storageUrl     String?
  createdAt      DateTime       @default(now())
  isAIGenerated  Boolean        @default(false)
  aiGenerationId Int?           // 关联的AI生成
  aiGeneration   AIGeneration?  @relation(fields: [aiGenerationId], references: [id])
  downloads      Download[]
}
```

### Download 模型

```prisma
model Download {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  cardId    Int
  card      Card     @relation(fields: [cardId], references: [id])
  format    String
  createdAt DateTime @default(now())
}
```

### AIGeneration 模型

```prisma
model AIGeneration {
  id            Int       @id @default(autoincrement())
  userId        Int
  user          User      @relation(fields: [userId], references: [id])
  prompt        String    // 用户提示词
  systemPrompt  String?   // 系统提示词
  parameters    Json      // 生成参数 (模型、温度等)
  modelUsed     String    // 使用的模型
  status        String    @default("pending") // "pending", "processing", "completed", "failed"
  content       String?   // 生成的内容
  errorMessage  String?   // 错误信息
  tokenCount    Int?      // 使用的token数
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  cards         Card[]    // 基于此生成创建的卡片
}
```

### APIKey 模型

```prisma
model APIKey {
  id          Int       @id @default(autoincrement())
  name        String    // 密钥描述名称
  service     String    // 服务类型 (openrouter, etc)
  key         String    // 加密存储的密钥
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  lastUsedAt  DateTime?
  usageCount  Int       @default(0)
}
```

## 六、核心模块职责

### 1. 控制器 (Controllers)

**authController.js**
- 处理用户认证相关请求
- 职责：对接Google登录
<!-- - 职责: 注册、登录、密码管理 -->

**cardController.js**
- 处理卡片管理相关请求
- 职责: 创建、获取、删除、预览、下载卡片

**userController.js**
- 处理用户信息相关请求
- 职责: 获取用户、更新用户信息

**aiController.js**
- 处理AI生成相关请求
- 职责: 内容生成、流式生成、模型查询、模板管理

### 2. 中间件 (Middleware)

**authMiddleware.js**
- 验证用户认证状态
- 提取和验证JWT令牌
- 在请求处理前检查权限

**errorMiddleware.js**
- 统一错误处理机制
- 格式化错误响应
- 记录错误日志

**quotaMiddleware.js**
- 检查用户配额限制
- 根据会员等级实施不同限制
- 更新使用计数

**rateLimitMiddleware.js**
- 实现API请求速率限制
- 防止暴力攻击和滥用
- IP和用户级别的限制

**streamMiddleware.js**
- 处理流式响应设置
- 配置正确的流式响应头
- 错误处理和超时管理

### 3. 服务 (Services)

**authService.js**
- 认证业务逻辑
<!-- - 职责: 密码加密、令牌生成、验证 -->

**cardService.js**
- 卡片生成业务逻辑
- 职责: 卡片创建、转换格式、存储管理

**membershipService.js**
- 会员管理业务逻辑
- 职责: 会员状态、配额管理、升级处理

**aiService.js**
- AI生成业务逻辑
- 职责: OpenRouter API调用、提示词处理
- 流式数据处理、模型管理
- 安全密钥轮换和错误重试

### 4. 工具 (Utils)

**database.js**
- 数据库连接管理
- 职责: 建立和维护数据库连接、查询封装
- 安全连接配置和连接池管理

**jwtUtils.js**
- JWT相关工具函数
- 职责: 生成令牌、验证令牌、解码令牌

**responseUtils.js**
- 响应格式化工具
- 职责: 统一响应格式、错误处理辅助

**streamUtils.js**
- 流处理工具
- 职责: 创建流式响应、处理部分响应、超时管理

**securityUtils.js**
- 安全工具函数
- 职责: 敏感数据加密/解密、验证输入、防XSS/CSRF

**configUtils.js**
- 配置管理工具
- 职责: 加载环境配置、密钥管理、配置验证

## 七、认证与授权流程

### JWT认证流程

1. **用户登录**:
   - 用户提交邮箱/密码
   - 验证凭证
   - 生成JWT令牌
   - 返回令牌给客户端

2. **请求认证**:
   - 客户端在请求头中包含令牌
   - 服务器验证令牌有效性
   - 提取用户信息
   - 将用户信息附加到请求对象

3. **权限检查**:
   - 根据用户会员级别检查操作权限
   - 验证资源所有权(如卡片所有者)
   - 允许或拒绝请求

## 八、业务逻辑流程

### 卡片创建流程

```
接收请求 → 验证身份 → 检查配额 → 保存卡片基本信息 → 生成卡片内容 → 保存最终卡片 → 返回结果
```

### 卡片预览流程

```
接收请求 → 验证身份 → 检查卡片所有权 → 获取卡片 → 根据格式生成预览 → 返回预览内容
```

### 卡片下载流程

```
接收请求 → 验证身份 → 检查会员等级 → 检查下载配额 → 获取卡片 → 生成下载文件 → 记录下载历史 → 返回文件
```

## 九、本地与云端环境配置

<!-- ### 配置管理系统

**环境配置文件**:
```javascript
// src/config/development.js
module.exports = {
  database: {
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    maxConnections: 5,
    idleTimeout: 30000
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: '7d',
    cookieSecure: false
  },
  ai: {
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1',
    defaultModel: 'gpt-3.5-turbo',
    apiKey: process.env.OPENROUTER_API_KEY,
    timeout: 60000
  },
  security: {
    rateLimits: {
      auth: { max: 20, windowMs: 3600000 }, // 认证接口: 20次/小时
      general: { max: 100, windowMs: 3600000 }, // 普通接口: 100次/小时 
      ai: { max: 20, windowMs: 3600000 } // AI接口: 20次/小时
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      secretKey: process.env.ENCRYPTION_KEY
    }
  }
};

// src/config/production.js
module.exports = {
  // 生产环境配置，类似但有适当调整
  // ...
};

// src/config/index.js
const development = require('./development');
const production = require('./production');

const configs = { development, production };
const env = process.env.NODE_ENV || 'development';

module.exports = configs[env];
``` -->

### 环境切换机制

**环境变量管理**:
<!-- ```bash
# .env.development
DATABASE_URL=postgres://user:password@dev-instance.example.com:5432/card_generator_dev
JWT_SECRET=dev_jwt_secret_key
OPENROUTER_API_KEY=dev_openrouter_key
ENCRYPTION_KEY=dev_encryption_key

# .env.production 
DATABASE_URL=postgres://user:password@prod-instance.example.com:5432/card_generator_prod
JWT_SECRET=prod_jwt_secret_key
OPENROUTER_API_KEY=prod_openrouter_key
ENCRYPTION_KEY=prod_encryption_key
``` -->

**环境切换脚本**:
<!-- ```json
// package.json
{
  "scripts": {
    "dev": "cp .env.development .env && wrangler dev",
    "prod": "cp .env.production .env && wrangler dev",
    "deploy:dev": "cp .env.development .env && wrangler publish --env development",
    "deploy:prod": "cp .env.production .env && wrangler publish"
  }
}
``` -->

### 本地开发环境

**数据库连接**:
- 使用云端Neon PostgreSQL开发环境实例
- 通过环境变量配置连接字符串
- 使用安全的连接池配置

**本地启动**:
<!-- ```bash
# 启动本地开发环境
npm run dev
``` -->

**敏感信息处理**:
<!-- ```javascript
// src/utils/securityUtils.js
const crypto = require('crypto');
const config = require('../config');

// 加密敏感数据
function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    config.security.encryption.algorithm, 
    Buffer.from(config.security.encryption.secretKey, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    tag: cipher.getAuthTag().toString('hex') // GCM模式下的认证标签
  };
}

// 解密敏感数据
function decryptData(encryptedObj) {
  const decipher = crypto.createDecipheriv(
    config.security.encryption.algorithm,
    Buffer.from(config.security.encryption.secretKey, 'hex'),
    Buffer.from(encryptedObj.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encryptData, decryptData };
``` -->

### 云端环境

**数据库连接**:
- 使用Neon PostgreSQL生产环境实例
- 通过Cloudflare环境变量设置连接信息
- 启用SSL连接和安全配置

**部署配置**:
<!-- ```toml
# wrangler.toml
name = "card-generator-api"
main = "src/index.js"
compatibility_date = "2023-01-01"

# 默认环境(生产)
[vars]
API_VERSION = "1.0.0"
NODE_ENV = "production"

# 环境变量在Cloudflare Workers仪表板设置
# [vars]
# DATABASE_URL = "postgres://user:password@prod-instance.example.com:5432/card_generator_prod"
# JWT_SECRET = "..."
# OPENROUTER_API_KEY = "..."
# ENCRYPTION_KEY = "..."

# 开发环境
[env.development]
name = "card-generator-api-dev"
vars = { API_VERSION = "1.0.0", NODE_ENV = "development" }

# 生产环境Worker路由绑定
[triggers]
routes = [
  "api.yourdomain.com/*"
]

# 开发环境Worker路由绑定
[env.development.triggers]
routes = [
  "dev-api.yourdomain.com/*"
]
``` -->

## 十、数据库迁移管理

**使用Prisma管理迁移**:
<!-- ```bash
# 创建迁移
npx prisma migrate dev --name init

# 应用迁移到生产环境
npx prisma migrate deploy
``` -->

**迁移策略**:
- 开发阶段使用开发环境数据库
- 使用版本控制管理迁移文件
- 部署时自动应用未执行迁移

## 十一、性能优化策略

1. **数据库优化**:
   - 创建适当的索引
   - 优化查询语句
   - 使用连接池管理

2. **缓存策略**:
   - 使用内存缓存频繁访问的数据
   - 实现缓存失效机制
   - 考虑使用Cloudflare KV存储

3. **Worker优化**:
   - 减少冷启动时间
   - 优化代码包大小
   - 避免阻塞操作

## 十二、错误处理与日志

**错误处理策略**:
- 使用集中式错误处理中间件
- 区分操作错误和系统错误
- 提供用户友好的错误消息

**日志系统**:
- 请求日志记录
- 错误日志记录
- 配额使用日志

## 十三、安全措施

1. **数据安全**:
   - 密码加密存储(Bcrypt)
   - 敏感数据加密
   - 定期数据备份

2. **API安全**:
   - HTTPS加密
   - CORS适当配置
   - 速率限制防止滥用

3. **认证安全**:
   - JWT过期策略
   - 令牌轮换机制
   - 安全HTTP头设置

## 十四、OpenRouter AI集成详细设计

### 1. AI服务模块

<!-- ```javascript
// src/services/aiService.js
const fetch = require('node-fetch');
const { ReadableStream } = require('stream/web');
const config = require('../config');
const { encryptData, decryptData } = require('../utils/securityUtils');
const prisma = require('../utils/database');

class AIService {
  constructor() {
    this.endpoint = config.ai.endpoint;
    this.defaultModel = config.ai.defaultModel;
  }
  
  // 获取API密钥(带轮换机制)
  async getAPIKey() {
    try {
      // 从数据库获取活跃密钥
      const keys = await prisma.aPIKey.findMany({
        where: { 
          service: 'openrouter',
          isActive: true 
        },
        orderBy: { lastUsedAt: 'asc' } // 最长时间未使用的密钥优先
      });
      
      if (keys.length === 0) {
        // 回退到环境变量
        return config.ai.apiKey;
      }
      
      // 选择一个密钥并更新使用信息
      const selectedKey = keys[0];
      await prisma.aPIKey.update({
        where: { id: selectedKey.id },
        data: { 
          lastUsedAt: new Date(),
          usageCount: { increment: 1 }
        }
      });
      
      // 解密密钥
      return decryptData(JSON.parse(selectedKey.key));
    } catch (error) {
      console.error('Error getting API key:', error);
      // 回退到环境变量
      return config.ai.apiKey;
    }
  }
  
  // 常规(非流式)生成
  async generateContent(userId, prompt, parameters = {}) {
    try {
      // 记录生成请求
      const generation = await prisma.aIGeneration.create({
        data: {
          userId,
          prompt,
          systemPrompt: parameters.systemPrompt || null,
          parameters: parameters,
          modelUsed: parameters.model || this.defaultModel,
          status: 'processing'
        }
      });
      
      // 准备OpenRouter请求
      const apiKey = await this.getAPIKey();
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://card-generator.app', // 您的应用域名
          'X-Title': 'Card Generator App' // 您的应用名称
        },
        body: JSON.stringify({
          model: parameters.model || this.defaultModel,
          messages: [
            ...(parameters.systemPrompt ? [{ role: 'system', content: parameters.systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: parameters.temperature || 0.7,
          max_tokens: parameters.maxTokens || 1000,
          stream: false
        }),
        timeout: config.ai.timeout
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OpenRouter API error');
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      const tokenCount = data.usage.total_tokens;
      
      // 更新生成记录
      await prisma.aIGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'completed',
          content,
          tokenCount,
          completedAt: new Date()
        }
      });
      
      return {
        generationId: generation.id,
        content,
        tokenCount,
        model: data.model
      };
    } catch (error) {
      // 记录失败
      if (generation) {
        await prisma.aIGeneration.update({
          where: { id: generation.id },
          data: {
            status: 'failed',
            errorMessage: error.message,
            completedAt: new Date()
          }
        });
      }
      
      throw error;
    }
  }
  
  // 流式生成
  async generateContentStream(userId, prompt, parameters = {}) {
    try {
      // 记录生成请求
      const generation = await prisma.aIGeneration.create({
        data: {
          userId,
          prompt,
          systemPrompt: parameters.systemPrompt || null,
          parameters: parameters,
          modelUsed: parameters.model || this.defaultModel,
          status: 'processing'
        }
      });
      
      // 准备OpenRouter请求
      const apiKey = await this.getAPIKey();
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://card-generator.app',
          'X-Title': 'Card Generator App'
        },
        body: JSON.stringify({
          model: parameters.model || this.defaultModel,
          messages: [
            ...(parameters.systemPrompt ? [{ role: 'system', content: parameters.systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: parameters.temperature || 0.7,
          max_tokens: parameters.maxTokens || 1000,
          stream: true
        }),
        timeout: config.ai.timeout
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OpenRouter API error');
      }
      
      // 确保响应是流式的
      if (!response.body) {
        throw new Error('Streaming not supported');
      }
      
      // 创建转换流
      let fullContent = '';
      let tokenCount = 0;
      
      // 处理流完成和错误
      const handleCompletion = async (success, error = null) => {
        try {
          await prisma.aIGeneration.update({
            where: { id: generation.id },
            data: {
              status: success ? 'completed' : 'failed',
              content: success ? fullContent : null,
              errorMessage: error ? error.message : null,
              tokenCount: tokenCount || null,
              completedAt: new Date()
            }
          });
        } catch (dbError) {
          console.error('Error updating AI generation:', dbError);
        }
      };
      
      // 创建一个转换流，将OpenRouter响应转换为我们需要的格式
      const transformStream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // 流结束，记录完成状态
                await handleCompletion(true);
                controller.close();
                break;
              }
              
              // 解码数据块
              const chunk = decoder.decode(value, { stream: true });
              
              // 处理SSE格式
              const lines = chunk
                .split('\n')
                .filter(line => line.startsWith('data: ') && line !== 'data: [DONE]');
              
              for (const line of lines) {
                try {
                  const jsonStr = line.substring(6); // 移除 'data: '
                  const data = JSON.parse(jsonStr);
                  
                  if (data.choices && data.choices[0]) {
                    const content = data.choices[0].delta?.content || '';
                    
                    if (content) {
                      fullContent += content;
                      // 将数据推送到流
                      controller.enqueue(JSON.stringify({ 
                        type: 'content',
                        content,
                        fullContent
                      }) + '\n');
                    }
                  }
                  
                  // 提取token计数(如果有)
                  if (data.usage && data.usage.total_tokens) {
                    tokenCount = data.usage.total_tokens;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          } catch (error) {
            // 处理流错误
            await handleCompletion(false, error);
            controller.error(error);
          }
        }
      });
      
      return { stream: transformStream, generationId: generation.id };
    } catch (error) {
      // 记录失败
      if (generation) {
        await prisma.aIGeneration.update({
          where: { id: generation.id },
          data: {
            status: 'failed',
            errorMessage: error.message,
            completedAt: new Date()
          }
        });
      }
      
      throw error;
    }
  }
  
  // 获取可用模型
  async getAvailableModels() {
    try {
      const apiKey = await this.getAPIKey();
      const response = await fetch(`${this.endpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://card-generator.app',
          'X-Title': 'Card Generator App'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
  
  // 估算生成成本
  async estimateGenerationCost(prompt, parameters = {}) {
    // 简单的token估算
    const promptTokens = Math.ceil(prompt.length / 4); // 粗略估计
    const maxTokens = parameters.maxTokens || 1000;
    
    // 不同模型的成本估算(示例值)
    const costPerToken = {
      'gpt-3.5-turbo': 0.000002,
      'gpt-4': 0.00003,
      // 添加其他模型...
    };
    
    const model = parameters.model || this.defaultModel;
    const rate = costPerToken[model] || 0.000005; // 默认估算率
    
    return {
      estimatedTokens: promptTokens + maxTokens,
      estimatedCost: (promptTokens + maxTokens) * rate,
      model
    };
  }
}

module.exports = new AIService();
``` -->

### 2. 流式响应控制器

<!-- ```javascript
// src/controllers/aiController.js
const aiService = require('../services/aiService');
const membershipService = require('../services/membershipService');

// 流式生成内容
async function streamGenerateContent(req, res) {
  try {
    const { prompt, parameters = {} } = req.body;
    const userId = req.user.id;
    
    // 检查配额
    const canGenerate = await membershipService.checkAIGenerationQuota(userId);
    if (!canGenerate) {
      return res.status(403).json({
        message: 'AI generation quota exceeded'
      });
    }
    
    // 启动流式生成
    const { stream, generationId } = await aiService.generateContentStream(
      userId, 
      prompt, 
      parameters
    );
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 流式发送数据
    const reader = stream.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.write('data: [DONE]\n\n');
            res.end();
            break;
          }
          
          res.write(`data: ${value}\n\n`);
        }
      } catch (error) {
        console.error('Stream error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    };
    
    // 开始数据泵
    pump();
    
    // 更新使用统计
    await membershipService.incrementAIGenerationCount(userId);
  } catch (error) {
    console.error('AI generation error:', error);
    // 如果流还没有开始，返回常规错误响应
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Failed to generate content',
        error: error.message
      });
    } else {
      // 否则，发送错误事件
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}

module.exports = {
  streamGenerateContent,
  // 其他AI控制器方法...
};
``` -->

## 十五、初始开发计划

### 第一阶段：基础设置 (1-2天)
- 创建项目结构和配置系统
- 设置Neon PostgreSQL数据库连接
- 配置Cloudflare Worker环境变量和安全存储

### 第二阶段：数据模型和环境配置 (1-2天)
- 设计数据库模型(包含AI生成相关表)
- 创建Prisma模式
- 配置开发和生产环境切换机制
- 实现敏感信息加密存储

### 第三阶段：认证系统 (2-3天)
- 实现用户注册和登录
- 配置安全的JWT认证
- 创建权限中间件
- 实现基本的限流保护

### 第四阶段：AI服务集成 (3-5天)
- 实现OpenRouter API连接
- 设计AI提示词模板系统
- 开发流式响应处理
- 创建AI生成记录和管理

### 第五阶段：卡片功能 (2-3天)
- 实现卡片创建API
- 集成AI生成内容与卡片
- 实现卡片预览和下载功能
- 连接卡片与生成历史

### 第六阶段：会员系统 (2-3天)
- 实现会员等级管理
- 实现使用统计和配额限制
- 实现AI和下载配额控制

### 第七阶段：安全与优化 (2-3天)
- 实现全面的安全措施
- 添加输入验证和数据清洗
- 优化数据库查询和连接
- 添加错误监控和性能检测
