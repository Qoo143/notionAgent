#!/usr/bin/env node

const NotionAgentApp = require('./src/app');

/**
 * 主入口點
 */
async function main() {
    console.log('🤖 Notion AI Agent Starting...');
    console.log('=====================================');
    
    try {
        const app = new NotionAgentApp();
        await app.start();
        
        // 保持程式運行
        console.log('🔄 程式運行中... (按 Ctrl+C 停止)');
        
    } catch (error) {
        console.error('💥 程式啟動失敗:', error);
        process.exit(1);
    }
}

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
    console.error('🚨 未捕獲的異常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 未處理的 Promise 拒絕:', reason);
    console.error('Promise:', promise);
    process.exit(1);
});

// 啟動應用程式
if (require.main === module) {
    main();
}

module.exports = NotionAgentApp;