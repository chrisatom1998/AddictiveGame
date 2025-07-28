/**
 * Integration Tests for Game Flow
 * Tests complete game scenarios and system interactions
 */

test.describe('Game Initialization', () => {
    let gameContainer;
    
    test.beforeEach(() => {
        gameContainer = test.createTestElement('div', { 'data-test': 'game-container' });
    });
    
    test.afterEach(() => {
        test.cleanupTestElements();
    });
    
    test.it('should initialize all core systems', async () => {
        // Mock DOM elements
        const mockElements = {
            'loading-screen': test.createTestElement('div', { id: 'loading-screen' }),
            'main-menu': test.createTestElement('div', { id: 'main-menu' }),
            'coins-display': test.createTestElement('span', { id: 'coins-display' }),
            'stars-display': test.createTestElement('span', { id: 'stars-display' }),
            'lives-display': test.createTestElement('span', { id: 'lives-display' })
        };
        
        // Initialize game
        const game = new Game();
        await game.initialize();
        
        test.expect(game.isInitialized).toBe(true);
        test.expect(game.stateManager).toBeTruthy();
        test.expect(game.currencyManager).toBeTruthy();
        test.expect(game.saveSystem).toBeTruthy();
    });
    
    test.it('should load saved game data', async () => {
        // Mock saved data
        const savedData = {
            playerData: {
                level: 5,
                coins: 2000,
                stars: 10,
                lives: 3,
                completedLevels: [1, 2, 3, 4]
            },
            gameState: 'menu'
        };
        
        localStorage.setItem('homeSweetPuzzle_save', JSON.stringify(savedData));
        
        const game = new Game();
        await game.initialize();
        
        test.expect(game.playerData.level).toBe(5);
        test.expect(game.playerData.coins).toBe(2000);
        test.expect(game.playerData.completedLevels).toHaveLength(4);
        
        // Cleanup
        localStorage.removeItem('homeSweetPuzzle_save');
    });
});

test.describe('Puzzle Game Flow', () => {
    let game;
    let puzzleEngine;
    
    test.beforeEach(async () => {
        // Setup DOM elements
        test.createTestElement('canvas', { id: 'puzzle-canvas' });
        test.createTestElement('div', { id: 'moves-left' });
        test.createTestElement('div', { id: 'current-score' });
        test.createTestElement('div', { id: 'level-number' });
        
        game = test.createMockGame();
        puzzleEngine = new PuzzleEngine(game);
    });
    
    test.afterEach(() => {
        test.cleanupTestElements();
    });
    
    test.it('should start a level correctly', () => {
        puzzleEngine.startLevel(1);
        
        test.expect(puzzleEngine.isPlaying).toBe(true);
        test.expect(puzzleEngine.currentLevel).toBe(1);
        test.expect(puzzleEngine.movesLeft).toBeGreaterThan(0);
        test.expect(puzzleEngine.board).toBeTruthy();
    });
    
    test.it('should handle tile swapping', () => {
        puzzleEngine.startLevel(1);
        
        const initialMoves = puzzleEngine.movesLeft;
        const success = puzzleEngine.swapTiles({ col: 0, row: 0 }, { col: 1, row: 0 });
        
        if (success) {
            test.expect(puzzleEngine.movesLeft).toBe(initialMoves - 1);
        }
    });
    
    test.it('should detect level completion', () => {
        puzzleEngine.startLevel(1);
        
        // Simulate completing objectives
        puzzleEngine.objectives = { red: 0, blue: 0 };
        puzzleEngine.checkGameEnd();
        
        test.expect(puzzleEngine.isPlaying).toBe(false);
    });
    
    test.it('should handle game over', () => {
        puzzleEngine.startLevel(1);
        
        // Simulate running out of moves
        puzzleEngine.movesLeft = 0;
        puzzleEngine.objectives = { red: 5, blue: 5 }; // Still have objectives
        puzzleEngine.checkGameEnd();
        
        test.expect(puzzleEngine.isPlaying).toBe(false);
    });
});

