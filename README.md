# Notion AI Agent 🤖

基於 Langchain.js 和 Google Gemini 的 Notion 對話機器人，能夠讀取和分析 Notion 內容。

## 功能特色

- 🔍 **智能搜尋**: 搜尋 Notion 頁面和資料庫
- 📄 **內容讀取**: 獲取完整的頁面內容和結構
- 🤖 **AI 對話**: 使用 Google Gemini 進行智能對話
- 💬 **會話管理**: 支援多個對話會話和歷史記錄
- 🛠️ **工具整合**: 基於 Langchain.js 的工具系統

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境配置

複製 `.env.example` 為 `.env` 並填入必要的 API 金鑰：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
# Notion API 配置
NOTION_API_KEY=your_notion_integration_token_here

# Google Gemini API 配置  
GOOGLE_API_KEY=your_google_gemini_api_key_here

# 伺服器配置
PORT=3000
```

### 3. 啟動應用

```bash
npm start
```

服務將在 `http://localhost:3000` 啟動。

## API 文檔

### 系統相關

- `GET /` - 歡迎頁面
- `GET /api/health` - 健康檢查
- `GET /api/info` - 系統資訊
- `GET /api/status` - 詳細狀態

### 對話相關

- `POST /api/chat` - 與 AI 對話

```json
{
  "message": "幫我搜尋專案相關的頁面",
  "sessionId": "user123"
}
```

### 歷史記錄

- `GET /api/history` - 獲取所有會話列表
- `GET /api/history/:sessionId` - 獲取特定會話歷史
- `DELETE /api/history/:sessionId` - 清除特定會話歷史

### Notion 相關

- `GET /api/notion/search?q=關鍵字` - 搜尋 Notion 頁面
- `GET /api/notion/page/:pageId` - 獲取頁面內容
- `GET /api/notion/database/:databaseId` - 查詢資料庫

## 專案結構

```
notionAgent/
├── src/
│   ├── agents/          # AI Agent 核心邏輯
│   ├── services/        # 服務層 (Notion, LLM)
│   ├── tools/          # Langchain 工具
│   ├── routes/         # Express 路由
│   ├── server/         # Express 伺服器配置
│   └── app.js          # 主應用程式
├── config/             # 配置檔案
├── index.js           # 入口點
└── package.json
```

## 使用範例

### 基本對話

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "幫我搜尋關於會議記錄的頁面",
    "sessionId": "demo"
  }'
```

### 搜尋 Notion 頁面

```bash
curl "http://localhost:3000/api/notion/search?q=專案計畫&limit=5"
```

### 獲取頁面內容

```bash
curl "http://localhost:3000/api/notion/page/YOUR_PAGE_ID"
```

## 環境變數說明

| 變數名稱 | 必要性 | 說明 |
|---------|--------|------|
| `NOTION_API_KEY` | 必要 | Notion 整合的 API 金鑰 |
| `GOOGLE_API_KEY` | 必要 | Google Gemini API 金鑰 |
| `PORT` | 可選 | 伺服器埠號 (預設: 3000) |
| `HOST` | 可選 | 伺服器主機 (預設: localhost) |
| `NODE_ENV` | 可選 | 執行環境 (development/production) |

## 取得 API 金鑰

### Notion API 金鑰

1. 前往 [Notion Developers](https://developers.notion.com/)
2. 建立新的整合 (Integration)
3. 複製 Internal Integration Token
4. 在你的 Notion 頁面中分享給這個整合

### Google Gemini API 金鑰

1. 前往 [Google AI Studio](https://aistudio.google.com/)
2. 建立 API 金鑰
3. 複製金鑰到環境變數

## 開發說明

這個專案採用模組化架構設計：

- **ExpressServer**: 處理 HTTP 伺服器基礎設定
- **NotionAgent**: AI 對話代理的核心邏輯
- **NotionService**: Notion API 的封裝
- **Routes**: 各種功能的路由處理
- **Tools**: Langchain 工具整合

## 授權

ISC License

## 貢獻

歡迎提交 Pull Request 或回報 Issue！