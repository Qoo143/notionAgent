/**
 * 工具函數集合
 * 提供通用的輔助功能
 */

/**
 * 格式化時間
 */
function formatTime(date, options = {}) {
    const defaults = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    const config = { ...defaults, ...options };
    
    return date.toLocaleTimeString('zh-TW', config);
}

/**
 * 格式化日期
 */
function formatDate(date, options = {}) {
    const defaults = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    
    const config = { ...defaults, ...options };
    
    return date.toLocaleDateString('zh-TW', config);
}

/**
 * 格式化相對時間
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return '剛剛';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} 分鐘前`;
    } else if (diffHours < 24) {
        return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
        return `${diffDays} 天前`;
    } else {
        return formatDate(date);
    }
}

/**
 * 防抖函數
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * 節流函數
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 深拷貝物件
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 生成唯一 ID
 */
function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 安全的 JSON 解析
 */
function safeJsonParse(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.warn('JSON 解析失敗:', error);
        return defaultValue;
    }
}

/**
 * 檢查是否為有效的 URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * 檢查是否為 Notion URL
 */
function isNotionUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('notion.so') || urlObj.hostname.includes('notion.com');
    } catch (_) {
        return false;
    }
}

/**
 * 提取 Notion 頁面 ID
 */
function extractNotionPageId(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        
        // Notion URL 格式: /username/page-title-{pageId}
        const match = pathname.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
        
        if (match) {
            return match[1].replace(/-/g, '');
        }
        
        return null;
    } catch (_) {
        return null;
    }
}

/**
 * 格式化檔案大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化數字（千分位）
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 截斷文字
 */
function truncateText(text, maxLength = 100, suffix = '...') {
    if (text.length <= maxLength) {
        return text;
    }
    
    return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 清理 HTML 標籤
 */
function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

/**
 * 轉義 HTML 字符
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 滾動到元素
 */
function scrollToElement(element, options = {}) {
    const defaults = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };
    
    const config = { ...defaults, ...options };
    
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (element) {
        element.scrollIntoView(config);
    }
}

/**
 * 複製文字到剪貼簿
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('📋 文字已複製到剪貼簿');
        return true;
    } catch (error) {
        console.error('❌ 複製失敗:', error);
        
        // 備用方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            console.log('📋 使用備用方法複製成功');
            return true;
        } catch (fallbackError) {
            console.error('❌ 備用方法也失敗:', fallbackError);
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

/**
 * 檢測瀏覽器支援
 */
function getBrowserSupport() {
    return {
        clipboard: !!navigator.clipboard,
        notifications: !!window.Notification,
        serviceWorker: !!navigator.serviceWorker,
        localStorage: (() => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        })(),
        webSockets: !!window.WebSocket,
        fetch: !!window.fetch
    };
}

/**
 * 本地儲存工具
 */
const storage = {
    set(key, value, expiry = null) {
        const item = {
            value: value,
            timestamp: Date.now(),
            expiry: expiry
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('❌ 儲存失敗:', error);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return defaultValue;
            
            const item = JSON.parse(itemStr);
            
            // 檢查是否過期
            if (item.expiry && Date.now() > item.expiry) {
                this.remove(key);
                return defaultValue;
            }
            
            return item.value;
        } catch (error) {
            console.error('❌ 讀取儲存失敗:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('❌ 移除儲存失敗:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('❌ 清除儲存失敗:', error);
            return false;
        }
    }
};

/**
 * 簡單的事件發射器
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }
    
    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error('❌ 事件處理器錯誤:', error);
            }
        });
    }
}

// 將工具函數暴露到全域
window.utils = {
    formatTime,
    formatDate,
    formatRelativeTime,
    debounce,
    throttle,
    deepClone,
    generateId,
    safeJsonParse,
    isValidUrl,
    isNotionUrl,
    extractNotionPageId,
    formatFileSize,
    formatNumber,
    truncateText,
    stripHtml,
    escapeHtml,
    scrollToElement,
    copyToClipboard,
    getBrowserSupport,
    storage,
    EventEmitter
};