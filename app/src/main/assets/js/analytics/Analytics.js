/**
 * Analytics System
 * Tracks player behavior and game metrics for optimization and monetization
 */
class Analytics {
    constructor(game) {
        this.game = game;
        this.sessionId = this.generateSessionId();
        this.playerId = this.getOrCreatePlayerId();
        this.sessionStartTime = Date.now();
        
        // Event queue for batch sending
        this.eventQueue = [];
        this.maxQueueSize = 50;
        this.flushInterval = 30000; // 30 seconds
        
        // Session tracking
        this.sessionData = {
            levelsPlayed: 0,
            coinsEarned: 0,
            coinsSpent: 0,
            starsEarned: 0,
            starsSpent: 0,
            furniturePurchased: 0,
            powerUpsUsed: 0,
            achievementsUnlocked: 0
        };
        
        // Player progression tracking
        this.progressionMetrics = {
            levelCompletionTimes: [],
            retryRates: new Map(),
            stuckPoints: [],
            monetizationTouchpoints: []
        };
        
        this.initializeAnalytics();
    }
    
    initializeAnalytics() {
        // Start session tracking
        this.trackEvent('session_start', {
            sessionId: this.sessionId,
            playerId: this.playerId,
            timestamp: this.sessionStartTime,
            platform: this.getPlatform(),
            screenSize: this.getScreenSize(),
            gameVersion: '1.0.0'
        });
        
        // Setup periodic flushing
        this.startPeriodicFlush();
        
        // Track page visibility changes
        this.setupVisibilityTracking();
        
        // Track errors
        this.setupErrorTracking();
    }
    
    // Core event tracking
    trackEvent(eventName, properties = {}) {
        const event = {
            id: this.generateEventId(),
            name: eventName,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                playerId: this.playerId,
                timestamp: Date.now(),
                gameState: this.game.gameState,
                currentLevel: this.game.currentLevel || 0,
                playerLevel: this.game.playerData.level,
                coins: this.game.playerData.coins,
                stars: this.game.playerData.stars,
                lives: this.game.playerData.lives
            }
        };
        
        this.eventQueue.push(event);
        
        // Flush if queue is full
        if (this.eventQueue.length >= this.maxQueueSize) {
            this.flushEvents();
        }
        
