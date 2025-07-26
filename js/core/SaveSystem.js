/**
 * Save System
 * Handles saving and loading player progress using localStorage
 */
class SaveSystem {
    constructor(game) {
        this.game = game;
        this.saveKey = 'homeSweetPuzzle_save';
        this.settingsKey = 'homeSweetPuzzle_settings';
        this.achievementsKey = 'homeSweetPuzzle_achievements';
        this.version = '1.0.0';
        
        // Auto-save interval (5 minutes)
        this.autoSaveInterval = 5 * 60 * 1000;
        this.lastSaveTime = Date.now();
        
        this.initializeAutoSave();
    }
    
    /**
     * Save player data to localStorage
     */
    async save(playerData) {
        try {
            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                playerData: this.sanitizePlayerData(playerData),
                gameState: this.game.stateManager ? this.game.stateManager.getStateData() : null
            };
            
            // Compress and save
            const compressedData = this.compressData(saveData);
            localStorage.setItem(this.saveKey, compressedData);
            
            this.lastSaveTime = Date.now();
            console.log('Game saved successfully');
            
            // Show save confirmation
            this.showSaveConfirmation();
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            this.showSaveError();
            return false;
        }
    }
    
    /**
     * Load player data from localStorage
     */
    async load() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) {
                console.log('No save data found');
                return null;
            }
            
            const decompressedData = this.decompressData(savedData);
            
            // Version check
            if (decompressedData.version !== this.version) {
                console.warn('Save version mismatch, attempting migration');
                return this.migrateSaveData(decompressedData);
            }
            
            console.log('Game loaded successfully');
            return decompressedData.playerData;
            
        } catch (error) {
            console.error('Failed to load game:', error);
            this.showLoadError();
            return null;
        }
    }
    
    /**
     * Save game settings separately
     */
    async saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }
    
    /**
     * Load game settings
     */
    async loadSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }
    
    /**
     * Save achievements separately for better performance
     */
    async saveAchievements(achievements) {
        try {
            localStorage.setItem(this.achievementsKey, JSON.stringify(achievements));
            return true;
        } catch (error) {
            console.error('Failed to save achievements:', error);
            return false;
        }
    }
    
    /**
     * Load achievements
     */
    async loadAchievements() {
        try {
            const achievements = localStorage.getItem(this.achievementsKey);
            return achievements ? JSON.parse(achievements) : [];
        } catch (error) {
            console.error('Failed to load achievements:', error);
            return [];
        }
    }
    
    /**
     * Delete save data
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            localStorage.removeItem(this.settingsKey);
            localStorage.removeItem(this.achievementsKey);
            console.log('Save data deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save data:', error);
            return false;
        }
    }
    
    /**
     * Check if save data exists
     */
    hasSaveData() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    /**
     * Get save data info without loading
     */
    getSaveInfo() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;
            
            const data = this.decompressData(savedData);
            return {
                version: data.version,
                timestamp: data.timestamp,
                level: data.playerData.level,
                coins: data.playerData.coins,
                stars: data.playerData.stars,
                completedLevels: data.playerData.completedLevels.length
            };
        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }
    
    /**
     * Export save data for backup
     */
    exportSave() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) return null;
            
            const exportData = {
                game: 'Home Sweet Puzzle',
                version: this.version,
                exportDate: new Date().toISOString(),
                data: saveData
            };
            
            return JSON.stringify(exportData);
        } catch (error) {
            console.error('Failed to export save:', error);
            return null;
        }
    }
    
    /**
     * Import save data from backup
     */
    importSave(importData) {
        try {
            const data = JSON.parse(importData);
            
            if (data.game !== 'Home Sweet Puzzle') {
                throw new Error('Invalid save file');
            }
            
            localStorage.setItem(this.saveKey, data.data);
            console.log('Save imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }
    
    /**
     * Initialize auto-save functionality
     */
    initializeAutoSave() {
        setInterval(() => {
            if (this.game.isInitialized && this.shouldAutoSave()) {
                this.save(this.game.playerData);
            }
        }, this.autoSaveInterval);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            if (this.game.isInitialized) {
                this.save(this.game.playerData);
            }
        });
        
        // Save on visibility change (mobile app switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.game.isInitialized) {
                this.save(this.game.playerData);
            }
        });
    }
    
    /**
     * Check if auto-save should trigger
     */
    shouldAutoSave() {
        const timeSinceLastSave = Date.now() - this.lastSaveTime;
        return timeSinceLastSave >= this.autoSaveInterval;
    }
    
    /**
     * Sanitize player data before saving
     */
    sanitizePlayerData(playerData) {
        // Remove any functions or non-serializable data
        const sanitized = JSON.parse(JSON.stringify(playerData));
        
        // Ensure required fields exist
        sanitized.level = sanitized.level || 1;
        sanitized.coins = sanitized.coins || 0;
        sanitized.stars = sanitized.stars || 0;
        sanitized.lives = sanitized.lives || 5;
        sanitized.completedLevels = sanitized.completedLevels || [];
        sanitized.ownedFurniture = sanitized.ownedFurniture || [];
        sanitized.achievements = sanitized.achievements || [];
        
        return sanitized;
    }
    
    /**
     * Compress data for storage
     */
    compressData(data) {
        // Simple compression - in production, use a proper compression library
        return JSON.stringify(data);
    }
    
    /**
     * Decompress data from storage
     */
    decompressData(data) {
        return JSON.parse(data);
    }
    
    /**
     * Migrate save data from older versions
     */
    migrateSaveData(oldData) {
        console.log('Migrating save data from version', oldData.version);
        
        // Migration logic for different versions
        let migratedData = oldData.playerData;
        
        // Example migration
        if (!migratedData.achievements) {
            migratedData.achievements = [];
        }
        
        if (!migratedData.settings) {
            migratedData.settings = {
                soundEnabled: true,
                musicEnabled: true,
                vibrationEnabled: true
            };
        }
        
        return migratedData;
    }
    
    /**
     * Show save confirmation
     */
    showSaveConfirmation() {
        // TODO: Implement save confirmation UI
        console.log('Game saved!');
    }
    
    /**
     * Show save error
     */
    showSaveError() {
        // TODO: Implement error UI
        console.error('Failed to save game!');
    }
    
    /**
     * Show load error
     */
    showLoadError() {
        // TODO: Implement error UI
        console.error('Failed to load game!');
    }
    
    /**
     * Get storage usage info
     */
    getStorageInfo() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            const settingsData = localStorage.getItem(this.settingsKey);
            const achievementsData = localStorage.getItem(this.achievementsKey);
            
            const saveSize = saveData ? new Blob([saveData]).size : 0;
            const settingsSize = settingsData ? new Blob([settingsData]).size : 0;
            const achievementsSize = achievementsData ? new Blob([achievementsData]).size : 0;
            
            return {
                totalSize: saveSize + settingsSize + achievementsSize,
                saveSize,
                settingsSize,
                achievementsSize
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }
    
    /**
     * Clear old save data (for cleanup)
     */
    clearOldSaves() {
        try {
            // Remove any old save keys from previous versions
            const oldKeys = ['homeSweetPuzzle_old', 'puzzle_game_save'];
            oldKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`Removed old save key: ${key}`);
                }
            });
        } catch (error) {
            console.error('Failed to clear old saves:', error);
        }
    }
}