test.describe('Currency and Economy Flow', () => {
    let game;
    let currency;
    
    test.beforeEach(() => {
        game = test.createMockGame();
        currency = new Currency(game);
    });
    
    test.it('should handle level completion rewards', () => {
        const initialCoins = game.playerData.coins;
        const levelReward = GameConfig.calculateLevelReward(1, 3);
        
        currency.addCoins(levelReward, 'level_completion');
        
        test.expect(game.playerData.coins).toBe(initialCoins + levelReward);
    });
    
    test.it('should handle furniture purchases', () => {
        const furniturePrice = 500;
        const initialCoins = game.playerData.coins;
        
        const success = currency.spendCoins(furniturePrice, 'furniture_purchase');
        
        test.expect(success).toBe(true);
        test.expect(game.playerData.coins).toBe(initialCoins - furniturePrice);
    });
    
    test.it('should handle daily bonuses', () => {
        const today = new Date().toDateString();
        game.playerData.lastDailyBonus = null;
        game.playerData.consecutiveDays = 0;
        
        currency.checkDailyBonus();
        
        test.expect(game.playerData.lastDailyBonus).toBe(today);
        test.expect(game.playerData.consecutiveDays).toBe(1);
    });
    
    test.it('should handle life regeneration', () => {
        game.playerData.lives = 3;
        game.playerData.lastLifeTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
        
        currency.regenerateLife();
        
        test.expect(game.playerData.lives).toBe(4);
    });
});

test.describe('Renovation System Flow', () => {
    let game;
    let renovationManager;
    
    test.beforeEach(() => {
        // Setup DOM elements
        test.createTestElement('div', { id: 'room-background' });
        test.createTestElement('div', { id: 'furniture-grid' });
        test.createTestElement('div', { id: 'room-name' });
        
        game = test.createMockGame();
        renovationManager = new RenovationManager(game);
    });
    
    test.afterEach(() => {
        test.cleanupTestElements();
    });
    
    test.it('should initialize with kitchen room', () => {
        test.expect(renovationManager.currentRoom).toBe('kitchen');
        test.expect(renovationManager.rooms.has('kitchen')).toBe(true);
    });
    
    test.it('should handle furniture purchase and placement', () => {
        const furnitureId = 'stove_basic';
        
        // Purchase furniture
        renovationManager.inventory.addFurniture(furnitureId);
        test.expect(renovationManager.inventory.hasFurniture(furnitureId)).toBe(true);
        
        // Place furniture
        const furniture = new Furniture(furnitureId, { name: 'Basic Stove' }, { x: 100, y: 100 });
        const room = renovationManager.rooms.get('kitchen');
        const success = room.addFurniture(furniture);
        
        test.expect(success).toBe(true);
        test.expect(room.placedFurniture).toHaveLength(1);
    });
    
    test.it('should calculate room completion stars', () => {
        const room = renovationManager.rooms.get('kitchen');
        
        // Add essential furniture
        const stove = new Furniture('stove_1', { type: 'stove', category: 'essential' }, { x: 0, y: 0 });
        const fridge = new Furniture('fridge_1', { type: 'refrigerator', category: 'essential' }, { x: 100, y: 0 });
        
        room.addFurniture(stove);
        room.addFurniture(fridge);
        
        const stars = room.calculateStars();
        test.expect(stars).toBeGreaterThan(0);
    });
    
    test.it('should prevent furniture collision', () => {
        const room = renovationManager.rooms.get('kitchen');
        
        const furniture1 = new Furniture('item1', { size: { width: 80, height: 80 } }, { x: 100, y: 100 });
        const furniture2 = new Furniture('item2', { size: { width: 80, height: 80 } }, { x: 120, y: 120 });
        
        room.addFurniture(furniture1);
        const success = room.addFurniture(furniture2); // Should collide
        
        test.expect(success).toBe(false);
    });
});

