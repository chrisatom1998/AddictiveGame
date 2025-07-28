/**
 * Performance Tests
 * Benchmarks and performance validation for game systems
 */

test.describe('Performance Benchmarks', () => {
    let game;
    let performanceMonitor;
    
    test.beforeEach(async () => {
        // Setup minimal DOM for performance testing
        document.body.innerHTML = `
            <canvas id="puzzle-canvas" width="400" height="400"></canvas>
            <div id="main-menu"></div>
        `;
        
        game = test.createMockGame();
        performanceMonitor = new PerformanceMonitor();
        performanceMonitor.startMonitoring();
    });
    
    test.afterEach(() => {
        performanceMonitor.stopMonitoring();
        document.body.innerHTML = '';
    });
    
    test.it('should benchmark tile creation performance', () => {
        const result = test.benchmark('Tile Creation', () => {
            const tile = new Tile('red', 0, 0);
            tile.setPosition(1, 1);
            return tile;
        }, 10000);
        
        test.expect(result.avgTime).toBeLessThan(0.1); // Less than 0.1ms per tile
        console.log(`✅ Tile creation: ${result.avgTime.toFixed(4)}ms average`);
    });
    
    test.it('should benchmark board initialization', () => {
        const result = test.benchmark('Board Initialization', () => {
            const puzzleEngine = test.createMockPuzzleEngine();
            const board = new Board(puzzleEngine, 8, 8);
            return board;
        }, 100);
        
        test.expect(result.avgTime).toBeLessThan(10); // Less than 10ms per board
        console.log(`✅ Board initialization: ${result.avgTime.toFixed(2)}ms average`);
    });
    
    test.it('should benchmark match detection', () => {
        const puzzleEngine = test.createMockPuzzleEngine();
        const board = new Board(puzzleEngine, 8, 8);
        
        // Create a board with known matches
        for (let i = 0; i < 3; i++) {
            board.setTile(i, 0, new Tile('red', i, 0));
        }
        
        const result = test.benchmark('Match Detection', () => {
            return board.findMatches();
        }, 1000);
        
        test.expect(result.avgTime).toBeLessThan(5); // Less than 5ms per detection
        console.log(`✅ Match detection: ${result.avgTime.toFixed(2)}ms average`);
    });
    
    test.it('should benchmark currency operations', () => {
        const currency = new Currency(game);
        
        const result = test.benchmark('Currency Operations', () => {
            currency.addCoins(100, 'test');
            currency.spendCoins(50, 'test');
            currency.getCoins();
        }, 10000);
        
        test.expect(result.avgTime).toBeLessThan(0.05); // Less than 0.05ms per operation
        console.log(`✅ Currency operations: ${result.avgTime.toFixed(4)}ms average`);
    });
    
    test.it('should benchmark furniture placement', () => {
        const renovationManager = new RenovationManager(game);
        const room = renovationManager.rooms.get('kitchen');
        
        const result = test.benchmark('Furniture Placement', () => {
            const furniture = new Furniture('test_item', {
                name: 'Test Item',
                size: { width: 60, height: 60 }
            }, { x: Math.random() * 200, y: Math.random() * 200 });
            
            const canPlace = room.canPlaceFurniture(furniture);
            return canPlace;
        }, 1000);
        
        test.expect(result.avgTime).toBeLessThan(1); // Less than 1ms per check
        console.log(`✅ Furniture placement: ${result.avgTime.toFixed(2)}ms average`);
    });
    
    test.it('should benchmark analytics event tracking', () => {
        const analytics = new Analytics(game);
        
        const result = test.benchmark('Analytics Event Tracking', () => {
            analytics.trackEvent('test_event', {
                value: Math.random() * 100,
                category: 'performance_test'
            });
        }, 10000);
        
        test.expect(result.avgTime).toBeLessThan(0.1); // Less than 0.1ms per event
        console.log(`✅ Analytics tracking: ${result.avgTime.toFixed(4)}ms average`);
    });
});

