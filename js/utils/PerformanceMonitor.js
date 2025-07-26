/**
 * Performance Monitor
 * Tracks game performance metrics and provides optimization insights
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            frameTime: [],
            memoryUsage: [],
            renderTime: [],
            updateTime: []
        };
        
        this.isMonitoring = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.startTime = Date.now();
        
        // Performance thresholds
        this.thresholds = {
            minFPS: 30,
            maxFrameTime: 33.33, // 30 FPS = 33.33ms per frame
            maxMemoryMB: 100,
            maxRenderTime: 16.67 // 60 FPS = 16.67ms per frame
        };
        
        // Monitoring intervals
        this.fpsInterval = null;
        this.memoryInterval = null;
        
        this.initializeMonitoring();
    }
    
    initializeMonitoring() {
        if (GameConfig.PERFORMANCE.DEBUG_MODE) {
            this.startMonitoring();
        }
        
        // Create performance display if needed
        if (GameConfig.PERFORMANCE.SHOW_FPS) {
            this.createPerformanceDisplay();
        }
    }
    
    startMonitoring() {
        this.isMonitoring = true;
        this.startTime = Date.now();
        
        // Monitor FPS
        this.fpsInterval = setInterval(() => {
            this.updateFPSMetrics();
        }, 1000);
        
        // Monitor memory usage
        if (performance.memory) {
            this.memoryInterval = setInterval(() => {
                this.updateMemoryMetrics();
            }, 5000);
        }
        
        console.log('Performance monitoring started');
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.fpsInterval) {
            clearInterval(this.fpsInterval);
            this.fpsInterval = null;
        }
        
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
            this.memoryInterval = null;
        }
        
        console.log('Performance monitoring stopped');
    }
    
    // Frame timing
    startFrame() {
        this.frameStartTime = performance.now();
    }
    
    endFrame() {
        if (!this.isMonitoring) return;
        
        const frameTime = performance.now() - this.frameStartTime;
        this.recordFrameTime(frameTime);
        this.frameCount++;
        
        // Update FPS display if enabled
        if (GameConfig.PERFORMANCE.SHOW_FPS) {
            this.updatePerformanceDisplay();
        }
    }
    
    // Render timing
    startRender() {
        this.renderStartTime = performance.now();
    }
    
    endRender() {
        if (!this.isMonitoring) return;
        
        const renderTime = performance.now() - this.renderStartTime;
        this.recordRenderTime(renderTime);
    }
    
    // Update timing
    startUpdate() {
        this.updateStartTime = performance.now();
    }
    
    endUpdate() {
        if (!this.isMonitoring) return;
        
        const updateTime = performance.now() - this.updateStartTime;
        this.recordUpdateTime(updateTime);
    }
    
    // Metric recording
    recordFrameTime(frameTime) {
        this.metrics.frameTime.push(frameTime);
        this.limitArraySize(this.metrics.frameTime, 60); // Keep last 60 frames
        
        // Check for performance issues
        if (frameTime > this.thresholds.maxFrameTime) {
            this.logPerformanceWarning('High frame time', frameTime);
        }
    }
    
    recordRenderTime(renderTime) {
        this.metrics.renderTime.push(renderTime);
        this.limitArraySize(this.metrics.renderTime, 60);
        
        if (renderTime > this.thresholds.maxRenderTime) {
            this.logPerformanceWarning('High render time', renderTime);
        }
    }
    
    recordUpdateTime(updateTime) {
        this.metrics.updateTime.push(updateTime);
        this.limitArraySize(this.metrics.updateTime, 60);
    }
    
    updateFPSMetrics() {
        const now = Date.now();
        const elapsed = now - this.lastFrameTime;
        
        if (elapsed >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / elapsed);
            this.metrics.fps.push(fps);
            this.limitArraySize(this.metrics.fps, 60);
            
            // Reset counters
            this.frameCount = 0;
            this.lastFrameTime = now;
            
            // Check FPS threshold
            if (fps < this.thresholds.minFPS) {
                this.logPerformanceWarning('Low FPS', fps);
            }
        }
    }
    
    updateMemoryMetrics() {
        if (!performance.memory) return;
        
        const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        this.metrics.memoryUsage.push(memoryMB);
        this.limitArraySize(this.metrics.memoryUsage, 60);
        
        if (memoryMB > this.thresholds.maxMemoryMB) {
            this.logPerformanceWarning('High memory usage', memoryMB);
        }
    }
    
    // Performance analysis
    getAverageFPS() {
        return this.calculateAverage(this.metrics.fps);
    }
    
    getAverageFrameTime() {
        return this.calculateAverage(this.metrics.frameTime);
    }
    
    getAverageRenderTime() {
        return this.calculateAverage(this.metrics.renderTime);
    }
    
    getMemoryUsage() {
        const latest = this.metrics.memoryUsage;
        return latest.length > 0 ? latest[latest.length - 1] : 0;
    }
    
    getPerformanceReport() {
        return {
            fps: {
                current: this.getCurrentFPS(),
                average: this.getAverageFPS(),
                min: Math.min(...this.metrics.fps),
                max: Math.max(...this.metrics.fps)
            },
            frameTime: {
                average: this.getAverageFrameTime(),
                min: Math.min(...this.metrics.frameTime),
                max: Math.max(...this.metrics.frameTime)
            },
            renderTime: {
                average: this.getAverageRenderTime(),
                min: Math.min(...this.metrics.renderTime),
                max: Math.max(...this.metrics.renderTime)
            },
            memory: {
                current: this.getMemoryUsage(),
                average: this.calculateAverage(this.metrics.memoryUsage),
                peak: Math.max(...this.metrics.memoryUsage)
            },
            uptime: Date.now() - this.startTime
        };
    }
    
    // Performance optimization suggestions
    getOptimizationSuggestions() {
        const suggestions = [];
        const report = this.getPerformanceReport();
        
        if (report.fps.average < this.thresholds.minFPS) {
            suggestions.push('Consider reducing visual effects or particle count');
            suggestions.push('Optimize render loop and reduce draw calls');
        }
        
        if (report.renderTime.average > this.thresholds.maxRenderTime) {
            suggestions.push('Optimize rendering pipeline');
            suggestions.push('Consider using object pooling for frequently created objects');
        }
        
        if (report.memory.current > this.thresholds.maxMemoryMB) {
            suggestions.push('Check for memory leaks');
            suggestions.push('Implement garbage collection optimization');
        }
        
        if (report.frameTime.max > this.thresholds.maxFrameTime * 2) {
            suggestions.push('Reduce complexity of update logic');
            suggestions.push('Consider spreading heavy operations across multiple frames');
        }
        
        return suggestions;
    }
    
    // Display creation
    createPerformanceDisplay() {
        const display = document.createElement('div');
        display.id = 'performance-display';
        display.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            min-width: 200px;
        `;
        
        document.body.appendChild(display);
    }
    
    updatePerformanceDisplay() {
        const display = document.getElementById('performance-display');
        if (!display) return;
        
        const report = this.getPerformanceReport();
        
        display.innerHTML = `
            <div>FPS: ${report.fps.current || 0}</div>
            <div>Frame: ${report.frameTime.average?.toFixed(2) || 0}ms</div>
            <div>Render: ${report.renderTime.average?.toFixed(2) || 0}ms</div>
            <div>Memory: ${report.memory.current?.toFixed(1) || 0}MB</div>
            <div>Uptime: ${Math.floor(report.uptime / 1000)}s</div>
        `;
    }
    
    // Utility methods
    getCurrentFPS() {
        const fps = this.metrics.fps;
        return fps.length > 0 ? fps[fps.length - 1] : 0;
    }
    
    calculateAverage(array) {
        if (array.length === 0) return 0;
        return array.reduce((sum, value) => sum + value, 0) / array.length;
    }
    
    limitArraySize(array, maxSize) {
        while (array.length > maxSize) {
            array.shift();
        }
    }
    
    logPerformanceWarning(type, value) {
        if (GameConfig.PERFORMANCE.LOG_PERFORMANCE) {
            console.warn(`Performance Warning: ${type} - ${value}`);
        }
    }
    
    // Export/Import metrics
    exportMetrics() {
        return {
            metrics: this.metrics,
            report: this.getPerformanceReport(),
            suggestions: this.getOptimizationSuggestions(),
            timestamp: Date.now()
        };
    }
    
    // Benchmark utilities
    benchmark(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`Benchmark ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
    
    async benchmarkAsync(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        console.log(`Async Benchmark ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
    
    // Memory profiling
    profileMemory(label) {
        if (performance.memory) {
            const memory = performance.memory;
            console.log(`Memory Profile [${label}]:`, {
                used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
            });
        }
    }
}
