/**
 * Shop System
 * Handles in-app purchases, premium content, and monetization
 */
class Shop {
    constructor(game) {
        this.game = game;
        this.currentCategory = 'boosters';
        
        // Shop categories
        this.categories = ['boosters', 'currency', 'premium'];
        
        // Shop items database
        this.shopItems = new Map();
        
        // Purchase history
        this.purchaseHistory = [];
        
        // Special offers and promotions
        this.activeOffers = [];
        this.dailyDeals = [];
        
        // Season pass
        this.seasonPass = {
            isActive: false,
            tier: 'free',
            progress: 0,
            rewards: []
        };
        
        this.initializeShop();
    }
    
    initializeShop() {
        this.loadShopItems();
        this.checkDailyDeals();
        this.checkSpecialOffers();
        this.updateSeasonPass();
    }
    
    loadShopItems() {
        // Booster items
        const boosters = [
            {
                id: 'hammer_pack_5',
                name: '5 Hammers',
                description: 'Remove any tile from the board',
                category: 'boosters',
                price: 100,
                currency: 'coins',
                icon: '🔨',
                contents: { hammer: 5 },
                popular: false
            },
            {
                id: 'bomb_pack_3',
                name: '3 Bombs',
                description: 'Destroy tiles in a 3x3 area',
                category: 'boosters',
                price: 150,
                currency: 'coins',
                icon: '💣',
                contents: { bomb: 3 },
                popular: true
            },
            {
                id: 'shuffle_pack_2',
                name: '2 Shuffles',
                description: 'Rearrange all tiles on the board',
                category: 'boosters',
                price: 200,
                currency: 'coins',
                icon: '🔄',
                contents: { shuffle: 2 },
                popular: false
            },
            {
                id: 'mega_booster_pack',
                name: 'Mega Booster Pack',
                description: '10 Hammers, 5 Bombs, 3 Shuffles',
                category: 'boosters',
                price: 5,
                currency: 'stars',
                icon: '🎁',
                contents: { hammer: 10, bomb: 5, shuffle: 3 },
                popular: true,
                bestValue: true
            }
        ];
        
        // Currency items
        const currency = [
            {
                id: 'coins_1000',
                name: '1,000 Coins',
                description: 'Pile of coins for furniture and boosters',
                category: 'currency',
                price: 0.99,
                currency: 'usd',
                icon: '💰',
                contents: { coins: 1000 },
                popular: false
            },
            {
                id: 'coins_5000',
                name: '5,000 Coins',
                description: 'Bag of coins with bonus',
                category: 'currency',
                price: 4.99,
                currency: 'usd',
                icon: '💰',
                contents: { coins: 5500 }, // 10% bonus
                popular: true
            },
            {
                id: 'coins_15000',
                name: '15,000 Coins',
                description: 'Chest of coins with big bonus',
                category: 'currency',
                price: 9.99,
                currency: 'usd',
                icon: '💰',
                contents: { coins: 18000 }, // 20% bonus
                popular: false,
                bestValue: true
            },
            {
                id: 'stars_10',
                name: '10 Stars',
                description: 'Premium currency for exclusive items',
                category: 'currency',
                price: 2.99,
                currency: 'usd',
                icon: '⭐',
                contents: { stars: 10 },
                popular: false
            },
            {
                id: 'stars_50',
                name: '50 Stars',
                description: 'Star pack with bonus',
                category: 'currency',
                price: 9.99,
                currency: 'usd',
                icon: '⭐',
                contents: { stars: 60 }, // 20% bonus
                popular: true
            }
        ];
        
        // Premium items
        const premium = [
            {
                id: 'season_pass',
                name: 'Season Pass',
                description: 'Unlock exclusive rewards and accelerated progression',
                category: 'premium',
                price: 9.99,
                currency: 'usd',
                icon: '🎫',
                duration: 30 * 24 * 60 * 60 * 1000, // 30 days
                benefits: [
                    'Exclusive furniture themes',
                    '2x coin rewards',
                    'Premium storylines',
                    'VIP customer support'
                ],
                popular: true
            },
            {
                id: 'unlimited_lives',
                name: 'Unlimited Lives',
                description: 'Play without waiting for life regeneration',
                category: 'premium',
                price: 4.99,
                currency: 'usd',
                icon: '❤️',
                duration: 7 * 24 * 60 * 60 * 1000, // 7 days
                popular: false
            },
            {
                id: 'premium_furniture_pack',
                name: 'Luxury Furniture Pack',
                description: 'Exclusive high-end furniture collection',
                category: 'premium',
                price: 7.99,
                currency: 'usd',
                icon: '🏰',
                contents: {
                    furniture: ['golden_sofa', 'crystal_chandelier', 'marble_table', 'silk_curtains']
                },
                popular: false
            }
        ];
        
        // Add all items to shop
        [...boosters, ...currency, ...premium].forEach(item => {
            this.shopItems.set(item.id, item);
        });
    }
    
