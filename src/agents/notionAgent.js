const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { NotionSearchTool, NotionGetPageTool, NotionQueryDatabaseTool } = require('../tools/notionTools');
const IntelligentSearchService = require('../services/intelligentSearchService');

/**
 * Notion AI Agent
 * 整合 LLM 和 Notion 工具的主要代理程式
 */
class NotionAgent {
    constructor(geminiApiKey, notionService) {
        this.notionService = notionService;
        this.geminiApiKey = geminiApiKey;
        
        // 初始化 Gemini LLM
        this.llm = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: geminiApiKey,
            temperature: 0.7,
            maxOutputTokens: 2048,
        });

        // 初始化智能搜索服務
        this.intelligentSearch = new IntelligentSearchService(notionService, geminiApiKey);

        // 初始化工具
        this.tools = [
            new NotionSearchTool(notionService),
            new NotionGetPageTool(notionService),
            new NotionQueryDatabaseTool(notionService)
        ];

        // 對話歷史記錄
        this.conversationHistory = [];
        
        // 進度回調存儲
        this.progressCallbacks = new Map();
    }

    /**
     * 初始化 Agent
     */
    async initialize() {
        try {
            // 建立系統提示詞
            const systemPrompt = this.createSystemPrompt();
            
            // 初始化 Agent Executor
            this.executor = await initializeAgentExecutorWithOptions(
                this.tools,
                this.llm,
                {
                    agentType: "zero-shot-react-description",
                    verbose: true,
                    maxIterations: 5,
                    systemMessage: systemPrompt
                }
            );

            console.log('✅ Notion Agent 初始化成功');
        } catch (error) {
            console.error('❌ Agent 初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 建立系統提示詞
     */
    createSystemPrompt() {
        return `你是一個專業的 Notion AI 助手，專門幫助用戶查詢和分析 Notion 中的內容。

你的職責：
1. 根據用戶的問題，決定是否需要搜尋或獲取 Notion 內容
2. 使用適當的工具來獲取相關資訊
3. 整理並總結獲取到的資訊，提供有用的回答
4. 保持友善和專業的對話風格

可用工具：
- notion_search: 搜尋 Notion 頁面
- notion_get_page: 獲取特定頁面的完整內容
- notion_query_database: 查詢 Notion 資料庫

重要規則：
- 如果用戶詢問具體的 Notion 內容，務必使用工具查詢
- 提供答案時要引用來源頁面
- 如果找不到相關資訊，要明確告知用戶
- 用繁體中文回應
- 保持回答的簡潔和相關性`;
    }

    /**
     * 智能搜索聊天 - 新的主要方法
     */
    async intelligentChat(userInput, sessionId = 'default', progressCallback = null) {
        try {
            console.log(`💬 用戶輸入 (智能模式): ${userInput}`);

            // 添加到對話歷史
            this.addToHistory(sessionId, 'user', userInput);

            // 判斷是否需要搜索
            const needsSearch = await this.determineIfNeedsSearch(userInput);
            
            if (needsSearch) {
                // 使用智能搜索
                const searchResult = await this.intelligentSearch.intelligentSearch(
                    userInput, 
                    progressCallback
                );
                
                if (searchResult.success) {
                    // 添加回應到歷史
                    this.addToHistory(sessionId, 'assistant', searchResult.response);
                    
                    console.log(`🤖 智能搜索回應完成`);
                    return {
                        response: searchResult.response,
                        metadata: searchResult.metadata,
                        searchUsed: true
                    };
                } else {
                    throw new Error('智能搜索失敗');
                }
            } else {
                // 使用傳統對話模式
                return await this.traditionalChat(userInput, sessionId);
            }

        } catch (error) {
            console.error('❌ 智能對話處理錯誤:', error);
            return {
                response: '抱歉，處理您的請求時發生錯誤。請稍後再試。',
                error: error.message,
                searchUsed: false
            };
        }
    }

    /**
     * 傳統 Agent 對話模式
     */
    async traditionalChat(userInput, sessionId = 'default') {
        try {
            // 檢查是否初始化
            if (!this.executor) {
                await this.initialize();
            }

            // 建構包含歷史的輸入
            const inputWithContext = this.buildInputWithContext(userInput, sessionId);

            // 使用 Agent 處理請求
            const result = await this.executor.invoke({
                input: inputWithContext
            });

            const response = result.output || '抱歉，我無法處理這個請求。';

            // 添加回應到歷史
            this.addToHistory(sessionId, 'assistant', response);

            console.log(`🤖 傳統 Agent 回應: ${response}`);
            return {
                response: response,
                searchUsed: false
            };

        } catch (error) {
            console.error('❌ 傳統對話處理錯誤:', error);
            throw error;
        }
    }

    /**
     * 判斷是否需要搜索
     */
    async determineIfNeedsSearch(userInput) {
        const searchKeywords = [
            '搜尋', '搜索', '找', '查', '尋找', '查詢',
            '專案', '計畫', '會議', '記錄', '文件', '頁面',
            '進度', '狀態', '總結', '分析', '整理',
            '什麼', '哪些', '如何', '怎麼', '為什麼'
        ];

        const needsSearch = searchKeywords.some(keyword => 
            userInput.toLowerCase().includes(keyword)
        );

        // 排除簡單問候語
        const greetings = ['你好', '嗨', '哈囉', '謝謝', '再見'];
        const isGreeting = greetings.some(greeting => 
            userInput.includes(greeting) && userInput.length < 10
        );

        return needsSearch && !isGreeting;
    }

    /**
     * 處理用戶輸入 (保持向後相容)
     */
    async chat(userInput, sessionId = 'default') {
        const result = await this.intelligentChat(userInput, sessionId);
        return result.response;
    }

    /**
     * 添加到對話歷史
     */
    addToHistory(sessionId, role, content) {
        if (!this.conversationHistory[sessionId]) {
            this.conversationHistory[sessionId] = [];
        }

        this.conversationHistory[sessionId].push({
            role,
            content,
            timestamp: new Date().toISOString()
        });

        // 保持歷史記錄不超過 10 條
        if (this.conversationHistory[sessionId].length > 10) {
            this.conversationHistory[sessionId] = this.conversationHistory[sessionId].slice(-10);
        }
    }

    /**
     * 建構包含上下文的輸入
     */
    buildInputWithContext(userInput, sessionId) {
        const history = this.conversationHistory[sessionId] || [];
        
        if (history.length === 0) {
            return userInput;
        }

        const recentHistory = history.slice(-4); // 最近 4 條記錄
        const contextString = recentHistory
            .map(item => `${item.role}: ${item.content}`)
            .join('\n');

        return `對話歷史:\n${contextString}\n\n當前問題: ${userInput}`;
    }

    /**
     * 清除對話歷史
     */
    clearHistory(sessionId = 'default') {
        if (this.conversationHistory[sessionId]) {
            this.conversationHistory[sessionId] = [];
        }
        console.log(`🗑️ 已清除 ${sessionId} 的對話歷史`);
    }

    /**
     * 獲取對話歷史
     */
    getHistory(sessionId = 'default') {
        return this.conversationHistory[sessionId] || [];
    }
}

module.exports = NotionAgent;