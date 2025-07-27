/**
 * PowerUps Class
 * Manages power-ups, boosters, and special abilities in the puzzle game
 */
class PowerUps {
    constructor(puzzleEngine) {
        this.puzzleEngine = puzzleEngine;
        this.game = puzzleEngine.game;
        
        // Power-up inventory
        this.inventory = {
            hammer: 3,
            bomb: 2,
            shuffle: 1,
            extra_moves: 0,
            color_bomb: 0
        };
        
        // Power-up costs (for purchase)
        this.costs = {
            hammer: 100,
            bomb: 150,
            shuffle: 200,
            extra_moves: 100,
            color_bomb: 300
        };
        
        // Active power-up state
        this.activePowerUp = null;
        this.isWaitingForTarget = false;
        
        this.initializeUI();
    }
    
    initializeUI() {
        // Update power-up counts in UI
        this.updatePowerUpCounts();
        
        // Add event listeners for power-up buttons
        document.querySelectorAll('.power-up').forEach(btn => {
            const powerUpType = btn.dataset.type;
            btn.addEventListener('click', () => this.activatePowerUp(powerUpType));
            
            // Update button display
            this.updatePowerUpButton(btn, powerUpType);
        });
    }
    
    updatePowerUpCounts() {
        document.querySelectorAll('.power-up').forEach(btn => {
            const powerUpType = btn.dataset.type;
            const count = this.inventory[powerUpType] || 0;
            btn.dataset.count = count;
            
            // Disable if no uses left
            if (count <= 0) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });
    }
    
    updatePowerUpButton(button, powerUpType) {
        const count = this.inventory[powerUpType] || 0;
        button.dataset.count = count;
        
        if (count <= 0) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
        
        // Update tooltip
        button.title = this.getPowerUpDescription(powerUpType);
    }
    
    getPowerUpDescription(powerUpType) {
        const descriptions = {
            hammer: 'Remove a single tile',
            bomb: 'Destroy tiles in a 3x3 area',
            shuffle: 'Shuffle all tiles on the board',
            extra_moves: 'Add 5 extra moves',
            color_bomb: 'Remove all tiles of selected color'
        };
        return descriptions[powerUpType] || 'Unknown power-up';
    }
    
    canUse(powerUpType) {
        return this.inventory[powerUpType] > 0 && 
               this.puzzleEngine.isPlaying && 
               !this.puzzleEngine.isPaused &&
               !this.puzzleEngine.isAnimating;
    }
    
    activatePowerUp(powerUpType) {
        if (!this.canUse(powerUpType)) {
            console.log(`Cannot use ${powerUpType}: not available or game not ready`);
            return false;
        }
        
        console.log(`Activating power-up: ${powerUpType}`);
        
        switch (powerUpType) {
            case 'hammer':
                this.activateHammer();
                break;
            case 'bomb':
                this.activateBomb();
                break;
            case 'shuffle':
                this.activateShuffle();
                break;
            case 'extra_moves':
                this.activateExtraMoves();
                break;
            case 'color_bomb':
                this.activateColorBomb();
                break;
            default:
                console.warn(`Unknown power-up type: ${powerUpType}`);
                return false;
        }
        
        return true;
    }
    
    activateHammer() {
        this.activePowerUp = 'hammer';
        this.isWaitingForTarget = true;
        this.showTargetingCursor();
        this.showInstruction('Click on a tile to remove it');
    }
    
    activateBomb() {
        this.activePowerUp = 'bomb';
        this.isWaitingForTarget = true;
        this.showTargetingCursor();
        this.showInstruction('Click on a tile to explode a 3x3 area');
    }
    
    activateShuffle() {
        this.usePowerUp('shuffle');
        this.puzzleEngine.board.shuffle();
        this.showPowerUpEffect('shuffle');
        this.showInstruction('Board shuffled!');
    }
    
