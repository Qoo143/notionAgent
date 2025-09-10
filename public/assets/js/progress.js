/**
 * 搜索進度追蹤器
 * 管理智能搜索進度的顯示和動畫
 */
class SearchProgressTracker {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isActive = false;
        this.currentStep = 0;
        this.totalSteps = 6;
        
        // 搜索步驟定義
        this.steps = [
            { id: 'analyze', icon: 'brain', text: '分析語意中...', detail: '提取關鍵字' },
            { id: 'search', icon: 'search', text: '搜索頁面中...', detail: '查詢相關內容' },
            { id: 'select', icon: 'target', text: 'AI篩選中...', detail: '選擇最佳頁面' },
            { id: 'content', icon: 'page', text: '獲取內容中...', detail: '讀取頁面詳情' },
            { id: 'recursive', icon: 'doc', text: '探索子頁面...', detail: '深度搜索' },
            { id: 'generate', icon: 'robot', text: 'AI整理中...', detail: '生成回復' }
        ];
    }

    /**
     * 開始搜索進度
     */
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.render();
        this.container.style.display = 'block';
        this.container.classList.add('searching');
    }

    /**
     * 更新進度
     */
    updateProgress(progress) {
        if (!this.isActive) return;
        
        // 確保進度物件有效
        const safeProgress = {
            step: progress?.step || this.currentStep || 1,
            percentage: progress?.percentage || 0,
            message: progress?.message || null
        };
        
        this.currentStep = safeProgress.step;
        this.updateStepStatus(safeProgress);
        this.updateProgressBar(safeProgress.percentage);
        
        // 更新當前步驟的詳細資訊
        if (safeProgress.message) {
            this.updateStepDetail(safeProgress.step - 1, safeProgress.message);
        }
    }

    /**
     * 完成搜索
     */
    complete(metadata = null) {
        this.isActive = false;
        this.currentStep = this.totalSteps;
        this.container.classList.remove('searching');
        this.container.classList.add('completed');
        
        // 更新最後一個步驟
        this.updateStepStatus({
            step: this.totalSteps,
            message: '回復準備完成',
            percentage: 100
        });
        
        this.updateProgressBar(100);
        
        // 顯示元數據
        if (metadata) {
            this.showMetadata(metadata);
        }
        
        // 3秒後隱藏進度指示器
        setTimeout(() => {
            this.hide();
        }, 3000);
    }

    /**
     * 搜索出錯
     */
    error(errorMessage) {
        this.isActive = false;
        this.container.classList.remove('searching');
        this.container.classList.add('error');
        
        const errorStep = this.container.querySelector(`.search-step[data-step="${this.currentStep}"]`);
        if (errorStep) {
            const detail = errorStep.querySelector('.search-step-detail');
            if (detail) {
                detail.textContent = errorMessage;
            }
        }
        
        // 5秒後隱藏
        setTimeout(() => {
            this.hide();
        }, 5000);
    }

    /**
     * 隱藏進度指示器
     */
    hide() {
        this.container.style.display = 'none';
        this.container.classList.remove('searching', 'completed', 'error');
        this.reset();
    }

    /**
     * 重設狀態
     */
    reset() {
        this.isActive = false;
        this.currentStep = 0;
    }

    /**
     * 渲染進度指示器
     */
    render() {
        const html = `
            <div class="search-step-list">
                ${this.steps.map((step, index) => `
                    <div class="search-step" data-step="${index + 1}">
                        <div class="search-step-icon step-icon-${step.icon}"></div>
                        <div class="search-step-content">
                            <div class="search-step-text">${step.text}</div>
                            <div class="search-step-detail">${step.detail}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-percentage">0%</div>
            </div>
            <div class="search-metadata" style="display: none;"></div>
        `;
        
        this.container.innerHTML = html;
    }

    /**
     * 更新步驟狀態
     */
    updateStepStatus(progress) {
        const steps = this.container.querySelectorAll('.search-step');
        
        steps.forEach((stepEl, index) => {
            const stepNumber = index + 1;
            
            // 清除所有狀態
            stepEl.classList.remove('active', 'completed');
            
            if (stepNumber < progress.step) {
                // 已完成的步驟
                stepEl.classList.add('completed');
            } else if (stepNumber === progress.step) {
                // 當前活動步驟
                stepEl.classList.add('active');
            }
        });
    }

    /**
     * 更新進度條
     */
    updateProgressBar(percentage) {
        // 確保百分比是有效數字
        const validPercentage = typeof percentage === 'number' ? Math.max(0, Math.min(100, percentage)) : 0;
        
        const progressFill = this.container.querySelector('.progress-fill');
        const progressText = this.container.querySelector('.progress-percentage');
        
        if (progressFill) {
            progressFill.style.width = `${validPercentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${validPercentage}%`;
        }
    }

    /**
     * 更新步驟詳細資訊
     */
    updateStepDetail(stepIndex, detail) {
        const step = this.container.querySelector(`.search-step[data-step="${stepIndex + 1}"]`);
        if (step) {
            const detailEl = step.querySelector('.search-step-detail');
            if (detailEl) {
                detailEl.textContent = detail;
            }
        }
    }

    /**
     * 顯示搜索元數據
     */
    showMetadata(metadata) {
        const metadataEl = this.container.querySelector('.search-metadata');
        if (!metadataEl || !metadata) return;
        
        const html = `
            <div class="metadata-item">
                <span class="metadata-label">關鍵字:</span>
                <span class="metadata-value">${metadata.keywords ? metadata.keywords.join(', ') : 'N/A'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">找到頁面:</span>
                <span class="metadata-value">${metadata.totalPagesFound || 0} 個</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">選擇頁面:</span>
                <span class="metadata-value">${metadata.selectedPages || 0} 個</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">處理時間:</span>
                <span class="metadata-value">${metadata.processingTime || 0} ms</span>
            </div>
        `;
        
        metadataEl.innerHTML = html;
        metadataEl.style.display = 'block';
    }
}

/**
 * 迷你進度指示器
 * 用於簡單的載入狀態
 */
class MiniProgressIndicator {
    constructor(text = '處理中...') {
        this.text = text;
        this.element = null;
    }

    show(container) {
        this.element = document.createElement('div');
        this.element.className = 'mini-progress';
        this.element.innerHTML = `
            <div class="mini-progress-spinner"></div>
            <span class="mini-progress-text">${this.text}</span>
        `;
        
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        container.appendChild(this.element);
        return this.element;
    }

    updateText(newText) {
        if (this.element) {
            const textEl = this.element.querySelector('.mini-progress-text');
            if (textEl) {
                textEl.textContent = newText;
            }
        }
    }

    hide() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}

// 全域實例
window.SearchProgressTracker = SearchProgressTracker;
window.MiniProgressIndicator = MiniProgressIndicator;