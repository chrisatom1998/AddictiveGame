/**
 * Furniture Class
 * Represents individual furniture items with their properties and behaviors
 */
class Furniture {
    constructor(id, config, position = { x: 0, y: 0 }) {
        this.id = id;
        this.name = config.name;
        this.type = config.type || this.inferTypeFromId(id);
        this.category = config.category || 'decorative';
        
        // Visual properties
        this.image = config.image;
        this.icon = config.icon;
        this.size = config.size || this.getDefaultSize();
        this.position = position;
        
        // Gameplay properties
        this.price = config.price || 100;
        this.currency = config.currency || 'coins';
        this.rarity = config.rarity || 'common';
        this.theme = config.theme || 'modern';
        this.style = config.style || 'neutral';
        
        // Placement properties
        this.canRotate = config.canRotate !== false;
        this.rotation = 0; // 0, 90, 180, 270 degrees
        this.snapToGrid = config.snapToGrid !== false;
        this.placementType = config.placementType || 'floor'; // floor, wall, ceiling
        
        // State
        this.isPlaced = false;
        this.isSelected = false;
        this.isLocked = config.isLocked || false;
        this.purchaseDate = null;
        this.placementDate = null;
        
        // Effects and bonuses
        this.comfortBonus = config.comfortBonus || 0;
        this.styleBonus = config.styleBonus || 0;
        this.functionalityBonus = config.functionalityBonus || 0;
        this.effects = config.effects || [];
        
        // Animation properties
        this.animationState = 'idle';
        this.animationProgress = 0;
        
        this.initializeFurniture();
    }
    
    initializeFurniture() {
        // Set default properties based on type
        this.applyTypeDefaults();
        
        // Initialize visual state
        this.updateVisualState();
    }
    
    inferTypeFromId(id) {
        // Infer furniture type from ID
        const typeMap = {
            'stove': 'appliance',
            'fridge': 'appliance',
            'refrigerator': 'appliance',
            'sink': 'appliance',
            'sofa': 'seating',
            'chair': 'seating',
            'bed': 'sleeping',
            'table': 'surface',
            'desk': 'surface',
            'lamp': 'lighting',
            'plant': 'decoration',
            'art': 'decoration',
            'mirror': 'decoration'
        };
        
        for (const [keyword, type] of Object.entries(typeMap)) {
            if (id.toLowerCase().includes(keyword)) {
                return type;
            }
        }
        
        return 'decoration';
    }
    
    applyTypeDefaults() {
        const typeDefaults = {
            appliance: {
                size: { width: 80, height: 80 },
                canRotate: false,
                placementType: 'floor',
                functionalityBonus: 10
            },
            seating: {
                size: { width: 100, height: 60 },
                canRotate: true,
                placementType: 'floor',
                comfortBonus: 15
            },
            sleeping: {
                size: { width: 120, height: 80 },
                canRotate: true,
                placementType: 'floor',
                comfortBonus: 20
            },
            surface: {
                size: { width: 80, height: 40 },
                canRotate: true,
                placementType: 'floor',
                functionalityBonus: 5
            },
            lighting: {
                size: { width: 30, height: 30 },
                canRotate: false,
                placementType: 'floor',
                styleBonus: 10
            },
            decoration: {
                size: { width: 40, height: 40 },
                canRotate: false,
                placementType: 'wall',
                styleBonus: 8
            }
        };
        
        const defaults = typeDefaults[this.type] || typeDefaults.decoration;
        
        // Apply defaults only if not already set
        Object.keys(defaults).forEach(key => {
            if (this[key] === undefined) {
                this[key] = defaults[key];
            }
        });
    }
    
    getDefaultSize() {
        return { width: 60, height: 60 };
    }
    
    place(position) {
        this.position = position;
        this.isPlaced = true;
        this.placementDate = Date.now();
        this.updateVisualState();
    }
    
    remove() {
        this.isPlaced = false;
        this.placementDate = null;
        this.updateVisualState();
    }
    
    move(newPosition) {
        if (!this.isPlaced) return false;
        
        this.position = newPosition;
        this.updateVisualState();
        return true;
    }
    
    rotate(degrees = 90) {
        if (!this.canRotate) return false;
        
        this.rotation = (this.rotation + degrees) % 360;
        
        // Swap width/height for 90/270 degree rotations
        if (degrees === 90 || degrees === 270) {
            const temp = this.size.width;
            this.size.width = this.size.height;
            this.size.height = temp;
        }
        
        this.updateVisualState();
        return true;
    }
    
    select() {
        this.isSelected = true;
        this.animationState = 'selected';
        this.updateVisualState();
    }
    
    deselect() {
        this.isSelected = false;
        this.animationState = 'idle';
        this.updateVisualState();
    }
    
    updateVisualState() {
        // Update visual representation based on current state
        this.calculateBoundingBox();
    }
    