        // Log in debug mode
        if (GameConfig.PERFORMANCE.DEBUG_MODE) {
            console.log('Analytics Event:', eventName, properties);
        }
    }
    
    // Gameplay tracking
    trackLevelStart(levelNumber) {
        this.currentLevelStartTime = Date.now();
        this.sessionData.levelsPlayed++;
        
        this.trackEvent('level_start', {
            level: levelNumber,
            attempts: this.getLevelAttempts(levelNumber),
            playerProgress: this.getPlayerProgress()
        });
    }
    
    trackLevelComplete(levelNumber, stars, score, movesUsed) {
        const completionTime = Date.now() - this.currentLevelStartTime;
        this.progressionMetrics.levelCompletionTimes.push({
            level: levelNumber,
            time: completionTime,
            stars: stars
        });
        
        this.trackEvent('level_complete', {
            level: levelNumber,
            stars: stars,
            score: score,
            movesUsed: movesUsed,
            completionTime: completionTime,
            attempts: this.getLevelAttempts(levelNumber)
        });
        
        // Reset attempt counter
        this.resetLevelAttempts(levelNumber);
    }
    
    trackLevelFail(levelNumber, reason = 'no_moves') {
        const attempts = this.incrementLevelAttempts(levelNumber);
        
        this.trackEvent('level_fail', {
            level: levelNumber,
            reason: reason,
            attempts: attempts,
            timeSpent: Date.now() - this.currentLevelStartTime
        });
        
        // Track stuck points
        if (attempts >= 3) {
            this.progressionMetrics.stuckPoints.push({
                level: levelNumber,
                attempts: attempts,
                timestamp: Date.now()
            });
        }
    }
    
    // Economy tracking
    trackCurrencyEarned(currency, amount, source) {
        if (currency === 'coins') {
            this.sessionData.coinsEarned += amount;
        } else if (currency === 'stars') {
            this.sessionData.starsEarned += amount;
        }
        
        this.trackEvent('currency_earned', {
            currency: currency,
            amount: amount,
            source: source,
            totalBalance: this.game.playerData[currency]
        });
    }
    
    trackCurrencySpent(currency, amount, purpose) {
        if (currency === 'coins') {
            this.sessionData.coinsSpent += amount;
        } else if (currency === 'stars') {
            this.sessionData.starsSpent += amount;
        }
        
        this.trackEvent('currency_spent', {
            currency: currency,
            amount: amount,
            purpose: purpose,
            remainingBalance: this.game.playerData[currency]
        });
    }
    
    trackPurchase(itemId, itemType, price, currency, success) {
        this.trackEvent('purchase_attempt', {
            itemId: itemId,
            itemType: itemType,
            price: price,
            currency: currency,
            success: success,
            playerBalance: this.game.playerData[currency]
        });
        
        if (success) {
            if (itemType === 'furniture') {
                this.sessionData.furniturePurchased++;
            }
            
            // Track monetization touchpoint
            this.progressionMetrics.monetizationTouchpoints.push({
                type: 'purchase',
                itemId: itemId,
                price: price,
                currency: currency,
                timestamp: Date.now(),
                playerLevel: this.game.playerData.level
            });
        }
    }
    
    trackPowerUpUsage(powerUpType, context = 'puzzle') {
        this.sessionData.powerUpsUsed++;
        
        this.trackEvent('powerup_used', {
            type: powerUpType,
            context: context,
            level: this.game.currentLevel,
            remainingCount: this.game.puzzleEngine?.powerUps?.inventory[powerUpType] || 0
        });
    }
    
    // Progression tracking
    trackRoomCompletion(roomId, stars) {
        this.trackEvent('room_complete', {
            roomId: roomId,
            stars: stars,
            furnitureCount: this.getRoomFurnitureCount(roomId),
            completionPercentage: this.getRoomCompletionPercentage(roomId)
        });
    }
    
    trackAchievementUnlocked(achievementId) {
        this.sessionData.achievementsUnlocked++;
        
        this.trackEvent('achievement_unlocked', {
            achievementId: achievementId,
            playerLevel: this.game.playerData.level,
            sessionTime: Date.now() - this.sessionStartTime
        });
    }
    
    // User engagement tracking
    trackScreenView(screenName) {
        this.trackEvent('screen_view', {
            screen: screenName,
            previousScreen: this.game.stateManager?.previousState,
            sessionTime: Date.now() - this.sessionStartTime
        });
    }
    
    trackFeatureUsage(featureName, context = {}) {
        this.trackEvent('feature_used', {
            feature: featureName,
            ...context
        });
    }
    
    trackTutorialStep(step, action = 'complete') {
        this.trackEvent('tutorial_step', {
            step: step,
            action: action,
            timeSpent: context.timeSpent || 0
        });
    }
    
    // Monetization tracking
    trackShopView(category) {
        this.trackEvent('shop_view', {
            category: category,
            playerCoins: this.game.playerData.coins,
            playerStars: this.game.playerData.stars
        });
    }
    
    trackAdOpportunity(adType, context, shown = false) {
        this.trackEvent('ad_opportunity', {
            adType: adType,
            context: context,
            shown: shown,
            playerLevel: this.game.playerData.level
        });
    }
    
    trackAdWatched(adType, reward) {
        this.trackEvent('ad_watched', {
            adType: adType,
            reward: reward,
            sessionAds: this.getSessionAdCount()
        });
    }
    
    // Session management
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.sessionStartTime;
        
        this.trackEvent('session_end', {
            duration: sessionDuration,
            ...this.sessionData,
            finalLevel: this.game.playerData.level,
            finalCoins: this.game.playerData.coins,
            finalStars: this.game.playerData.stars
        });
        
        // Flush remaining events
        this.flushEvents();
    }
    
    // Data processing and insights
    getPlayerSegment() {
        const level = this.game.playerData.level;
        const coinsSpent = this.sessionData.coinsSpent;
        const starsSpent = this.sessionData.starsSpent;
        
        if (starsSpent > 0) return 'spender';
        if (level >= 20) return 'engaged';
        if (level >= 10) return 'progressing';
        if (level >= 5) return 'active';
        return 'new';
    }
    
    getRetentionRisk() {
        const stuckPoints = this.progressionMetrics.stuckPoints.length;
        const sessionTime = Date.now() - this.sessionStartTime;
        const levelsPlayed = this.sessionData.levelsPlayed;
        
        if (stuckPoints >= 2) return 'high';
        if (sessionTime < 300000 && levelsPlayed < 2) return 'medium'; // Less than 5 minutes
        return 'low';
    }
    
    getMonetizationOpportunities() {
        const opportunities = [];
        
        // Low on lives
        if (this.game.playerData.lives <= 1) {
            opportunities.push('lives_offer');
        }
        
        // Stuck on level
        const currentLevel = this.game.currentLevel;
        if (this.getLevelAttempts(currentLevel) >= 3) {
            opportunities.push('powerup_offer');
        }
        
        // Low on currency for desired purchase
        if (this.game.playerData.coins < 500) {
            opportunities.push('coins_offer');
        }
        
        return opportunities;
    }
    
    // Utility methods
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getOrCreatePlayerId() {
        let playerId = localStorage.getItem('homeSweetPuzzle_playerId');
        if (!playerId) {
            playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('homeSweetPuzzle_playerId', playerId);
        }
        return playerId;
    }
    
    getPlatform() {
        const userAgent = navigator.userAgent;
        if (/Android/i.test(userAgent)) return 'android';
        if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
        if (/Windows/i.test(userAgent)) return 'windows';
        if (/Mac/i.test(userAgent)) return 'mac';
        return 'unknown';
    }
    
    getScreenSize() {
        return {
            width: window.screen.width,
            height: window.screen.height,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    
    getPlayerProgress() {
        return {
            level: this.game.playerData.level,
            completedLevels: this.game.playerData.completedLevels.length,
            totalCoins: this.game.playerData.coins,
            totalStars: this.game.playerData.stars,
            ownedFurniture: this.game.playerData.ownedFurniture.length
        };
    }
    
    getLevelAttempts(levelNumber) {
        return this.progressionMetrics.retryRates.get(levelNumber) || 0;
    }
    
    incrementLevelAttempts(levelNumber) {
        const current = this.getLevelAttempts(levelNumber);
        this.progressionMetrics.retryRates.set(levelNumber, current + 1);
        return current + 1;
    }
    
    resetLevelAttempts(levelNumber) {
        this.progressionMetrics.retryRates.delete(levelNumber);
    }
    
    getRoomFurnitureCount(roomId) {
        const room = this.game.renovationManager?.rooms.get(roomId);
        return room ? room.placedFurniture.length : 0;
    }
    
    getRoomCompletionPercentage(roomId) {
        const room = this.game.renovationManager?.rooms.get(roomId);
        return room ? room.getCompletionPercentage() : 0;
    }
    
    getSessionAdCount() {
        return this.eventQueue.filter(event => event.name === 'ad_watched').length;
    }
    
    // Event flushing
    startPeriodicFlush() {
        setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flushEvents();
            }
        }, this.flushInterval);
    }
    
    flushEvents() {
        if (this.eventQueue.length === 0) return;
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        // In production, send to analytics service
        this.sendToAnalyticsService(events);
        
        if (GameConfig.PERFORMANCE.DEBUG_MODE) {
            console.log('Flushed analytics events:', events.length);
        }
    }
    
    sendToAnalyticsService(events) {
        // Placeholder for actual analytics service integration
        // This would typically send to Google Analytics, Firebase, or custom backend
        
        if (GameConfig.PERFORMANCE.LOG_PERFORMANCE) {
            console.log('Analytics batch:', events);
        }
        
        // Example: Send to custom analytics endpoint
        // fetch('/api/analytics', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ events })
        // });
    }
    
    // Visibility and error tracking
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('app_background');
            } else {
                this.trackEvent('app_foreground');
            }
        });
    }
    
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
    }
}