    activateExtraMoves() {
        this.usePowerUp('extra_moves');
        this.puzzleEngine.movesLeft += 5;
        this.puzzleEngine.updateUI();
        this.showPowerUpEffect('extra_moves');
        this.showInstruction('+5 moves added!');
    }
    
    activateColorBomb() {
        this.activePowerUp = 'color_bomb';
        this.isWaitingForTarget = true;
        this.showTargetingCursor();
        this.showInstruction('Click on a tile to remove all tiles of that color');
    }
    
    handleTileClick(col, row) {
        if (!this.isWaitingForTarget || !this.activePowerUp) {
            return false; // Let normal tile selection handle it
        }
        
        const tile = this.puzzleEngine.board.getTile(col, row);
        if (!tile) return false;
        
        switch (this.activePowerUp) {
            case 'hammer':
                this.executeHammer(col, row);
                break;
            case 'bomb':
                this.executeBomb(col, row);
                break;
            case 'color_bomb':
                this.executeColorBomb(tile.type);
                break;
        }
        
        this.deactivatePowerUp();
        return true; // Consumed the click
    }
    
    executeHammer(col, row) {
        this.usePowerUp('hammer');
        
        // Remove the tile
        this.puzzleEngine.board.setTile(col, row, null);
        
        // Update objectives if applicable
        const tile = this.puzzleEngine.board.getTile(col, row);
        if (tile && this.puzzleEngine.objectives[tile.type]) {
            this.puzzleEngine.objectives[tile.type] = Math.max(0, 
                this.puzzleEngine.objectives[tile.type] - 1);
        }
        
        // Trigger tile drop and refill
        setTimeout(() => {
            this.puzzleEngine.board.dropTiles();
            this.puzzleEngine.board.fillEmptySpaces();
        }, 100);
        
        this.showPowerUpEffect('hammer', col, row);
    }
    