test.describe('Memory Performance', () => {
    let initialMemory;
    
    test.beforeEach(() => {
        if (performance.memory) {
            initialMemory = performance.memory.usedJSHeapSize;
        }
    });
    
    test.it('should not leak memory during tile operations', () => {
        const tiles = [];
        
        // Create many tiles
        for (let i = 0; i < 1000; i++) {
            tiles.push(new Tile('red', i % 8, Math.floor(i / 8)));
        }
        
        // Clear references
        tiles.length = 0;
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        if (performance.memory) {
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;
            
            test.expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
            console.log(`✅ Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        }
    });
    
    test.it('should handle large board operations efficiently', () => {
        const puzzleEngine = test.createMockPuzzleEngine();
        const board = new Board(puzzleEngine, 20, 20); // Large board
        
        // Perform many operations
        for (let i = 0; i < 100; i++) {
            board.findMatches();
            board.dropTiles();
            board.fillEmptySpaces();
        }
        
        if (performance.memory) {
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;
            
            test.expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
            console.log(`✅ Large board memory: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        }
    });
});

test.describe('Rendering Performance', () => {
    let canvas;
    let ctx;
    
    test.beforeEach(() => {
        canvas = document.getElementById('puzzle-canvas');
        ctx = canvas.getContext('2d');
    });
    
    test.it('should render tiles efficiently', () => {
        const tiles = [];
        for (let i = 0; i < 64; i++) {
            tiles.push(new Tile('red', i % 8, Math.floor(i / 8)));
        }
        
        const result = test.benchmark('Tile Rendering', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            tiles.forEach(tile => {
                tile.render(ctx);
            });
        }, 100);
        
        test.expect(result.avgTime).toBeLessThan(16); // Less than 16ms (60 FPS)
        console.log(`✅ Tile rendering: ${result.avgTime.toFixed(2)}ms for 64 tiles`);
    });
    
    test.it('should handle animation updates efficiently', () => {
        const tiles = [];
        for (let i = 0; i < 64; i++) {
            const tile = new Tile('red', i % 8, Math.floor(i / 8));
            tile.startAnimation('spawn');
            tiles.push(tile);
        }
        
        const result = test.benchmark('Animation Updates', () => {
            tiles.forEach(tile => {
                tile.update(16); // 16ms delta time
            });
        }, 1000);
        
        test.expect(result.avgTime).toBeLessThan(5); // Less than 5ms
        console.log(`✅ Animation updates: ${result.avgTime.toFixed(2)}ms for 64 tiles`);
    });
});

test.describe('Save System Performance', () => {
    let game;
    let saveSystem;
    
    test.beforeEach(() => {
        game = test.createMockGame();
        saveSystem = new SaveSystem(game);
        
        // Create large save data
        game.playerData.completedLevels = Array.from({ length: 100 }, (_, i) => i + 1);
        game.playerData.ownedFurniture = Array.from({ length: 50 }, (_, i) => `item_${i}`);
    });
    
    test.afterEach(() => {
        localStorage.clear();
    });
    
    test.it('should save large game data efficiently', () => {
        const result = test.benchmark('Save Game Data', () => {
            return saveSystem.saveGame();
        }, 100);
        
        test.expect(result.avgTime).toBeLessThan(10); // Less than 10ms
        console.log(`✅ Save operation: ${result.avgTime.toFixed(2)}ms average`);
    });
    
    test.it('should load large game data efficiently', () => {
        // First save the data
        saveSystem.saveGame();
        
        const result = test.benchmark('Load Game Data', () => {
            return saveSystem.loadGame();
        }, 100);
        
        test.expect(result.avgTime).toBeLessThan(10); // Less than 10ms
        console.log(`✅ Load operation: ${result.avgTime.toFixed(2)}ms average`);
    });
});

test.describe('Configuration Performance', () => {
    test.it('should access configuration values efficiently', () => {
        const result = test.benchmark('Config Access', () => {
            const boardWidth = GameConfig.PUZZLE.BOARD_WIDTH;
            const startingCoins = GameConfig.ECONOMY.STARTING_COINS;
            const tileType = GameConfig.getRandomTileType();
            const moves = GameConfig.calculateLevelMoves(5);
            return { boardWidth, startingCoins, tileType, moves };
        }, 10000);
        
        test.expect(result.avgTime).toBeLessThan(0.01); // Less than 0.01ms
        console.log(`✅ Config access: ${result.avgTime.toFixed(4)}ms average`);
    });
    
    test.it('should handle utility calculations efficiently', () => {
        const result = test.benchmark('Config Calculations', () => {
            const reward = GameConfig.calculateLevelReward(10, 3);
            const unlocked = GameConfig.isFeatureUnlocked('renovation', 5);
            return { reward, unlocked };
        }, 10000);
        
        test.expect(result.avgTime).toBeLessThan(0.01); // Less than 0.01ms
        console.log(`✅ Config calculations: ${result.avgTime.toFixed(4)}ms average`);
    });
});

