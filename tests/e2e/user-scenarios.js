/**
 * End-to-End User Scenario Tests
 * Tests complete user journeys and interactions
 */

test.describe('New Player Journey', () => {
    let game;
    
    test.beforeEach(async () => {
        // Clear any existing save data
        localStorage.clear();
        
        // Setup complete DOM structure
        document.body.innerHTML = `
            <div id="loading-screen" class="screen active"></div>
            <div id="main-menu" class="screen">
                <button id="play-btn">Play</button>
                <button id="renovation-btn">My Home</button>
                <span id="coins-display">1000</span>
                <span id="stars-display">5</span>
                <span id="lives-display">5</span>
            </div>
            <div id="level-select" class="screen">
                <div class="level-grid"></div>
            </div>
            <div id="puzzle-game" class="screen">
                <canvas id="puzzle-canvas"></canvas>
                <div id="moves-left">25</div>
                <div id="current-score">0</div>
                <button id="pause-btn">Pause</button>
            </div>
            <div id="renovation-mode" class="screen">
                <div id="room-background"></div>
                <div id="furniture-grid"></div>
            </div>
            <div id="story-dialog">
                <div id="character-name"></div>
                <div id="dialog-message"></div>
                <button id="dialog-continue">Continue</button>
            </div>
        `;
        
        game = new Game();
        await game.initialize();
    });
    
    test.afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });
    
    test.it('should complete first-time user experience', async () => {
        // 1. Game should start with loading screen
        test.expect(game.gameState).toBe('loading');
        
        // 2. Should transition to main menu
        await test.waitFor(() => game.gameState === 'menu', 3000);
        test.expect(game.gameState).toBe('menu');
        
        // 3. Player should have starting currency
        test.expect(game.playerData.coins).toBe(GameConfig.ECONOMY.STARTING_COINS);
        test.expect(game.playerData.stars).toBe(GameConfig.ECONOMY.STARTING_STARS);
        test.expect(game.playerData.lives).toBe(GameConfig.ECONOMY.STARTING_LIVES);
        
        // 4. Should be able to start first level
        game.showScreen('level-select');
        test.expect(game.gameState).toBe('level-select');
        
        // 5. Should be able to play level 1
        game.startLevel(1);
        test.expect(game.currentLevel).toBe(1);
        test.expect(game.puzzleEngine.isPlaying).toBe(true);
    });
    
    test.it('should handle level completion flow', async () => {
        // Start level 1
        game.startLevel(1);
        
        // Simulate level completion
        game.puzzleEngine.score = 1500;
        game.puzzleEngine.objectives = {}; // All objectives completed
        game.puzzleEngine.completeLevel(3); // 3 stars
        
        // Should award coins and stars
        const expectedCoins = GameConfig.calculateLevelReward(1, 3);
        test.expect(game.playerData.coins).toBeGreaterThan(GameConfig.ECONOMY.STARTING_COINS);
        
        // Should unlock next level
        test.expect(game.playerData.completedLevels).toContain(1);
        
        // Should trigger story
        await test.waitFor(() => game.storyManager.unlockedStories.length > 1, 2000);
    });
    
    test.it('should handle first furniture purchase', async () => {
        // Give player enough coins
        game.currencyManager.addCoins(500, 'test');
        
        // Go to renovation mode
        game.showScreen('renovation-mode');
        
        // Purchase first furniture item
        const furnitureId = 'stove_basic';
        const success = game.renovationManager.inventory.addFurniture(furnitureId);
        
        test.expect(success).toBe(true);
        test.expect(game.renovationManager.inventory.hasFurniture(furnitureId)).toBe(true);
        
        // Should trigger achievement
        game.rewardsManager?.checkAchievements();
    });
});

