/**
 * 系統相關路由
 */
class SystemRoutes {
    constructor() {
        this.startTime = new Date();
    }

    /**
     * 註冊系統路由
     */
    register(app) {
        // GET /api/health - 健康檢查
        app.get('/api/health', (req, res) => {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            
            res.json({
                success: true,
                data: {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: {
                        seconds: Math.floor(uptime),
                        formatted: this.formatUptime(uptime)
                    },
                    memory: {
                        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
                    },
                    version: '1.0.0',
                    nodeVersion: process.version
                }
            });
        });

        // GET /api/info - 系統資訊
        app.get('/api/info', (req, res) => {
            res.json({
                success: true,
                data: {
                    name: 'Notion AI Agent',
                    version: '1.0.0',
                    description: '基於 Langchain.js 和 Gemini 的 Notion 對話機器人',
                    startTime: this.startTime.toISOString(),
                    endpoints: {
                        chat: 'POST /api/chat',
                        history: 'GET /api/history/:sessionId',
                        search: 'GET /api/notion/search',
                        page: 'GET /api/notion/page/:pageId',
                        database: 'GET /api/notion/database/:databaseId'
                    },
                    features: [
                        'Notion 內容搜尋',
                        '頁面內容讀取',
                        '資料庫查詢',
                        'AI 對話代理',
                        '對話歷史記錄',
                        'Session 管理'
                    ]
                }
            });
        });

        // GET /api/status - 詳細狀態
        app.get('/api/status', (req, res) => {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            res.json({
                success: true,
                data: {
                    system: {
                        platform: process.platform,
                        arch: process.arch,
                        nodeVersion: process.version,
                        pid: process.pid
                    },
                    performance: {
                        uptime: this.formatUptime(uptime),
                        memory: {
                            rss: memoryUsage.rss,
                            heapUsed: memoryUsage.heapUsed,
                            heapTotal: memoryUsage.heapTotal,
                            external: memoryUsage.external
                        },
                        cpu: {
                            user: cpuUsage.user,
                            system: cpuUsage.system
                        }
                    },
                    environment: {
                        nodeEnv: process.env.NODE_ENV || 'development',
                        hasNotionKey: !!process.env.NOTION_API_KEY,
                        hasGeminiKey: !!process.env.GOOGLE_API_KEY
                    }
                }
            });
        });

        // GET / - 根路徑
        app.get('/', (req, res) => {
            res.json({
                success: true,
                data: {
                    message: '歡迎使用 Notion AI Agent 🤖',
                    description: '這是一個基於 Langchain.js 和 Google Gemini 的 Notion 對話機器人',
                    documentation: '/api/info',
                    health: '/api/health'
                }
            });
        });
    }

    /**
     * 格式化運行時間
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}天`);
        if (hours > 0) parts.push(`${hours}小時`);
        if (minutes > 0) parts.push(`${minutes}分鐘`);
        if (secs > 0) parts.push(`${secs}秒`);

        return parts.join(' ') || '0秒';
    }
}

module.exports = SystemRoutes;