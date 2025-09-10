require('dotenv').config();

const config = {
    // Notion API 配置
    notion: {
        apiKey: process.env.NOTION_API_KEY
    },

    // Google Gemini API 配置
    gemini: {
        apiKey: process.env.GOOGLE_API_KEY
    },

    // 伺服器配置
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Agent 配置
    agent: {
        maxConversationHistory: 10,
        maxIterations: 5,
        temperature: 0.7,
        maxTokens: 2048
    }
};

// 驗證必要的配置
const validateConfig = () => {
    const requiredKeys = [
        'NOTION_API_KEY',
        'GOOGLE_API_KEY'
    ];

    const missing = requiredKeys.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`缺少必要的環境變數: ${missing.join(', ')}`);
    }
};

module.exports = {
    config,
    validateConfig
};