test.describe('Returning Player Journey', () => {
    let game;
    
    test.beforeEach(async () => {
        // Setup saved game data for returning player
        const savedData = {
            playerData: {
                level: 10,
                coins: 2500,
                stars: 15,
                lives: 5,
                completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                ownedFurniture: ['stove_basic', 'plant_herbs'],
                lastDailyBonus: null,
                consecutiveDays: 0
            },
            currentLevel: 10,
            gameState: 'menu'
        };
        
        localStorage.setItem('homeSweetPuzzle_save', JSON.stringify(savedData));
        
        // Setup DOM
        document.body.innerHTML = `
            <div id="main-menu" class="screen">
                <span id="coins-display">0</span>
                <span id="stars-display">0</span>
                <span id="lives-display">0</span>
            </div>
            <div id="puzzle-game" class="screen">
                <canvas id="puzzle-canvas"></canvas>
            </div>
            <div id="renovation-mode" class="screen">
                <div id="room-background"></div>
            </div>
        `;
        
        game = new Game();
        await game.initialize();
    });
    
    test.afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });
    
    test.it('should load saved progress correctly', () => {
        test.expect(game.playerData.level).toBe(10);
        test.expect(game.playerData.coins).toBe(2500);
        test.expect(game.playerData.completedLevels).toHaveLength(9);
        test.expect(game.renovationManager.inventory.hasFurniture('stove_basic')).toBe(true);
    });
    
    test.it('should award daily bonus', () => {
        const initialCoins = game.playerData.coins;
        
        // Trigger daily bonus check
        game.currencyManager.checkDailyBonus();
        
        test.expect(game.playerData.coins).toBeGreaterThan(initialCoins);
        test.expect(game.playerData.consecutiveDays).toBe(1);
        
        const today = new Date().toDateString();
        test.expect(game.playerData.lastDailyBonus).toBe(today);
    });
    
    test.it('should continue from current level', () => {
        game.startLevel(10);
        
        test.expect(game.currentLevel).toBe(10);
        test.expect(game.puzzleEngine.isPlaying).toBe(true);
    });
});

test.describe('Monetization Flow', () => {
    let game;
    
    test.beforeEach(async () => {
        document.body.innerHTML = `
            <div id="shop-screen" class="screen">
                <div class="shop-items"></div>
            </div>
            <div id="main-menu" class="screen">
                <span id="coins-display">100</span>
                <span id="stars-display">0</span>
            </div>
        `;
        
        game = new Game();
        await game.initialize();
        
        // Set low currency to trigger monetization opportunities
        game.playerData.coins = 100;
        game.playerData.stars = 0;
        game.playerData.lives = 1;
    });
    
    test.afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });
    
    test.it('should identify monetization opportunities', () => {
        const opportunities = game.analytics.getMonetizationOpportunities();
        
        test.expect(opportunities).toContain('lives_offer');
        test.expect(opportunities).toContain('coins_offer');
    });
    
    test.it('should handle in-app purchase flow', () => {
        const itemId = 'coins_1000';
        const success = game.shop.purchaseItem(itemId, 'game_currency');
        
        // Should fail due to insufficient currency
        test.expect(success).toBe(false);
        
        // Simulate successful real money purchase
        const realMoneySuccess = game.shop.purchaseWithRealMoney({
            id: itemId,
            contents: { coins: 1000 },
            price: 0.99
        });
        
        if (realMoneySuccess) {
            test.expect(game.playerData.coins).toBe(1100);
        }
    });
    
    test.it('should track purchase analytics', () => {
        const initialEvents = game.analytics.eventQueue.length;
        
        game.analytics.trackPurchase('coins_1000', 'currency', 0.99, 'usd', true);
        
        test.expect(game.analytics.eventQueue.length).toBe(initialEvents + 1);
        
        const purchaseEvent = game.analytics.eventQueue.find(e => e.name === 'purchase_attempt');
        test.expect(purchaseEvent).toBeTruthy();
        test.expect(purchaseEvent.properties.success).toBe(true);
    });
});

