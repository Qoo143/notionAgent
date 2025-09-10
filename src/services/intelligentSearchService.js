const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

/**
 * 智能搜索服務
 * 實作六步驟搜索策略：語意分析 → 關鍵字搜索 → AI篩選 → 內容獲取 → 遞歸探索 → 智能整理
 */
class IntelligentSearchService {
    constructor(notionService, geminiApiKey) {
        this.notionService = notionService;
        this.llm = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: geminiApiKey,
            temperature: 0.3,
            maxOutputTokens: 2048,
        });
        
        // 搜索配置
        this.config = {
            maxKeywords: 3,          // 最多3個關鍵字
            maxResults: 30,          // 最多30個搜索結果
            maxSelectedPages: 3,     // 最多選擇3個頁面
            maxDepth: 3,            // 最多3層遞歸
            searchDelay: 350        // API請求間隔(ms)
        };
    }

    /**
     * 主要搜索入口
     */
    async intelligentSearch(userQuery, progressCallback = null) {
        try {
            const searchContext = {
                userQuery,
                startTime: Date.now(),
                totalSteps: 6,
                currentStep: 0
            };

            // 步驟1: 語意分析，提取關鍵字
            searchContext.currentStep = 1;
            this.updateProgress(progressCallback, searchContext, '🧠 分析語意中...', searchContext.currentStep, 17);
            const keywords = await this.extractKeywords(userQuery);

            // 步驟2: 並行搜索獲取標題
            searchContext.currentStep = 2;
            this.updateProgress(progressCallback, searchContext, '🔍 搜索頁面中...', searchContext.currentStep, 33);
            const allPages = await this.parallelSearch(keywords, progressCallback);

            // 步驟3: AI篩選最佳頁面
            searchContext.currentStep = 3;
            this.updateProgress(progressCallback, searchContext, '🎯 AI篩選最佳頁面...', searchContext.currentStep, 50);
            const selectedPages = await this.selectBestPages(allPages, userQuery);

            // 步驟4: 遞歸獲取內容
            searchContext.currentStep = 4;
            this.updateProgress(progressCallback, searchContext, '📄 獲取頁面內容...', searchContext.currentStep, 67);
            const pageContents = await this.getPageContentsRecursively(selectedPages, progressCallback);

            // 步驟5: 智能整理回復
            searchContext.currentStep = 5;
            this.updateProgress(progressCallback, searchContext, '🤖 AI整理回復中...', searchContext.currentStep, 83);
            const response = await this.generateIntelligentResponse(userQuery, pageContents);

            // 步驟6: 完成
            searchContext.currentStep = 6;
            this.updateProgress(progressCallback, searchContext, '✅ 回復準備完成', searchContext.currentStep, 100);

            return {
                success: true,
                response: response,
                metadata: {
                    keywords: keywords,
                    totalPagesFound: allPages.length,
                    selectedPages: selectedPages.length,
                    processingTime: Date.now() - searchContext.startTime,
                    sources: selectedPages.map(page => ({
                        title: page.title,
                        id: page.id,
                        url: page.url
                    }))
                }
            };

        } catch (error) {
            console.error('智能搜索失敗:', error);
            throw error;
        }
    }

    /**
     * 步驟1: 提取關鍵字
     */
    async extractKeywords(userQuery) {
        const prompt = `
你是一個專業的語意分析師。請從用戶問題中提取最重要的搜索關鍵字。

用戶問題: "${userQuery}"

要求:
1. 提取最多3個關鍵字
2. 關鍵字要精準且具有搜索價值
3. 優先選擇名詞和具體概念
4. 避免停用詞和過於泛泛的詞彙

請以JSON格式回應:
{
  "keywords": ["關鍵字1", "關鍵字2", "關鍵字3"],
  "reasoning": "選擇這些關鍵字的理由"
}`;

        try {
            const response = await this.llm.invoke(prompt);
            const content = response.content || response;
            
            // 嘗試解析JSON回應
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.keywords.slice(0, this.config.maxKeywords);
            }
            
            // 備用方案：簡單分詞
            return this.fallbackKeywordExtraction(userQuery);
            
        } catch (error) {
            console.error('關鍵字提取失敗:', error);
            return this.fallbackKeywordExtraction(userQuery);
        }
    }

    /**
     * 備用關鍵字提取
     */
    fallbackKeywordExtraction(userQuery) {
        // 簡單的關鍵字提取邏輯
        const words = userQuery.split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !['的', '了', '是', '在', '和', '與', '或', '但', '然後', '因為', '所以'].includes(word))
            .slice(0, this.config.maxKeywords);
        
        return words.length > 0 ? words : [userQuery];
    }

    /**
     * 步驟2: 並行搜索
     */
    async parallelSearch(keywords, progressCallback = null) {
        const allPages = new Map(); // 用Map去重
        
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            
            // 不在這裡發送進度更新，因為這會干擾主要的進度流程
            console.log(`🔍 搜索關鍵字: ${keyword} (${i + 1}/${keywords.length})`);
            
            try {
                // 每個關鍵字搜索多次以獲得更多結果
                const searches = [
                    this.notionService.searchPages(keyword),
                    this.notionService.searchPages(`${keyword} 專案`),
                    this.notionService.searchPages(`${keyword} 計畫`)
                ];
                
                const results = await Promise.all(searches);
                
                // 合併結果並去重
                results.forEach(searchResult => {
                    searchResult.forEach(page => {
                        if (!allPages.has(page.id)) {
                            allPages.set(page.id, {
                                id: page.id,
                                title: this.notionService.getPageTitle(page),
                                url: page.url,
                                created_time: page.created_time,
                                last_edited_time: page.last_edited_time,
                                original: page
                            });
                        }
                    });
                });
                
                // API請求間隔
                if (i < keywords.length - 1) {
                    await this.delay(this.config.searchDelay);
                }
                
            } catch (error) {
                console.error(`搜索關鍵字 "${keyword}" 失敗:`, error);
            }
        }
        
        const results = Array.from(allPages.values()).slice(0, this.config.maxResults);
        console.log(`🔍 搜索完成: 找到 ${results.length} 個不重複頁面`);
        return results;
    }

    /**
     * 步驟3: AI篩選最佳頁面
     */
    async selectBestPages(allPages, userQuery) {
        if (allPages.length <= this.config.maxSelectedPages) {
            return allPages;
        }

        const prompt = `
你是一個智能內容篩選師。請從以下頁面中選出最符合用戶問題的頁面。

用戶問題: "${userQuery}"

可選頁面:
${allPages.map((page, index) => 
    `${index + 1}. 標題: ${page.title}\n   ID: ${page.id}\n   最後編輯: ${page.last_edited_time}`
).join('\n\n')}

要求:
1. 選擇最多${this.config.maxSelectedPages}個最相關的頁面
2. 考慮標題相關性和時間新近性
3. 優先選擇可能包含具體內容的頁面

請以JSON格式回應:
{
  "selectedIndices": [0, 1, 2],
  "reasoning": "選擇理由"
}`;

        try {
            const response = await this.llm.invoke(prompt);
            const content = response.content || response;
            
            // 解析JSON回應
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const selectedPages = parsed.selectedIndices
                    .filter(index => index >= 0 && index < allPages.length)
                    .slice(0, this.config.maxSelectedPages)
                    .map(index => allPages[index]);
                
                console.log(`🎯 AI篩選完成: 選擇 ${selectedPages.length} 個頁面`);
                return selectedPages;
            }
            
        } catch (error) {
            console.error('AI篩選失敗:', error);
        }
        
        // 備用方案：選擇前幾個
        return allPages.slice(0, this.config.maxSelectedPages);
    }

    /**
     * 步驟4: 遞歸獲取頁面內容
     */
    async getPageContentsRecursively(pages, progressCallback = null, currentDepth = 1) {
        const contents = [];
        
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            // 不在這裡發送進度更新，因為這會干擾主要的進度流程
            console.log(`📄 讀取內容: ${page.title} (第${currentDepth}層, ${i + 1}/${pages.length})`);
            
            try {
                // 獲取頁面基本信息和內容
                const [pageInfo, content] = await Promise.all([
                    this.notionService.getPageInfo(page.id),
                    this.notionService.getPageContent(page.id)
                ]);
                
                const pageContent = {
                    ...pageInfo,
                    content: content,
                    depth: currentDepth,
                    children: []
                };
                
                // 如果未達最大深度，搜索子頁面
                if (currentDepth < this.config.maxDepth) {
                    const childPages = await this.findChildPages(page.id);
                    if (childPages.length > 0) {
                        // 不在這裡發送進度更新，因為這會干擾主要的進度流程
                        console.log(`📑 探索子頁面: ${page.title} (第${currentDepth + 1}層)`);
                        
                        pageContent.children = await this.getPageContentsRecursively(
                            childPages, 
                            progressCallback, 
                            currentDepth + 1
                        );
                    }
                }
                
                contents.push(pageContent);
                
                // API請求間隔
                await this.delay(this.config.searchDelay);
                
            } catch (error) {
                console.error(`獲取頁面內容失敗 (${page.title}):`, error);
                // 添加錯誤記錄但繼續處理其他頁面
                contents.push({
                    id: page.id,
                    title: page.title,
                    content: '無法獲取內容',
                    depth: currentDepth,
                    children: [],
                    error: error.message
                });
            }
        }
        
        return contents;
    }

    /**
     * 尋找子頁面
     */
    async findChildPages(pageId) {
        try {
            // 這裡可以實作子頁面搜索邏輯
            // 暫時返回空陣列，可以後續擴展
            return [];
        } catch (error) {
            console.error(`尋找子頁面失敗 (${pageId}):`, error);
            return [];
        }
    }

    /**
     * 步驟6: 生成智能回復
     */
    async generateIntelligentResponse(userQuery, pageContents) {
        const prompt = `
你是一個專業的資訊整理師。請根據用戶問題和提供的內容，生成一個有用、準確的回復。

用戶問題: "${userQuery}"

可用內容:
${pageContents.map(page => `
標題: ${page.title}
層級: 第${page.depth}層
內容: ${page.content}
${page.children.length > 0 ? `子頁面: ${page.children.length}個` : ''}
---`).join('\n')}

要求:
1. 回復要直接回答用戶的問題
2. 整理並結構化相關資訊
3. 引用具體的來源頁面
4. 如果內容不足以回答問題，誠實說明
5. 使用清晰的格式，包含標題、要點、結論

回復格式:
- 使用適當的標題和分段
- 重要資訊用粗體標示
- 如有清單，使用項目符號
- 在最後列出資料來源`;

        try {
            const response = await this.llm.invoke(prompt);
            const content = response.content || response;
            
            // 添加來源資訊
            const sources = pageContents.map(page => `📄 [${page.title}](${page.url})`).join('\n');
            
            return `${content}\n\n---\n**資料來源:**\n${sources}`;
            
        } catch (error) {
            console.error('生成回復失敗:', error);
            throw error;
        }
    }

    /**
     * 更新進度
     */
    updateProgress(callback, context, message, step, customPercentage = null) {
        const percentage = customPercentage !== null ? customPercentage : Math.round((step / context.totalSteps) * 100);
        
        if (callback) {
            const progress = {
                message: message,
                step: step,
                totalSteps: context.totalSteps,
                percentage: percentage
            };
            
            try {
                callback(progress);
            } catch (error) {
                console.error(`❌ 進度更新發送失敗:`, error);
            }
        }
        
        console.log(`[搜索進度 ${step}/${context.totalSteps}] ${message} (${percentage}%)`);
    }

    /**
     * 延遲函數
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = IntelligentSearchService;