    getItemsByCategory(category) {
        const items = [];
        this.shopItems.forEach(item => {
            if (item.category === category) {
                items.push(item);
            }
        });
        return items;
    }
    
    purchaseItem(itemId, paymentMethod = 'game_currency') {
        const item = this.shopItems.get(itemId);
        if (!item) {
            console.error(`Item not found: ${itemId}`);
            return false;
        }
        
        console.log(`Attempting to purchase: ${item.name}`);
        
        if (paymentMethod === 'game_currency') {
            return this.purchaseWithGameCurrency(item);
        } else if (paymentMethod === 'real_money') {
            return this.purchaseWithRealMoney(item);
        }
        
        return false;
    }
    
    purchaseWithGameCurrency(item) {
        const currency = item.currency;
        const price = item.price;
        
        if (currency === 'coins') {
            if (this.game.currencyManager.spendCoins(price, `shop_${item.id}`)) {
                this.deliverPurchase(item);
                return true;
            }
        } else if (currency === 'stars') {
            if (this.game.currencyManager.spendStars(price, `shop_${item.id}`)) {
                this.deliverPurchase(item);
                return true;
            }
        }
        
        this.showInsufficientFundsMessage(currency, price);
        return false;
    }
    
    purchaseWithRealMoney(item) {
        // In a real implementation, this would integrate with payment processors
        console.log(`Processing real money purchase: ${item.name} for $${item.price}`);
        
        // Simulate payment processing
        if (this.simulatePayment(item)) {
            this.deliverPurchase(item);
            this.recordRealMoneyPurchase(item);
            return true;
        }
        
        return false;
    }
    
    simulatePayment(item) {
        // Simulate payment success/failure
        // In production, this would be handled by payment processors
        return Math.random() > 0.1; // 90% success rate for simulation
    }
    
    deliverPurchase(item) {
        console.log(`Delivering purchase: ${item.name}`);
        
        // Deliver contents
        if (item.contents) {
            Object.entries(item.contents).forEach(([type, amount]) => {
                switch (type) {
                    case 'coins':
                        this.game.currencyManager.addCoins(amount, 'shop_purchase');
                        break;
                    case 'stars':
                        this.game.currencyManager.addStars(amount, 'shop_purchase');
                        break;
                    case 'hammer':
                    case 'bomb':
                    case 'shuffle':
                        this.game.puzzleEngine.powerUps.addPowerUp(type, amount);
                        break;
                    case 'furniture':
                        amount.forEach(furnitureId => {
                            this.game.renovationManager.inventory.addFurniture(furnitureId);
                        });
                        break;
                }
            });
        }
        
        // Handle special items
        if (item.id === 'season_pass') {
            this.activateSeasonPass();
        } else if (item.id === 'unlimited_lives') {
            this.activateUnlimitedLives(item.duration);
        }
        
        // Record purchase
        this.recordPurchase(item);
        
        // Show success message
        this.showPurchaseSuccessMessage(item);
        
        // Save game
        this.game.saveGame();
    }
    
    recordPurchase(item) {
        const purchase = {
            id: this.generatePurchaseId(),
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            currency: item.currency,
            timestamp: Date.now(),
            delivered: true
        };
        
        this.purchaseHistory.unshift(purchase);
        
        // Limit history length
        if (this.purchaseHistory.length > 100) {
            this.purchaseHistory = this.purchaseHistory.slice(0, 100);
        }
    }
    
    recordRealMoneyPurchase(item) {
        // Record real money purchases for analytics and support
        const purchase = {
            id: this.generatePurchaseId(),
            itemId: item.id,
            realMoney: true,
            amount: item.price,
            currency: 'USD',
            timestamp: Date.now()
        };
        
        // In production, this would be sent to analytics/backend
        console.log('Real money purchase recorded:', purchase);
    }
    
