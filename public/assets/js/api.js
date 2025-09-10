/**
 * API 呼叫封裝
 * 處理與後端的所有通信
 */
class APIClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * 基本 HTTP 請求方法
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...(options.headers || {}) },
            ...options
        };

        try {
            console.log(`🌐 API 請求: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API 回應:`, data);
            
            return data;
            
        } catch (error) {
            console.error(`❌ API 錯誤 (${url}):`, error);
            throw error;
        }
    }

    /**
     * GET 請求
     */
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * POST 請求
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE 請求
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ===================
    // 業務 API 方法
    // ===================

    /**
     * 發送聊天訊息
     */
    async sendMessage(message, sessionId = 'default', useIntelligentSearch = true) {
        return this.post('/api/chat', {
            message,
            sessionId,
            useIntelligentSearch
        });
    }

    /**
     * 發送聊天訊息並監聽進度更新
     */
    async sendMessageWithProgress(message, sessionId = 'default', useIntelligentSearch = true, progressCallback = null) {
        // 生成唯一的請求ID來關聯進度事件
        const requestId = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // 如果有進度回調，開始監聽 SSE
        let eventSource = null;
        if (progressCallback && useIntelligentSearch) {
            eventSource = new EventSource(`/api/chat/progress/${requestId}`);
            
            eventSource.onmessage = (event) => {
                try {
                    const progress = JSON.parse(event.data);
                    progressCallback(progress);
                } catch (error) {
                    console.error('進度解析錯誤:', error);
                }
            };
            
            eventSource.onerror = (error) => {
                console.error('進度監聽錯誤:', error);
                eventSource.close();
            };
        }
        
        try {
            // 發送聊天請求，包含請求ID
            const result = await this.post('/api/chat', {
                message,
                sessionId,
                useIntelligentSearch,
                requestId
            });
            
            // 關閉 SSE 連接
            if (eventSource) {
                eventSource.close();
            }
            
            return result;
            
        } catch (error) {
            // 發生錯誤時確保關閉 SSE 連接
            if (eventSource) {
                eventSource.close();
            }
            throw error;
        }
    }

    /**
     * 獲取對話歷史
     */
    async getHistory(sessionId) {
        return this.get(`/api/history/${sessionId}`);
    }

    /**
     * 清除對話歷史
     */
    async clearHistory(sessionId) {
        return this.delete(`/api/history/${sessionId}`);
    }

    /**
     * 獲取所有會話列表
     */
    async getSessions() {
        return this.get('/api/history');
    }

    /**
     * 搜尋 Notion 頁面
     */
    async searchNotion(query, limit = 10) {
        return this.get('/api/notion/search', { q: query, limit });
    }

    /**
     * 獲取 Notion 頁面內容
     */
    async getNotionPage(pageId) {
        return this.get(`/api/notion/page/${pageId}`);
    }

    /**
     * 查詢 Notion 資料庫
     */
    async queryNotionDatabase(databaseId, limit = 20) {
        return this.get(`/api/notion/database/${databaseId}`, { limit });
    }

    /**
     * 獲取系統健康狀態
     */
    async getHealth() {
        return this.get('/api/health');
    }

    /**
     * 獲取系統資訊
     */
    async getSystemInfo() {
        return this.get('/api/info');
    }

    /**
     * 獲取詳細狀態
     */
    async getStatus() {
        return this.get('/api/status');
    }
}

// 創建全域 API 客戶端實例
window.apiClient = new APIClient();