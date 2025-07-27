/**
 * Game Configuration
 * Central configuration file for easy game balancing and customization
 */
class GameConfig {
    static get PUZZLE() {
        return {
            // Board settings
            BOARD_WIDTH: 8,
            BOARD_HEIGHT: 8,
            TILE_SIZE: 50,
            
            // Gameplay settings
            MIN_MATCH_LENGTH: 3,
            COMBO_MULTIPLIER: 1.5,
            SPECIAL_TILE_THRESHOLD: 4,
            
            // Scoring
            BASE_SCORE_PER_TILE: 100,
            COMBO_BONUS: 50,
            MOVE_BONUS_MULTIPLIER: 10,
            
            // Power-ups
            HAMMER_USES: 3,
            BOMB_USES: 2,
            SHUFFLE_USES: 1,
            
            // Animation timing (ms)
            TILE_FALL_SPEED: 400,
            MATCH_ANIMATION_DURATION: 300,
            SPAWN_ANIMATION_DURATION: 400,
            
            // Tile types
            TILE_TYPES: ['red', 'blue', 'green', 'yellow', 'purple', 'orange']
        };
    }
    
    static get ECONOMY() {
        return {
            // Starting currency
            STARTING_COINS: 1000,
            STARTING_STARS: 5,
            STARTING_LIVES: 5,
            
            // Currency limits
            MAX_COINS: 999999,
            MAX_STARS: 9999,
            MAX_LIVES: 5,
            
            // Earning rates
            COINS_PER_LEVEL: 150,
            STARS_PER_THREE_STARS: 1,
            BONUS_COINS_MULTIPLIER: 1.2,
            
            // Life regeneration
            LIFE_REGEN_TIME: 30 * 60 * 1000, // 30 minutes
            
            // Daily bonuses
            DAILY_COINS: [100, 150, 200, 250, 300, 400, 500],
            DAILY_STARS: [1, 1, 2, 2, 3, 3, 5],
            
            // Power-up costs
            HAMMER_COST: 100,
            BOMB_COST: 150,
            SHUFFLE_COST: 200,
            EXTRA_MOVES_COST: 100,
            COLOR_BOMB_COST: 300
        };
    }
    
    static get RENOVATION() {
        return {
            // Room progression
            ROOM_UNLOCK_REQUIREMENTS: {
                kitchen: { level: 1, stars: 0 },
                living_room: { level: 10, stars: 15 },
                bedroom: { level: 20, stars: 30 },
                bathroom: { level: 30, stars: 45 },
                garden: { level: 40, stars: 60 }
            },
            
            // Star requirements
            ONE_STAR_ESSENTIAL: 2,
            TWO_STAR_ESSENTIAL: 3,
            TWO_STAR_DECORATIVE: 2,
            THREE_STAR_ESSENTIAL: 4,
            THREE_STAR_DECORATIVE: 3,
            THREE_STAR_PREMIUM: 1,
            
            // Furniture categories
            CATEGORIES: ['essential', 'decorative', 'premium'],
            
            // Placement settings
            GRID_SIZE: 20,
            SNAP_TO_GRID: true,
            COLLISION_DETECTION: true,
            
            // Theme bonuses
            THEME_MATCH_BONUS: 1.0,
            THEME_MISMATCH_PENALTY: 0.5
        };
    }
    
    static get STORY() {
        return {
            // Character settings
            TYPEWRITER_SPEED: 50, // ms per character
            AUTO_ADVANCE_DELAY: 3000, // ms
            MAX_DIALOG_HISTORY: 50,
            
            // Story triggers
            LEVEL_TRIGGERS: {
                1: 'kitchen_start',
                5: 'first_furniture',
                10: 'room_complete',
                15: 'living_room_unlock',
                25: 'bedroom_unlock'
            },
            
            // Character unlock requirements
            CHARACTER_UNLOCKS: {
                emma: { level: 1 },
                marcus: { level: 10 },
                sophia: { level: 20 }
            }
        };
    }
    
    static get MONETIZATION() {
        return {
            // IAP prices (USD)
            CURRENCY_PACKS: {
                small: { coins: 1000, price: 0.99 },
                medium: { coins: 5500, price: 4.99 }, // 10% bonus
                large: { coins: 18000, price: 9.99 }  // 20% bonus
            },
            
            STAR_PACKS: {
                small: { stars: 10, price: 2.99 },
                large: { stars: 60, price: 9.99 } // 20% bonus
            },
            
            // Premium features
            SEASON_PASS_PRICE: 9.99,
            SEASON_PASS_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
            UNLIMITED_LIVES_PRICE: 4.99,
            UNLIMITED_LIVES_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
            
            // Ad rewards
            AD_REWARD_COINS: 50,
            AD_REWARD_MOVES: 5,
            AD_REWARD_LIVES: 1,
            
            // Special offers
            FIRST_PURCHASE_BONUS: 1.5, // 50% extra
            LEVEL_MILESTONE_DISCOUNT: 0.5, // 50% off
            DAILY_DEAL_DISCOUNT: 0.7 // 30% off
        };
    }
    
