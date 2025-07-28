#!/usr/bin/env node

/**
 * Automated Test Runner for Home Sweet Puzzle
 * Runs tests in headless browser and generates reports
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class AutomatedTestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0,
            errors: []
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing automated test runner...');
        
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Listen for console messages
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                this.results.errors.push(text);
            }
            
            console.log(`[${type.toUpperCase()}] ${text}`);
        });
        
        // Listen for page errors
        this.page.on('pageerror', error => {
            this.results.errors.push(error.message);
            console.error('❌ Page Error:', error.message);
        });
    }
    
    async runGameTests() {
        console.log('🎮 Testing game functionality...');
        
        try {
            // Navigate to game
            await this.page.goto('http://localhost:8000');
            
            // Wait for game to load
            await this.page.waitForSelector('#main-menu', { timeout: 10000 });
            
            // Test navigation
            await this.testNavigation();
            
            // Test game initialization
            await this.testGameInitialization();
            
            console.log('✅ Game functionality tests completed');
            
        } catch (error) {
            console.error('❌ Game tests failed:', error.message);
            this.results.errors.push(`Game test error: ${error.message}`);
        }
    }
    
    async testNavigation() {
        console.log('🧭 Testing navigation...');
        
        // Test Play button
        await this.page.click('button:has-text("Play")');
        await this.page.waitForTimeout(500);
        
        // Test My Home button
        await this.page.click('button:has-text("My Home")');
        await this.page.waitForTimeout(500);
        
        // Test Shop button
        await this.page.click('button:has-text("Shop")');
        await this.page.waitForTimeout(500);
        
        console.log('✅ Navigation tests passed');
    }
    
    async testGameInitialization() {
        console.log('🎯 Testing game initialization...');
        
        // Check currency display
        const coinsText = await this.page.textContent('#coins-display');
        const starsText = await this.page.textContent('#stars-display');
        const livesText = await this.page.textContent('#lives-display');
        
        console.log(`💰 Coins: ${coinsText}`);
        console.log(`⭐ Stars: ${starsText}`);
        console.log(`❤️ Lives: ${livesText}`);
        
        // Verify currency values are reasonable
        const coins = parseInt(coinsText);
        const stars = parseInt(starsText);
        const lives = parseInt(livesText);
        
        if (coins >= 1000 && stars >= 5 && lives >= 5) {
            console.log('✅ Currency initialization passed');
        } else {
            throw new Error('Currency initialization failed');
        }
    }
    
    async runUnitTests() {
        console.log('🔧 Running unit tests...');
        
        try {
            // Navigate to test runner
            await this.page.goto('http://localhost:8000/tests/test-runner.html');
            
            // Wait for test framework to load
            await this.page.waitForSelector('#run-all-btn', { timeout: 10000 });
            
            // Run tests programmatically
            const testResults = await this.page.evaluate(async () => {
                if (window.test && typeof test.runTests === 'function') {
                    await test.runTests();
                    return test.results;
                } else {
                    throw new Error('Test framework not available');
                }
            });
            
            this.results.passed += testResults.passed;
            this.results.failed += testResults.failed;
            this.results.skipped += testResults.skipped;
            this.results.total += testResults.total;
            
            console.log('✅ Unit tests completed');
            
        } catch (error) {
            console.error('❌ Unit tests failed:', error.message);
            this.results.errors.push(`Unit test error: ${error.message}`);
        }
    }
    
    async runPerformanceTests() {
        console.log('⚡ Running performance tests...');
        
        try {
            // Navigate back to game
            await this.page.goto('http://localhost:8000');
            
            // Wait for game to load
            await this.page.waitForSelector('#main-menu', { timeout: 10000 });
            
            // Measure page load time
            const loadTime = await this.page.evaluate(() => {
                return performance.timing.loadEventEnd - performance.timing.navigationStart;
            });
            
            console.log(`📊 Page load time: ${loadTime}ms`);
            
            // Test memory usage
            const memoryInfo = await this.page.evaluate(() => {
                if (performance.memory) {
                    return {
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                    };
                }
                return null;
            });
            
            if (memoryInfo) {
                console.log(`🧠 Memory usage: ${memoryInfo.used}MB / ${memoryInfo.total}MB`);
            }
            
            // Performance thresholds
            if (loadTime < 5000) {
                console.log('✅ Performance tests passed');
            } else {
                console.warn('⚠️ Performance tests: slow load time');
            }
            
        } catch (error) {
            console.error('❌ Performance tests failed:', error.message);
            this.results.errors.push(`Performance test error: ${error.message}`);
        }
    }
    
    async generateReport() {
        console.log('📊 Generating test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                successRate: this.results.total > 0 ? 
                    Math.round((this.results.passed / this.results.total) * 100) : 0,
                totalErrors: this.results.errors.length,
                status: this.results.failed === 0 && this.results.errors.length === 0 ? 'PASS' : 'FAIL'
            }
        };
        
        // Save report to file
        const reportPath = path.join(__dirname, 'automated-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📄 Report saved to:', reportPath);
        
        return report;
    }
    
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    
    async run() {
        const startTime = Date.now();
        
        try {
            await this.initialize();
            
            console.log('🧪 Starting automated test suite...');
            console.log('═'.repeat(50));
            
            // Run all test suites
            await this.runGameTests();
            await this.runUnitTests();
            await this.runPerformanceTests();
            
            this.results.duration = Date.now() - startTime;
            
            console.log('═'.repeat(50));
            console.log('📊 Test Results Summary:');
            console.log(`✅ Passed: ${this.results.passed}`);
            console.log(`❌ Failed: ${this.results.failed}`);
            console.log(`⏭️ Skipped: ${this.results.skipped}`);
            console.log(`📈 Total: ${this.results.total}`);
            console.log(`⏱️ Duration: ${this.results.duration}ms`);
            console.log(`🚨 Errors: ${this.results.errors.length}`);
            
            const report = await this.generateReport();
            
            if (report.summary.status === 'PASS') {
                console.log('🎉 All tests passed!');
                process.exit(0);
            } else {
                console.log('💥 Some tests failed!');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('💥 Test runner failed:', error);
            process.exit(1);
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new AutomatedTestRunner();
    runner.run().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = AutomatedTestRunner;
