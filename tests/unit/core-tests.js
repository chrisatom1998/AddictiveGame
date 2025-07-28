/**
 * Core Game System Unit Tests
 * Tests for fundamental game mechanics and systems
 */

// Test GameConfig
test.describe('GameConfig', () => {
    test.it('should have all required configuration sections', () => {
        test.expect(GameConfig.PUZZLE).toBeTruthy();
        test.expect(GameConfig.ECONOMY).toBeTruthy();
        test.expect(GameConfig.RENOVATION).toBeTruthy();
        test.expect(GameConfig.STORY).toBeTruthy();
        test.expect(GameConfig.MONETIZATION).toBeTruthy();
        test.expect(GameConfig.UI).toBeTruthy();
        test.expect(GameConfig.PERFORMANCE).toBeTruthy();
        test.expect(GameConfig.LEVELS).toBeTruthy();
    });
    
    test.it('should have valid puzzle configuration', () => {
        test.expect(GameConfig.PUZZLE.BOARD_WIDTH).toBeGreaterThan(0);
        test.expect(GameConfig.PUZZLE.BOARD_HEIGHT).toBeGreaterThan(0);
        test.expect(GameConfig.PUZZLE.TILE_TYPES).toHaveLength(6);
        test.expect(GameConfig.PUZZLE.MIN_MATCH_LENGTH).toBe(3);
    });
    
    test.it('should have balanced economy settings', () => {
        test.expect(GameConfig.ECONOMY.STARTING_COINS).toBeGreaterThan(0);
        test.expect(GameConfig.ECONOMY.MAX_COINS).toBeGreaterThan(GameConfig.ECONOMY.STARTING_COINS);
        test.expect(GameConfig.ECONOMY.COINS_PER_LEVEL).toBeGreaterThan(0);
        test.expect(GameConfig.ECONOMY.MAX_LIVES).toBeGreaterThan(0);
    });
    
    test.it('should provide utility methods', () => {
        const tileType = GameConfig.getRandomTileType();
        test.expect(GameConfig.PUZZLE.TILE_TYPES).toContain(tileType);
        
        const moves = GameConfig.calculateLevelMoves(1);
        test.expect(moves).toBeGreaterThan(0);
        
        const reward = GameConfig.calculateLevelReward(1, 3);
        test.expect(reward).toBeGreaterThan(0);
    });
});

// Test Currency System
test.describe('Currency System', () => {
    let mockGame;
    let currency;
    
    test.beforeEach(() => {
        mockGame = test.createMockGame();
        currency = new Currency(mockGame);
    });
    
    test.it('should initialize with correct starting values', () => {
        test.expect(mockGame.playerData.coins).toBe(1000);
        test.expect(mockGame.playerData.stars).toBe(5);
        test.expect(mockGame.playerData.lives).toBe(5);
    });
    
    test.it('should add coins correctly', () => {
        const initialCoins = mockGame.playerData.coins;
        const added = currency.addCoins(100, 'test');
        
        test.expect(added).toBe(100);
        test.expect(mockGame.playerData.coins).toBe(initialCoins + 100);
    });
    
    test.it('should spend coins when sufficient balance', () => {
        const success = currency.spendCoins(500, 'test_purchase');
        
        test.expect(success).toBe(true);
        test.expect(mockGame.playerData.coins).toBe(500);
    });
    
    test.it('should not spend coins when insufficient balance', () => {
        const success = currency.spendCoins(2000, 'expensive_item');
        
        test.expect(success).toBe(false);
        test.expect(mockGame.playerData.coins).toBe(1000); // Unchanged
    });
    
    test.it('should respect currency limits', () => {
        const maxCoins = currency.currencies.coins.maxAmount;
        const added = currency.addCoins(maxCoins, 'test');
        
        test.expect(mockGame.playerData.coins).toBeLessThan(maxCoins + 1);
    });
    
    test.it('should track transaction history', () => {
        currency.addCoins(100, 'test_earn');
        currency.spendCoins(50, 'test_spend');
        
        const history = currency.getTransactionHistory();
        test.expect(history).toHaveLength(2);
        test.expect(history[0].type).toBe('spent');
        test.expect(history[1].type).toBe('earned');
    });
});