test.describe('Power-up Usage Flow', () => {
    let game;
    
    test.beforeEach(async () => {
        document.body.innerHTML = `
            <div id="puzzle-game" class="screen">
                <canvas id="puzzle-canvas"></canvas>
                <div class="power-ups">
                    <button class="power-up" data-type="hammer" data-count="3">🔨</button>
                    <button class="power-up" data-type="bomb" data-count="2">💣</button>
                </div>
            </div>
        `;
        
        game = new Game();
        await game.initialize();
        
        // Start a level
        game.startLevel(5);
    });
    
    test.afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });
    
    test.it('should use hammer power-up correctly', () => {
        const initialHammers = game.puzzleEngine.powerUps.inventory.hammer;
        
        // Activate hammer
        const success = game.puzzleEngine.powerUps.activatePowerUp('hammer');
        test.expect(success).toBe(true);
        test.expect(game.puzzleEngine.powerUps.activePowerUp).toBe('hammer');
        
        // Use hammer on tile
        const used = game.puzzleEngine.powerUps.handleTileClick(2, 2);
        test.expect(used).toBe(true);
        test.expect(game.puzzleEngine.powerUps.inventory.hammer).toBe(initialHammers - 1);
    });
    
    test.it('should prevent power-up use when none available', () => {
        // Set hammer count to 0
        game.puzzleEngine.powerUps.inventory.hammer = 0;
        
        const success = game.puzzleEngine.powerUps.activatePowerUp('hammer');
        test.expect(success).toBe(false);
    });
    
    test.it('should track power-up analytics', () => {
        const initialEvents = game.analytics.eventQueue.length;
        
        game.puzzleEngine.powerUps.activatePowerUp('bomb');
        game.puzzleEngine.powerUps.handleTileClick(3, 3);
        
        // Should track power-up usage
        const powerUpEvents = game.analytics.eventQueue.filter(e => e.name === 'powerup_used');
        test.expect(powerUpEvents.length).toBeGreaterThan(0);
    });
});

test.describe('Performance Under Load', () => {
    let game;
    let performanceMonitor;
    
    test.beforeEach(async () => {
        document.body.innerHTML = `
            <div id="puzzle-game" class="screen">
                <canvas id="puzzle-canvas"></canvas>
            </div>
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
    
    test.it('should maintain performance during intensive gameplay', async () => {
        game.startLevel(1);
        
        // Simulate intensive gameplay
        for (let i = 0; i < 100; i++) {
            performanceMonitor.startFrame();
            
            // Simulate game update
            game.puzzleEngine.update(16);
            game.puzzleEngine.render();
            
            performanceMonitor.endFrame();
            
            // Small delay to prevent blocking
            if (i % 10 === 0) {
                await test.sleep(1);
            }
        }
        
        const avgFrameTime = performanceMonitor.getAverageFrameTime();
        test.expect(avgFrameTime).toBeLessThan(33); // Should maintain 30+ FPS
        
        const suggestions = performanceMonitor.getOptimizationSuggestions();
        console.log('Performance suggestions:', suggestions);
    });
    
    test.it('should handle memory efficiently', () => {
        const initialMemory = performanceMonitor.getMemoryUsage();
        
        // Create and destroy many objects
        for (let i = 0; i < 1000; i++) {
            const tile = new Tile('red', i % 8, Math.floor(i / 8));
            tile.startAnimation('spawn');
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        const finalMemory = performanceMonitor.getMemoryUsage();
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable
        test.expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
    });
});

test.describe('Error Handling', () => {
    let game;
    
    test.beforeEach(async () => {
        document.body.innerHTML = `<div id="main-menu" class="screen"></div>`;
        game = new Game();
    });
    
    test.afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });
    
    test.it('should handle corrupted save data gracefully', async () => {
        // Set corrupted save data
        localStorage.setItem('homeSweetPuzzle_save', 'invalid json');
        
        await game.initialize();
        
        // Should fall back to defaults
        test.expect(game.playerData.level).toBe(1);
        test.expect(game.playerData.coins).toBe(GameConfig.ECONOMY.STARTING_COINS);
    });
    
    test.it('should handle missing DOM elements', async () => {
        // Remove required elements
        document.body.innerHTML = '';
        
        // Should not crash
        await game.initialize();
        test.expect(game.isInitialized).toBe(true);
    });
    
    test.it('should handle invalid level data', () => {
        game.initialize();
        
        // Try to start invalid level
        const success = game.startLevel(-1);
        test.expect(success).toBe(false);
        
        const success2 = game.startLevel(999);
        test.expect(success2).toBe(false);
    });
});
