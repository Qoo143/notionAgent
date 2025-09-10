/**
 * 對話相關路由
 */
class ChatRoutes {
    constructor(notionAgent) {
        this.notionAgent = notionAgent;
        
        // 存儲進度連接的映射
        this.progressConnections = new Map();
    }

    /**
     * 註冊聊天路由
     */
    register(app) {
        // GET /api/chat/progress/:requestId - SSE 進度監聽端點
        app.get('/api/chat/progress/:requestId', (req, res) => {
            const { requestId } = req.params;
            
            // 設定 SSE 標頭
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });

            // 存儲連接以便發送進度更新
            this.progressConnections.set(requestId, res);
            
            // 發送初始連接確認
            res.write(`data: ${JSON.stringify({ type: 'connected', requestId })}\n\n`);
            
            console.log(`📡 SSE 進度連接已建立: ${requestId}`);

            // 客戶端斷開連接時清理
            req.on('close', () => {
                this.progressConnections.delete(requestId);
                console.log(`📡 SSE 進度連接已關閉: ${requestId}`);
            });
        });

        // POST /api/chat - 處理對話 (智能搜索模式)
        app.post('/api/chat', async (req, res) => {
            try {
                const { message, sessionId = 'default', useIntelligentSearch = true, requestId = null } = req.body;

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
                    // 設定進度回調函數
                    const progressCallback = requestId ? (progress) => {
                        const connection = this.progressConnections.get(requestId);
                        if (connection) {
                            try {
                                connection.write(`data: ${JSON.stringify(progress)}\n\n`);
                            } catch (error) {
                                console.error(`❌ 發送進度更新失敗 (${requestId}):`, error);
                                this.progressConnections.delete(requestId);
                            }
                        }
                    } : null;

                    // 使用智能搜索模式
                    const result = await this.notionAgent.intelligentChat(
                        message.trim(), 
                        sessionId,
                        progressCallback
                    );

                    console.log(`🤖 [${sessionId}] 智能搜索${result.searchUsed ? '已使用' : '未使用'}: ${result.response.substring(0, 100)}...`);

                    // 發送完成通知並關閉進度連接
                    if (requestId && this.progressConnections.has(requestId)) {
                        const connection = this.progressConnections.get(requestId);
                        try {
                            connection.write(`data: ${JSON.stringify({ type: 'completed', step: 6, totalSteps: 6, percentage: 100 })}\n\n`);
                            connection.end();
                        } catch (error) {
                            console.error(`❌ 關閉進度連接失敗 (${requestId}):`, error);
                        } finally {
                            this.progressConnections.delete(requestId);
                        }
                    }

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