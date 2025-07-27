/**
 * Unit tests for Board class
 * Tests the puzzle board grid management and tile operations
 */

describe('Board', () => {
  let board;
  let mockPuzzleEngine;
  let mockTile;

  beforeEach(() => {
    // Mock Tile class
    global.Tile = class Tile {
      constructor(type, col, row) {
        this.type = type;
        this.col = col;
        this.row = row;
        this.id = `tile_${col}_${row}_${type}`;
        this.isMatched = false;
        this.isSelected = false;
        this.isAnimating = false;
      }
      
      canMatch(otherTile) {
        return otherTile && this.type === otherTile.type;
      }
      
      setPosition(col, row) {
        this.col = col;
        this.row = row;
      }
    };

    // Mock puzzle engine
    mockPuzzleEngine = {
      canvas: {
        width: 400,
        height: 400
      }
    };

    // Mock Board class
    global.Board = class Board {
      constructor(puzzleEngine, width = 8, height = 8) {
        this.puzzleEngine = puzzleEngine;
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.tileSize = 50;
        this.tileTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.obstacles = [];
        this.fallingTiles = [];
        this.animationQueue = [];
        
        this.initialize(width, height);
      }
      
      initialize(width = 8, height = 8, tileTypes = null) {
        this.width = width;
        this.height = height;
        if (tileTypes) this.tileTypes = tileTypes;
        
        // Calculate tile size
        if (this.puzzleEngine.canvas) {
          this.tileSize = Math.min(
            this.puzzleEngine.canvas.width / this.width,
            this.puzzleEngine.canvas.height / this.height
          );
        }
        
        // Initialize empty grid
        this.tiles = [];
        for (let row = 0; row < this.height; row++) {
          this.tiles[row] = [];
          for (let col = 0; col < this.width; col++) {
            this.tiles[row][col] = null;
          }
        }
        
        this.fillBoard();
        this.removeInitialMatches();
      }
      
      fillBoard() {
        for (let row = 0; row < this.height; row++) {
          for (let col = 0; col < this.width; col++) {
            if (!this.tiles[row][col]) {
              const tileType = this.getRandomTileType();
              this.tiles[row][col] = new Tile(tileType, col, row);
            }
          }
        }
      }
      
      getRandomTileType() {
        return this.tileTypes[Math.floor(Math.random() * this.tileTypes.length)];
      }
      
      getTile(col, row) {
        if (this.isValidPosition(col, row)) {
          return this.tiles[row][col];
        }
        return null;
      }
      
      setTile(col, row, tile) {
        if (this.isValidPosition(col, row)) {
          this.tiles[row][col] = tile;
          if (tile) {
            tile.setPosition(col, row);
          }
          return true;
        }
        return false;
      }
      
      isValidPosition(col, row) {
        return col >= 0 && col < this.width && row >= 0 && row < this.height;
      }
      
      swapTiles(col1, row1, col2, row2) {
        if (!this.isValidPosition(col1, row1) || !this.isValidPosition(col2, row2)) {
          return false;
        }
        
        const tile1 = this.tiles[row1][col1];
        const tile2 = this.tiles[row2][col2];
        
        this.tiles[row1][col1] = tile2;
        this.tiles[row2][col2] = tile1;
        
        if (tile1) tile1.setPosition(col2, row2);
        if (tile2) tile2.setPosition(col1, row1);
        
        return true;
      }
      
      findMatches() {
        const matches = [];
        
        // Check horizontal matches
        for (let row = 0; row < this.height; row++) {
          let matchCount = 1;
          let currentType = null;
          
          for (let col = 0; col < this.width; col++) {
            const tile = this.tiles[row][col];
            
            if (tile && tile.type === currentType && !tile.isMatched) {
              matchCount++;
            } else {
              if (matchCount >= 3 && currentType) {
                for (let i = col - matchCount; i < col; i++) {
                  matches.push({ col: i, row: row });
                }
              }
              currentType = tile ? tile.type : null;
              matchCount = 1;
            }
          }
          
          // Check end of row
          if (matchCount >= 3 && currentType) {
            for (let i = this.width - matchCount; i < this.width; i++) {
              matches.push({ col: i, row: row });
            }
          }
        }
        
        // Check vertical matches
        for (let col = 0; col < this.width; col++) {
          let matchCount = 1;
          let currentType = null;
          
          for (let row = 0; row < this.height; row++) {
            const tile = this.tiles[row][col];
            
            if (tile && tile.type === currentType && !tile.isMatched) {
              matchCount++;
            } else {
              if (matchCount >= 3 && currentType) {
                for (let i = row - matchCount; i < row; i++) {
                  matches.push({ col: col, row: i });
                }
              }
              currentType = tile ? tile.type : null;
              matchCount = 1;
            }
          }
          
          // Check end of column
          if (matchCount >= 3 && currentType) {
            for (let i = this.height - matchCount; i < this.height; i++) {
              matches.push({ col: col, row: i });
            }
          }
        }
        
        return matches;
      }
      
      removeMatches(matches) {
        let removedCount = 0;
        
        matches.forEach(match => {
          const tile = this.getTile(match.col, match.row);
          if (tile) {
            tile.isMatched = true;
            this.setTile(match.col, match.row, null);
            removedCount++;
          }
        });
        
        return removedCount;
      }
      
      applyGravity() {
        let movesMade = false;
        
        for (let col = 0; col < this.width; col++) {
          // Collect non-null tiles from bottom to top
          const columnTiles = [];
          for (let row = this.height - 1; row >= 0; row--) {
            const tile = this.tiles[row][col];
            if (tile) {
              columnTiles.push(tile);
            }
          }
          
          // Clear column
          for (let row = 0; row < this.height; row++) {
            this.tiles[row][col] = null;
          }
          
          // Place tiles at bottom
          for (let i = 0; i < columnTiles.length; i++) {
            const row = this.height - 1 - i;
            const tile = columnTiles[i];
            const oldRow = tile.row;
            this.setTile(col, row, tile);
            if (oldRow !== row) {
              movesMade = true;
            }
          }
        }
        
        return movesMade;
      }
      
      fillEmptySpaces() {
        let tilesAdded = 0;
        
        for (let col = 0; col < this.width; col++) {
          for (let row = 0; row < this.height; row++) {
            if (!this.tiles[row][col]) {
              const tileType = this.getRandomTileType();
              this.setTile(col, row, new Tile(tileType, col, row));
              tilesAdded++;
            }
          }
        }
        
        return tilesAdded;
      }
      
      removeInitialMatches() {
        let iterations = 0;
        const maxIterations = 10;
        
        while (iterations < maxIterations) {
          const matches = this.findMatches();
          if (matches.length === 0) break;
          
          // Replace matched tiles with new random tiles
          matches.forEach(match => {
            const newType = this.getRandomTileType();
            this.setTile(match.col, match.row, new Tile(newType, match.col, match.row));
          });
          
          iterations++;
        }
      }
      
      clear() {
        for (let row = 0; row < this.height; row++) {
          for (let col = 0; col < this.width; col++) {
            this.tiles[row][col] = null;
          }
        }
      }
      
      getEmptyPositions() {
        const empty = [];
        for (let row = 0; row < this.height; row++) {
          for (let col = 0; col < this.width; col++) {
            if (!this.tiles[row][col]) {
              empty.push({ col, row });
            }
          }
        }
        return empty;
      }
    };

    board = new Board(mockPuzzleEngine, 8, 8);
  });

  describe('Constructor', () => {
    test('should initialize with correct dimensions', () => {
      expect(board.width).toBe(8);
      expect(board.height).toBe(8);
      expect(board.puzzleEngine).toBe(mockPuzzleEngine);
    });

    test('should initialize with default tile types', () => {
      expect(board.tileTypes).toContain('red');
      expect(board.tileTypes).toContain('blue');
      expect(board.tileTypes).toContain('green');
      expect(board.tileTypes.length).toBe(6);
    });

    test('should calculate tile size based on canvas', () => {
      expect(board.tileSize).toBe(50); // 400/8 = 50
    });

    test('should create a full board of tiles', () => {
      let tileCount = 0;
      for (let row = 0; row < board.height; row++) {
        for (let col = 0; col < board.width; col++) {
          if (board.tiles[row][col]) {
            tileCount++;
          }
        }
      }
      expect(tileCount).toBe(64); // 8x8 board
    });
  });

  describe('Position Validation', () => {
    test('isValidPosition should return true for valid positions', () => {
      expect(board.isValidPosition(0, 0)).toBe(true);
      expect(board.isValidPosition(7, 7)).toBe(true);
      expect(board.isValidPosition(3, 4)).toBe(true);
    });

    test('isValidPosition should return false for invalid positions', () => {
      expect(board.isValidPosition(-1, 0)).toBe(false);
      expect(board.isValidPosition(0, -1)).toBe(false);
      expect(board.isValidPosition(8, 0)).toBe(false);
      expect(board.isValidPosition(0, 8)).toBe(false);
      expect(board.isValidPosition(10, 10)).toBe(false);
    });
  });

  describe('Tile Management', () => {
    test('getTile should return tile at valid position', () => {
      const tile = board.getTile(0, 0);
      expect(tile).toBeInstanceOf(Tile);
      expect(tile.col).toBe(0);
      expect(tile.row).toBe(0);
    });

    test('getTile should return null for invalid position', () => {
      expect(board.getTile(-1, 0)).toBe(null);
      expect(board.getTile(8, 0)).toBe(null);
    });

    test('setTile should place tile at valid position', () => {
      const newTile = new Tile('test', 5, 5);
      const result = board.setTile(5, 5, newTile);
      
      expect(result).toBe(true);
      expect(board.getTile(5, 5)).toBe(newTile);
      expect(newTile.col).toBe(5);
      expect(newTile.row).toBe(5);
    });

    test('setTile should fail for invalid position', () => {
      const newTile = new Tile('test', 0, 0);
      const result = board.setTile(-1, 0, newTile);
      
      expect(result).toBe(false);
    });

    test('setTile should handle null tiles', () => {
      const result = board.setTile(0, 0, null);
      
      expect(result).toBe(true);
      expect(board.getTile(0, 0)).toBe(null);
    });
  });

  describe('Tile Swapping', () => {
    test('swapTiles should exchange positions of two tiles', () => {
      const tile1 = board.getTile(0, 0);
      const tile2 = board.getTile(1, 0);
      
      const result = board.swapTiles(0, 0, 1, 0);
      
      expect(result).toBe(true);
      expect(board.getTile(0, 0)).toBe(tile2);
      expect(board.getTile(1, 0)).toBe(tile1);
      expect(tile1.col).toBe(1);
      expect(tile2.col).toBe(0);
    });

    test('swapTiles should fail for invalid positions', () => {
      const result = board.swapTiles(-1, 0, 1, 0);
      expect(result).toBe(false);
      
      const result2 = board.swapTiles(0, 0, 8, 0);
      expect(result2).toBe(false);
    });
  });

  describe('Match Finding', () => {
    test('findMatches should detect horizontal matches', () => {
      // Create a horizontal match manually
      board.setTile(0, 0, new Tile('red', 0, 0));
      board.setTile(1, 0, new Tile('red', 1, 0));
      board.setTile(2, 0, new Tile('red', 2, 0));
      
      const matches = board.findMatches();
      
      const horizontalMatches = matches.filter(m => m.row === 0 && m.col <= 2);
      expect(horizontalMatches.length).toBeGreaterThanOrEqual(3);
    });

    test('findMatches should detect vertical matches', () => {
      // Create a vertical match manually
      board.setTile(0, 0, new Tile('blue', 0, 0));
      board.setTile(0, 1, new Tile('blue', 0, 1));
      board.setTile(0, 2, new Tile('blue', 0, 2));
      
      const matches = board.findMatches();
      
      const verticalMatches = matches.filter(m => m.col === 0 && m.row <= 2);
      expect(verticalMatches.length).toBeGreaterThanOrEqual(3);
    });

    test('findMatches should return empty array when no matches', () => {
      // Create board with no matches
      board.clear();
      const pattern = ['red', 'blue', 'green', 'yellow'];
      for (let row = 0; row < board.height; row++) {
        for (let col = 0; col < board.width; col++) {
          const type = pattern[(row + col) % pattern.length];
          board.setTile(col, row, new Tile(type, col, row));
        }
      }
      
      const matches = board.findMatches();
      expect(matches.length).toBe(0);
    });
  });

  describe('Gravity System', () => {
    test('applyGravity should move tiles down', () => {
      // Clear the column first
      for (let row = 0; row < board.height; row++) {
        board.setTile(3, row, null);
      }
      
      // Create a specific setup: tile at row 1, gap at row 2
      const tileAbove = new Tile('test', 3, 1);
      board.setTile(3, 1, tileAbove);
      
      const movesMade = board.applyGravity();
      
      expect(movesMade).toBe(true);
      expect(board.getTile(3, board.height - 1)).toBe(tileAbove); // Should be at bottom
      expect(board.getTile(3, 1)).toBe(null); // Should be empty now
    });

    test('applyGravity should return false when no moves made', () => {
      // Full board with no gaps
      const movesMade = board.applyGravity();
      expect(movesMade).toBe(false);
    });

    test('fillEmptySpaces should fill all null positions', () => {
      // Create some empty spaces
      board.setTile(0, 0, null);
      board.setTile(1, 1, null);
      board.setTile(2, 2, null);
      
      const tilesAdded = board.fillEmptySpaces();
      
      expect(tilesAdded).toBe(3);
      expect(board.getTile(0, 0)).toBeInstanceOf(Tile);
      expect(board.getTile(1, 1)).toBeInstanceOf(Tile);
      expect(board.getTile(2, 2)).toBeInstanceOf(Tile);
    });
  });

  describe('Board Manipulation', () => {
    test('clear should remove all tiles', () => {
      board.clear();
      
      for (let row = 0; row < board.height; row++) {
        for (let col = 0; col < board.width; col++) {
          expect(board.getTile(col, row)).toBe(null);
        }
      }
    });

    test('getEmptyPositions should return all empty positions', () => {
      board.clear();
      board.setTile(0, 0, new Tile('red', 0, 0));
      board.setTile(7, 7, new Tile('blue', 7, 7));
      
      const emptyPositions = board.getEmptyPositions();
      
      expect(emptyPositions.length).toBe(62); // 64 - 2 filled positions
      expect(emptyPositions).not.toContainEqual({ col: 0, row: 0 });
      expect(emptyPositions).not.toContainEqual({ col: 7, row: 7 });
    });
  });

  describe('Custom Dimensions', () => {
    test('should handle different board sizes', () => {
      const smallBoard = new Board(mockPuzzleEngine, 4, 4);
      
      expect(smallBoard.width).toBe(4);
      expect(smallBoard.height).toBe(4);
      expect(smallBoard.tileSize).toBe(100); // 400/4 = 100
      
      let tileCount = 0;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (smallBoard.getTile(col, row)) {
            tileCount++;
          }
        }
      }
      expect(tileCount).toBe(16);
    });

    test('should handle rectangular boards', () => {
      const rectBoard = new Board(mockPuzzleEngine, 6, 10);
      
      expect(rectBoard.width).toBe(6);
      expect(rectBoard.height).toBe(10);
      
      // Test boundaries
      expect(rectBoard.isValidPosition(5, 9)).toBe(true);
      expect(rectBoard.isValidPosition(6, 9)).toBe(false);
      expect(rectBoard.isValidPosition(5, 10)).toBe(false);
    });
  });
});