    static get UI() {
        return {
            // Animation settings
            MODAL_FADE_DURATION: 300,
            NOTIFICATION_DURATION: 3000,
            TOOLTIP_DELAY: 500,
            
            // Notification limits
            MAX_NOTIFICATIONS: 5,
            NOTIFICATION_QUEUE_SIZE: 10,
            
            // Currency animation
            CURRENCY_ANIMATION_DURATION: 1000,
            SCORE_POPUP_DURATION: 1000,
            
            // Responsive breakpoints
            MOBILE_BREAKPOINT: 768,
            TABLET_BREAKPOINT: 1024,
            
            // Touch settings
            TOUCH_SENSITIVITY: 10,
            SWIPE_THRESHOLD: 50
        };
    }
    
    static get PERFORMANCE() {
        return {
            // Rendering settings
            TARGET_FPS: 60,
            MAX_PARTICLES: 100,
            PARTICLE_POOL_SIZE: 200,
            
            // Memory management
            MAX_UNDO_HISTORY: 10,
            MAX_SAVE_SLOTS: 3,
            AUTO_SAVE_INTERVAL: 5 * 60 * 1000, // 5 minutes
            
            // Asset loading
            PRELOAD_AUDIO: true,
            PRELOAD_IMAGES: true,
            LAZY_LOAD_THRESHOLD: 1024 * 1024, // 1MB
            
            // Debug settings
            DEBUG_MODE: false,
            SHOW_FPS: false,
            LOG_PERFORMANCE: false
        };
    }
    
    static get LEVELS() {
        return {
            // Level progression
            MAX_LEVEL: 100,
            MOVES_BASE: 25,
            MOVES_VARIATION: 5,
            
            // Difficulty scaling
            DIFFICULTY_INCREASE_RATE: 0.1,
            OBJECTIVE_SCALING: 1.2,
            
            // Level types
            LEVEL_TYPES: ['collect', 'clear', 'score', 'time'],
            
            // Objectives
            DEFAULT_OBJECTIVES: {
                red: 10,
                blue: 10,
                green: 8,
                yellow: 8
            }
        };
    }
    
    // Utility methods
    static getRandomTileType() {
        const types = this.PUZZLE.TILE_TYPES;
        return types[Math.floor(Math.random() * types.length)];
    }
    
    static calculateLevelMoves(levelNumber) {
        const base = this.LEVELS.MOVES_BASE;
        const variation = this.LEVELS.MOVES_VARIATION;
        return base + Math.floor(Math.random() * variation);
    }
    
    static calculateLevelReward(levelNumber, stars) {
        const base = this.ECONOMY.COINS_PER_LEVEL;
        const starBonus = stars * 50;
        const levelBonus = Math.floor(levelNumber / 10) * 25;
        return base + starBonus + levelBonus;
    }
    
    static isFeatureUnlocked(feature, playerLevel) {
        const requirements = {
            renovation: 1,
            shop: 1,
            story: 1,
            achievements: 5,
            daily_bonuses: 3
        };
        
        return playerLevel >= (requirements[feature] || 1);
    }
    
    // Development helpers
    static enableDebugMode() {
        this.PERFORMANCE.DEBUG_MODE = true;
        this.PERFORMANCE.SHOW_FPS = true;
        this.PERFORMANCE.LOG_PERFORMANCE = true;
        console.log('Debug mode enabled');
    }
    
    static getConfigSummary() {
        return {
            boardSize: `${this.PUZZLE.BOARD_WIDTH}x${this.PUZZLE.BOARD_HEIGHT}`,
            tileTypes: this.PUZZLE.TILE_TYPES.length,
            maxLevel: this.LEVELS.MAX_LEVEL,
            currencies: ['coins', 'stars', 'lives'],
            rooms: Object.keys(this.RENOVATION.ROOM_UNLOCK_REQUIREMENTS).length,
            monetization: Object.keys(this.MONETIZATION.CURRENCY_PACKS).length + ' IAP packs'
        };
    }
}