    executeBomb(col, row) {
        this.usePowerUp('bomb');
        
        const tilesToRemove = [];
        
        // Get 3x3 area around target
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                const tile = this.puzzleEngine.board.getTile(c, r);
                if (tile) {
                    tilesToRemove.push({ tile, col: c, row: r });
                }
            }
        }
        
        // Remove tiles and update objectives
        tilesToRemove.forEach(({ tile, col: c, row: r }) => {
            this.puzzleEngine.board.setTile(c, r, null);
            
            if (this.puzzleEngine.objectives[tile.type]) {
                this.puzzleEngine.objectives[tile.type] = Math.max(0, 
                    this.puzzleEngine.objectives[tile.type] - 1);
            }
        });
        
        // Add score
        this.puzzleEngine.score += tilesToRemove.length * 50;
        
        // Trigger tile drop and refill
        setTimeout(() => {
            this.puzzleEngine.board.dropTiles();
            this.puzzleEngine.board.fillEmptySpaces();
        }, 200);
        
        this.showPowerUpEffect('bomb', col, row);
    }
    
    executeColorBomb(tileType) {
        this.usePowerUp('color_bomb');
        
        const tilesToRemove = [];
        const board = this.puzzleEngine.board;
        
        // Find all tiles of the selected type
        for (let row = 0; row < board.height; row++) {
            for (let col = 0; col < board.width; col++) {
                const tile = board.getTile(col, row);
                if (tile && tile.type === tileType) {
                    tilesToRemove.push({ tile, col, row });
                }
            }
        }
        
        // Remove tiles
        tilesToRemove.forEach(({ col, row }) => {
            board.setTile(col, row, null);
        });
        
        // Update objectives
        if (this.puzzleEngine.objectives[tileType]) {
            this.puzzleEngine.objectives[tileType] = Math.max(0, 
                this.puzzleEngine.objectives[tileType] - tilesToRemove.length);
        }
        
        // Add score
        this.puzzleEngine.score += tilesToRemove.length * 75;
        
        // Trigger tile drop and refill
        setTimeout(() => {
            this.puzzleEngine.board.dropTiles();
            this.puzzleEngine.board.fillEmptySpaces();
        }, 300);
        
        this.showPowerUpEffect('color_bomb');
    }
    
    usePowerUp(powerUpType) {
        if (this.inventory[powerUpType] > 0) {
            this.inventory[powerUpType]--;
            this.updatePowerUpCounts();
            this.puzzleEngine.updateUI();
            
            // Save to game data
            if (this.game.playerData.powerUps) {
                this.game.playerData.powerUps = this.inventory;
            }
        }
    }
    
    deactivatePowerUp() {
        this.activePowerUp = null;
        this.isWaitingForTarget = false;
        this.hideTargetingCursor();
        this.hideInstruction();
    }
    
    addPowerUp(powerUpType, count = 1) {
        this.inventory[powerUpType] = (this.inventory[powerUpType] || 0) + count;
        this.updatePowerUpCounts();
        
        // Show notification
        this.showNotification(`+${count} ${powerUpType.replace('_', ' ')}!`);
    }
    
    purchasePowerUp(powerUpType, count = 1) {
        const totalCost = this.costs[powerUpType] * count;
        
        if (this.game.playerData.coins >= totalCost) {
            this.game.spendCoins(totalCost);
            this.addPowerUp(powerUpType, count);
            return true;
        }
        
        return false;
    }
    
    showTargetingCursor() {
        document.body.style.cursor = 'crosshair';
        this.puzzleEngine.canvas.style.cursor = 'crosshair';
    }
    
    hideTargetingCursor() {
        document.body.style.cursor = 'default';
        this.puzzleEngine.canvas.style.cursor = 'pointer';
    }
    
    showInstruction(message) {
        // Create or update instruction overlay
        let instruction = document.getElementById('power-up-instruction');
        if (!instruction) {
            instruction = document.createElement('div');
            instruction.id = 'power-up-instruction';
            instruction.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(instruction);
        }
        
        instruction.textContent = message;
        instruction.style.display = 'block';
    }
    
    hideInstruction() {
        const instruction = document.getElementById('power-up-instruction');
        if (instruction) {
            instruction.style.display = 'none';
        }
    }
    
    showPowerUpEffect(powerUpType, col = null, row = null) {
        // Create visual effect for power-up usage
        const canvas = this.puzzleEngine.canvas;
        const rect = canvas.getBoundingClientRect();
        
        const effect = document.createElement('div');
        effect.className = `power-up-effect ${powerUpType}`;
        effect.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 999;
            font-size: 24px;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            animation: powerUpEffect 1s ease-out forwards;
        `;
        
        if (col !== null && row !== null) {
            const tileSize = this.puzzleEngine.board.tileSize;
            effect.style.left = (rect.left + col * tileSize + tileSize / 2) + 'px';
            effect.style.top = (rect.top + row * tileSize + tileSize / 2) + 'px';
        } else {
            effect.style.left = (rect.left + rect.width / 2) + 'px';
            effect.style.top = (rect.top + rect.height / 2) + 'px';
        }
        
        const effectText = {
            hammer: '🔨',
            bomb: '💥',
            shuffle: '🔄',
            extra_moves: '+5',
            color_bomb: '🌈'
        };
        
        effect.textContent = effectText[powerUpType] || '✨';
        document.body.appendChild(effect);
        
        // Remove after animation
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
    }
    
    showNotification(message) {
        // Simple notification system
        console.log(`Power-up notification: ${message}`);
        // TODO: Implement proper notification UI
    }
    
    // Save/Load methods
    getInventoryData() {
        return { ...this.inventory };
    }
    
    loadInventoryData(data) {
        if (data) {
            this.inventory = { ...this.inventory, ...data };
            this.updatePowerUpCounts();
        }
    }
    
    // Reset for new level
    resetForLevel() {
        this.deactivatePowerUp();
    }
}
