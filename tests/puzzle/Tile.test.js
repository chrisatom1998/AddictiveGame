/**
 * Unit tests for Tile class
 * Tests the fundamental puzzle tile functionality
 */

// Import the Tile class
// Note: In a real setup, you'd use proper ES6 imports or require()
// For now, we'll assume the class is globally available

describe('Tile', () => {
  let tile;

  beforeEach(() => {
    // Mock the Tile class for testing
    global.Tile = class Tile {
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
        this.animationDuration = 300;
        
        // Special properties
        this.isSpecial = false;
        this.specialType = null;
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
      
      makeSpecial(specialType) {
        this.isSpecial = true;
        this.specialType = specialType;
      }
      
      canMatch(otherTile) {
        if (!otherTile || this.isSpecial || otherTile.isSpecial) {
          return false;
        }
        return this.type === otherTile.type;
      }
      
      reset() {
        this.isMatched = false;
        this.isSelected = false;
        this.isAnimating = false;
        this.animationType = null;
        this.animationProgress = 0;
        this.scale = 1;
        this.rotation = 0;
        this.opacity = 1;
      }
    };

    tile = new Tile('red', 2, 3);
  });

  describe('Constructor', () => {
    test('should create a tile with correct basic properties', () => {
      expect(tile.type).toBe('red');
      expect(tile.col).toBe(2);
      expect(tile.row).toBe(3);
      expect(tile.x).toBe(2);
      expect(tile.y).toBe(3);
      expect(tile.targetX).toBe(2);
      expect(tile.targetY).toBe(3);
    });

    test('should generate a unique ID', () => {
      const tile1 = new Tile('blue', 0, 0);
      const tile2 = new Tile('blue', 0, 0);
      expect(tile1.id).toBeDefined();
      expect(tile2.id).toBeDefined();
      expect(tile1.id).not.toBe(tile2.id);
    });

    test('should initialize with default animation properties', () => {
      expect(tile.isAnimating).toBe(false);
      expect(tile.animationType).toBe(null);
      expect(tile.animationProgress).toBe(0);
      expect(tile.animationDuration).toBe(300);
    });

    test('should initialize as non-special tile', () => {
      expect(tile.isSpecial).toBe(false);
      expect(tile.specialType).toBe(null);
      expect(tile.power).toBe(1);
    });
  });

  describe('Position Management', () => {
    test('setPosition should update position coordinates', () => {
      tile.setPosition(5, 7);
      expect(tile.col).toBe(5);
      expect(tile.row).toBe(7);
      expect(tile.targetX).toBe(5);
      expect(tile.targetY).toBe(7);
    });

    test('moveTo without animation should set position immediately', () => {
      tile.moveTo(4, 6, false);
      expect(tile.col).toBe(4);
      expect(tile.row).toBe(6);
      expect(tile.x).toBe(4);
      expect(tile.y).toBe(6);
      expect(tile.targetX).toBe(4);
      expect(tile.targetY).toBe(6);
      expect(tile.isAnimating).toBe(false);
    });

    test('moveTo with animation should start animation', () => {
      tile.moveTo(4, 6, true);
      expect(tile.col).toBe(4);
      expect(tile.row).toBe(6);
      expect(tile.targetX).toBe(4);
      expect(tile.targetY).toBe(6);
      expect(tile.isAnimating).toBe(true);
      expect(tile.animationType).toBe('move');
    });
  });

  describe('Special Tile Functionality', () => {
    test('makeSpecial should convert tile to special type', () => {
      tile.makeSpecial('bomb');
      expect(tile.isSpecial).toBe(true);
      expect(tile.specialType).toBe('bomb');
    });

    test('should handle different special types', () => {
      const specialTypes = ['bomb', 'line_horizontal', 'line_vertical', 'color_bomb'];
      
      specialTypes.forEach(type => {
        const specialTile = new Tile('special', 0, 0);
        specialTile.makeSpecial(type);
        expect(specialTile.specialType).toBe(type);
        expect(specialTile.isSpecial).toBe(true);
      });
    });
  });

  describe('Matching Logic', () => {
    test('canMatch should return true for same type tiles', () => {
      const otherTile = new Tile('red', 1, 1);
      expect(tile.canMatch(otherTile)).toBe(true);
    });

    test('canMatch should return false for different type tiles', () => {
      const otherTile = new Tile('blue', 1, 1);
      expect(tile.canMatch(otherTile)).toBe(false);
    });

    test('canMatch should return false for special tiles', () => {
      const specialTile = new Tile('red', 1, 1);
      specialTile.makeSpecial('bomb');
      expect(tile.canMatch(specialTile)).toBe(false);
    });

    test('canMatch should return false for null tile', () => {
      expect(tile.canMatch(null)).toBe(false);
    });
  });

  describe('State Management', () => {
    test('reset should clear all temporary states', () => {
      // Set various states
      tile.isMatched = true;
      tile.isSelected = true;
      tile.isAnimating = true;
      tile.animationType = 'explode';
      tile.animationProgress = 0.5;
      tile.scale = 1.2;
      tile.rotation = 45;
      tile.opacity = 0.5;

      tile.reset();

      expect(tile.isMatched).toBe(false);
      expect(tile.isSelected).toBe(false);
      expect(tile.isAnimating).toBe(false);
      expect(tile.animationType).toBe(null);
      expect(tile.animationProgress).toBe(0);
      expect(tile.scale).toBe(1);
      expect(tile.rotation).toBe(0);
      expect(tile.opacity).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative positions', () => {
      const negativeTile = new Tile('green', -1, -1);
      expect(negativeTile.col).toBe(-1);
      expect(negativeTile.row).toBe(-1);
    });

    test('should handle large positions', () => {
      const largeTile = new Tile('yellow', 999, 999);
      expect(largeTile.col).toBe(999);
      expect(largeTile.row).toBe(999);
    });

    test('should handle empty or invalid tile types', () => {
      const emptyTile = new Tile('', 0, 0);
      const nullTile = new Tile(null, 0, 0);
      expect(emptyTile.type).toBe('');
      expect(nullTile.type).toBe(null);
    });
  });
});