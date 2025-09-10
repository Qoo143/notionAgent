const { Tool } = require('langchain/tools');

/**
 * Notion 搜尋頁面工具
 */
class NotionSearchTool extends Tool {
    constructor(notionService) {
        super();
        this.name = 'notion_search';
        this.description = `搜尋 Notion 頁面內容。輸入搜尋關鍵字，會回傳相關的頁面標題和 ID。
        輸入格式: 搜尋關鍵字
        範例: "專案計畫" 或 "會議記錄"`;
        this.notionService = notionService;
    }

    async _call(query) {
        try {
            console.log(`🔍 搜尋 Notion 頁面: ${query}`);
            const pages = await this.notionService.searchPages(query);
            
            if (pages.length === 0) {
                return '沒有找到相關的頁面';
            }

            const results = pages.slice(0, 5).map(page => {
                const title = this.notionService.getPageTitle(page);
                return `標題: ${title}\nID: ${page.id}\nURL: ${page.url}\n`;
            });

            return `找到 ${pages.length} 個相關頁面:\n\n${results.join('\n')}`;
        } catch (error) {
            return `搜尋時發生錯誤: ${error.message}`;
        }
    }
}

/**
 * Notion 獲取頁面內容工具
 */
class NotionGetPageTool extends Tool {
    constructor(notionService) {
        super();
        this.name = 'notion_get_page';
        this.description = `獲取指定 Notion 頁面的完整內容。需要提供頁面 ID。
        輸入格式: 頁面 ID
        範例: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"`;
        this.notionService = notionService;
    }

    async _call(pageId) {
        try {
            console.log(`📄 獲取頁面內容: ${pageId}`);
            
            // 清理頁面 ID（移除可能的 URL 前綴）
            const cleanPageId = pageId.replace(/.*\//, '').replace(/-/g, '');
            
            const [pageInfo, content] = await Promise.all([
                this.notionService.getPageInfo(cleanPageId),
                this.notionService.getPageContent(cleanPageId)
            ]);

            return `頁面標題: ${pageInfo.title}\n建立時間: ${pageInfo.created_time}\n最後編輯: ${pageInfo.last_edited_time}\n\n頁面內容:\n${content}`;
        } catch (error) {
            return `獲取頁面內容時發生錯誤: ${error.message}`;
        }
    }
}

/**
 * Notion 查詢資料庫工具
 */
class NotionQueryDatabaseTool extends Tool {
    constructor(notionService) {
        super();
        this.name = 'notion_query_database';
        this.description = `查詢 Notion 資料庫中的記錄。需要提供資料庫 ID。
        輸入格式: 資料庫 ID
        範例: "a1b2c3d4e5f67890abcdef1234567890"`;
        this.notionService = notionService;
    }

    async _call(databaseId) {
        try {
            console.log(`🗂️ 查詢資料庫: ${databaseId}`);
            
            // 清理資料庫 ID
            const cleanDatabaseId = databaseId.replace(/.*\//, '').replace(/-/g, '');
            
            const records = await this.notionService.queryDatabase(cleanDatabaseId);
            
            if (records.length === 0) {
                return '資料庫中沒有記錄';
            }

            const results = records.slice(0, 10).map((record, index) => {
                const title = this.notionService.getPageTitle(record);
                return `${index + 1}. ${title} (ID: ${record.id})`;
            });

            return `資料庫中有 ${records.length} 筆記錄，顯示前 10 筆:\n\n${results.join('\n')}`;
        } catch (error) {
            return `查詢資料庫時發生錯誤: ${error.message}`;
        }
    }
}

module.exports = {
    NotionSearchTool,
    NotionGetPageTool,
    NotionQueryDatabaseTool
};