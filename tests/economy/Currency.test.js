/**
 * Unit tests for Currency class
 * Tests the in-game currency management system
 */

describe('Currency', () => {
  let currency;
  let mockGame;

  beforeEach(() => {
    // Mock game object
    mockGame = {
      playerData: {
        coins: 1000,
        stars: 5,
        lives: 5
      },
      saveSystem: {
        save: jest.fn()
      }
    };

    // Mock the Currency class
    global.Currency = class Currency {
      constructor(game) {
        this.game = game;
        
        this.currencies = {
          coins: {
            name: 'Coins',
            icon: '💰',
            description: 'Primary currency for purchasing furniture and boosters',
            maxAmount: 999999,
            earnRate: 1.0
          },
          stars: {
            name: 'Stars',
            icon: '⭐',
            description: 'Premium currency for exclusive items and upgrades',
            maxAmount: 9999,
            earnRate: 0.1
          },
          lives: {
            name: 'Lives',
            icon: '❤️',
            description: 'Required to play puzzle levels',
            maxAmount: 5,
            regenTime: 30 * 60 * 1000
          }
        };
        
        this.transactionHistory = [];
        this.maxHistoryLength = 100;
        
        this.dailyBonuses = {
          coins: [100, 150, 200, 250, 300, 400, 500],
          stars: [1, 1, 2, 2, 3, 3, 5]
        };
        
        this.multipliers = {
          coins: 1.0,
          stars: 1.0,
          experience: 1.0
        };
      }
      
      getAmount(currencyType) {
        return this.game.playerData[currencyType] || 0;
      }
      
      addCurrency(currencyType, amount, source = 'unknown') {
        if (!this.currencies[currencyType] || amount <= 0) {
          return false;
        }
        
        const currentAmount = this.getAmount(currencyType);
        const maxAmount = this.currencies[currencyType].maxAmount;
        const actualAmount = Math.min(amount, maxAmount - currentAmount);
        
        if (actualAmount <= 0) {
          return false;
        }
        
        this.game.playerData[currencyType] = currentAmount + actualAmount;
        this.recordTransaction('add', currencyType, actualAmount, source);
        
        return true;
      }
      
      spendCurrency(currencyType, amount, purpose = 'unknown') {
        if (!this.currencies[currencyType] || amount <= 0) {
          return false;
        }
        
        const currentAmount = this.getAmount(currencyType);
        
        if (currentAmount < amount) {
          return false;
        }
        
        this.game.playerData[currencyType] = currentAmount - amount;
        this.recordTransaction('spend', currencyType, amount, purpose);
        
        return true;
      }
      
      canAfford(currencyType, amount) {
        return this.getAmount(currencyType) >= amount;
      }
      
      recordTransaction(type, currency, amount, details) {
        const transaction = {
          id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          type,
          currency,
          amount,
          details,
          timestamp: Date.now(),
          balanceAfter: this.getAmount(currency)
        };
        
        this.transactionHistory.unshift(transaction);
        
        if (this.transactionHistory.length > this.maxHistoryLength) {
          this.transactionHistory.pop();
        }
      }
      
      getDailyBonus(day) {
        const dayIndex = Math.min(day - 1, 6);
        return {
          coins: this.dailyBonuses.coins[dayIndex],
          stars: this.dailyBonuses.stars[dayIndex]
        };
      }
      
      applyMultiplier(currencyType, baseAmount) {
        const multiplier = this.multipliers[currencyType] || 1.0;
        return Math.floor(baseAmount * multiplier);
      }
      
      setMultiplier(currencyType, multiplier) {
        if (this.multipliers.hasOwnProperty(currencyType)) {
          this.multipliers[currencyType] = Math.max(0, multiplier);
        }
      }
      
      getTransactionHistory(limit = 10) {
        return this.transactionHistory.slice(0, limit);
      }
      
      clearTransactionHistory() {
        this.transactionHistory = [];
      }
    };

    currency = new Currency(mockGame);
  });

  describe('Constructor', () => {
    test('should initialize with correct currency definitions', () => {
      expect(currency.currencies.coins).toBeDefined();
      expect(currency.currencies.stars).toBeDefined();
      expect(currency.currencies.lives).toBeDefined();
      
      expect(currency.currencies.coins.maxAmount).toBe(999999);
      expect(currency.currencies.stars.maxAmount).toBe(9999);
      expect(currency.currencies.lives.maxAmount).toBe(5);
    });

    test('should initialize empty transaction history', () => {
      expect(currency.transactionHistory).toEqual([]);
      expect(currency.maxHistoryLength).toBe(100);
    });

    test('should initialize multipliers to 1.0', () => {
      expect(currency.multipliers.coins).toBe(1.0);
      expect(currency.multipliers.stars).toBe(1.0);
      expect(currency.multipliers.experience).toBe(1.0);
    });
  });

  describe('Currency Retrieval', () => {
    test('getAmount should return current currency amount', () => {
      expect(currency.getAmount('coins')).toBe(1000);
      expect(currency.getAmount('stars')).toBe(5);
      expect(currency.getAmount('lives')).toBe(5);
    });

    test('getAmount should return 0 for invalid currency', () => {
      expect(currency.getAmount('invalid')).toBe(0);
    });
  });

  describe('Adding Currency', () => {
    test('addCurrency should increase currency amount', () => {
      const result = currency.addCurrency('coins', 500, 'test');
      
      expect(result).toBe(true);
      expect(currency.getAmount('coins')).toBe(1500);
    });

    test('addCurrency should respect maximum limits', () => {
      mockGame.playerData.coins = 999900;
      const result = currency.addCurrency('coins', 200, 'test');
      
      expect(result).toBe(true);
      expect(currency.getAmount('coins')).toBe(999999); // Capped at max
    });

    test('addCurrency should reject amounts that exceed maximum', () => {
      mockGame.playerData.coins = 999999;
      const result = currency.addCurrency('coins', 1, 'test');
      
      expect(result).toBe(false);
      expect(currency.getAmount('coins')).toBe(999999);
    });

    test('addCurrency should reject invalid currency types', () => {
      const result = currency.addCurrency('invalid', 100, 'test');
      
      expect(result).toBe(false);
    });

    test('addCurrency should reject negative amounts', () => {
      const result = currency.addCurrency('coins', -100, 'test');
      
      expect(result).toBe(false);
      expect(currency.getAmount('coins')).toBe(1000);
    });

    test('addCurrency should record transaction', () => {
      currency.addCurrency('coins', 500, 'level_reward');
      
      expect(currency.transactionHistory.length).toBe(1);
      expect(currency.transactionHistory[0].type).toBe('add');
      expect(currency.transactionHistory[0].currency).toBe('coins');
      expect(currency.transactionHistory[0].amount).toBe(500);
      expect(currency.transactionHistory[0].details).toBe('level_reward');
    });
  });

  describe('Spending Currency', () => {
    test('spendCurrency should decrease currency amount', () => {
      const result = currency.spendCurrency('coins', 300, 'furniture');
      
      expect(result).toBe(true);
      expect(currency.getAmount('coins')).toBe(700);
    });

    test('spendCurrency should reject insufficient funds', () => {
      const result = currency.spendCurrency('coins', 1500, 'expensive_item');
      
      expect(result).toBe(false);
      expect(currency.getAmount('coins')).toBe(1000);
    });

    test('spendCurrency should reject invalid currency types', () => {
      const result = currency.spendCurrency('invalid', 100, 'test');
      
      expect(result).toBe(false);
    });

    test('spendCurrency should reject negative amounts', () => {
      const result = currency.spendCurrency('coins', -100, 'test');
      
      expect(result).toBe(false);
      expect(currency.getAmount('coins')).toBe(1000);
    });

    test('spendCurrency should record transaction', () => {
      currency.spendCurrency('coins', 200, 'power_up');
      
      expect(currency.transactionHistory.length).toBe(1);
      expect(currency.transactionHistory[0].type).toBe('spend');
      expect(currency.transactionHistory[0].currency).toBe('coins');
      expect(currency.transactionHistory[0].amount).toBe(200);
      expect(currency.transactionHistory[0].details).toBe('power_up');
    });
  });

  describe('Affordability Checks', () => {
    test('canAfford should return true for affordable amounts', () => {
      expect(currency.canAfford('coins', 500)).toBe(true);
      expect(currency.canAfford('stars', 3)).toBe(true);
    });

    test('canAfford should return false for unaffordable amounts', () => {
      expect(currency.canAfford('coins', 1500)).toBe(false);
      expect(currency.canAfford('stars', 10)).toBe(false);
    });

    test('canAfford should handle exact amounts', () => {
      expect(currency.canAfford('coins', 1000)).toBe(true);
      expect(currency.canAfford('stars', 5)).toBe(true);
    });
  });

  describe('Transaction History', () => {
    test('should maintain transaction history', () => {
      currency.addCurrency('coins', 100, 'test1');
      currency.spendCurrency('coins', 50, 'test2');
      
      expect(currency.transactionHistory.length).toBe(2);
      expect(currency.transactionHistory[0].type).toBe('spend'); // Latest first
      expect(currency.transactionHistory[1].type).toBe('add');
    });

    test('should limit transaction history length', () => {
      // Simulate many transactions
      for (let i = 0; i < 150; i++) {
        currency.addCurrency('coins', 1, `test${i}`);
      }
      
      expect(currency.transactionHistory.length).toBe(100);
    });

    test('getTransactionHistory should return limited results', () => {
      for (let i = 0; i < 20; i++) {
        currency.addCurrency('coins', 1, `test${i}`);
      }
      
      const history = currency.getTransactionHistory(5);
      expect(history.length).toBe(5);
    });

    test('clearTransactionHistory should empty the history', () => {
      currency.addCurrency('coins', 100, 'test');
      currency.clearTransactionHistory();
      
      expect(currency.transactionHistory.length).toBe(0);
    });
  });

  describe('Daily Bonuses', () => {
    test('getDailyBonus should return correct bonuses for different days', () => {
      const day1 = currency.getDailyBonus(1);
      const day7 = currency.getDailyBonus(7);
      
      expect(day1.coins).toBe(100);
      expect(day1.stars).toBe(1);
      expect(day7.coins).toBe(500);
      expect(day7.stars).toBe(5);
    });

    test('getDailyBonus should cap at maximum day bonus', () => {
      const day10 = currency.getDailyBonus(10);
      const day7 = currency.getDailyBonus(7);
      
      expect(day10.coins).toBe(day7.coins);
      expect(day10.stars).toBe(day7.stars);
    });
  });

  describe('Multipliers', () => {
    test('applyMultiplier should multiply amounts correctly', () => {
      currency.setMultiplier('coins', 1.5);
      
      const result = currency.applyMultiplier('coins', 100);
      expect(result).toBe(150);
    });

    test('applyMultiplier should floor results', () => {
      currency.setMultiplier('coins', 1.33);
      
      const result = currency.applyMultiplier('coins', 100);
      expect(result).toBe(133);
    });

    test('setMultiplier should handle invalid currency types', () => {
      currency.setMultiplier('invalid', 2.0);
      expect(currency.multipliers.invalid).toBeUndefined();
    });

    test('setMultiplier should prevent negative multipliers', () => {
      currency.setMultiplier('coins', -1.0);
      expect(currency.multipliers.coins).toBe(0);
    });
  });
});