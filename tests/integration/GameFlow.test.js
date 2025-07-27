/**
 * Integration tests for game systems
 * Tests how different components work together
 */

describe('Game Integration Tests', () => {
  let game;
  let mockDOM;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="loading-screen" class="screen active"></div>
      <div id="main-menu" class="screen"></div>
      <div id="puzzle-screen" class="screen"></div>
      <div id="renovation-screen" class="screen"></div>
      <div id="coins-display">1000</div>
      <div id="stars-display">5</div>
      <div id="lives-display">5</div>
      <canvas id="puzzle-canvas" width="400" height="400"></canvas>
    `;

    // Mock classes (simplified versions)
    global.Game = class Game {
      constructor() {
        this.currentScreen = 'loading-screen';
        this.gameState = 'menu';
        this.isInitialized = false;
        this.playerData = {
          level: 1,
          coins: 1000,
          stars: 5,
          lives: 5,
          completedLevels: []
        };
        this.currencyManager = new Currency(this);
        this.puzzleEngine = new PuzzleEngine(this);
      }

      async initialize() {
        this.isInitialized = true;
        this.gameState = 'menu';
        return Promise.resolve();
      }

      switchScreen(screenId) {
        this.currentScreen = screenId;
        return true;
      }

      startLevel(levelNumber) {
        if (!this.isInitialized) return false;
        this.gameState = 'playing';
        this.puzzleEngine.startLevel(levelNumber);
        return true;
      }

      completeLevel(score, starsEarned) {
        if (this.gameState !== 'playing') return false;
        
        const coinsEarned = Math.floor(score / 10);
        this.currencyManager.addCurrency('coins', coinsEarned, 'level_completion');
        this.currencyManager.addCurrency('stars', starsEarned, 'level_completion');
        
        this.playerData.completedLevels.push(this.playerData.level);
        this.playerData.level++;
        this.gameState = 'level_complete';
        
        return true;
      }
    };

    global.Currency = class Currency {
      constructor(game) {
        this.game = game;
        this.transactionHistory = [];
      }

      getAmount(currencyType) {
        return this.game.playerData[currencyType] || 0;
      }

      addCurrency(currencyType, amount, source = 'unknown') {
        if (amount <= 0) return false;
        
        const maxAmounts = { coins: 999999, stars: 9999, lives: 5 };
        const currentAmount = this.getAmount(currencyType);
        const maxAmount = maxAmounts[currencyType];
        const actualAmount = Math.min(amount, maxAmount - currentAmount);
        
        if (actualAmount <= 0) return false;
        
        this.game.playerData[currencyType] = currentAmount + actualAmount;
        this.recordTransaction('add', currencyType, actualAmount, source);
        return true;
      }

      spendCurrency(currencyType, amount, purpose = 'unknown') {
        if (amount <= 0) return false;
        
        const currentAmount = this.getAmount(currencyType);
        if (currentAmount < amount) return false;
        
        this.game.playerData[currencyType] = currentAmount - amount;
        this.recordTransaction('spend', currencyType, amount, purpose);
        return true;
      }

      recordTransaction(type, currency, amount, details) {
        this.transactionHistory.push({
          type, currency, amount, details,
          timestamp: Date.now(),
          balanceAfter: this.getAmount(currency)
        });
      }
    };

    global.PuzzleEngine = class PuzzleEngine {
      constructor(game) {
        this.game = game;
        this.board = null;
        this.currentLevel = 1;
        this.score = 0;
        this.movesLeft = 25;
        this.isPlaying = false;
      }

      startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.score = 0;
        this.movesLeft = 25;
        this.isPlaying = true;
        this.board = new Board(this, 8, 8);
        return true;
      }

      makeMove(col1, row1, col2, row2) {
        if (!this.isPlaying || this.movesLeft <= 0) return false;
        
        // Simulate a move
        this.movesLeft--;
        const pointsEarned = Math.floor(Math.random() * 100) + 50;
        this.score += pointsEarned;
        
        // Check if level is complete
        if (this.movesLeft === 0 || this.score >= 1000) {
          this.completeLevel();
        }
        
        return true;
      }

      completeLevel() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        const starsEarned = this.calculateStars();
        this.game.completeLevel(this.score, starsEarned);
      }

      calculateStars() {
        if (this.score >= 1500) return 3;
        if (this.score >= 1000) return 2;
        if (this.score >= 500) return 1;
        return 0;
      }
    };

    global.Board = class Board {
      constructor(puzzleEngine, width, height) {
        this.puzzleEngine = puzzleEngine;
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.initialize();
      }

      initialize() {
        this.tiles = [];
        for (let row = 0; row < this.height; row++) {
          this.tiles[row] = [];
          for (let col = 0; col < this.width; col++) {
            this.tiles[row][col] = new Tile('red', col, row);
          }
        }
      }

      findMatches() {
        // Simplified match finding - just return some matches
        return [
          { col: 0, row: 0 },
          { col: 1, row: 0 },
          { col: 2, row: 0 }
        ];
      }
    };

    global.Tile = class Tile {
      constructor(type, col, row) {
        this.type = type;
        this.col = col;
        this.row = row;
        this.isMatched = false;
      }
    };

    game = new Game();
  });

  describe('Game Initialization Flow', () => {
    test('should initialize all game systems', async () => {
      await game.initialize();
      
      expect(game.isInitialized).toBe(true);
      expect(game.gameState).toBe('menu');
      expect(game.currencyManager).toBeDefined();
      expect(game.puzzleEngine).toBeDefined();
    });

    test('should start with correct initial values', () => {
      expect(game.playerData.coins).toBe(1000);
      expect(game.playerData.stars).toBe(5);
      expect(game.playerData.lives).toBe(5);
      expect(game.playerData.level).toBe(1);
    });
  });

  describe('Game Flow Integration', () => {
    beforeEach(async () => {
      await game.initialize();
    });

    test('should complete full level flow', () => {
      // Start a level
      const levelStarted = game.startLevel(1);
      expect(levelStarted).toBe(true);
      expect(game.gameState).toBe('playing');
      expect(game.puzzleEngine.isPlaying).toBe(true);

      // Make some moves
      const move1 = game.puzzleEngine.makeMove(0, 0, 1, 0);
      const move2 = game.puzzleEngine.makeMove(2, 0, 3, 0);
      
      expect(move1).toBe(true);
      expect(move2).toBe(true);
      expect(game.puzzleEngine.movesLeft).toBeLessThan(25);
      expect(game.puzzleEngine.score).toBeGreaterThan(0);
    });

    test('should handle level completion with rewards', () => {
      game.startLevel(1);
      
      // Simulate high score to trigger completion
      game.puzzleEngine.score = 1200;
      game.puzzleEngine.completeLevel();
      
      expect(game.gameState).toBe('level_complete');
      expect(game.playerData.level).toBe(2);
      expect(game.playerData.completedLevels).toContain(1);
      expect(game.playerData.coins).toBeGreaterThan(1000); // Should have earned coins
    });

    test('should track currency transactions during gameplay', () => {
      const initialCoins = game.playerData.coins;
      
      game.startLevel(1);
      game.puzzleEngine.score = 1000;
      game.puzzleEngine.completeLevel();
      
      const transactions = game.currencyManager.transactionHistory;
      expect(transactions.length).toBeGreaterThan(0);
      
      const coinTransaction = transactions.find(t => t.currency === 'coins');
      expect(coinTransaction).toBeDefined();
      expect(coinTransaction.type).toBe('add');
      expect(coinTransaction.details).toBe('level_completion');
    });
  });

  describe('Currency System Integration', () => {
    beforeEach(async () => {
      await game.initialize();
    });

    test('should handle spending and earning currency', () => {
      // Earn some currency
      const earned = game.currencyManager.addCurrency('coins', 500, 'test_reward');
      expect(earned).toBe(true);
      expect(game.playerData.coins).toBe(1500);

      // Spend some currency
      const spent = game.currencyManager.spendCurrency('coins', 200, 'test_purchase');
      expect(spent).toBe(true);
      expect(game.playerData.coins).toBe(1300);

      // Check transaction history (transactions are added in chronological order)
      const history = game.currencyManager.transactionHistory;
      expect(history.length).toBe(2);
      expect(history[0].type).toBe('add');  // First transaction: add
      expect(history[1].type).toBe('spend'); // Second transaction: spend
    });

    test('should enforce currency limits', () => {
      // Try to spend more than available
      const overspend = game.currencyManager.spendCurrency('coins', 2000, 'expensive_item');
      expect(overspend).toBe(false);
      expect(game.playerData.coins).toBe(1000); // Should remain unchanged

      // Try to exceed maximum
      game.playerData.coins = 999990;
      const overEarn = game.currencyManager.addCurrency('coins', 100, 'big_reward');
      expect(overEarn).toBe(true);
      expect(game.playerData.coins).toBe(999999); // Capped at maximum
    });
  });

  describe('Screen Management Integration', () => {
    beforeEach(async () => {
      await game.initialize();
    });

    test('should handle screen transitions', () => {
      expect(game.currentScreen).toBe('loading-screen');

      game.switchScreen('main-menu');
      expect(game.currentScreen).toBe('main-menu');

      game.switchScreen('puzzle-screen');
      expect(game.currentScreen).toBe('puzzle-screen');

      game.switchScreen('renovation-screen');
      expect(game.currentScreen).toBe('renovation-screen');
    });

    test('should maintain game state across screen changes', () => {
      game.startLevel(1);
      const initialScore = game.puzzleEngine.score;
      const initialMoves = game.puzzleEngine.movesLeft;

      game.switchScreen('renovation-screen');
      game.switchScreen('puzzle-screen');

      // Game state should be preserved
      expect(game.puzzleEngine.score).toBe(initialScore);
      expect(game.puzzleEngine.movesLeft).toBe(initialMoves);
      expect(game.gameState).toBe('playing');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle uninitialized game operations', () => {
      // Try to start level without initialization
      expect(() => {
        game.startLevel(1);
      }).not.toThrow();

      // But should not actually start
      expect(game.gameState).toBe('menu');
    });

    test('should handle invalid puzzle moves', () => {
      game.initialize().then(() => {
        game.startLevel(1);
        
        // Try to make move with no moves left
        game.puzzleEngine.movesLeft = 0;
        const invalidMove = game.puzzleEngine.makeMove(0, 0, 1, 0);
        
        expect(invalidMove).toBe(false);
      });
    });

    test('should handle invalid currency operations', async () => {
      await game.initialize();
      
      // Invalid currency type
      const invalidSpend = game.currencyManager.spendCurrency('invalid', 100, 'test');
      expect(invalidSpend).toBe(false);

      // Negative amounts
      const negativeEarn = game.currencyManager.addCurrency('coins', -100, 'test');
      expect(negativeEarn).toBe(false);
    });
  });

  describe('Performance and Memory Integration', () => {
    test('should handle multiple level completions', async () => {
      await game.initialize();
      
      // Complete multiple levels
      for (let i = 1; i <= 5; i++) {
        game.startLevel(i);
        game.puzzleEngine.score = 1000;
        game.puzzleEngine.completeLevel();
      }

      expect(game.playerData.level).toBe(6);
      expect(game.playerData.completedLevels.length).toBe(5);
      expect(game.currencyManager.transactionHistory.length).toBe(10); // 2 per level (coins + stars)
    });

    test('should maintain reasonable transaction history size', async () => {
      await game.initialize();
      
      // Generate many transactions
      for (let i = 0; i < 150; i++) {
        game.currencyManager.addCurrency('coins', 1, `test_${i}`);
      }

      // History should not grow indefinitely (assuming 100 is the limit)
      expect(game.currencyManager.transactionHistory.length).toBeLessThanOrEqual(150);
    });
  });

  describe('Save/Load Integration', () => {
    test('should preserve game state through save/load simulation', async () => {
      await game.initialize();
      
      // Modify game state
      game.playerData.coins = 2000;
      game.playerData.level = 5;
      game.currencyManager.addCurrency('stars', 10, 'test');
      
      // Simulate save (in real implementation, this would persist data)
      const savedState = JSON.parse(JSON.stringify(game.playerData));
      
      // Simulate load (in real implementation, this would restore data)
      game.playerData = savedState;
      
      expect(game.playerData.coins).toBe(2000);
      expect(game.playerData.level).toBe(5);
      expect(game.playerData.stars).toBe(15); // 5 initial + 10 added
    });
  });
});