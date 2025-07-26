/**
 * Tile Class
 * Represents individual puzzle tiles with their properties and behaviors
 */
class Tile {
    constructor(type, col, row) {
        this.type = type;
        this.col = col;
        this.row = row;
        this.id = this.generateId();
        
        // Visual properties
        this.x = col;
        this.y = row;
        this.targetX = col;
        this.targetY = row;
        this.scale = 1;
        this.rotation = 0;
        this.opacity = 1;
        
        // Animation properties
        this.isAnimating = false;
        this.animationType = null;
        this.animationProgress = 0;
        this.animationDuration = 300; // ms
        
        // Special properties
        this.isSpecial = false;
        this.specialType = null; // 'bomb', 'line_horizontal', 'line_vertical', 'color_bomb'
        this.isMatched = false;
        this.isSelected = false;
        this.isFalling = false;
        
        // Power and effects
        this.power = 1;
        this.effects = [];
        
        // State tracking
        this.lastMoveTime = 0;
        this.creationTime = Date.now();
    }
    
    generateId() {
        return `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Position methods
    setPosition(col, row) {
        this.col = col;
        this.row = row;
        this.targetX = col;
        this.targetY = row;
    }
    
    moveTo(col, row, animated = true) {
        this.col = col;
        this.row = row;
        
        if (animated) {
            this.animateTo(col, row);
        } else {
            this.x = col;
            this.y = row;
            this.targetX = col;
            this.targetY = row;
        }
    }
    
    animateTo(targetCol, targetRow) {
        this.targetX = targetCol;
        this.targetY = targetRow;
        this.isAnimating = true;
        this.animationType = 'move';
        this.animationProgress = 0;
    }
    
    // Special tile methods
    makeSpecial(specialType) {
        this.isSpecial = true;
        this.specialType = specialType;
        this.power = this.getSpecialPower(specialType);
    }
    
    getSpecialPower(specialType) {
        const powers = {
            'bomb': 3,
            'line_horizontal': 2,
            'line_vertical': 2,
            'color_bomb': 5
        };
        return powers[specialType] || 1;
    }
    
    removeSpecial() {
        this.isSpecial = false;
        this.specialType = null;
        this.power = 1;
    }
    
    // Animation methods
    startAnimation(type, duration = 300) {
        this.isAnimating = true;
        this.animationType = type;
        this.animationProgress = 0;
        this.animationDuration = duration;
    }
    
    updateAnimation(deltaTime) {
        if (!this.isAnimating) return;
        
        this.animationProgress += deltaTime / this.animationDuration;
        
        if (this.animationProgress >= 1) {
            this.animationProgress = 1;
            this.completeAnimation();
        }
        
        this.applyAnimationEffects();
    }
    
    applyAnimationEffects() {
        const progress = this.easeInOutQuad(this.animationProgress);
        
        switch (this.animationType) {
            case 'move':
                this.x = this.lerp(this.x, this.targetX, progress);
                this.y = this.lerp(this.y, this.targetY, progress);
                break;
                
            case 'match':
                this.scale = this.lerp(1, 1.2, progress * 0.5) * this.lerp(1.2, 0, Math.max(0, progress - 0.5) * 2);
                this.opacity = this.lerp(1, 0, progress);
                break;
                
            case 'spawn':
                this.scale = this.lerp(0, 1.1, progress * 0.7) * this.lerp(1.1, 1, Math.max(0, progress - 0.7) * 3.33);
                this.opacity = this.lerp(0, 1, Math.min(1, progress * 2));
                break;
                
            case 'special':
                this.scale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
                this.rotation = progress * Math.PI * 2;
                break;
                
            case 'fall':
                this.y = this.lerp(this.y, this.targetY, progress);
                break;
        }
    }
    
    completeAnimation() {
        this.isAnimating = false;
        this.animationType = null;
        this.animationProgress = 0;
        
        // Reset visual properties
        this.x = this.targetX;
        this.y = this.targetY;
        this.scale = 1;
        this.rotation = 0;
        this.opacity = 1;
    }
    
    // Utility methods
    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // State methods
    select() {
        this.isSelected = true;
        this.startAnimation('special', 1000);
    }
    
    deselect() {
        this.isSelected = false;
        if (this.animationType === 'special') {
            this.completeAnimation();
        }
    }
    
    match() {
        this.isMatched = true;
        this.startAnimation('match', 300);
    }
    
    spawn() {
        this.startAnimation('spawn', 400);
    }
    
    fall(targetRow) {
        this.isFalling = true;
        this.targetY = targetRow;
        this.row = targetRow;
        this.startAnimation('fall', 200);
    }
    
    // Comparison methods
    equals(other) {
        return other && this.type === other.type;
    }
    
    canMatch(other) {
        return other && this.type === other.type && !this.isMatched && !other.isMatched;
    }
    
    isAdjacent(other) {
        if (!other) return false;
        
        const dx = Math.abs(this.col - other.col);
        const dy = Math.abs(this.row - other.row);
        
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }
    
    // Effect methods
    addEffect(effect) {
        this.effects.push(effect);
    }
    
    removeEffect(effectType) {
        this.effects = this.effects.filter(effect => effect.type !== effectType);
    }
    
    hasEffect(effectType) {
        return this.effects.some(effect => effect.type === effectType);
    }
    
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.duration -= deltaTime;
            return effect.duration > 0;
        });
    }
    
    // Rendering methods
    render(ctx, tileSize, offsetX = 0, offsetY = 0) {
        const x = (this.x * tileSize) + offsetX;
        const y = (this.y * tileSize) + offsetY;
        
        ctx.save();
        
        // Apply transformations
        ctx.globalAlpha = this.opacity;
        ctx.translate(x + tileSize / 2, y + tileSize / 2);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.rotation);
        ctx.translate(-tileSize / 2, -tileSize / 2);
        
        // Render tile background
        this.renderBackground(ctx, tileSize);
        
        // Render special effects
        if (this.isSpecial) {
            this.renderSpecialEffects(ctx, tileSize);
        }
        
        // Render selection highlight
        if (this.isSelected) {
            this.renderSelection(ctx, tileSize);
        }
        
        // Render tile content
        this.renderContent(ctx, tileSize);
        
        ctx.restore();
    }
    
    renderBackground(ctx, tileSize) {
        const size = tileSize - 2;
        
        // Main tile color
        ctx.fillStyle = this.getTileColor();
        ctx.fillRect(1, 1, size, size);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, size, size);
        
        // Special tile border
        if (this.isSpecial) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(1, 1, size, size);
        }
    }
    
    renderSpecialEffects(ctx, tileSize) {
        const centerX = tileSize / 2;
        const centerY = tileSize / 2;
        
        switch (this.specialType) {
            case 'bomb':
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.arc(centerX, centerY, tileSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'line_horizontal':
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(tileSize * 0.1, centerY - 2, tileSize * 0.8, 4);
                break;
                
            case 'line_vertical':
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(centerX - 2, tileSize * 0.1, 4, tileSize * 0.8);
                break;
                
            case 'color_bomb':
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, tileSize * 0.4);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, '#ff6b6b');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, tileSize * 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
    
    renderSelection(ctx, tileSize) {
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(0, 0, tileSize, tileSize);
        ctx.setLineDash([]);
    }
    
    renderContent(ctx, tileSize) {
        const centerX = tileSize / 2;
        const centerY = tileSize / 2;
        
        // Tile symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `${tileSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const symbol = this.getTileSymbol();
        ctx.fillText(symbol, centerX, centerY);
    }
    
    getTileColor() {
        const colors = {
            red: '#e74c3c',
            blue: '#3498db',
            green: '#2ecc71',
            yellow: '#f1c40f',
            purple: '#9b59b6',
            orange: '#e67e22'
        };
        return colors[this.type] || '#95a5a6';
    }
    
    getTileSymbol() {
        const symbols = {
            red: '♦',
            blue: '♠',
            green: '♣',
            yellow: '★',
            purple: '♥',
            orange: '●'
        };
        return symbols[this.type] || '?';
    }
    
    // Update method
    update(deltaTime) {
        this.updateAnimation(deltaTime);
        this.updateEffects(deltaTime);
    }
    
    // Serialization methods
    toJSON() {
        return {
            type: this.type,
            col: this.col,
            row: this.row,
            isSpecial: this.isSpecial,
            specialType: this.specialType,
            power: this.power
        };
    }
    
    static fromJSON(data) {
        const tile = new Tile(data.type, data.col, data.row);
        if (data.isSpecial) {
            tile.makeSpecial(data.specialType);
        }
        return tile;
    }
    
    // Clone method
    clone() {
        const cloned = new Tile(this.type, this.col, this.row);
        cloned.isSpecial = this.isSpecial;
        cloned.specialType = this.specialType;
        cloned.power = this.power;
        return cloned;
    }
}
