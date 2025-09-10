# Notion AI Agent 前端設計文檔

## 🎯 設計目標

建立一個**簡潔、高效**的 Notion AI 聊天介面，專注於核心對話功能，並針對 Notion API 限制和智能搜索策略進行優化。

## 🔍 智能搜索策略視覺化

### **搜索流程設計**
```
用戶輸入 → 
語意分析提取3個關鍵字 → 
並行搜索獲取30個標題 → 
AI分析選擇最相關3個頁面 → 
遞歸獲取內容(最多3層) → 
AI整理分析回復
```

### **進度指示器設計**
```
🧠 分析語意中... (生成關鍵字)
🔍 搜索頁面... (1/3 關鍵字完成)
🎯 AI篩選最佳頁面... (分析30個結果)
📄 獲取內容... (第1頁/共3頁)
📑 獲取子頁面... (第2層/共3層)
🤖 AI整理回復中...
✅ 回復準備完成
```

## 📱 介面設計原則

### 1. **極簡設計**
- 單頁應用，專注於對話功能
- 清晰的訊息分離（用戶 vs AI）
- 最少的視覺干擾元素

### 2. **效能優先**
- 輕量級 CSS，無重型框架
- 簡單的 Vanilla JavaScript
- 快速載入和響應

### 3. **針對智能搜索優化**
- 詳細的搜索進度展示
- API 請求狀態指示器
- 錯誤處理和重試機制

## 🎨 視覺設計

### **色彩方案**
```css
主色調: #2d3748 (深灰藍)
次色調: #4a5568 (中灰)
強調色: #3182ce (藍色)
成功色: #38a169 (綠色)
警告色: #ed8936 (橙色)
錯誤色: #e53e3e (紅色)
背景色: #f7fafc (淺灰)
進度色: #805ad5 (紫色)
```

### **字體系統**
```css
主字體: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
程式碼: 'SFMono-Regular', Monaco, 'Cascadia Code', monospace
```

## 🏗️ 頁面結構

```
┌─────────────────────────────────────┐
│              標題欄                  │
│    🤖 Notion AI 助手 [狀態]          │
├─────────────────────────────────────┤
│                                     │
│          對話訊息區域                │
│                                     │
│  [用戶訊息]              [時間]      │
│              [AI回應] [時間]         │
│                                     │
│         [智能搜索進度條]              │
│         [當前步驟說明]                │
│                                     │
├─────────────────────────────────────┤
│            輸入區域                  │
│  [文字輸入框............] [送出]     │
│  [快速按鈕] [快速按鈕] [快速按鈕]    │
└─────────────────────────────────────┘
```

## 💬 對話介面設計

### **訊息類型**
1. **用戶訊息**
   - 靠右對齊，藍色背景
   - 圓角氣泡設計
   - 顯示發送時間

2. **AI 回應**
   - 靠左對齊，淺灰背景
   - 支援 Markdown 格式
   - 支援 Notion 連結高亮
   - 顯示來源頁面標籤

3. **搜索進度訊息**
   - 置中顯示，特殊樣式
   - 動態更新進度條
   - 顯示當前步驟和預估時間

### **特殊元素**
- **Notion 連結**: 自動識別並高亮，點擊開啟
- **程式碼區塊**: 語法高亮和複製按鈕
- **來源標籤**: 顯示資訊來源的頁面名稱
- **層級指示**: 顯示內容來自第幾層子頁面

## 🔄 智能搜索進度設計

### **步驟指示器**
```css
.search-progress {
  background: linear-gradient(90deg, #805ad5, #3182ce);
  border-radius: 20px;
  padding: 12px 16px;
  margin: 8px 0;
}

.search-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-step-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #38a169;
}

.search-step-text {
  color: white;
  font-size: 14px;
}
```

### **進度條動畫**
```css
@keyframes searchProgress {
  0% { width: 0%; }
  100% { width: 100%; }
}

.progress-bar {
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #38a169;
  animation: searchProgress 2s ease-in-out;
}
```

