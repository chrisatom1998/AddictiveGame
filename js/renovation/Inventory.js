/**
 * Inventory Class
 * Manages player's furniture and decoration inventory
 */
class Inventory {
    constructor(renovationManager) {
        this.renovationManager = renovationManager;
        this.game = renovationManager.game;
        
        // Inventory storage
        this.ownedFurniture = new Map(); // furnitureId -> quantity
        this.placedFurniture = new Map(); // furnitureId -> [roomId, ...]
        this.furnitureData = new Map(); // furnitureId -> furniture config
        
        // Inventory limits
        this.maxSlots = 100;
        this.categoryLimits = {
            essential: 50,
            decorative: 30,
            premium: 20
        };
        
        // Sorting and filtering
        this.sortBy = 'name'; // name, price, category, date
        this.filterBy = 'all'; // all, essential, decorative, premium, owned, unowned
        this.searchQuery = '';
        
        this.initializeInventory();
    }
    
    initializeInventory() {
        // Load initial furniture data
        this.loadFurnitureDatabase();
        
        // Initialize with starter furniture
        this.addStarterFurniture();
    }
    
    loadFurnitureDatabase() {
        // In production, this would load from JSON files
        const furnitureDatabase = {
            // Kitchen furniture
            'stove_basic': {
                name: 'Basic Stove',
                type: 'stove',
                category: 'essential',
                price: 500,
                currency: 'coins',
                image: 'stove_basic.png',
                size: { width: 80, height: 80 },
                theme: 'modern',
                comfortBonus: 0,
                functionalityBonus: 10
            },
            'fridge_basic': {
                name: 'Refrigerator',
                type: 'refrigerator',
                category: 'essential',
                price: 800,
                currency: 'coins',
                image: 'fridge_basic.png',
                size: { width: 80, height: 100 },
                theme: 'modern',
                functionalityBonus: 15
            },
            'sink_basic': {
                name: 'Kitchen Sink',
                type: 'sink',
                category: 'essential',
                price: 300,
                currency: 'coins',
                image: 'sink_basic.png',
                size: { width: 60, height: 40 },
                theme: 'modern',
                functionalityBonus: 8
            },
            'plant_herbs': {
                name: 'Herb Garden',
                type: 'plant',
                category: 'decorative',
                price: 150,
                currency: 'coins',
                image: 'herbs.png',
                size: { width: 40, height: 40 },
                theme: 'natural',
                styleBonus: 12
            },
            'art_kitchen': {
                name: 'Kitchen Art',
                type: 'art',
                category: 'decorative',
                price: 200,
                currency: 'coins',
                image: 'kitchen_art.png',
                size: { width: 60, height: 40 },
                theme: 'modern',
                styleBonus: 15
            },
            'island_premium': {
                name: 'Kitchen Island',
                type: 'island',
                category: 'premium',
                price: 5,
                currency: 'stars',
                image: 'island_premium.png',
                size: { width: 120, height: 80 },
                theme: 'luxury',
                functionalityBonus: 20,
                styleBonus: 25
            },
            'chandelier_crystal': {
                name: 'Crystal Chandelier',
                type: 'chandelier',
                category: 'premium',
                price: 10,
                currency: 'stars',
                image: 'chandelier.png',
                size: { width: 80, height: 60 },
                theme: 'luxury',
                styleBonus: 30
            }
        };
        
        Object.entries(furnitureDatabase).forEach(([id, config]) => {
            this.furnitureData.set(id, config);
        });
    }
    
    addStarterFurniture() {
        // Give player some basic furniture to start with
        const starterItems = ['stove_basic', 'plant_herbs'];
        
        starterItems.forEach(itemId => {
            this.addFurniture(itemId, 1);
        });
    }
    
