/**
 * Simple Test Framework
 * Lightweight testing framework for Home Sweet Puzzle game
 */
class TestFramework {
    constructor() {
        this.tests = [];
        this.suites = new Map();
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };
        this.currentSuite = null;
        this.verbose = true;
        this.startTime = null;
    }
    
    // Test suite management
    describe(suiteName, callback) {
        this.currentSuite = suiteName;
        this.suites.set(suiteName, []);
        
        console.log(`\n📋 Test Suite: ${suiteName}`);
        console.log('─'.repeat(50));
        
        callback();
        this.currentSuite = null;
    }
    
    // Individual test
    it(testName, callback) {
        const test = {
            name: testName,
            suite: this.currentSuite,
            callback: callback,
            status: 'pending'
        };
        
        this.tests.push(test);
        
        if (this.currentSuite) {
            this.suites.get(this.currentSuite).push(test);
        }
    }
    
    // Assertions
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
                return true;
            },
            
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
                return true;
            },
            
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${actual}`);
                }
                return true;
            },
            
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${actual}`);
                }
                return true;
            },
            
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
                return true;
            },
            
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
                return true;
            },
            
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
                return true;
            },
            
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, but got ${actual.length}`);
                }
                return true;
            },
            
            toBeInstanceOf: (expected) => {
                if (!(actual instanceof expected)) {
                    throw new Error(`Expected instance of ${expected.name}, but got ${actual.constructor.name}`);
                }
                return true;
            },
            
            toThrow: () => {
                try {
                    actual();
                    throw new Error('Expected function to throw, but it did not');
                } catch (error) {
                    if (error.message === 'Expected function to throw, but it did not') {
                        throw error;
                    }
                    return true;
                }
            }
        };
    }
    
    // Test execution
    async runTests() {
        this.startTime = Date.now();
        console.log('\n🚀 Starting Test Execution');
        console.log('═'.repeat(60));
        
        for (const test of this.tests) {
            await this.runSingleTest(test);
        }
        
        this.printResults();
    }
    
    async runSingleTest(test) {
        this.results.total++;
        
        try {
            await test.callback();
            test.status = 'passed';
            this.results.passed++;
            
            if (this.verbose) {
                console.log(`✅ ${test.name}`);
            }
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            this.results.failed++;
            
            console.log(`❌ ${test.name}`);
            console.log(`   Error: ${error.message}`);
        }
    }
    
    // Results reporting
    printResults() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        console.log('\n📊 Test Results');
        console.log('═'.repeat(60));
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️  Skipped: ${this.results.skipped}`);
        console.log(`📈 Total: ${this.results.total}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        
        const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
        console.log(`📊 Success Rate: ${successRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.tests.filter(t => t.status === 'failed').forEach(test => {
                console.log(`   • ${test.name}: ${test.error}`);
            });
        }
        
        console.log('\n' + '═'.repeat(60));
        
        return this.results.failed === 0;
    }
    
    // Utility methods
    beforeEach(callback) {
        this.beforeEachCallback = callback;
    }
    
    afterEach(callback) {
        this.afterEachCallback = callback;
    }
    
    skip(testName, callback) {
        this.it(testName, () => {
            console.log(`⏭️  Skipped: ${testName}`);
            this.results.skipped++;
        });
    }
    
    // Mock utilities
    createMock(object) {
        const mock = {};
        Object.keys(object).forEach(key => {
            if (typeof object[key] === 'function') {
                mock[key] = this.createMockFunction();
            } else {
                mock[key] = object[key];
            }
        });
        return mock;
    }
    
    createMockFunction() {
        const mockFn = function(...args) {
            mockFn.calls.push(args);
            return mockFn.returnValue;
        };
        
        mockFn.calls = [];
        mockFn.returnValue = undefined;
        mockFn.mockReturnValue = (value) => {
            mockFn.returnValue = value;
            return mockFn;
        };
        
        return mockFn;
    }
    
    // Performance testing
    benchmark(name, callback, iterations = 1000) {
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            callback();
        }
        
        const end = performance.now();
        const totalTime = end - start;
        const avgTime = totalTime / iterations;
        
        console.log(`⚡ Benchmark ${name}:`);
        console.log(`   Total: ${totalTime.toFixed(2)}ms`);
        console.log(`   Average: ${avgTime.toFixed(4)}ms per iteration`);
        console.log(`   Iterations: ${iterations}`);
        
        return { totalTime, avgTime, iterations };
    }
    
    // Async testing utilities
    async waitFor(condition, timeout = 5000) {
        const start = Date.now();
        
        while (Date.now() - start < timeout) {
            if (await condition()) {
                return true;
            }
            await this.sleep(10);
        }
        
        throw new Error(`Condition not met within ${timeout}ms`);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // DOM testing utilities
    createTestElement(tag = 'div', attributes = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        document.body.appendChild(element);
        return element;
    }
    
    cleanupTestElements() {
        document.querySelectorAll('[data-test]').forEach(el => el.remove());
    }
    
    // Game-specific utilities
    createMockGame() {
        return {
            playerData: {
                level: 1,
                coins: 1000,
                stars: 5,
                lives: 5,
                completedLevels: [],
                ownedFurniture: []
            },
            currentLevel: 1,
            gameState: 'menu',
            isInitialized: true,
            saveGame: this.createMockFunction(),
            updateCurrencyDisplay: this.createMockFunction(),
            showScreen: this.createMockFunction()
        };
    }
    
    createMockPuzzleEngine() {
        return {
            isPlaying: false,
            isPaused: false,
            currentLevel: 1,
            movesLeft: 25,
            score: 0,
            board: {
                width: 8,
                height: 8,
                tiles: []
            },
            startLevel: this.createMockFunction(),
            pause: this.createMockFunction(),
            resume: this.createMockFunction()
        };
    }
}

// Global test instance
const test = new TestFramework();

// Export for use in test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestFramework;
}
