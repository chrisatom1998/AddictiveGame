/**
 * Room Class
 * Represents a room in the house with furniture and decoration management
 */
class Room {
    constructor(id, config) {
        this.id = id;
        this.name = config.name;
        this.background = config.background;
        this.size = config.size;
        
        // Furniture categories and requirements
        this.essentialItems = config.essentialItems || [];
        this.decorativeItems = config.decorativeItems || [];
        this.premiumItems = config.premiumItems || [];
        
        // Placed furniture
        this.placedFurniture = [];
        this.furnitureGrid = new Map(); // For collision detection
        
        // Room state
        this.isUnlocked = false;
        this.completionLevel = 0; // 0-3 stars
        this.lastUpdated = Date.now();
        
        // Room zones for furniture placement
        this.zones = this.initializeZones();
        
        // Room themes and styles
        this.theme = 'modern';
        this.colorScheme = 'neutral';
        
        this.initializeRoom();
    }
    
    initializeRoom() {
        // Set up initial room state
        this.calculateGridSize();
        this.setupPlacementZones();
    }
    
    calculateGridSize() {
        // Create a grid for furniture placement collision detection
        this.gridSize = 20; // 20px grid
        this.gridWidth = Math.ceil(this.size.width / this.gridSize);
        this.gridHeight = Math.ceil(this.size.height / this.gridSize);
        
        // Initialize grid
        this.furnitureGrid.clear();
    }
    
    initializeZones() {
        // Define placement zones for different types of furniture
        return {
            walls: [
                { x: 0, y: 0, width: this.size.width, height: 50 }, // Top wall
                { x: 0, y: this.size.height - 50, width: this.size.width, height: 50 }, // Bottom wall
                { x: 0, y: 0, width: 50, height: this.size.height }, // Left wall
                { x: this.size.width - 50, y: 0, width: 50, height: this.size.height } // Right wall
            ],
            center: {
                x: this.size.width * 0.2,
                y: this.size.height * 0.2,
                width: this.size.width * 0.6,
                height: this.size.height * 0.6
            },
            corners: [
                { x: 0, y: 0, width: 100, height: 100 },
                { x: this.size.width - 100, y: 0, width: 100, height: 100 },
                { x: 0, y: this.size.height - 100, width: 100, height: 100 },
                { x: this.size.width - 100, y: this.size.height - 100, width: 100, height: 100 }
            ]
        };
    }
    
    setupPlacementZones() {
        // Define where different types of furniture can be placed
        this.placementRules = {
            'stove': { zones: ['walls'], wallSide: 'any' },
            'refrigerator': { zones: ['walls', 'corners'], wallSide: 'any' },
            'sink': { zones: ['walls'], wallSide: 'any' },
            'sofa': { zones: ['center', 'walls'], wallSide: 'back' },
            'bed': { zones: ['walls', 'corners'], wallSide: 'back' },
            'table': { zones: ['center'], wallSide: null },
            'chair': { zones: ['center'], wallSide: null },
            'decoration': { zones: ['walls', 'corners', 'center'], wallSide: 'any' }
        };
    }
    
    addFurniture(furniture) {
        if (!this.canPlaceFurniture(furniture)) {
            console.warn('Cannot place furniture at this location');
            return false;
        }
        
        // Add to placed furniture
        this.placedFurniture.push(furniture);
        
        // Update grid occupation
        this.occupyGridSpace(furniture);
        
        // Update room completion
        this.updateCompletion();
        
        console.log(`Added furniture ${furniture.id} to room ${this.id}`);
        return true;
    }
    
    removeFurniture(furnitureId) {
        const index = this.placedFurniture.findIndex(f => f.id === furnitureId);
        if (index === -1) return false;
        
        const furniture = this.placedFurniture[index];
        
        // Free grid space
        this.freeGridSpace(furniture);
        
        // Remove from placed furniture
        this.placedFurniture.splice(index, 1);
        
        // Update room completion
        this.updateCompletion();
        
        return true;
    }
    
    moveFurniture(furnitureId, newPosition) {
        const furniture = this.placedFurniture.find(f => f.id === furnitureId);
        if (!furniture) return false;
        
        // Free current space
        this.freeGridSpace(furniture);
        
        // Update position
        furniture.position = newPosition;
        
        // Check if new position is valid
        if (!this.canPlaceFurniture(furniture)) {
            // Revert if invalid
            this.occupyGridSpace(furniture);
            return false;
        }
        
        // Occupy new space
        this.occupyGridSpace(furniture);
        
        return true;
    }
    
    canPlaceFurniture(furniture) {
        // Check bounds
        if (!this.isWithinBounds(furniture)) {
            return false;
        }
        
        // Check collision with other furniture
        if (this.hasCollision(furniture)) {
            return false;
        }
        
        // Check placement rules
        if (!this.followsPlacementRules(furniture)) {
            return false;
        }
        
        return true;
    }
    
    isWithinBounds(furniture) {
        const { x, y } = furniture.position;
        const { width, height } = furniture.size;
        
        return x >= 0 && y >= 0 && 
               x + width <= this.size.width && 
               y + height <= this.size.height;
    }
    
    hasCollision(furniture) {
        const gridPositions = this.getGridPositions(furniture);
        
        return gridPositions.some(pos => {
            const key = `${pos.x},${pos.y}`;
            const occupant = this.furnitureGrid.get(key);
            return occupant && occupant !== furniture.id;
        });
    }
    