// Test Tile System
test.describe('Tile System', () => {
    let tile;
    
    test.beforeEach(() => {
        tile = new Tile('red', 0, 0);
    });
    
    test.it('should create tile with correct properties', () => {
        test.expect(tile.type).toBe('red');
        test.expect(tile.col).toBe(0);
        test.expect(tile.row).toBe(0);
        test.expect(tile.id).toBeTruthy();
    });
    
    test.it('should handle position changes', () => {
        tile.setPosition(2, 3);
        
        test.expect(tile.col).toBe(2);
        test.expect(tile.row).toBe(3);
        test.expect(tile.targetX).toBe(2);
        test.expect(tile.targetY).toBe(3);
    });
    
    test.it('should support special tile creation', () => {
        tile.makeSpecial('bomb');
        
        test.expect(tile.isSpecial).toBe(true);
        test.expect(tile.specialType).toBe('bomb');
        test.expect(tile.power).toBeGreaterThan(1);
    });
    
    test.it('should handle tile matching', () => {
        const otherTile = new Tile('red', 1, 0);
        const differentTile = new Tile('blue', 2, 0);
        
        test.expect(tile.canMatch(otherTile)).toBe(true);
        test.expect(tile.canMatch(differentTile)).toBe(false);
    });
    
    test.it('should detect adjacent tiles', () => {
        const adjacentTile = new Tile('blue', 1, 0);
        const distantTile = new Tile('green', 3, 3);
        
        test.expect(tile.isAdjacent(adjacentTile)).toBe(true);
        test.expect(tile.isAdjacent(distantTile)).toBe(false);
    });
    
    test.it('should serialize and deserialize correctly', () => {
        tile.makeSpecial('bomb');
        const serialized = tile.toJSON();
        const deserialized = Tile.fromJSON(serialized);
        
        test.expect(deserialized.type).toBe(tile.type);
        test.expect(deserialized.isSpecial).toBe(tile.isSpecial);
        test.expect(deserialized.specialType).toBe(tile.specialType);
    });
});

// Test Board System
test.describe('Board System', () => {
    let mockPuzzleEngine;
    let board;
    
    test.beforeEach(() => {
        mockPuzzleEngine = test.createMockPuzzleEngine();
        board = new Board(mockPuzzleEngine, 8, 8);
    });
    
    test.it('should initialize with correct dimensions', () => {
        test.expect(board.width).toBe(8);
        test.expect(board.height).toBe(8);
        test.expect(board.tiles).toHaveLength(8);
        test.expect(board.tiles[0]).toHaveLength(8);
    });
    
    test.it('should fill board with tiles', () => {
        let tileCount = 0;
        for (let row = 0; row < board.height; row++) {
            for (let col = 0; col < board.width; col++) {
                if (board.getTile(col, row)) {
                    tileCount++;
                }
            }
        }
        test.expect(tileCount).toBe(64); // 8x8 board
    });
    
    test.it('should handle tile swapping', () => {
        const tile1 = board.getTile(0, 0);
        const tile2 = board.getTile(1, 0);
        const type1 = tile1.type;
        const type2 = tile2.type;
        
        const success = board.swapTiles(0, 0, 1, 0);
        
        test.expect(success).toBe(true);
        test.expect(board.getTile(0, 0).type).toBe(type2);
        test.expect(board.getTile(1, 0).type).toBe(type1);
    });
    
    test.it('should detect matches correctly', () => {
        // Create a horizontal match
        board.setTile(0, 0, new Tile('red', 0, 0));
        board.setTile(1, 0, new Tile('red', 1, 0));
        board.setTile(2, 0, new Tile('red', 2, 0));
        
        const matches = board.findMatches();
        test.expect(matches.length).toBeGreaterThan(0);
        
        const horizontalMatch = matches.find(m => m.type === 'horizontal');
        test.expect(horizontalMatch).toBeTruthy();
        test.expect(horizontalMatch.tiles).toHaveLength(3);
    });
    
    test.it('should handle tile dropping', () => {
        // Remove a tile to create a gap
        board.setTile(0, 0, null);
        
        board.dropTiles();
        
        // Check that tiles have fallen down
        const bottomTile = board.getTile(0, board.height - 1);
        test.expect(bottomTile).toBeTruthy();
    });
    
    test.it('should validate tile positions', () => {
        test.expect(board.isValidPosition(0, 0)).toBe(true);
        test.expect(board.isValidPosition(7, 7)).toBe(true);
        test.expect(board.isValidPosition(-1, 0)).toBe(false);
        test.expect(board.isValidPosition(8, 8)).toBe(false);
    });
});

