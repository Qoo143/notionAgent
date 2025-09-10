/**
 * 對話相關路由
 */
class ChatRoutes {
    constructor(notionAgent) {
        this.notionAgent = notionAgent;
    }

    /**
     * 註冊聊天路由
     */
    register(app) {
        // POST /api/chat - 處理對話 (智能搜索模式)
        app.post('/api/chat', async (req, res) => {
            try {
                const { message, sessionId = 'default', useIntelligentSearch = true } = req.body;

                // 驗證輸入
                if (!message || typeof message !== 'string' || message.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: '請提供有效的訊息內容'
                    });
                }

                if (!this.notionAgent) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Agent 服務暫時無法使用'
                    });
                }

                console.log(`💬 [${sessionId}] 用戶: ${message}`);

                if (useIntelligentSearch) {
                    // 使用智能搜索模式
                    const result = await this.notionAgent.intelligentChat(
                        message.trim(), 
                        sessionId
                    );

                    console.log(`🤖 [${sessionId}] 智能搜索${result.searchUsed ? '已使用' : '未使用'}: ${result.response.substring(0, 100)}...`);

                    res.json({
                        success: true,
                        data: {
                            response: result.response,
                            sessionId,
                            timestamp: new Date().toISOString(),
                            searchUsed: result.searchUsed,
                            metadata: result.metadata || null
                        }
                    });
                } else {
                    // 使用傳統模式
                    const response = await this.notionAgent.chat(message.trim(), sessionId);

                    console.log(`🤖 [${sessionId}] 傳統模式: ${response.substring(0, 100)}...`);

                    res.json({
                        success: true,
                        data: {
                            response,
                            sessionId,
                            timestamp: new Date().toISOString(),
                            searchUsed: false
                        }
                    });
                }

            } catch (error) {
                console.error('對話處理錯誤:', error);
                res.status(500).json({
                    success: false,
                    error: '處理對話時發生錯誤',
                    details: error.message
                });
            }
        });

        // POST /api/chat/stream - 串流對話 (未來擴展用)
        app.post('/api/chat/stream', async (req, res) => {
            try {
                res.status(501).json({
                    success: false,
                    error: '串流對話功能尚未實作'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
}

module.exports = ChatRoutes;