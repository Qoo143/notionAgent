const { GoogleGenerativeAI } = require('@langchain/google-genai');

/**
 * Gemini LLM 服務配置
 * 處理與 Google Gemini API 的互動
 */
class LLMService {
    constructor(apiKey) {
        this.llm = new GoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: apiKey,
            temperature: 0.7,
            maxOutputTokens: 2048,
        });
    }

    /**
     * 生成回應
     */
    async generate(prompt) {
        try {
            const response = await this.llm.invoke(prompt);
            return response.content || response;
        } catch (error) {
            console.error('LLM 生成回應時發生錯誤:', error);
            throw error;
        }
    }

    /**
     * 串流生成回應
     */
    async *generateStream(prompt) {
        try {
            const stream = await this.llm.stream(prompt);
            for await (const chunk of stream) {
                yield chunk.content || chunk;
            }
        } catch (error) {
            console.error('LLM 串流生成時發生錯誤:', error);
            throw error;
        }
    }
}

module.exports = LLMService;