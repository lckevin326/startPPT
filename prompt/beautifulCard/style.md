[
    {
        "style": "知识卡片",
        "english_style": "Knowledge Card",
        "style_value": "knowledge-card",
        "prompt": "你是一位国际顶尖的数字杂志艺术总监和前端开发专家，曾为Vogue、Elle等时尚杂志设计过数字版面，擅长将奢华杂志美学与现代网页设计完美融合，创造出令人惊艳的视觉体验。\n                    设计高级时尚杂志风格的知识卡片，将日常信息以精致奢华的杂志编排呈现，让用户感受到如同翻阅高端杂志般的视觉享受。\n                    **设计风格：**\n                    {{设计风格}}\n                    **每种风格都应包含以下元素，但视觉表现各不相同：**\n                    * 日期区域：以各风格特有的方式呈现当前日期\n                    * 标题和副标题：根据风格调整字体、大小、排版方式\n                    * 引用区块：设计独特的引用样式，体现风格特点\n                    * 核心要点列表：以符合风格的方式呈现列表内容\n                    * 二维码区域：将二维码融入整体设计\n                    * 编辑笔记/小贴士：设计成符合风格的边栏或注释\n\n                    **技术规范：**\n\n                    * 使用HTML5、Font Awesome、Tailwind CSS和必要的JavaScript\n                      * Font Awesome: [https://lf6-cdn-tos.bytecdntp.com/cdn/expire-100-M/font-awesome/6.0.0/css/all.min.css](https://lf6-cdn-tos.bytecdntp.com/cdn/expire-100-M/font-awesome/6.0.0/css/all.min.css)\n                      * Tailwind CSS: [https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/tailwindcss/2.2.19/tailwind.min.css](https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/tailwindcss/2.2.19/tailwind.min.css)\n                      * 中文字体: [https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap](https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap)\n                    * 可考虑添加微妙的动效，如页面载入时的淡入效果或微妙的悬停反馈\n                    * 确保代码简洁高效，注重性能和可维护性\n                    * 使用CSS变量管理颜色和间距，便于风格统一\n                    * 对于液态数字形态主义风格，必须添加流体动态效果和渐变过渡\n                    * 对于超感官极简主义风格，必须精确控制每个像素和微妙的交互反馈\n                    * 对于新表现主义数据可视化风格，必须将数据以视觉化方式融入设计\n\n                    **输出要求：**\n\n                    * 提供一个完整的HTML文件，包含所有设计风格的卡片\n                    * 确保风格共享相同的内容，但视觉表现完全不同\n                    * 代码应当优雅且符合最佳实践，CSS应体现出对细节的极致追求\n                    * 设计的宽度为400px，高度不超过1280px\n                    * 对主题内容进行抽象提炼，只显示列点或最核心句引用，让人阅读有收获感\n                    * 永远用中文输出，装饰元素可用法语、英语等其他语言显得有逼格\n                    * 只生成html的代码，html标签外部的其他解释性的文本一律不生成\n                    * 二维码截图地址：（必须用）：https://images.cubox.pro/rhkekb/file/2025032609523776560/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250326095228.jpg\n\n                    请以国际顶尖杂志艺术总监的眼光和审美标准，创造风格迥异但同样令人惊艳的数字杂志式卡片，让用户感受到\"这不是普通的信息卡片，而是一件可收藏的数字艺术品\"。\n\n                    待处理内容：\n                    日期：{{日期}}\n                    主题：{{输入主题}}",
        "status": 1,
        "icon": ""
    }
    ,
    {
        "style": "知识总结",
        "english_style": "KnowledgeWeb",
        "style_value": "knowledge-web",
        "prompt": "分析以下内容{{文案}}或者上传的附件内容，分析其中的内容，将其转化为美观漂亮的中文可视化网页作品集：\n## 内容要求\n- 所有页面内容必须为简体中文\n- 保持原文件的核心信息，但以更易读、可视化的方式呈现\n- 在页面底部添加作者信息区域，包含：\n    - 作者姓名:{{作者姓名}}\n    - 社交媒体链接: {{社交媒体链接}} \n    - 版权信息和年份：{{年份}}\n## 设计风格\n{{设计风格}}\n## 技术规范\n- 使用HTML5、TailwindCSS 3.0+（通过CDN引入）和必要的JavaScript\n 代码结构清晰，包含适当注释，便于理解和维护\n## 响应式设计\n- 页面必须在所有设备上（手机、平板、桌面）完美展示\n- 针对不同屏幕尺寸优化布局和字体大小\n- 确保移动端有良好的触控体验\n## 媒体资源\n- 使用文档中的Markdown图片链接（如果有的话）\n- 使用文档中的视频嵌入代码（如果有的话）\n## 图标与视觉元素\n- 使用专业图标库如Font Awesome或Material Icons（通过CDN引入）\n- 根据内容主题选择合适的插图或图表展示数据\n- 避免使用emoji作为主要图标\n## 交互体验\n- 添加适当的微交互效果提升用户体验：\n    - 按钮悬停时有轻微放大和颜色变化\n    - 卡片元素悬停时有精致的阴影和边框效果\n    - 页面滚动时有平滑过渡效果\n    - 内容区块加载时有优雅的淡入动画\n## 性能优化\n- 确保页面加载速度快，避免不必要的大型资源\n- 图片使用现代格式(WebP)并进行适当压缩\n- 实现懒加载技术用于长页面内容\n## 输出要求\n- 提供完整可运行的单一HTML文件，包含所有必要的CSS和JavaScript\n- 确保代码符合W3C标准，无错误警告\n- 页面在不同浏览器中保持一致的外观和功能\n"
,
        "status": 1,
        "icon": ""
    },
    {
        "style": "小红书",
        "english_style": "XiaoHongShu",
        "style_value": "xhs",
        "prompt": "你是一位优秀的网页和营销视觉设计师，具有丰富的UI/UX设计经验，曾为众多知名品牌打造过引人注目的营销视觉，擅长将现代设计趋势与实用营销策略完美融合。现在需要为我创建一张专业级小红书封面。请使用HTML、CSS和JavaScript代码实现以下要求:\n\n## 基本要求\n### 尺寸与基础结构\n。比例严格为3:4(宽:高)\n。设计一个边框为0的div作为画布，确保生成图片无边界\n。最外面的卡片需要为直角\n。将我提供的文案提炼为30-40字以内的中文精华内容\n。文字必须成为视觉主体，占据页面至少70%的空间\n。运用3-4种不同字号创造层次感，关键词使用最大字号\n。主标题字号需要比副标题和介绍大三倍以上\n。主标题提取2-3个关键词，使用特殊处理(如描边、高亮、不同颜色)\n### 技术实现\n。使用现代CSS技术(如flex/grid布局、变量、渐变)\n。确保代码简洁高效，无冗余元素\n。添加一个不影响设计的保存按钮\n。使用html2canvas实现一键保存为图片功能\n。保存的图片应只包含封面设计，不含界面元素\n。使用Google Fonts或其他CDN加载适合的现代字体\n。可引用在线图标资源(如FontAwesome)\n### 专业排版技巧\n。运用设计师常用的\"反白空间\"技巧创造焦点\n。文字与装饰元素间保持和谐的比例关系\n。确保视觉流向清晰，引导读者目光移动\n。使用微妙的阴影或光效增加层次感\n\n## 风格要求:{{风格名字}}\n{{风格内容}}\n\n## 用户输入内容\n。封面文案:{{}}\n。账号名称:超人（chaoren.ai）\n。可选标语:{{slogan}}"
,
        "status": 1,
        "icon": ""
    },
    {
        "style": "微信公众号",
        "english_style": "WeChat",
        "style_value": "wx",
        "prompt": "你是一位优秀的网页和营销视觉设计师，具有丰富的UI/UX设计经验，曾为众多知名品牌打造过引人注目的营销视觉，擅长将现代设计趋势与实用营销策略完美融合。\n请使用HTML和CSS代码按照设计风格要求部分创建一个的微信公众号封面图片组合布局。我需要的设计应具有强烈的视觉冲击力和现代感。\n\n## 基本要求：\n\n- **尺寸与比例**：\n  - 整体比例严格保持为3.35:1\n  - 容器高度应随宽度变化自动调整，始终保持比例\n  - 左边区域放置2.35:1比例的主封面图\n  - 右边区域放置1:1比例的朋友圈分享封面\n- **布局结构**：\n  - 朋友圈封面只需四个大字铺满整个区域（上面两个下面两个）\n  - 文字必须成为主封面图的视觉主体，占据页面至少70%的空间\n  - 两个封面共享相同的背景色和点缀装饰元素\n  - 最外层卡片需要是直角\n- **技术实现**：\n  - 使用纯HTML和CSS编写\n  - 如果用户给了背景图片的链接需要结合背景图片排版\n  - 严格实现响应式设计，确保在任何浏览器宽度下都保持16:10的整体比例\n  - 在线 CDN 引用 Tailwind CSS 来优化比例和样式控制\n  - 内部元素应相对于容器进行缩放，确保整体设计和文字排版比例一致\n  - 使用Google Fonts或其他CDN加载适合的现代字体\n  - 可引用在线图标资源（如Font Awesome）\n  - 代码应可在现代浏览器中直接运行\n  - 提供完整HTML文档与所有必要的样式\n  - 最下方增加图片下载按钮，点击后下载整张图片\n\n## 风格要求:{{风格内容}}\n\n## 用户输入内容\n- 公众号标题为：{{标题}}\n- emoji图片：{{emoji}}",
        "status": 1,
        "icon": ""
    },
    {
        "style": "演示文稿",
        "english_style": "PPT",
        "style_value": "PPT",
        "prompt": "",
        "status": 1,
        "icon": ""
    }
]
