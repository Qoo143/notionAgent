const express = require('express');
const cors = require('cors');

/**
 * Express 伺服器基礎類別
 * 負責處理 HTTP 伺服器的基本設定和啟動
 */
class ExpressServer {
    constructor(port = 3000, host = 'localhost') {
        this.app = express();
        this.port = port;
        this.host = host;
        this.server = null;
        
        this.setupMiddleware();
    }

    /**
     * 設定基本中介軟體
     */
    setupMiddleware() {
        // CORS 設定
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // JSON 解析
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // 靜態檔案服務
        this.app.use(express.static('public'));

        // 請求日誌中介軟體
        this.app.use(this.requestLogger);

        // 安全標頭
        this.app.use(this.securityHeaders);
    }

    /**
     * 請求日誌中介軟體
     */
    requestLogger(req, res, next) {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl;
        const ip = req.ip || req.connection.remoteAddress;
        
        console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
        next();
    }

    /**
     * 安全標頭中介軟體
     */
    securityHeaders(req, res, next) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    }

    /**
     * 註冊路由
     */
    registerRoutes(routeHandler) {
        if (typeof routeHandler === 'function') {
            routeHandler(this.app);
        } else {
            throw new Error('路由處理器必須是一個函數');
        }
    }

    /**
     * 設定錯誤處理
     */
    setupErrorHandling() {
        // 404 處理
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: '找不到請求的資源',
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        });

        // 全域錯誤處理
        this.app.use((error, req, res, next) => {
            console.error('🚨 伺服器錯誤:', error);
            
            const statusCode = error.statusCode || 500;
            const message = error.message || '伺服器內部錯誤';
            
            res.status(statusCode).json({
                success: false,
                error: message,
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * 啟動伺服器
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                // 設定錯誤處理（在路由註冊後）
                this.setupErrorHandling();

                this.server = this.app.listen(this.port, this.host, () => {
                    console.log(`🌟 Express 伺服器已啟動`);
                    console.log(`📡 監聽地址: http://${this.host}:${this.port}`);
                    resolve(this.server);
                });

                this.server.on('error', (error) => {
                    console.error('❌ 伺服器啟動失敗:', error);
                    reject(error);
                });

                // 優雅關閉處理
                this.setupGracefulShutdown();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 設定優雅關閉
     */
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            console.log(`\n🛑 收到 ${signal} 信號，正在關閉伺服器...`);
            
            if (this.server) {
                this.server.close(() => {
                    console.log('✅ HTTP 伺服器已關閉');
                    process.exit(0);
                });

                // 強制關閉超時
                setTimeout(() => {
                    console.log('⚠️ 強制關閉伺服器');
                    process.exit(1);
                }, 10000);
            }
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }

    /**
     * 停止伺服器
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 伺服器已停止');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * 獲取 Express 應用實例
     */
    getApp() {
        return this.app;
    }
}

module.exports = ExpressServer;