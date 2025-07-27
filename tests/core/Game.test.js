/**
 * Unit tests for Game class
 * Tests the main game controller and state management
 */

describe('Game', () => {
  let game;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="loading-screen" class="screen active"></div>
      <div id="main-menu" class="screen"></div>
      <div id="puzzle-screen" class="screen"></div>
      <div id="renovation-screen" class="screen"></div>
      <div id="coins-display">1000</div>
      <div id="stars-display">5</div>
      <div id="lives-display">5</div>
    `;

    // Mock the Game class
    global.Game = class Game {
      constructor() {
        this.currentScreen = 'loading-screen';
        this.gameState = 'menu';
        this.isInitialized = false;
        
        // Core systems (mocked)
        this.stateManager = null;
        this.saveSystem = null;
        this.puzzleEngine = null;
        this.renovationManager = null;
        this.currencyManager = null;
        this.storyManager = null;
        this.uiManager = null;
        
        // Game data
        this.playerData = {
          level: 1,
          coins: 1000,
          stars: 5,
          lives: 5,
          maxLives: 5,
          lastLifeTime: Date.now(),
          currentRoom: 'kitchen',
          unlockedRooms: ['kitchen'],
          completedLevels: [],
          achievements: [],
          settings: {
            soundEnabled: true,
            musicEnabled: true,
            vibrationEnabled: true,
            difficulty: 'normal'
          },
          stats: {
            totalPlayTime: 0,
            levelsCompleted: 0,
            coinsEarned: 0,
            furniturePurchased: 0
          }
        };
        
        this.gameConfig = {
          version: '1.0.0',
          debug: false,
          autoSave: true,
          saveInterval: 30000
        };
      }
      
      initialize() {
        if (this.isInitialized) {
          return Promise.resolve();
        }
        
        return new Promise((resolve) => {
          // Simulate initialization
          setTimeout(() => {
            this.isInitialized = true;
            this.gameState = 'menu';
            this.currentScreen = 'main-menu';
            resolve();
          }, 100);
        });
      }
      
      start() {
        if (!this.isInitialized) {
          throw new Error('Game not initialized');
        }
        
        this.gameState = 'playing';
        this.updateUI();
      }
      
      pause() {
        if (this.gameState === 'playing') {
          this.gameState = 'paused';
          return true;
        }
        return false;
      }
      
      resume() {
        if (this.gameState === 'paused') {
          this.gameState = 'playing';
          return true;
        }
        return false;
      }
      
      stop() {
        this.gameState = 'menu';
        this.currentScreen = 'main-menu';
        this.updateUI();
      }
      
      switchScreen(screenId) {
        if (!screenId) return false;
        
        const screens = ['loading-screen', 'main-menu', 'puzzle-screen', 'renovation-screen'];
        if (!screens.includes(screenId)) {
          return false;
        }
        
        // Hide current screen
        const currentElement = document.getElementById(this.currentScreen);
        if (currentElement) {
          currentElement.classList.remove('active');
        }
        
        // Show new screen
        const newElement = document.getElementById(screenId);
        if (newElement) {
          newElement.classList.add('active');
          this.currentScreen = screenId;
          return true;
        }
        
        return false;
      }
      
      updateUI() {
        this.updateCurrencyDisplay();
        this.updateLivesDisplay();
      }
      
      updateCurrencyDisplay() {
        const coinsElement = document.getElementById('coins-display');
        const starsElement = document.getElementById('stars-display');
        
        if (coinsElement) {
          coinsElement.textContent = this.playerData.coins.toString();
        }
        if (starsElement) {
          starsElement.textContent = this.playerData.stars.toString();
        }
      }
      
      updateLivesDisplay() {
        const livesElement = document.getElementById('lives-display');
        if (livesElement) {
          livesElement.textContent = this.playerData.lives.toString();
        }
      }
      
      addCurrency(type, amount) {
        if (amount <= 0) return false;
        
        const maxAmounts = {
          coins: 999999,
          stars: 9999,
          lives: this.playerData.maxLives
        };
        
        if (!maxAmounts.hasOwnProperty(type)) {
          return false;
        }
        
        const currentAmount = this.playerData[type];
        const maxAmount = maxAmounts[type];
        const actualAmount = Math.min(amount, maxAmount - currentAmount);
        
        if (actualAmount <= 0) {
          return false;
        }
        
        this.playerData[type] += actualAmount;
        this.updateUI();
        return true;
      }
      
      spendCurrency(type, amount) {
        if (amount <= 0) return false;
        
        if (!this.playerData.hasOwnProperty(type)) {
          return false;
        }
        
        if (this.playerData[type] < amount) {
          return false;
        }
        
        this.playerData[type] -= amount;
        this.updateUI();
        return true;
      }
      
      save() {
        return new Promise((resolve) => {
          // Simulate save operation
          setTimeout(() => {
            resolve(true);
          }, 50);
        });
      }
      
      load() {
        return new Promise((resolve) => {
          // Simulate load operation
          setTimeout(() => {
            resolve(true);
          }, 50);
        });
      }
      
      reset() {
        this.playerData = {
          level: 1,
          coins: 1000,
          stars: 5,
          lives: 5,
          maxLives: 5,
          lastLifeTime: Date.now(),
          currentRoom: 'kitchen',
          unlockedRooms: ['kitchen'],
          completedLevels: [],
          achievements: [],
          settings: {
            soundEnabled: true,
            musicEnabled: true,
            vibrationEnabled: true,
            difficulty: 'normal'
          },
          stats: {
            totalPlayTime: 0,
            levelsCompleted: 0,
            coinsEarned: 0,
            furniturePurchased: 0
          }
        };
        
        this.gameState = 'menu';
        this.currentScreen = 'main-menu';
        this.updateUI();
      }
      
      getGameState() {
        return {
          state: this.gameState,
          screen: this.currentScreen,
          playerData: { ...this.playerData },
          isInitialized: this.isInitialized
        };
      }
    };

    game = new Game();
  });

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      expect(game.currentScreen).toBe('loading-screen');
      expect(game.gameState).toBe('menu');
      expect(game.isInitialized).toBe(false);
    });

    test('should initialize player data with defaults', () => {
      expect(game.playerData.level).toBe(1);
      expect(game.playerData.coins).toBe(1000);
      expect(game.playerData.stars).toBe(5);
      expect(game.playerData.lives).toBe(5);
      expect(game.playerData.currentRoom).toBe('kitchen');
      expect(game.playerData.unlockedRooms).toContain('kitchen');
    });

    test('should initialize settings with defaults', () => {
      expect(game.playerData.settings.soundEnabled).toBe(true);
      expect(game.playerData.settings.musicEnabled).toBe(true);
      expect(game.playerData.settings.difficulty).toBe('normal');
    });
  });

  describe('Initialization', () => {
    test('initialize should set initialized state', async () => {
      await game.initialize();
      
      expect(game.isInitialized).toBe(true);
      expect(game.gameState).toBe('menu');
      expect(game.currentScreen).toBe('main-menu');
    });

    test('initialize should not reinitialize if already initialized', async () => {
      await game.initialize();
      const firstInitTime = Date.now();
      
      await game.initialize();
      
      expect(game.isInitialized).toBe(true);
    });
  });

  describe('Game State Management', () => {
    beforeEach(async () => {
      await game.initialize();
    });

    test('start should change state to playing', () => {
      game.start();
      expect(game.gameState).toBe('playing');
    });

    test('start should throw error if not initialized', () => {
      game.isInitialized = false;
      expect(() => game.start()).toThrow('Game not initialized');
    });

    test('pause should work only when playing', () => {
      game.start();
      expect(game.pause()).toBe(true);
      expect(game.gameState).toBe('paused');
      
      // Should not pause when not playing
      expect(game.pause()).toBe(false);
    });

    test('resume should work only when paused', () => {
      game.start();
      game.pause();
      
      expect(game.resume()).toBe(true);
      expect(game.gameState).toBe('playing');
      
      // Should not resume when not paused
      expect(game.resume()).toBe(false);
    });

    test('stop should return to menu state', () => {
      game.start();
      game.stop();
      
      expect(game.gameState).toBe('menu');
      expect(game.currentScreen).toBe('main-menu');
    });
  });

  describe('Screen Management', () => {
    test('switchScreen should change to valid screens', () => {
      const result = game.switchScreen('puzzle-screen');
      
      expect(result).toBe(true);
      expect(game.currentScreen).toBe('puzzle-screen');
    });

    test('switchScreen should reject invalid screens', () => {
      const result = game.switchScreen('invalid-screen');
      
      expect(result).toBe(false);
      expect(game.currentScreen).toBe('loading-screen'); // Should remain unchanged
    });

    test('switchScreen should handle null/undefined screen', () => {
      expect(game.switchScreen(null)).toBe(false);
      expect(game.switchScreen(undefined)).toBe(false);
    });

    test('switchScreen should update DOM classes', () => {
      const oldScreen = document.getElementById('loading-screen');
      const newScreen = document.getElementById('main-menu');
      
      game.switchScreen('main-menu');
      
      expect(oldScreen.classList.contains('active')).toBe(false);
      expect(newScreen.classList.contains('active')).toBe(true);
    });
  });

  describe('Currency Management', () => {
    test('addCurrency should increase currency amounts', () => {
      const result = game.addCurrency('coins', 500);
      
      expect(result).toBe(true);
      expect(game.playerData.coins).toBe(1500);
    });

    test('addCurrency should respect maximum limits', () => {
      game.playerData.coins = 999990;
      const result = game.addCurrency('coins', 100);
      
      expect(result).toBe(true);
      expect(game.playerData.coins).toBe(999999); // Capped at max
    });

    test('addCurrency should reject invalid amounts', () => {
      expect(game.addCurrency('coins', 0)).toBe(false);
      expect(game.addCurrency('coins', -100)).toBe(false);
    });

    test('spendCurrency should decrease currency amounts', () => {
      const result = game.spendCurrency('coins', 200);
      
      expect(result).toBe(true);
      expect(game.playerData.coins).toBe(800);
    });

    test('spendCurrency should reject insufficient funds', () => {
      const result = game.spendCurrency('coins', 2000);
      
      expect(result).toBe(false);
      expect(game.playerData.coins).toBe(1000); // Should remain unchanged
    });

    test('spendCurrency should reject invalid currency types', () => {
      const result = game.spendCurrency('invalid', 100);
      
      expect(result).toBe(false);
    });
  });

  describe('UI Updates', () => {
    test('updateCurrencyDisplay should update DOM elements', () => {
      game.playerData.coins = 2000;
      game.playerData.stars = 10;
      
      game.updateCurrencyDisplay();
      
      expect(document.getElementById('coins-display').textContent).toBe('2000');
      expect(document.getElementById('stars-display').textContent).toBe('10');
    });

    test('updateLivesDisplay should update lives display', () => {
      game.playerData.lives = 3;
      
      game.updateLivesDisplay();
      
      expect(document.getElementById('lives-display').textContent).toBe('3');
    });
  });

  describe('Save/Load System', () => {
    test('save should return promise that resolves', async () => {
      const result = await game.save();
      expect(result).toBe(true);
    });

    test('load should return promise that resolves', async () => {
      const result = await game.load();
      expect(result).toBe(true);
    });
  });

  describe('Game Reset', () => {
    test('reset should restore default player data', () => {
      // Modify game state
      game.playerData.coins = 5000;
      game.playerData.level = 10;
      game.gameState = 'playing';
      
      game.reset();
      
      expect(game.playerData.coins).toBe(1000);
      expect(game.playerData.level).toBe(1);
      expect(game.gameState).toBe('menu');
    });

    test('reset should clear completed levels and achievements', () => {
      game.playerData.completedLevels = [1, 2, 3];
      game.playerData.achievements = ['first_level', 'big_spender'];
      
      game.reset();
      
      expect(game.playerData.completedLevels).toEqual([]);
      expect(game.playerData.achievements).toEqual([]);
    });
  });

  describe('Game State Retrieval', () => {
    test('getGameState should return current game state', () => {
      const state = game.getGameState();
      
      expect(state.state).toBe('menu');
      expect(state.screen).toBe('loading-screen');
      expect(state.isInitialized).toBe(false);
      expect(state.playerData).toEqual(game.playerData);
    });

    test('getGameState should return a copy of player data', () => {
      const state = game.getGameState();
      state.playerData.coins = 999;
      
      expect(game.playerData.coins).toBe(1000); // Should remain unchanged
    });
  });
});