    addFurniture(furnitureId, quantity = 1) {
        if (!this.furnitureData.has(furnitureId)) {
            console.warn(`Unknown furniture ID: ${furnitureId}`);
            return false;
        }
        
        const currentQuantity = this.ownedFurniture.get(furnitureId) || 0;
        const newQuantity = currentQuantity + quantity;
        
        // Check inventory limits
        if (!this.canAddFurniture(furnitureId, quantity)) {
            console.warn('Cannot add furniture: inventory limit reached');
            return false;
        }
        
        this.ownedFurniture.set(furnitureId, newQuantity);
        
        // Update game data
        this.updateGameData();
        
        console.log(`Added ${quantity}x ${furnitureId} to inventory`);
        return true;
    }
    
    removeFurniture(furnitureId, quantity = 1) {
        const currentQuantity = this.ownedFurniture.get(furnitureId) || 0;
        
        if (currentQuantity < quantity) {
            console.warn('Not enough furniture to remove');
            return false;
        }
        
        const newQuantity = currentQuantity - quantity;
        
        if (newQuantity <= 0) {
            this.ownedFurniture.delete(furnitureId);
        } else {
            this.ownedFurniture.set(furnitureId, newQuantity);
        }
        
        this.updateGameData();
        return true;
    }
    
    hasFurniture(furnitureId, quantity = 1) {
        const owned = this.ownedFurniture.get(furnitureId) || 0;
        return owned >= quantity;
    }
    
    getFurnitureQuantity(furnitureId) {
        return this.ownedFurniture.get(furnitureId) || 0;
    }
    
    canAddFurniture(furnitureId, quantity = 1) {
        // Check total inventory limit
        const totalItems = this.getTotalItemCount();
        if (totalItems + quantity > this.maxSlots) {
            return false;
        }
        
        // Check category limit
        const furnitureConfig = this.furnitureData.get(furnitureId);
        if (furnitureConfig) {
            const categoryCount = this.getCategoryCount(furnitureConfig.category);
            const categoryLimit = this.categoryLimits[furnitureConfig.category] || this.maxSlots;
            
            if (categoryCount + quantity > categoryLimit) {
                return false;
            }
        }
        
        return true;
    }
    
    getTotalItemCount() {
        let total = 0;
        this.ownedFurniture.forEach(quantity => {
            total += quantity;
        });
        return total;
    }
    
    getCategoryCount(category) {
        let count = 0;
        this.ownedFurniture.forEach((quantity, furnitureId) => {
            const config = this.furnitureData.get(furnitureId);
            if (config && config.category === category) {
                count += quantity;
            }
        });
        return count;
    }
    
    getOwnedFurnitureByCategory(category) {
        const furniture = [];
        this.ownedFurniture.forEach((quantity, furnitureId) => {
            const config = this.furnitureData.get(furnitureId);
            if (config && (category === 'all' || config.category === category)) {
                furniture.push({
                    id: furnitureId,
                    quantity: quantity,
                    config: config
                });
            }
        });
        
        return this.sortFurniture(furniture);
    }
    