## 🎛️ 控制元件設計

### **輸入區域**
- **自適應文字框**: 自動調整高度（最大 4 行）
- **智能發送按鈕**: 根據搜索狀態變化
- **快速搜索按鈕**: 預設智能搜索指令

### **快速按鈕範例**
```
🔍 深度搜索  📝 會議總結  ✅ 任務分析  📊 數據整理
💡 創意發想  🔬 技術研究  📈 進度追蹤  🎯 目標規劃
```

## 📊 狀態指示器

### **搜索狀態**
- 🧠 語意分析中
- 🔍 關鍵字搜索中 (1/3)
- 🎯 AI篩選中
- 📄 內容獲取中 (第1層)
- 📑 子頁面探索中 (第2層)
- 🤖 智能整理中
- ✅ 完成

### **API 狀態**
- 📡 Notion API: 正常/限制中/錯誤
- 🤖 Gemini AI: 正常/限制中/錯誤
- ⚡ 搜索深度: 第X層/共3層

## 🎨 動畫效果

### **搜索進度動畫**
```css
@keyframes searchPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.searching {
  animation: searchPulse 2s infinite;
}
```

### **內容載入動畫**
```css
@keyframes contentLoad {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-item {
  animation: contentLoad 0.5s ease-out;
}
```

## 📱 響應式設計

### **斷點設計**
```css
/* 手機 */
@media (max-width: 768px) {
  .chat-container { margin: 0.5rem; }
  .message-bubble { max-width: 85%; }
  .search-progress { padding: 8px 12px; }
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  .chat-container { max-width: 600px; }
}

/* 桌面 */
@media (min-width: 1025px) {
  .chat-container { max-width: 800px; }
  .search-progress { padding: 16px 20px; }
}
```

## 🛠️ 技術實作

### **檔案結構**
```
public/
├── chat.html              # 主頁面
├── assets/
│   ├── css/
│   │   ├── main.css       # 基礎樣式
│   │   ├── chat.css       # 對話樣式
│   │   └── progress.css   # 進度指示器樣式
│   └── js/
│       ├── chat.js        # 對話邏輯
│       ├── api.js         # API 呼叫
│       ├── progress.js    # 進度追蹤
│       └── utils.js       # 工具函數
```

### **主要 JavaScript 模組**
- `ChatManager`: 管理對話狀態和歷史
- `SearchProgressTracker`: 追蹤智能搜索進度
- `APIClient`: 處理後端 API 呼叫
- `MessageRenderer`: 渲染訊息和格式化
- `NotionLinkHandler`: 處理 Notion 連結

## 🎯 智能搜索 UX 設計

### **搜索過程透明化**
```
用戶輸入: "幫我找最近的專案進度"

顯示進度:
🧠 理解語意... 提取關鍵字: "專案", "進度", "最近"
🔍 搜索中... 找到 28 個相關頁面
🎯 AI篩選... 選出 3 個最相關頁面
📄 讀取內容... 專案管理頁面 (第1頁)
📑 探索子頁面... 進度追蹤 (第2層)
🤖 整理回復... 分析完成
```

### **結果展示優化**
- 頁面來源標籤
- 內容層級指示 (第1層/第2層/第3層)
- 相關性評分指示
- 一鍵跳轉 Notion 按鈕

## 🚀 性能優化

### **搜索優化**
- 並行 API 請求
- 智能快取機制
- 請求去重和合併

### **載入優化**
- CSS 模組化載入
- JavaScript 按需載入
- 進度式內容渲染

## 🔍 Notion 專屬功能

### **智能搜索結果**
- 顯示搜索來源路徑
- 子頁面層級關係圖
- 內容相關性評分
- 快速導航到原始頁面

### **內容整理展示**
- 結構化資訊呈現
- 關鍵要點提取
- 時間線和進度追蹤
- 行動項目清單

---

**設計理念**: 智能而透明，讓用戶清楚了解 AI 如何深度分析 Notion 內容，提供最相關的回復。