    followsPlacementRules(furniture) {
        const rules = this.placementRules[furniture.type] || this.placementRules['decoration'];
        
        // Check if furniture is in allowed zones
        const isInAllowedZone = rules.zones.some(zoneName => {
            return this.isInZone(furniture, zoneName);
        });
        
        return isInAllowedZone;
    }
    
    isInZone(furniture, zoneName) {
        const { x, y } = furniture.position;
        const { width, height } = furniture.size;
        
        switch (zoneName) {
            case 'center':
                const centerZone = this.zones.center;
                return x >= centerZone.x && y >= centerZone.y &&
                       x + width <= centerZone.x + centerZone.width &&
                       y + height <= centerZone.y + centerZone.height;
                       
            case 'walls':
                return this.zones.walls.some(wall => {
                    return this.rectanglesOverlap(
                        { x, y, width, height },
                        wall
                    );
                });
                
            case 'corners':
                return this.zones.corners.some(corner => {
                    return this.rectanglesOverlap(
                        { x, y, width, height },
                        corner
                    );
                });
                
            default:
                return false;
        }
    }
    
    rectanglesOverlap(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    getGridPositions(furniture) {
        const { x, y } = furniture.position;
        const { width, height } = furniture.size;
        
        const positions = [];
        const startX = Math.floor(x / this.gridSize);
        const startY = Math.floor(y / this.gridSize);
        const endX = Math.floor((x + width - 1) / this.gridSize);
        const endY = Math.floor((y + height - 1) / this.gridSize);
        
        for (let gx = startX; gx <= endX; gx++) {
            for (let gy = startY; gy <= endY; gy++) {
                positions.push({ x: gx, y: gy });
            }
        }
        
        return positions;
    }
    
    occupyGridSpace(furniture) {
        const positions = this.getGridPositions(furniture);
        positions.forEach(pos => {
            const key = `${pos.x},${pos.y}`;
            this.furnitureGrid.set(key, furniture.id);
        });
    }
    
    freeGridSpace(furniture) {
        const positions = this.getGridPositions(furniture);
        positions.forEach(pos => {
            const key = `${pos.x},${pos.y}`;
            this.furnitureGrid.delete(key);
        });
    }
    
    calculateStars() {
        const essentialCount = this.countFurnitureByCategory('essential');
        const decorativeCount = this.countFurnitureByCategory('decorative');
        const premiumCount = this.countFurnitureByCategory('premium');
        
        let stars = 0;
        
        // 1 star: At least 2 essential items
        if (essentialCount >= 2) stars = 1;
        
        // 2 stars: At least 3 essential + 2 decorative
        if (essentialCount >= 3 && decorativeCount >= 2) stars = 2;
        
        // 3 stars: At least 4 essential + 3 decorative + 1 premium
        if (essentialCount >= 4 && decorativeCount >= 3 && premiumCount >= 1) stars = 3;
        
        this.completionLevel = stars;
        return stars;
    }
    
    countFurnitureByCategory(category) {
        const categoryItems = this[`${category}Items`] || [];
        return this.placedFurniture.filter(furniture => {
            return categoryItems.some(itemType => furniture.type.includes(itemType));
        }).length;
    }
    
    updateCompletion() {
        this.calculateStars();
        this.lastUpdated = Date.now();
    }
    
    getFurnitureAt(x, y) {
        return this.placedFurniture.find(furniture => {
            const fx = furniture.position.x;
            const fy = furniture.position.y;
            const fw = furniture.size.width;
            const fh = furniture.size.height;
            
            return x >= fx && x <= fx + fw && y >= fy && y <= fy + fh;
        });
    }
    
    getCompletionPercentage() {
        const totalRequired = this.essentialItems.length + this.decorativeItems.length + this.premiumItems.length;
        const totalPlaced = this.placedFurniture.length;
        
        return Math.min(100, (totalPlaced / totalRequired) * 100);
    }
    
    getThemeBonus() {
        // Calculate bonus based on furniture theme consistency
        const themes = {};
        this.placedFurniture.forEach(furniture => {
            const theme = furniture.theme || 'neutral';
            themes[theme] = (themes[theme] || 0) + 1;
        });
        
        const dominantTheme = Object.keys(themes).reduce((a, b) => 
            themes[a] > themes[b] ? a : b, 'neutral');
        
        const themeCount = themes[dominantTheme] || 0;
        const totalFurniture = this.placedFurniture.length;
        
        if (totalFurniture === 0) return 0;
        
        const themePercentage = themeCount / totalFurniture;
        return Math.floor(themePercentage * 100); // 0-100 bonus
    }
    
    update() {
        // Update room state, animations, etc.
        this.placedFurniture.forEach(furniture => {
            if (furniture.update) {
                furniture.update();
            }
        });
    }
    
    // Serialization methods
    toJSON() {
        return {
            id: this.id,
            placedFurniture: this.placedFurniture.map(f => f.toJSON()),
            completionLevel: this.completionLevel,
            theme: this.theme,
            colorScheme: this.colorScheme,
            lastUpdated: this.lastUpdated
        };
    }
    
    fromJSON(data) {
        if (!data) return;
        
        this.completionLevel = data.completionLevel || 0;
        this.theme = data.theme || 'modern';
        this.colorScheme = data.colorScheme || 'neutral';
        this.lastUpdated = data.lastUpdated || Date.now();
        
        // Load placed furniture
        this.placedFurniture = [];
        this.furnitureGrid.clear();
        
        if (data.placedFurniture) {
            data.placedFurniture.forEach(furnitureData => {
                const furniture = Furniture.fromJSON(furnitureData);
                if (furniture) {
                    this.placedFurniture.push(furniture);
                    this.occupyGridSpace(furniture);
                }
            });
        }
    }
}