    generatePurchaseId() {
        return `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Daily deals and special offers
    checkDailyDeals() {
        const today = new Date().toDateString();
        const lastCheck = this.game.playerData.lastDailyDealsCheck;
        
        if (lastCheck !== today) {
            this.generateDailyDeals();
            this.game.playerData.lastDailyDealsCheck = today;
        }
    }
    
    generateDailyDeals() {
        // Generate random daily deals
        const allItems = Array.from(this.shopItems.values());
        const dealItems = this.shuffleArray(allItems).slice(0, 3);
        
        this.dailyDeals = dealItems.map(item => ({
            ...item,
            originalPrice: item.price,
            price: Math.floor(item.price * 0.7), // 30% off
            discount: 30,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        }));
        
        console.log('Generated daily deals:', this.dailyDeals);
    }
    
    checkSpecialOffers() {
        // Check for special promotional offers
        const playerLevel = this.game.playerData.level;
        const coinsSpent = this.getTotalCoinsSpent();
        
        // First purchase bonus
        if (this.purchaseHistory.length === 0) {
            this.addSpecialOffer({
                id: 'first_purchase_bonus',
                title: 'First Purchase Bonus!',
                description: 'Get 50% extra coins on your first purchase',
                multiplier: 1.5,
                category: 'currency',
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }
        
        // Level milestone offers
        if (playerLevel % 10 === 0 && playerLevel > 0) {
            this.addSpecialOffer({
                id: `level_${playerLevel}_offer`,
                title: `Level ${playerLevel} Celebration!`,
                description: 'Special booster pack to celebrate your progress',
                itemId: 'mega_booster_pack',
                discount: 50,
                expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000 // 3 days
            });
        }
    }
    
    addSpecialOffer(offer) {
        // Check if offer already exists
        const exists = this.activeOffers.some(o => o.id === offer.id);
        if (!exists) {
            this.activeOffers.push(offer);
        }
    }
    
    // Season Pass
    activateSeasonPass() {
        this.seasonPass.isActive = true;
        this.seasonPass.tier = 'premium';
        this.seasonPass.activatedAt = Date.now();
        this.seasonPass.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
        
        // Apply season pass benefits
        this.game.currencyManager.setMultiplier('coins', 2.0, this.seasonPass.expiresAt - Date.now());
        
        console.log('Season Pass activated!');
    }
    
    updateSeasonPass() {
        if (this.seasonPass.isActive && Date.now() > this.seasonPass.expiresAt) {
            this.seasonPass.isActive = false;
            this.seasonPass.tier = 'free';
            this.game.currencyManager.setMultiplier('coins', 1.0);
            console.log('Season Pass expired');
        }
    }
    
    activateUnlimitedLives(duration) {
        this.game.playerData.unlimitedLivesUntil = Date.now() + duration;
        console.log('Unlimited Lives activated!');
    }
    
    // Utility methods
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    getTotalCoinsSpent() {
        return this.purchaseHistory
            .filter(p => p.currency === 'coins')
            .reduce((total, p) => total + p.price, 0);
    }
    
    getTotalRealMoneySpent() {
        return this.purchaseHistory
            .filter(p => p.currency === 'usd')
            .reduce((total, p) => total + p.price, 0);
    }
    
    // UI Messages
    showInsufficientFundsMessage(currency, needed) {
        const currencyName = currency === 'coins' ? 'coins' : 'stars';
        const current = this.game.currencyManager.getCurrency(currency);
        
        console.log(`Insufficient ${currencyName}: need ${needed}, have ${current}`);
        // TODO: Show proper UI modal
    }
    
    showPurchaseSuccessMessage(item) {
        console.log(`Purchase successful: ${item.name}`);
        // TODO: Show proper UI notification
    }
    
    // Save/Load
    getShopData() {
        return {
            purchaseHistory: this.purchaseHistory,
            activeOffers: this.activeOffers,
            dailyDeals: this.dailyDeals,
            seasonPass: this.seasonPass
        };
    }
    
    loadShopData(data) {
        if (!data) return;
        
        this.purchaseHistory = data.purchaseHistory || [];
        this.activeOffers = data.activeOffers || [];
        this.dailyDeals = data.dailyDeals || [];
        this.seasonPass = { ...this.seasonPass, ...data.seasonPass };
    }
}
