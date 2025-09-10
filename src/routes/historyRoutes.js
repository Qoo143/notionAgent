/**
 * 對話歷史相關路由
 */
class HistoryRoutes {
    constructor(notionAgent) {
        this.notionAgent = notionAgent;
    }

    /**
     * 註冊歷史記錄路由
     */
    register(app) {
        // GET /api/history/:sessionId - 獲取對話歷史
        app.get('/api/history/:sessionId', (req, res) => {
            try {
                const { sessionId } = req.params;
                const { limit = 50 } = req.query;

                if (!this.notionAgent) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Agent 服務暫時無法使用'
                    });
                }

                const history = this.notionAgent.getHistory(sessionId);
                const limitedHistory = history.slice(-parseInt(limit));

                res.json({
                    success: true,
                    data: {
                        sessionId,
                        history: limitedHistory,
                        total: history.length,
                        returned: limitedHistory.length
                    }
                });

            } catch (error) {
                console.error('獲取歷史記錄錯誤:', error);
                res.status(500).json({
                    success: false,
                    error: '獲取歷史記錄時發生錯誤',
                    details: error.message
                });
            }
        });

        // DELETE /api/history/:sessionId - 清除對話歷史
        app.delete('/api/history/:sessionId', (req, res) => {
            try {
                const { sessionId } = req.params;

                if (!this.notionAgent) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Agent 服務暫時無法使用'
                    });
                }

                this.notionAgent.clearHistory(sessionId);

                console.log(`🗑️ 已清除 ${sessionId} 的對話歷史`);

                res.json({
                    success: true,
                    data: {
                        message: `已清除 ${sessionId} 的對話歷史`,
                        sessionId,
                        timestamp: new Date().toISOString()
                    }
                });

            } catch (error) {
                console.error('清除歷史記錄錯誤:', error);
                res.status(500).json({
                    success: false,
                    error: '清除歷史記錄時發生錯誤',
                    details: error.message
                });
            }
        });

        // GET /api/history - 獲取所有會話列表
        app.get('/api/history', (req, res) => {
            try {
                if (!this.notionAgent) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Agent 服務暫時無法使用'
                    });
                }

                const sessions = Object.keys(this.notionAgent.conversationHistory || {});
                const sessionInfo = sessions.map(sessionId => {
                    const history = this.notionAgent.getHistory(sessionId);
                    return {
                        sessionId,
                        messageCount: history.length,
                        lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null
                    };
                });

                res.json({
                    success: true,
                    data: {
                        sessions: sessionInfo,
                        total: sessions.length
                    }
                });

            } catch (error) {
                console.error('獲取會話列表錯誤:', error);
                res.status(500).json({
                    success: false,
                    error: '獲取會話列表時發生錯誤',
                    details: error.message
                });
            }
        });
    }
}

module.exports = HistoryRoutes;