    sortFurniture(furniture) {
        return furniture.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.config.name.localeCompare(b.config.name);
                case 'price':
                    return a.config.price - b.config.price;
                case 'category':
                    return a.config.category.localeCompare(b.config.category);
                case 'date':
                    // Would need to track purchase dates
                    return 0;
                default:
                    return 0;
            }
        });
    }
    
    searchFurniture(query) {
        if (!query) return this.getOwnedFurnitureByCategory('all');
        
        const results = [];
        this.ownedFurniture.forEach((quantity, furnitureId) => {
            const config = this.furnitureData.get(furnitureId);
            if (config) {
                const searchText = `${config.name} ${config.type} ${config.category}`.toLowerCase();
                if (searchText.includes(query.toLowerCase())) {
                    results.push({
                        id: furnitureId,
                        quantity: quantity,
                        config: config
                    });
                }
            }
        });
        
        return this.sortFurniture(results);
    }
    
    placeFurniture(furnitureId, roomId) {
        if (!this.hasFurniture(furnitureId)) {
            console.warn('Furniture not owned');
            return false;
        }
        
        // Track where furniture is placed
        if (!this.placedFurniture.has(furnitureId)) {
            this.placedFurniture.set(furnitureId, []);
        }
        
        const placements = this.placedFurniture.get(furnitureId);
        placements.push(roomId);
        
        return true;
    }
    
    removePlacedFurniture(furnitureId, roomId) {
        const placements = this.placedFurniture.get(furnitureId);
        if (!placements) return false;
        
        const index = placements.indexOf(roomId);
        if (index > -1) {
            placements.splice(index, 1);
            
            if (placements.length === 0) {
                this.placedFurniture.delete(furnitureId);
            }
            
            return true;
        }
        
        return false;
    }
    
    getPlacedFurnitureCount(furnitureId) {
        const placements = this.placedFurniture.get(furnitureId);
        return placements ? placements.length : 0;
    }
    
    getAvailableFurnitureCount(furnitureId) {
        const owned = this.getFurnitureQuantity(furnitureId);
        const placed = this.getPlacedFurnitureCount(furnitureId);
        return Math.max(0, owned - placed);
    }
    
    canPlaceFurniture(furnitureId) {
        return this.getAvailableFurnitureCount(furnitureId) > 0;
    }
    
    getFurnitureConfig(furnitureId) {
        return this.furnitureData.get(furnitureId);
    }
    
    getAllFurnitureConfigs() {
        return Array.from(this.furnitureData.entries()).map(([id, config]) => ({
            id,
            ...config
        }));
    }
    
    getInventoryValue() {
        let totalValue = { coins: 0, stars: 0 };
        
        this.ownedFurniture.forEach((quantity, furnitureId) => {
            const config = this.furnitureData.get(furnitureId);
            if (config) {
                totalValue[config.currency] += config.price * quantity;
            }
        });
        
        return totalValue;
    }
    
    getInventoryStats() {
        const stats = {
            totalItems: this.getTotalItemCount(),
            categories: {
                essential: this.getCategoryCount('essential'),
                decorative: this.getCategoryCount('decorative'),
                premium: this.getCategoryCount('premium')
            },
            value: this.getInventoryValue(),
            slotsUsed: this.getTotalItemCount(),
            slotsAvailable: this.maxSlots - this.getTotalItemCount()
        };
        
        return stats;
    }
    
    updateGameData() {
        // Update the game's player data with current inventory
        if (this.game.playerData) {
            this.game.playerData.ownedFurniture = Array.from(this.ownedFurniture.entries());
        }
    }
    
    // Serialization methods
    toJSON() {
        return {
            ownedFurniture: Array.from(this.ownedFurniture.entries()),
            placedFurniture: Array.from(this.placedFurniture.entries()),
            sortBy: this.sortBy,
            filterBy: this.filterBy
        };
    }
    
    fromJSON(data) {
        if (!data) return;
        
        // Load owned furniture
        if (data.ownedFurniture) {
            this.ownedFurniture.clear();
            data.ownedFurniture.forEach(([furnitureId, quantity]) => {
                this.ownedFurniture.set(furnitureId, quantity);
            });
        }
        
        // Load placed furniture
        if (data.placedFurniture) {
            this.placedFurniture.clear();
            data.placedFurniture.forEach(([furnitureId, placements]) => {
                this.placedFurniture.set(furnitureId, placements);
            });
        }
        
        // Load preferences
        this.sortBy = data.sortBy || 'name';
        this.filterBy = data.filterBy || 'all';
    }
    
    // Utility methods
    setSortBy(sortBy) {
        this.sortBy = sortBy;
    }
    
    setFilterBy(filterBy) {
        this.filterBy = filterBy;
    }
    
    setSearchQuery(query) {
        this.searchQuery = query;
    }
    
    expandInventory(additionalSlots) {
        this.maxSlots += additionalSlots;
        console.log(`Inventory expanded by ${additionalSlots} slots`);
    }
}
