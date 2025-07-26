/**
 * Currency System
 * Manages in-game currencies (coins, stars, lives) and transactions
 */
class Currency {
    constructor(game) {
        this.game = game;
        
        // Currency types
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
                regenTime: 30 * 60 * 1000 // 30 minutes
            }
        };
        
        // Transaction history
        this.transactionHistory = [];
        this.maxHistoryLength = 100;
        
        // Daily bonuses and rewards
        this.dailyBonuses = {
            coins: [100, 150, 200, 250, 300, 400, 500],
            stars: [1, 1, 2, 2, 3, 3, 5]
        };
        
        // Achievement multipliers
        this.multipliers = {
            coins: 1.0,
            stars: 1.0,
            experience: 1.0
        };
        
        this.initializeCurrency();
    }
    
    initializeCurrency() {
        // Initialize currency amounts from player data
        this.updateFromPlayerData();
        
        // Start life regeneration
        this.startLifeRegeneration();
        
        // Setup daily bonus tracking
        this.checkDailyBonus();
    }
    
    updateFromPlayerData() {
        const playerData = this.game.playerData;
        
        // Ensure currency properties exist
        if (typeof playerData.coins !== 'number') playerData.coins = 1000;
        if (typeof playerData.stars !== 'number') playerData.stars = 5;
        if (typeof playerData.lives !== 'number') playerData.lives = 5;
        if (typeof playerData.lastLifeTime !== 'number') playerData.lastLifeTime = Date.now();
    }
    
    // Coin operations
    addCoins(amount, source = 'unknown') {
        const adjustedAmount = Math.floor(amount * this.multipliers.coins);
        const maxCoins = this.currencies.coins.maxAmount;
        const currentCoins = this.game.playerData.coins;
        
        const actualAmount = Math.min(adjustedAmount, maxCoins - currentCoins);
        
        if (actualAmount > 0) {
            this.game.playerData.coins += actualAmount;
            this.recordTransaction('coins', actualAmount, 'earned', source);
            this.showCurrencyAnimation('coins', actualAmount);
            this.updateDisplay();
            
            console.log(`Added ${actualAmount} coins from ${source}`);
            return actualAmount;
        }
        
        return 0;
    }
    
    spendCoins(amount, purpose = 'unknown') {
        const currentCoins = this.game.playerData.coins;
        
        if (currentCoins >= amount) {
            this.game.playerData.coins -= amount;
            this.recordTransaction('coins', amount, 'spent', purpose);
            this.updateDisplay();
            
            console.log(`Spent ${amount} coins on ${purpose}`);
            return true;
        }
        
        console.warn(`Not enough coins: need ${amount}, have ${currentCoins}`);
        return false;
    }
    
    getCoins() {
        return this.game.playerData.coins;
    }
    
    // Star operations
    addStars(amount, source = 'unknown') {
        const adjustedAmount = Math.floor(amount * this.multipliers.stars);
        const maxStars = this.currencies.stars.maxAmount;
        const currentStars = this.game.playerData.stars;
        
        const actualAmount = Math.min(adjustedAmount, maxStars - currentStars);
        
        if (actualAmount > 0) {
            this.game.playerData.stars += actualAmount;
            this.recordTransaction('stars', actualAmount, 'earned', source);
            this.showCurrencyAnimation('stars', actualAmount);
            this.updateDisplay();
            
            console.log(`Added ${actualAmount} stars from ${source}`);
            return actualAmount;
        }
        
        return 0;
    }
    
    spendStars(amount, purpose = 'unknown') {
        const currentStars = this.game.playerData.stars;
        
        if (currentStars >= amount) {
            this.game.playerData.stars -= amount;
            this.recordTransaction('stars', amount, 'spent', purpose);
            this.updateDisplay();
            
            console.log(`Spent ${amount} stars on ${purpose}`);
            return true;
        }
        
        console.warn(`Not enough stars: need ${amount}, have ${currentStars}`);
        return false;
    }
    
    getStars() {
        return this.game.playerData.stars;
    }
    
    // Life operations
    addLives(amount, source = 'unknown') {
        const maxLives = this.currencies.lives.maxAmount;
        const currentLives = this.game.playerData.lives;
        
        const actualAmount = Math.min(amount, maxLives - currentLives);
        
        if (actualAmount > 0) {
            this.game.playerData.lives += actualAmount;
            this.game.playerData.lastLifeTime = Date.now();
            this.recordTransaction('lives', actualAmount, 'earned', source);
            this.updateDisplay();
            
            console.log(`Added ${actualAmount} lives from ${source}`);
            return actualAmount;
        }
        
        return 0;
    }
    
    spendLife(purpose = 'level_attempt') {
        const currentLives = this.game.playerData.lives;
        
        if (currentLives > 0) {
            this.game.playerData.lives--;
            this.recordTransaction('lives', 1, 'spent', purpose);
            this.updateDisplay();
            
            console.log(`Spent 1 life on ${purpose}`);
            return true;
        }
        
        console.warn('No lives available');
        return false;
    }
    
    getLives() {
        return this.game.playerData.lives;
    }
    
    getTimeUntilNextLife() {
        const maxLives = this.currencies.lives.maxAmount;
        const currentLives = this.game.playerData.lives;
        
        if (currentLives >= maxLives) return 0;
        
        const regenTime = this.currencies.lives.regenTime;
        const timeSinceLastLife = Date.now() - this.game.playerData.lastLifeTime;
        const timeUntilNext = regenTime - (timeSinceLastLife % regenTime);
        
        return Math.max(0, timeUntilNext);
    }
    
    startLifeRegeneration() {
        setInterval(() => {
            this.regenerateLife();
        }, 60000); // Check every minute
    }
    
    regenerateLife() {
        const maxLives = this.currencies.lives.maxAmount;
        const currentLives = this.game.playerData.lives;
        
        if (currentLives >= maxLives) return;
        
        const regenTime = this.currencies.lives.regenTime;
        const timeSinceLastLife = Date.now() - this.game.playerData.lastLifeTime;
        
        if (timeSinceLastLife >= regenTime) {
            const livesToAdd = Math.floor(timeSinceLastLife / regenTime);
            const actualLivesToAdd = Math.min(livesToAdd, maxLives - currentLives);
            
            if (actualLivesToAdd > 0) {
                this.addLives(actualLivesToAdd, 'regeneration');
                this.game.playerData.lastLifeTime = Date.now();
            }
        }
    }
    
    // Transaction tracking
    recordTransaction(currency, amount, type, source) {
        const transaction = {
            id: this.generateTransactionId(),
            currency: currency,
            amount: amount,
            type: type, // 'earned' or 'spent'
            source: source,
            timestamp: Date.now(),
            balanceAfter: this.game.playerData[currency]
        };
        
        this.transactionHistory.unshift(transaction);
        
        // Limit history length
        if (this.transactionHistory.length > this.maxHistoryLength) {
            this.transactionHistory = this.transactionHistory.slice(0, this.maxHistoryLength);
        }
    }
    
    generateTransactionId() {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getTransactionHistory(currency = null, limit = 20) {
        let history = this.transactionHistory;
        
        if (currency) {
            history = history.filter(tx => tx.currency === currency);
        }
        
        return history.slice(0, limit);
    }
    
    // Daily bonuses
    checkDailyBonus() {
        const playerData = this.game.playerData;
        const today = new Date().toDateString();
        
        if (!playerData.lastDailyBonus || playerData.lastDailyBonus !== today) {
            this.calculateDailyBonus();
        }
    }
    
    calculateDailyBonus() {
        const playerData = this.game.playerData;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        // Calculate consecutive days
        let consecutiveDays = playerData.consecutiveDays || 0;
        
        if (playerData.lastDailyBonus === yesterday) {
            consecutiveDays++;
        } else if (playerData.lastDailyBonus !== today) {
            consecutiveDays = 1;
        }
        
        // Cap at 7 days (weekly cycle)
        consecutiveDays = Math.min(consecutiveDays, 7);
        
        // Award daily bonus
        const dayIndex = consecutiveDays - 1;
        const coinsBonus = this.dailyBonuses.coins[dayIndex];
        const starsBonus = this.dailyBonuses.stars[dayIndex];
        
        this.addCoins(coinsBonus, 'daily_bonus');
        this.addStars(starsBonus, 'daily_bonus');
        
        // Update player data
        playerData.lastDailyBonus = today;
        playerData.consecutiveDays = consecutiveDays;
        
        // Show daily bonus modal
        this.showDailyBonusModal(coinsBonus, starsBonus, consecutiveDays);
    }
    
    // Multipliers and bonuses
    setMultiplier(currency, multiplier, duration = null) {
        this.multipliers[currency] = multiplier;
        
        if (duration) {
            setTimeout(() => {
                this.multipliers[currency] = 1.0;
            }, duration);
        }
    }
    
    getMultiplier(currency) {
        return this.multipliers[currency] || 1.0;
    }
    
    // Purchase validation
    canAfford(currency, amount) {
        const current = this.game.playerData[currency] || 0;
        return current >= amount;
    }
    
    getAffordableAmount(currency, unitPrice) {
        const current = this.game.playerData[currency] || 0;
        return Math.floor(current / unitPrice);
    }
    
    // Currency conversion (for special offers)
    convertCurrency(fromCurrency, toCurrency, amount, rate) {
        if (!this.canAfford(fromCurrency, amount)) {
            return false;
        }
        
        const convertedAmount = Math.floor(amount * rate);
        
        if (this.spendCurrency(fromCurrency, amount, 'conversion')) {
            this.addCurrency(toCurrency, convertedAmount, 'conversion');
            return true;
        }
        
        return false;
    }
    
    // Generic currency operations
    addCurrency(currency, amount, source = 'unknown') {
        switch (currency) {
            case 'coins':
                return this.addCoins(amount, source);
            case 'stars':
                return this.addStars(amount, source);
            case 'lives':
                return this.addLives(amount, source);
            default:
                console.warn(`Unknown currency: ${currency}`);
                return 0;
        }
    }
    
    spendCurrency(currency, amount, purpose = 'unknown') {
        switch (currency) {
            case 'coins':
                return this.spendCoins(amount, purpose);
            case 'stars':
                return this.spendStars(amount, purpose);
            case 'lives':
                return this.spendLife(purpose);
            default:
                console.warn(`Unknown currency: ${currency}`);
                return false;
        }
    }
    
    getCurrency(currency) {
        return this.game.playerData[currency] || 0;
    }
    
    // UI updates
    updateDisplay() {
        this.game.updateCurrencyDisplay();
    }
    
    showCurrencyAnimation(currency, amount) {
        const currencyInfo = this.currencies[currency];
        const icon = currencyInfo.icon;
        
        // Create floating animation
        const animation = document.createElement('div');
        animation.className = 'currency-animation';
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: bold;
            color: #4ecdc4;
            pointer-events: none;
            z-index: 1000;
            animation: currencyFloat 2s ease-out forwards;
        `;
        animation.textContent = `+${amount} ${icon}`;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            if (animation.parentNode) {
                animation.parentNode.removeChild(animation);
            }
        }, 2000);
    }
    
    showDailyBonusModal(coins, stars, day) {
        // TODO: Implement daily bonus modal UI
        console.log(`Daily Bonus Day ${day}: +${coins} coins, +${stars} stars`);
    }
    
    // Save/Load
    getCurrencyData() {
        return {
            transactionHistory: this.transactionHistory,
            multipliers: this.multipliers,
            lastDailyBonus: this.game.playerData.lastDailyBonus,
            consecutiveDays: this.game.playerData.consecutiveDays
        };
    }
    
    loadCurrencyData(data) {
        if (!data) return;
        
        this.transactionHistory = data.transactionHistory || [];
        this.multipliers = { ...this.multipliers, ...data.multipliers };
        
        if (data.lastDailyBonus) {
            this.game.playerData.lastDailyBonus = data.lastDailyBonus;
        }
        if (data.consecutiveDays) {
            this.game.playerData.consecutiveDays = data.consecutiveDays;
        }
    }
}