test.describe('Real-World Performance Scenarios', () => {
    let game;
    let performanceMonitor;
    
    test.beforeEach(async () => {
        document.body.innerHTML = `
            <canvas id="puzzle-canvas" width="400" height="400"></canvas>
            <div id="main-menu"></div>
            <div id="puzzle-game"></div>
        `;
        
        game = new Game();
        await game.initialize();
        performanceMonitor = new PerformanceMonitor();
        performanceMonitor.startMonitoring();
    });
    
    test.afterEach(() => {
        performanceMonitor.stopMonitoring();
        document.body.innerHTML = '';
        localStorage.clear();
    });
    
    test.it('should maintain 30+ FPS during intensive gameplay', async () => {
        game.startLevel(1);
        
        const frameCount = 60; // Test 60 frames
        const frameTimes = [];
        
        for (let i = 0; i < frameCount; i++) {
            const start = performance.now();
            
            // Simulate game loop
            performanceMonitor.startFrame();
            game.puzzleEngine.update(16);
            game.puzzleEngine.render();
            performanceMonitor.endFrame();
            
            const frameTime = performance.now() - start;
            frameTimes.push(frameTime);
            
            // Small delay to prevent blocking
            await test.sleep(1);
        }
        
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = 1000 / avgFrameTime;
        
        test.expect(fps).toBeGreaterThan(30); // Should maintain 30+ FPS
        console.log(`✅ Average FPS: ${fps.toFixed(1)}`);
        console.log(`✅ Average frame time: ${avgFrameTime.toFixed(2)}ms`);
    });
    
    test.it('should handle rapid user interactions efficiently', () => {
        game.startLevel(1);
        
        const result = test.benchmark('Rapid Tile Swaps', () => {
            // Simulate rapid tile swapping
            const col1 = Math.floor(Math.random() * 8);
            const row1 = Math.floor(Math.random() * 8);
            const col2 = Math.min(7, col1 + 1);
            const row2 = row1;
            
            game.puzzleEngine.swapTiles({ col: col1, row: row1 }, { col: col2, row: row2 });
        }, 1000);
        
        test.expect(result.avgTime).toBeLessThan(2); // Less than 2ms per swap
        console.log(`✅ Tile swap performance: ${result.avgTime.toFixed(2)}ms average`);
    });
    
    test.it('should handle multiple system updates efficiently', () => {
        const result = test.benchmark('Multi-System Update', () => {
            // Update multiple systems
            game.puzzleEngine.update(16);
            game.currencyManager.regenerateLife();
            game.analytics.trackEvent('performance_test', { timestamp: Date.now() });
            game.renovationManager.update();
        }, 1000);
        
        test.expect(result.avgTime).toBeLessThan(5); // Less than 5ms per update cycle
        console.log(`✅ Multi-system update: ${result.avgTime.toFixed(2)}ms average`);
    });
});

// Performance summary
test.describe('Performance Summary', () => {
    test.it('should provide performance recommendations', () => {
        console.log('\n📊 Performance Test Summary');
        console.log('═'.repeat(50));
        console.log('✅ All performance benchmarks completed');
        console.log('');
        console.log('🎯 Performance Targets:');
        console.log('  • Tile operations: < 0.1ms');
        console.log('  • Board operations: < 10ms');
        console.log('  • Rendering: < 16ms (60 FPS)');
        console.log('  • Memory usage: < 100MB');
        console.log('  • Save/Load: < 10ms');
        console.log('');
        console.log('🚀 Optimization Tips:');
        console.log('  • Use object pooling for frequently created objects');
        console.log('  • Batch DOM updates to minimize reflows');
        console.log('  • Implement efficient collision detection');
        console.log('  • Use requestAnimationFrame for smooth animations');
        console.log('  • Compress save data for faster I/O');
        console.log('');
        console.log('📈 Monitoring:');
        console.log('  • Enable performance monitoring in production');
        console.log('  • Track frame rates and memory usage');
        console.log('  • Monitor user interaction response times');
        console.log('  • Set up alerts for performance degradation');
        
        test.expect(true).toBe(true); // Always pass summary
    });
});