// Test Performance Monitor
test.describe('Performance Monitor', () => {
    let monitor;
    
    test.beforeEach(() => {
        monitor = new PerformanceMonitor();
    });
    
    test.it('should initialize with correct default values', () => {
        test.expect(monitor.metrics.fps).toHaveLength(0);
        test.expect(monitor.metrics.frameTime).toHaveLength(0);
        test.expect(monitor.isMonitoring).toBe(false);
    });
    
    test.it('should track frame timing', () => {
        monitor.startMonitoring();
        monitor.startFrame();
        monitor.endFrame();
        
        test.expect(monitor.metrics.frameTime.length).toBeGreaterThan(0);
    });
    
    test.it('should calculate performance metrics', () => {
        monitor.metrics.fps = [60, 58, 62, 59, 61];
        
        const avgFPS = monitor.getAverageFPS();
        test.expect(avgFPS).toBe(60);
    });
    
    test.it('should provide optimization suggestions', () => {
        // Simulate poor performance
        monitor.metrics.fps = [20, 18, 22, 19, 21];
        monitor.metrics.renderTime = [25, 30, 28, 32, 27];
        
        const suggestions = monitor.getOptimizationSuggestions();
        test.expect(suggestions.length).toBeGreaterThan(0);
    });
    
    test.it('should benchmark functions', () => {
        const result = monitor.benchmark('test function', () => {
            let sum = 0;
            for (let i = 0; i < 1000; i++) {
                sum += i;
            }
            return sum;
        }, 100);
        
        test.expect(result.totalTime).toBeGreaterThan(0);
        test.expect(result.avgTime).toBeGreaterThan(0);
        test.expect(result.iterations).toBe(100);
    });
});

// Test Analytics
test.describe('Analytics System', () => {
    let mockGame;
    let analytics;
    
    test.beforeEach(() => {
        mockGame = test.createMockGame();
        analytics = new Analytics(mockGame);
    });
    
    test.it('should initialize with session data', () => {
        test.expect(analytics.sessionId).toBeTruthy();
        test.expect(analytics.playerId).toBeTruthy();
        test.expect(analytics.sessionStartTime).toBeGreaterThan(0);
    });
    
    test.it('should track events correctly', () => {
        analytics.trackEvent('test_event', { value: 123 });
        
        test.expect(analytics.eventQueue).toHaveLength(1);
        
        const event = analytics.eventQueue[0];
        test.expect(event.name).toBe('test_event');
        test.expect(event.properties.value).toBe(123);
        test.expect(event.properties.sessionId).toBe(analytics.sessionId);
    });
    
    test.it('should track level progression', () => {
        analytics.trackLevelStart(1);
        analytics.trackLevelComplete(1, 3, 1500, 20);
        
        test.expect(analytics.sessionData.levelsPlayed).toBe(1);
        test.expect(analytics.progressionMetrics.levelCompletionTimes).toHaveLength(1);
    });
    
    test.it('should track currency transactions', () => {
        analytics.trackCurrencyEarned('coins', 100, 'level_complete');
        analytics.trackCurrencySpent('coins', 50, 'power_up');
        
        test.expect(analytics.sessionData.coinsEarned).toBe(100);
        test.expect(analytics.sessionData.coinsSpent).toBe(50);
    });
    
    test.it('should segment players correctly', () => {
        // Test new player
        mockGame.playerData.level = 1;
        test.expect(analytics.getPlayerSegment()).toBe('new');
        
        // Test active player
        mockGame.playerData.level = 7;
        test.expect(analytics.getPlayerSegment()).toBe('active');
        
        // Test engaged player
        mockGame.playerData.level = 15;
        test.expect(analytics.getPlayerSegment()).toBe('engaged');
    });
    
    test.it('should assess retention risk', () => {
        // Low risk scenario
        analytics.sessionData.levelsPlayed = 5;
        test.expect(analytics.getRetentionRisk()).toBe('low');
        
        // High risk scenario
        analytics.progressionMetrics.stuckPoints = [1, 2, 3];
        test.expect(analytics.getRetentionRisk()).toBe('high');
    });
});
