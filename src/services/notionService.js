const { Client } = require('@notionhq/client');

/**
 * Notion API 服務類別
 * 提供讀取 Notion 資料的核心功能
 */
class NotionService {
    constructor(apiKey) {
        this.notion = new Client({
            auth: apiKey
        });
    }

    /**
     * 搜尋 Notion 頁面
     */
    async searchPages(query) {
        try {
            const response = await this.notion.search({
                query,
                filter: {
                    value: 'page',
                    property: 'object'
                }
            });
            return response.results;
        } catch (error) {
            console.error('搜尋頁面時發生錯誤:', error);
            throw error;
        }
    }

    /**
     * 獲取頁面內容
     */
    async getPageContent(pageId) {
        try {
            const response = await this.notion.blocks.children.list({
                block_id: pageId,
                page_size: 100
            });
            return this.extractTextFromBlocks(response.results);
        } catch (error) {
            console.error('獲取頁面內容時發生錯誤:', error);
            throw error;
        }
    }

    /**
     * 查詢資料庫
     */
    async queryDatabase(databaseId, filter = {}) {
        try {
            const response = await this.notion.databases.query({
                database_id: databaseId,
                filter
            });
            return response.results;
        } catch (error) {
            console.error('查詢資料庫時發生錯誤:', error);
            throw error;
        }
    }

    /**
     * 從區塊中提取文字內容
     */
    extractTextFromBlocks(blocks) {
        let text = '';
        
        for (const block of blocks) {
            switch (block.type) {
                case 'paragraph':
                    text += this.extractRichText(block.paragraph.rich_text) + '\n\n';
                    break;
                case 'heading_1':
                    text += '# ' + this.extractRichText(block.heading_1.rich_text) + '\n\n';
                    break;
                case 'heading_2':
                    text += '## ' + this.extractRichText(block.heading_2.rich_text) + '\n\n';
                    break;
                case 'heading_3':
                    text += '### ' + this.extractRichText(block.heading_3.rich_text) + '\n\n';
                    break;
                case 'bulleted_list_item':
                    text += '• ' + this.extractRichText(block.bulleted_list_item.rich_text) + '\n';
                    break;
                case 'numbered_list_item':
                    text += '1. ' + this.extractRichText(block.numbered_list_item.rich_text) + '\n';
                    break;
                case 'to_do':
                    const checked = block.to_do.checked ? '[✓]' : '[ ]';
                    text += `${checked} ${this.extractRichText(block.to_do.rich_text)}\n`;
                    break;
                case 'quote':
                    text += '> ' + this.extractRichText(block.quote.rich_text) + '\n\n';
                    break;
                case 'code':
                    const language = block.code.language || '';
                    text += '```' + language + '\n' + this.extractRichText(block.code.rich_text) + '\n```\n\n';
                    break;
                case 'divider':
                    text += '---\n\n';
                    break;
            }
        }
        
        return text.trim();
    }

    /**
     * 提取富文本內容
     */
    extractRichText(richTextArray) {
        if (!richTextArray || !Array.isArray(richTextArray)) {
            return '';
        }
        return richTextArray.map(text => text.plain_text).join('');
    }

    /**
     * 獲取頁面基本資訊
     */
    async getPageInfo(pageId) {
        try {
            const page = await this.notion.pages.retrieve({
                page_id: pageId
            });
            
            // 提取標題
            const title = this.getPageTitle(page);
            
            return {
                id: page.id,
                title: title,
                url: page.url,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time
            };
        } catch (error) {
            console.error('獲取頁面資訊時發生錯誤:', error);
            throw error;
        }
    }

    /**
     * 提取頁面標題
     */
    getPageTitle(page) {
        const properties = page.properties;
        
        // 尋找標題屬性
        for (const [key, prop] of Object.entries(properties)) {
            if (prop.type === 'title') {
                return this.extractRichText(prop.title);
            }
        }
        
        return '無標題';
    }
}

module.exports = NotionService;