    calculateBoundingBox() {
        // Calculate rotated bounding box
        const { width, height } = this.size;
        const rad = (this.rotation * Math.PI) / 180;
        
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        
        this.boundingBox = {
            width: width * cos + height * sin,
            height: width * sin + height * cos
        };
    }
    
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.boundingBox?.width || this.size.width,
            height: this.boundingBox?.height || this.size.height
        };
    }
    
    intersects(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    }
    
    getSnapPosition(position, gridSize = 20) {
        if (!this.snapToGrid) return position;
        
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    }
    
    canBePlacedAt(position, room) {
        // Check if furniture can be placed at the given position
        const tempPosition = this.position;
        this.position = position;
        
        const canPlace = room.canPlaceFurniture(this);
        
        this.position = tempPosition;
        return canPlace;
    }
    
    getTotalBonus() {
        return this.comfortBonus + this.styleBonus + this.functionalityBonus;
    }
    
    getThemeCompatibility(roomTheme) {
        // Calculate how well this furniture fits the room theme
        if (this.theme === roomTheme) return 100;
        
        const compatibilityMap = {
            modern: { contemporary: 80, minimalist: 70, industrial: 60 },
            traditional: { classic: 90, vintage: 80, rustic: 70 },
            minimalist: { modern: 70, contemporary: 60, scandinavian: 90 }
        };
        
        return compatibilityMap[this.theme]?.[roomTheme] || 50;
    }
    
    getStylePoints(roomStyle) {
        const basePoints = this.styleBonus;
        const compatibility = this.getThemeCompatibility(roomStyle);
        
        return Math.floor(basePoints * (compatibility / 100));
    }
    
    upgrade(upgradeType) {
        // Upgrade furniture properties
        switch (upgradeType) {
            case 'comfort':
                this.comfortBonus += 5;
                break;
            case 'style':
                this.styleBonus += 5;
                break;
            case 'functionality':
                this.functionalityBonus += 5;
                break;
        }
        
        this.updateVisualState();
    }
    
    addEffect(effect) {
        if (!this.effects.includes(effect)) {
            this.effects.push(effect);
        }
    }
    
    removeEffect(effect) {
        const index = this.effects.indexOf(effect);
        if (index > -1) {
            this.effects.splice(index, 1);
        }
    }
    
    hasEffect(effect) {
        return this.effects.includes(effect);
    }
    
    update(deltaTime) {
        // Update animations and effects
        this.updateAnimation(deltaTime);
        this.updateEffects(deltaTime);
    }
    
    updateAnimation(deltaTime) {
        switch (this.animationState) {
            case 'selected':
                this.animationProgress += deltaTime * 0.003;
                break;
            case 'placing':
                this.animationProgress += deltaTime * 0.005;
                break;
            default:
                this.animationProgress = 0;
        }
        
        this.animationProgress = this.animationProgress % 1;
    }
    
    updateEffects(deltaTime) {
        // Update any time-based effects
        this.effects.forEach(effect => {
            if (effect.update) {
                effect.update(deltaTime);
            }
        });
    }
    
    render(ctx, offsetX = 0, offsetY = 0) {
        const x = this.position.x + offsetX;
        const y = this.position.y + offsetY;
        
        ctx.save();
        
        // Apply transformations
        ctx.translate(x + this.size.width / 2, y + this.size.height / 2);
        ctx.rotate((this.rotation * Math.PI) / 180);
        
        // Apply selection effects
        if (this.isSelected) {
            ctx.shadowColor = '#ff6b6b';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Render furniture
        this.renderFurniture(ctx);
        
        ctx.restore();
    }
    
    renderFurniture(ctx) {
        const halfWidth = this.size.width / 2;
        const halfHeight = this.size.height / 2;
        
        // Render furniture background
        ctx.fillStyle = this.getColorByType();
        ctx.fillRect(-halfWidth, -halfHeight, this.size.width, this.size.height);
        
        // Render furniture border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfWidth, -halfHeight, this.size.width, this.size.height);
        
        // Render furniture icon/symbol
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.min(this.size.width, this.size.height) * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getIcon(), 0, 0);
    }
    
    getColorByType() {
        const colors = {
            appliance: '#e74c3c',
            seating: '#3498db',
            sleeping: '#9b59b6',
            surface: '#f39c12',
            lighting: '#f1c40f',
            decoration: '#2ecc71'
        };
        return colors[this.type] || '#95a5a6';
    }
    
    getIcon() {
        const icons = {
            stove: '🔥',
            refrigerator: '❄️',
            sink: '🚿',
            sofa: '🛋️',
            chair: '🪑',
            bed: '🛏️',
            table: '🪑',
            lamp: '💡',
            plant: '🌿',
            art: '🖼️',
            mirror: '🪞'
        };
        
        // Try to find icon by ID keywords
        for (const [keyword, icon] of Object.entries(icons)) {
            if (this.id.toLowerCase().includes(keyword)) {
                return icon;
            }
        }
        
        return this.icon || '📦';
    }
    
    // Serialization methods
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            category: this.category,
            position: this.position,
            rotation: this.rotation,
            size: this.size,
            theme: this.theme,
            style: this.style,
            isPlaced: this.isPlaced,
            purchaseDate: this.purchaseDate,
            placementDate: this.placementDate,
            comfortBonus: this.comfortBonus,
            styleBonus: this.styleBonus,
            functionalityBonus: this.functionalityBonus,
            effects: this.effects
        };
    }
    
    static fromJSON(data) {
        if (!data) return null;
        
        const furniture = new Furniture(data.id, {
            name: data.name,
            type: data.type,
            category: data.category,
            theme: data.theme,
            style: data.style
        }, data.position);
        
        // Restore state
        furniture.rotation = data.rotation || 0;
        furniture.size = data.size || furniture.size;
        furniture.isPlaced = data.isPlaced || false;
        furniture.purchaseDate = data.purchaseDate;
        furniture.placementDate = data.placementDate;
        furniture.comfortBonus = data.comfortBonus || 0;
        furniture.styleBonus = data.styleBonus || 0;
        furniture.functionalityBonus = data.functionalityBonus || 0;
        furniture.effects = data.effects || [];
        
        furniture.updateVisualState();
        
        return furniture;
    }
    
    clone() {
        return Furniture.fromJSON(this.toJSON());
    }
}