test.describe('Story System Flow', () => {
    let game;
    let storyManager;
    
    test.beforeEach(() => {
        // Setup DOM elements
        test.createTestElement('div', { id: 'story-dialog' });
        test.createTestElement('div', { id: 'character-name' });
        test.createTestElement('div', { id: 'dialog-message' });
        test.createTestElement('button', { id: 'dialog-continue' });
        
        game = test.createMockGame();
        storyManager = new StoryManager(game);
    });
    
    test.afterEach(() => {
        test.cleanupTestElements();
    });
    
    test.it('should trigger story on level completion', () => {
        const initialStories = storyManager.unlockedStories.length;
        
        storyManager.checkLevelCompletion(1);
        
        // Should unlock kitchen_start story
        test.expect(storyManager.unlockedStories.length).toBeGreaterThan(initialStories);
    });
    
    test.it('should unlock characters based on progress', () => {
        test.expect(storyManager.isCharacterUnlocked('emma')).toBe(true);
        test.expect(storyManager.isCharacterUnlocked('marcus')).toBe(false);
        
        // Simulate reaching level 10
        game.playerData.level = 10;
        storyManager.unlockCharacter('marcus');
        
        test.expect(storyManager.isCharacterUnlocked('marcus')).toBe(true);
    });
    
    test.it('should track dialog history', () => {
        const initialHistory = storyManager.dialogHistory.length;
        
        storyManager.recordDialog('emma', 'Test dialog', 'test_story');
        
        test.expect(storyManager.dialogHistory.length).toBe(initialHistory + 1);
        
        const latestDialog = storyManager.dialogHistory[0];
        test.expect(latestDialog.characterId).toBe('emma');
        test.expect(latestDialog.text).toBe('Test dialog');
    });
});

test.describe('Save System Integration', () => {
    let game;
    let saveSystem;
    
    test.beforeEach(() => {
        game = test.createMockGame();
        saveSystem = new SaveSystem(game);
    });
    
    test.afterEach(() => {
        // Cleanup localStorage
        localStorage.removeItem('homeSweetPuzzle_save');
        localStorage.removeItem('homeSweetPuzzle_settings');
    });
    
    test.it('should save complete game state', () => {
        game.playerData.level = 5;
        game.playerData.coins = 1500;
        game.currentLevel = 3;
        
        const success = saveSystem.saveGame();
        
        test.expect(success).toBe(true);
        
        const savedData = JSON.parse(localStorage.getItem('homeSweetPuzzle_save'));
        test.expect(savedData.playerData.level).toBe(5);
        test.expect(savedData.playerData.coins).toBe(1500);
    });
    
    test.it('should load complete game state', () => {
        const testData = {
            playerData: {
                level: 7,
                coins: 2500,
                stars: 15,
                completedLevels: [1, 2, 3, 4, 5, 6]
            },
            currentLevel: 6,
            gameState: 'playing'
        };
        
        localStorage.setItem('homeSweetPuzzle_save', JSON.stringify(testData));
        
        const success = saveSystem.loadGame();
        
        test.expect(success).toBe(true);
        test.expect(game.playerData.level).toBe(7);
        test.expect(game.playerData.coins).toBe(2500);
        test.expect(game.playerData.completedLevels).toHaveLength(6);
    });
    
    test.it('should handle corrupted save data', () => {
        localStorage.setItem('homeSweetPuzzle_save', 'invalid json data');
        
        const success = saveSystem.loadGame();
        
        test.expect(success).toBe(false);
        // Should fall back to default values
        test.expect(game.playerData.level).toBe(1);
        test.expect(game.playerData.coins).toBe(1000);
    });
});

test.describe('Performance Integration', () => {
    let game;
    let performanceMonitor;
    
    test.beforeEach(() => {
        game = test.createMockGame();
        performanceMonitor = new PerformanceMonitor();
    });
    
    test.it('should monitor game loop performance', async () => {
        performanceMonitor.startMonitoring();
        
        // Simulate game loop
        for (let i = 0; i < 10; i++) {
            performanceMonitor.startFrame();
            
            // Simulate game update
            await test.sleep(16); // ~60 FPS
            
            performanceMonitor.endFrame();
        }
        
        test.expect(performanceMonitor.metrics.frameTime.length).toBeGreaterThan(0);
        
        const avgFrameTime = performanceMonitor.getAverageFrameTime();
        test.expect(avgFrameTime).toBeGreaterThan(0);
        test.expect(avgFrameTime).toBeLessThan(100); // Should be reasonable
    });
    
    test.it('should provide performance insights', () => {
        // Simulate performance data
        performanceMonitor.metrics.fps = [45, 42, 48, 44, 46]; // Below 60 FPS
        performanceMonitor.metrics.renderTime = [20, 22, 18, 25, 19]; // High render time
        
        const suggestions = performanceMonitor.getOptimizationSuggestions();
        test.expect(suggestions.length).toBeGreaterThan(0);
        
        const report = performanceMonitor.getPerformanceReport();
        test.expect(report.fps.average).toBeLessThan(50);
    });
});
