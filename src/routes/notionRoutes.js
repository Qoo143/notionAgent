const NotionService = require('../services/notionService');

/**
 * Notion API 相關路由
 */
class NotionRoutes {
    constructor(notionApiKey) {
        this.notionService = new NotionService(notionApiKey);
    }

    /**
     * 註冊 Notion 路由
     */
    register(app) {
        // GET /api/notion/search - 搜尋 Notion 頁面
        app.get('/api/notion/search', async (req, res) => {
            try {
                const { q: query, limit = 10 } = req.query;

                if (!query || typeof query !== 'string' || query.trim().length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: '請提供搜尋關鍵字參數 q'
                    });
                }

                console.log(`🔍 搜尋 Notion: ${query}`);

                const results = await this.notionService.searchPages(query.trim());
                const limitedResults = results.slice(0, parseInt(limit));

                res.json({
                    success: true,
                    data: {
                        query: query.trim(),
                        results: limitedResults.map(page => ({
                            id: page.id,
                            title: this.notionService.getPageTitle(page),
                            url: page.url,
                            created_time: page.created_time,
                            last_edited_time: page.last_edited_time
                        })),
                        total: results.length,
                        returned: limitedResults.length
                    }
                });

            } catch (error) {
                console.error('搜尋 Notion 錯誤:', error);
                res.status(500).json({
                    success: false,
                    error: '搜尋時發生錯誤',
                    details: error.message
                });
            }
        });

        // GET /api/notion/page/:pageId - 獲取頁面內容
        app.get('/api/notion/page/:pageId', async (req, res) => {
            try {
                const { pageId } = req.params;

                if (!pageId) {
                    return res.status(400).json({
                        success: false,
                        error: '請提供頁面 ID'
                    });
                }

                console.log(`📄 獲取頁面: ${pageId}`);

                // 清理頁面 ID
                const cleanPageId = pageId.replace(/.*\//, '').replace(/-/g, '');

                const [pageInfo, content] = await Promise.all([
                    this.notionService.getPageInfo(cleanPageId),
                    this.notionService.getPageContent(cleanPageId)
                ]);

                res.json({
                    success: true,
                    data: {
                        page: pageInfo,
                        content: content,
                        contentLength: content.length
                    }
                });

            } catch (error) {
                console.error('獲取頁面內容錯誤:', error);
                
                if (error.code === 'object_not_found') {
                    res.status(404).json({
                        success: false,
                        error: '找不到指定的頁面'
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: '獲取頁面內容時發生錯誤',
                        details: error.message
                    });
                }
            }
        });

        // GET /api/notion/database/:databaseId - 查詢資料庫
        app.get('/api/notion/database/:databaseId', async (req, res) => {
            try {
                const { databaseId } = req.params;
                const { limit = 20 } = req.query;

                if (!databaseId) {
                    return res.status(400).json({
                        success: false,
                        error: '請提供資料庫 ID'
                    });
                }

                console.log(`🗂️ 查詢資料庫: ${databaseId}`);

                // 清理資料庫 ID
                const cleanDatabaseId = databaseId.replace(/.*\//, '').replace(/-/g, '');

                const records = await this.notionService.queryDatabase(cleanDatabaseId);
                const limitedRecords = records.slice(0, parseInt(limit));

                res.json({
                    success: true,
                    data: {
                        databaseId: cleanDatabaseId,
                        records: limitedRecords.map(record => ({
                            id: record.id,
                            title: this.notionService.getPageTitle(record),
                            url: record.url,
                            created_time: record.created_time,
                            last_edited_time: record.last_edited_time,
                            properties: record.properties
                        })),
                        total: records.length,
                        returned: limitedRecords.length
                    }
                });

            } catch (error) {
                console.error('查詢資料庫錯誤:', error);
                
                if (error.code === 'object_not_found') {
                    res.status(404).json({
                        success: false,
                        error: '找不到指定的資料庫'
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: '查詢資料庫時發生錯誤',
                        details: error.message
                    });
                }
            }
        });
    }
}

module.exports = NotionRoutes;