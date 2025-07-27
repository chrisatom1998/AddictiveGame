/**
 * Rewards System
 * Handles achievements, daily bonuses, and reward distribution
 */
class Rewards {
    constructor(game) {
        this.game = game;
        this.achievements = new Map();
        this.unlockedAchievements = [];
        this.dailyRewards = [];
        this.weeklyRewards = [];
        
        this.initializeRewards();
    }
    
    initializeRewards() {
        this.loadAchievements();
        this.checkDailyRewards();
    }
    
    loadAchievements() {
        const achievements = [
            {
                id: 'first_level',
                name: 'Getting Started',
                description: 'Complete your first level',
                icon: '🎯',
                rewards: { coins: 100 },
                condition: { type: 'levels_completed', value: 1 }
            },
            {
                id: 'furniture_collector',
                name: 'Furniture Collector',
                description: 'Purchase 10 pieces of furniture',
                icon: '🪑',
                rewards: { coins: 500, stars: 2 },
                condition: { type: 'furniture_purchased', value: 10 }
            },
            {
                id: 'room_designer',
                name: 'Room Designer',
                description: 'Get 3 stars in any room',
                icon: '⭐',
                rewards: { stars: 5 },
                condition: { type: 'room_three_stars', value: 1 }
            }
        ];
        
        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }
    
    checkAchievements() {
        this.achievements.forEach((achievement, id) => {
            if (!this.unlockedAchievements.includes(id)) {
                if (this.isAchievementUnlocked(achievement)) {
                    this.unlockAchievement(id);
                }
            }
        });
    }
    
    isAchievementUnlocked(achievement) {
        const condition = achievement.condition;
        const playerData = this.game.playerData;
        
        switch (condition.type) {
            case 'levels_completed':
                return playerData.completedLevels.length >= condition.value;
            case 'furniture_purchased':
                return this.game.renovationManager.inventory.getTotalItemCount() >= condition.value;
            case 'room_three_stars':
                let threeStarRooms = 0;
                this.game.renovationManager.rooms.forEach(room => {
                    if (room.calculateStars() >= 3) threeStarRooms++;
                });
                return threeStarRooms >= condition.value;
            default:
                return false;
        }
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement) return;
        
        this.unlockedAchievements.push(achievementId);
        
        // Award rewards
        if (achievement.rewards.coins) {
            this.game.currencyManager.addCoins(achievement.rewards.coins, 'achievement');
        }
        if (achievement.rewards.stars) {
            this.game.currencyManager.addStars(achievement.rewards.stars, 'achievement');
        }
        
        // Show achievement notification
        this.showAchievementNotification(achievement);
        
        console.log(`Achievement unlocked: ${achievement.name}`);
    }
    
    showAchievementNotification(achievement) {
        this.game.uiManager.showNotification(
            `Achievement Unlocked: ${achievement.name}`,
            'achievement',
            5000
        );
    }
    
    checkDailyRewards() {
        // Simple daily reward system
        const today = new Date().toDateString();
        const lastReward = this.game.playerData.lastDailyReward;
        
        if (lastReward !== today) {
            this.awardDailyReward();
            this.game.playerData.lastDailyReward = today;
        }
    }
    
    awardDailyReward() {
        const baseReward = 50;
        const bonusCoins = baseReward + Math.floor(Math.random() * 50);
        
        this.game.currencyManager.addCoins(bonusCoins, 'daily_reward');
        
        this.game.uiManager.showNotification(
            `Daily Reward: +${bonusCoins} coins!`,
            'success',
            3000
        );
    }
}
