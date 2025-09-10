/**
 * 聊天管理器
 * 處理聊天介面的核心邏輯
 */
class ChatManager {
    constructor() {
        this.sessionId = 'session-' + Date.now();
        this.isProcessing = false;
        this.messageHistory = [];
        this.progressTracker = null;
        
        // DOM 元素
        this.messagesContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.typingIndicator = null;
        this.statusIndicator = null;
        
        this.init();
    }

    /**
     * 初始化聊天管理器
     */
    init() {
        // 等待 DOM 載入完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDOM());
        } else {
            this.initializeDOM();
        }
    }

    /**
     * 初始化 DOM 元素和事件監聽
     */
    initializeDOM() {
        // 獲取 DOM 元素
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.statusIndicator = document.getElementById('status');
        
        // 初始化進度追蹤器
        this.progressTracker = new SearchProgressTracker('searchProgress');
        
        // 設定事件監聽器
        this.setupEventListeners();
        
        // 初始化狀態
        this.updateStatus('準備就緒', 'success');
        
        // 載入歷史記錄（如果需要）
        this.loadHistory();
        
        // 聚焦輸入框
        if (this.messageInput) {
            this.messageInput.focus();
        }
        
        console.log('✅ ChatManager 初始化完成');
    }

    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        if (!this.messageInput || !this.sendButton) {
            console.error('❌ 無法找到必要的 DOM 元素');
            return;
        }

        // 發送按鈕點擊
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Enter 鍵發送（Shift+Enter 換行）
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 自動調整輸入框高度
        this.messageInput.addEventListener('input', (e) => this.autoResizeInput(e.target));

        // 快速按鈕事件
        this.setupQuickButtons();
    }

    /**
     * 設定快速按鈕
     */
    setupQuickButtons() {
        const quickButtons = document.querySelectorAll('.quick-btn');
        quickButtons.forEach(button => {
            button.addEventListener('click', () => {
                const message = button.textContent.trim().replace(/^[\u{1F000}-\u{1FFFF}]\s*/u, '');
                this.insertQuickMessage(message);
            });
        });
    }

    /**
     * 自動調整輸入框高度
     */
    autoResizeInput(element) {
        element.style.height = 'auto';
        element.style.height = Math.min(element.scrollHeight, 120) + 'px';
    }

    /**
     * 插入快速訊息
     */
    insertQuickMessage(message) {
        if (this.messageInput) {
            this.messageInput.value = message;
            this.messageInput.focus();
            this.autoResizeInput(this.messageInput);
        }
    }

    /**
     * 發送訊息
     */
    async sendMessage() {
        if (this.isProcessing) {
            console.log('⏳ 正在處理中，忽略新訊息');
            return;
        }

        const message = this.messageInput.value.trim();
        if (!message) {
            console.log('⚠️ 訊息為空，不發送');
            return;
        }

        try {
            // 設定處理狀態
            this.setProcessingState(true);
            
            // 清空輸入框並重設高度
            this.messageInput.value = '';
            this.autoResizeInput(this.messageInput);
            
            // 顯示用戶訊息
            this.addMessage(message, 'user');
            
            // 顯示處理狀態
            this.showTypingIndicator();
            this.updateStatus('AI 思考中...', 'processing');
            
            // 如果是搜索相關的訊息，顯示搜索進度
            const needsProgress = this.shouldShowProgress(message);
            if (needsProgress) {
                this.progressTracker.start();
            }
            
            // 發送到後端，並監聽進度更新
            const progressCallback = needsProgress ? (progress) => {
                // 實時更新進度條
                this.progressTracker.updateProgress(progress);
            } : null;

            const result = await window.apiClient.sendMessageWithProgress(
                message, 
                this.sessionId, 
                true, // 使用智能搜索
                progressCallback
            );
            
            if (result.success) {
                // 隱藏處理指示器
                this.hideTypingIndicator();
                
                // 完成搜索進度（如果有的話）
                if (needsProgress && result.data.searchUsed) {
                    this.progressTracker.complete(result.data.metadata);
                }
                
                // 顯示 AI 回應
                this.addMessage(result.data.response, 'bot', {
                    searchUsed: result.data.searchUsed,
                    metadata: result.data.metadata
                });
                
                this.updateStatus('回應完成', 'success');
                
            } else {
                throw new Error(result.error || '未知錯誤');
            }
            
        } catch (error) {
            console.error('❌ 發送訊息失敗:', error);
            
            this.hideTypingIndicator();
            this.progressTracker.error(error.message);
            
            this.addMessage(
                '抱歉，處理您的請求時發生錯誤。請稍後再試。\n' + 
                '錯誤詳情: ' + error.message, 
                'bot'
            );
            
            this.updateStatus('處理失敗', 'error');
            
        } finally {
            // 重設處理狀態
            this.setProcessingState(false);
            
            // 重新聚焦輸入框
            this.messageInput.focus();
        }
    }

    /**
     * 判斷是否應該顯示搜索進度
     */
    shouldShowProgress(message) {
        const progressKeywords = [
            '搜尋', '搜索', '找', '查', '尋找', '查詢',
            '分析', '總結', '整理', '比較'
        ];
        
        return progressKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
    }

    /**
     * 添加訊息到聊天區
     */
    addMessage(content, type, options = {}) {
        if (!this.messagesContainer) {
            console.error('❌ 找不到訊息容器');
            return;
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;

        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'message-bubble';

        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';

        // 根據類型處理內容
        if (type === 'user') {
            contentEl.textContent = content;
        } else {
            // Bot 訊息支援 Markdown 和特殊格式
            contentEl.innerHTML = this.formatBotMessage(content);
            
            // 添加來源資訊（如果有的話）
            if (options.metadata && options.metadata.sources) {
                const sourcesEl = this.createSourceTags(options.metadata.sources);
                contentEl.appendChild(sourcesEl);
            }
        }

        bubbleEl.appendChild(contentEl);

        // 添加時間戳
        const timeEl = document.createElement('div');
        timeEl.className = 'message-time';
        timeEl.textContent = this.formatTime(new Date());
        
        messageEl.appendChild(bubbleEl);
        messageEl.appendChild(timeEl);
        
        // 添加到訊息容器
        this.messagesContainer.appendChild(messageEl);
        
        // 滾動到底部
        this.scrollToBottom();
        
        // 保存到歷史記錄
        this.messageHistory.push({
            content,
            type,
            timestamp: new Date(),
            options
        });
    }

    /**
     * 格式化 Bot 訊息（支援 Markdown）
     */
    formatBotMessage(content) {
        return content
            // 粗體
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // 斜體
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 程式碼
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // 換行
            .replace(/\n/g, '<br>')
            // Notion 連結（簡單檢測）
            .replace(/https:\/\/www\.notion\.so\/[^\s]*/g, (url) => {
                return `<a href="${url}" class="notion-link" target="_blank" rel="noopener">${url}</a>`;
            });
    }

    /**
     * 建立來源標籤
     */
    createSourceTags(sources) {
        const sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'source-tags';
        
        sources.forEach(source => {
            const tag = document.createElement('a');
            tag.className = 'source-tag';
            tag.href = source.url;
            tag.target = '_blank';
            tag.rel = 'noopener';
            tag.textContent = source.title;
            sourcesContainer.appendChild(tag);
        });
        
        return sourcesContainer;
    }

    /**
     * 格式化時間
     */
    formatTime(date) {
        return date.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * 滾動到底部
     */
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    /**
     * 顯示打字指示器
     */
    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.add('show');
            this.scrollToBottom();
        }
    }

    /**
     * 隱藏打字指示器
     */
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.remove('show');
        }
    }

    /**
     * 更新狀態
     */
    updateStatus(message, type = 'info') {
        if (this.statusIndicator) {
            this.statusIndicator.textContent = message;
            
            // 更新狀態指示器顏色
            const indicator = document.querySelector('.status-indicator');
            if (indicator) {
                indicator.classList.remove('connecting', 'error');
                
                switch (type) {
                    case 'processing':
                        indicator.classList.add('connecting');
                        break;
                    case 'error':
                        indicator.classList.add('error');
                        break;
                    default:
                        // success 或其他，保持預設樣式
                        break;
                }
            }
        }
        
        console.log(`📊 狀態更新: ${message} (${type})`);
    }

    /**
     * 設定處理狀態
     */
    setProcessingState(processing) {
        this.isProcessing = processing;
        
        if (this.sendButton) {
            this.sendButton.disabled = processing;
            
            if (processing) {
                this.sendButton.classList.add('loading');
            } else {
                this.sendButton.classList.remove('loading');
            }
        }
        
        if (this.messageInput) {
            this.messageInput.disabled = processing;
        }
    }

    /**
     * 載入歷史記錄
     */
    async loadHistory() {
        try {
            const result = await window.apiClient.getHistory(this.sessionId);
            if (result.success && result.data.history.length > 0) {
                console.log(`📚 載入 ${result.data.history.length} 條歷史記錄`);
                
                result.data.history.forEach(item => {
                    this.addMessage(item.content, item.role === 'user' ? 'user' : 'bot');
                });
            }
        } catch (error) {
            console.log('📚 無法載入歷史記錄:', error.message);
        }
    }

    /**
     * 清除聊天記錄
     */
    async clearChat() {
        try {
            await window.apiClient.clearHistory(this.sessionId);
            
            if (this.messagesContainer) {
                this.messagesContainer.innerHTML = '';
            }
            
            this.messageHistory = [];
            this.updateStatus('對話已清除', 'success');
            
            console.log('🗑️ 聊天記錄已清除');
            
        } catch (error) {
            console.error('❌ 清除聊天記錄失敗:', error);
            this.updateStatus('清除失敗', 'error');
        }
    }
}

// 全域聊天管理器實例
window.chatManager = null;

// 當頁面載入完成時初始化
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});