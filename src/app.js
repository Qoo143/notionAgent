const { config, validateConfig } = require('../config/config');
const ExpressServer = require('./server/expressServer');
const NotionAgent = require('./agents/notionAgent');
const NotionService = require('./services/notionService');

// 路由類別
const SystemRoutes = require('./routes/systemRoutes');
const ChatRoutes = require('./routes/chatRoutes');
const HistoryRoutes = require('./routes/historyRoutes');
const NotionRoutes = require('./routes/notionRoutes');

/**
 * 主應用程式類別
 * 整合所有元件並啟動服務
 */
class NotionAgentApp {
    constructor() {
        this.expressServer = null;
        this.notionAgent = null;
        this.notionService = null;
        this.isInitialized = false;
    }

    /**
     * 初始化應用程式
     */
    async initialize() {
        try {
            console.log('🚀 開始初始化 Notion AI Agent...');

            // 1. 驗證配置
            await this.validateConfiguration();

            // 2. 初始化服務
            await this.initializeServices();

            // 3. 初始化 Express 伺服器
            await this.initializeServer();

            // 4. 註冊路由
            await this.registerRoutes();

            this.isInitialized = true;
            console.log('✅ Notion AI Agent 初始化完成');

        } catch (error) {
            console.error('❌ 應用程式初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 驗證配置
     */
    async validateConfiguration() {
        console.log('🔍 驗證配置中...');
        
        try {
            validateConfig();
            console.log('✅ 配置驗證通過');
        } catch (error) {
            console.error('❌ 配置驗證失敗:', error.message);
            console.log('💡 請確認 .env 檔案中包含以下環境變數:');
            console.log('   - NOTION_API_KEY');
            console.log('   - GOOGLE_API_KEY');
            throw error;
        }
    }

    /**
     * 初始化服務
     */
    async initializeServices() {
        console.log('🔧 初始化服務中...');

        // 初始化 Notion 服務
        this.notionService = new NotionService(config.notion.apiKey);
        console.log('✅ Notion 服務初始化完成');

        // 初始化 AI Agent
        this.notionAgent = new NotionAgent(config.gemini.apiKey, this.notionService);
        await this.notionAgent.initialize();
        console.log('✅ AI Agent 初始化完成');
    }

    /**
     * 初始化 Express 伺服器
     */
    async initializeServer() {
        console.log('🌐 初始化 Express 伺服器中...');
        
        this.expressServer = new ExpressServer(
            config.server.port,
            config.server.host
        );
        
        console.log('✅ Express 伺服器初始化完成');
    }

    /**
     * 註冊所有路由
     */
    async registerRoutes() {
        console.log('🛤️ 註冊路由中...');

        const app = this.expressServer.getApp();

        // 系統路由
        const systemRoutes = new SystemRoutes();
        systemRoutes.register(app);

        // 對話路由
        const chatRoutes = new ChatRoutes(this.notionAgent);
        chatRoutes.register(app);

        // 歷史記錄路由
        const historyRoutes = new HistoryRoutes(this.notionAgent);
        historyRoutes.register(app);

        // Notion API 路由
        const notionRoutes = new NotionRoutes(config.notion.apiKey);
        notionRoutes.register(app);

        console.log('✅ 路由註冊完成');
        this.logRegisteredRoutes();
    }

    /**
     * 記錄已註冊的路由
     */
    logRegisteredRoutes() {
        console.log('📋 API 端點列表:');
        console.log('   系統相關:');
        console.log('     GET  / - 歡迎頁面');
        console.log('     GET  /api/health - 健康檢查');
        console.log('     GET  /api/info - 系統資訊');
        console.log('     GET  /api/status - 詳細狀態');
        console.log('   對話相關:');
        console.log('     POST /api/chat - 對話介面');
        console.log('   歷史記錄:');
        console.log('     GET  /api/history - 所有會話列表');
        console.log('     GET  /api/history/:sessionId - 獲取對話歷史');
        console.log('     DELETE /api/history/:sessionId - 清除對話歷史');
        console.log('   Notion 相關:');
        console.log('     GET  /api/notion/search?q=關鍵字 - 搜尋頁面');
        console.log('     GET  /api/notion/page/:pageId - 獲取頁面內容');
        console.log('     GET  /api/notion/database/:databaseId - 查詢資料庫');
    }

    /**
     * 啟動應用程式
     */
    async start() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // 啟動 Express 伺服器
            await this.expressServer.start();

            console.log('🎉 Notion AI Agent 已成功啟動！');
            console.log(`🔗 服務地址: http://${config.server.host}:${config.server.port}`);

            return this;

        } catch (error) {
            console.error('❌ 應用程式啟動失敗:', error);
            process.exit(1);
        }
    }

    /**
     * 停止應用程式
     */
    async stop() {
        try {
            console.log('🛑 正在停止 Notion AI Agent...');
            
            if (this.expressServer) {
                await this.expressServer.stop();
            }
            
            console.log('✅ Notion AI Agent 已停止');
        } catch (error) {
            console.error('❌ 停止應用程式時發生錯誤:', error);
        }
    }

    /**
     * 獲取 Agent 實例
     */
    getAgent() {
        return this.notionAgent;
    }

    /**
     * 獲取 Express 伺服器實例
     */
    getServer() {
        return this.expressServer;
    }
}

module.exports = NotionAgentApp;