/**
 * Board Class
 * Manages the puzzle grid, tiles, and board-related operations
 */
class Board {
    constructor(puzzleEngine, width, height) {
        this.puzzleEngine = puzzleEngine;
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.tileSize = 50;
        this.tileTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.obstacles = [];
        
        // Animation properties
        this.fallingTiles = [];
        this.animationQueue = [];
        
        this.initialize();
    }
    
    initialize(width = 8, height = 8, tileTypes = null) {
        this.width = width;
        this.height = height;
        if (tileTypes) this.tileTypes = tileTypes;
        
        // Calculate tile size based on canvas
        const canvas = this.puzzleEngine.canvas;
        if (canvas) {
            this.tileSize = Math.min(canvas.width / this.width, canvas.height / this.height);
        }
        
        // Initialize empty grid
        this.tiles = [];
        for (let row = 0; row < this.height; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.width; col++) {
                this.tiles[row][col] = null;
            }
        }
        
        // Fill board with initial tiles
        this.fillBoard();
        
        // Ensure no initial matches
        this.removeInitialMatches();
    }
    
    fillBoard() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (!this.tiles[row][col]) {
                    this.tiles[row][col] = this.createRandomTile(col, row);
                }
            }
        }
    }
    
    createRandomTile(col, row) {
        const type = this.getRandomTileType(col, row);
        return new Tile(type, col, row);
    }
    
    getRandomTileType(col, row) {
        // Avoid creating initial matches
        const availableTypes = [...this.tileTypes];
        
        // Check horizontal matches
        if (col >= 2) {
            const type1 = this.tiles[row][col - 1]?.type;
            const type2 = this.tiles[row][col - 2]?.type;
            if (type1 === type2) {
                const index = availableTypes.indexOf(type1);
                if (index > -1) availableTypes.splice(index, 1);
            }
        }
        
        // Check vertical matches
        if (row >= 2) {
            const type1 = this.tiles[row - 1][col]?.type;
            const type2 = this.tiles[row - 2][col]?.type;
            if (type1 === type2) {
                const index = availableTypes.indexOf(type1);
                if (index > -1) availableTypes.splice(index, 1);
            }
        }
        
        return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
    
    removeInitialMatches() {
        let hasMatches = true;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (hasMatches && attempts < maxAttempts) {
            const matches = this.findMatches();
            if (matches.length === 0) {
                hasMatches = false;
            } else {
                // Replace matched tiles with new random tiles
                matches.forEach(match => {
                    match.tiles.forEach(tile => {
                        const newTile = this.createRandomTile(tile.col, tile.row);
                        this.tiles[tile.row][tile.col] = newTile;
                    });
                });
            }
            attempts++;
        }
    }
    
    getTile(col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return null;
        }
        return this.tiles[row][col];
    }
    
    setTile(col, row, tile) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return;
        }
        this.tiles[row][col] = tile;
        if (tile) {
            tile.col = col;
            tile.row = row;
        }
    }
    
    swapTiles(col1, row1, col2, row2) {
        const tile1 = this.getTile(col1, row1);
        const tile2 = this.getTile(col2, row2);
        
        if (!tile1 || !tile2) return false;
        
        // Swap positions
        this.setTile(col1, row1, tile2);
        this.setTile(col2, row2, tile1);
        
        return true;
    }
    
    findMatches() {
        const matches = [];
        const visited = new Set();
        
        // Find horizontal matches
        for (let row = 0; row < this.height; row++) {
            let currentMatch = [];
            let currentType = null;
            
            for (let col = 0; col < this.width; col++) {
                const tile = this.getTile(col, row);
                if (!tile) continue;
                
                if (tile.type === currentType) {
                    currentMatch.push(tile);
                } else {
                    if (currentMatch.length >= 3) {
                        matches.push({
                            type: 'horizontal',
                            tiles: [...currentMatch],
                            row: row
                        });
                        currentMatch.forEach(t => visited.add(`${t.col},${t.row}`));
                    }
                    currentMatch = [tile];
                    currentType = tile.type;
                }
            }
            
            // Check final match
            if (currentMatch.length >= 3) {
                matches.push({
                    type: 'horizontal',
                    tiles: [...currentMatch],
                    row: row
                });
                currentMatch.forEach(t => visited.add(`${t.col},${t.row}`));
            }
        }
        
        // Find vertical matches
        for (let col = 0; col < this.width; col++) {
            let currentMatch = [];
            let currentType = null;
            
            for (let row = 0; row < this.height; row++) {
                const tile = this.getTile(col, row);
                if (!tile) continue;
                
                if (tile.type === currentType) {
                    currentMatch.push(tile);
                } else {
                    if (currentMatch.length >= 3) {
                        matches.push({
                            type: 'vertical',
                            tiles: [...currentMatch],
                            col: col
                        });
                        currentMatch.forEach(t => visited.add(`${t.col},${t.row}`));
                    }
                    currentMatch = [tile];
                    currentType = tile.type;
                }
            }
            
            // Check final match
            if (currentMatch.length >= 3) {
                matches.push({
                    type: 'vertical',
                    tiles: [...currentMatch],
                    col: col
                });
                currentMatch.forEach(t => visited.add(`${t.col},${t.row}`));
            }
        }
        
        return matches;
    }
    
    hasMatches() {
        return this.findMatches().length > 0;
    }
    
    removeMatches(matches) {
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                this.setTile(tile.col, tile.row, null);
            });
        });
    }
    
    dropTiles() {
        for (let col = 0; col < this.width; col++) {
            // Collect non-null tiles from bottom to top
            const columnTiles = [];
            for (let row = this.height - 1; row >= 0; row--) {
                const tile = this.getTile(col, row);
                if (tile) {
                    columnTiles.push(tile);
                }
            }
            
            // Clear column
            for (let row = 0; row < this.height; row++) {
                this.setTile(col, row, null);
            }
            
            // Place tiles from bottom
            for (let i = 0; i < columnTiles.length; i++) {
                const newRow = this.height - 1 - i;
                this.setTile(col, newRow, columnTiles[i]);
            }
        }
    }
    
    fillEmptySpaces() {
        for (let col = 0; col < this.width; col++) {
            for (let row = 0; row < this.height; row++) {
                if (!this.getTile(col, row)) {
                    const newTile = this.createRandomTile(col, row);
                    this.setTile(col, row, newTile);
                }
            }
        }
    }
    
    getTilePosition(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        
        if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
            return { col, row };
        }
        return null;
    }
    
    getTileAt(x, y) {
        const pos = this.getTilePosition(x, y);
        return pos ? this.getTile(pos.col, pos.row) : null;
    }
    
    render(ctx) {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const tile = this.getTile(col, row);
                if (tile) {
                    this.renderTile(ctx, tile, col, row);
                } else {
                    this.renderEmptySpace(ctx, col, row);
                }
            }
        }
    }
    
    renderTile(ctx, tile, col, row) {
        const x = col * this.tileSize;
        const y = row * this.tileSize;
        const size = this.tileSize - 2; // Small gap between tiles
        
        // Tile background
        ctx.fillStyle = this.getTileColor(tile.type);
        ctx.fillRect(x + 1, y + 1, size, size);
        
        // Tile border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, size, size);
        
        // Tile icon/text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.tileSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = x + this.tileSize / 2;
        const centerY = y + this.tileSize / 2;
        
        // Draw tile symbol
        const symbol = this.getTileSymbol(tile.type);
        ctx.fillText(symbol, centerX, centerY);
    }
    
    renderEmptySpace(ctx, col, row) {
        const x = col * this.tileSize;
        const y = row * this.tileSize;
        const size = this.tileSize - 2;
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 1, y + 1, size, size);
        
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, size, size);
    }
    
    getTileColor(type) {
        const colors = {
            red: '#e74c3c',
            blue: '#3498db',
            green: '#2ecc71',
            yellow: '#f1c40f',
            purple: '#9b59b6',
            orange: '#e67e22'
        };
        return colors[type] || '#95a5a6';
    }
    
    getTileSymbol(type) {
        const symbols = {
            red: '♦',
            blue: '♠',
            green: '♣',
            yellow: '★',
            purple: '♥',
            orange: '●'
        };
        return symbols[type] || '?';
    }
    
    update(deltaTime) {
        // Update any animations or tile movements
        this.updateFallingTiles(deltaTime);
    }
    
    updateFallingTiles(deltaTime) {
        // Handle tile falling animations
        this.fallingTiles = this.fallingTiles.filter(fallingTile => {
            fallingTile.y += fallingTile.speed * deltaTime;
            
            if (fallingTile.y >= fallingTile.targetY) {
                fallingTile.y = fallingTile.targetY;
                return false; // Remove from falling tiles
            }
            return true;
        });
    }
    
    // Utility methods
    isEmpty(col, row) {
        return this.getTile(col, row) === null;
    }
    
    isValidPosition(col, row) {
        return col >= 0 && col < this.width && row >= 0 && row < this.height;
    }
    
    getNeighbors(col, row) {
        const neighbors = [];
        const directions = [
            { col: -1, row: 0 }, // left
            { col: 1, row: 0 },  // right
            { col: 0, row: -1 }, // up
            { col: 0, row: 1 }   // down
        ];
        
        directions.forEach(dir => {
            const newCol = col + dir.col;
            const newRow = row + dir.row;
            if (this.isValidPosition(newCol, newRow)) {
                neighbors.push({ col: newCol, row: newRow });
            }
        });
        
        return neighbors;
    }
    
    countTileType(type) {
        let count = 0;
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const tile = this.getTile(col, row);
                if (tile && tile.type === type) {
                    count++;
                }
            }
        }
        return count;
    }
    
    shuffle() {
        // Collect all tiles
        const allTiles = [];
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const tile = this.getTile(col, row);
                if (tile) {
                    allTiles.push(tile);
                }
            }
        }
        
        // Shuffle array
        for (let i = allTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
        }
        
        // Place shuffled tiles back
        let tileIndex = 0;
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (this.getTile(col, row)) {
                    this.setTile(col, row, allTiles[tileIndex]);
                    tileIndex++;
                }
            }
        }
        
        // Remove any matches created by shuffling
        this.removeInitialMatches();
    }
}
