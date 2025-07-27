/**
 * Puzzle Engine
 * Core match-3 game logic and mechanics
 */
class PuzzleEngine {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.board = null;
        this.powerUps = null;
        
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.currentLevel = 1;
        this.movesLeft = 25;
        this.score = 0;
        this.objectives = {};
        this.selectedTile = null;
        this.isAnimating = false;
        this.comboCount = 0;
        
        // Timing
        this.lastUpdate = 0;
        this.animationSpeed = 300; // ms
        
        // Level configuration
        this.levelConfig = {
            1: {
                moves: 25,
                objectives: { red: 10, blue: 10 },
                boardSize: { width: 8, height: 8 },
                tileTypes: ['red', 'blue', 'green', 'yellow', 'purple'],
                obstacles: []
            }
        };
        
        this.initializeCanvas();
        this.bindEvents();
    }
    
    initializeCanvas() {
        this.canvas = document.getElementById('puzzle-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = 400;
            this.canvas.height = 400;
            
            // Initialize board
            this.board = new Board(this, 8, 8);
            this.powerUps = new PowerUps(this);
        }
    }
    
    bindEvents() {
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
            this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        }
        
        // Power-up buttons
        document.querySelectorAll('.power-up').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePowerUpClick(e));
        });
        
        // Pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
    }
    
    startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        const config = this.levelConfig[levelNumber] || this.levelConfig[1];
        
        // Initialize level
        this.movesLeft = config.moves;
        this.score = 0;
        this.objectives = { ...config.objectives };
        this.comboCount = 0;
        this.selectedTile = null;
        this.isAnimating = false;
        
        // Setup board
        this.board.initialize(config.boardSize.width, config.boardSize.height, config.tileTypes);
        
        // Update UI
        this.updateUI();
        
        // Start game loop
        this.isPlaying = true;
        this.isPaused = false;
        this.gameLoop();
        
        console.log(`Started level ${levelNumber}`);
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        if (this.isPaused || this.isAnimating) return;
        
        // Update board
        this.board.update(deltaTime);
        
        // Check for matches
        this.checkMatches();
        
        // Check win/lose conditions
        this.checkGameEnd();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render board
        this.board.render(this.ctx);
        
        // Render selected tile highlight
        if (this.selectedTile) {
            this.renderSelection();
        }
    }
    
    handleClick(event) {
        if (!this.isPlaying || this.isPaused || this.isAnimating) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const tilePos = this.board.getTilePosition(x, y);
        if (!tilePos) return;
        
        const tile = this.board.getTile(tilePos.col, tilePos.row);
        if (!tile) return;
        
        this.handleTileSelection(tile, tilePos);
    }
    
    handleTouch(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const clickEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        this.handleClick(clickEvent);
    }
    
    handleTileSelection(tile, position) {
        if (!this.selectedTile) {
            // First tile selection
            this.selectedTile = { tile, position };
        } else {
            // Second tile selection - attempt swap
            const canSwap = this.canSwapTiles(this.selectedTile.position, position);
            
            if (canSwap) {
                this.swapTiles(this.selectedTile.position, position);
                this.selectedTile = null;
            } else {
                // Select new tile
                this.selectedTile = { tile, position };
            }
        }
    }
    
    canSwapTiles(pos1, pos2) {
        // Check if tiles are adjacent
        const dx = Math.abs(pos1.col - pos2.col);
        const dy = Math.abs(pos1.row - pos2.row);
        
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }
    
    swapTiles(pos1, pos2) {
        if (this.movesLeft <= 0) return;
        
        // Perform swap
        this.board.swapTiles(pos1.col, pos1.row, pos2.col, pos2.row);
        
        // Check if swap creates matches
        const hasMatches = this.board.hasMatches();
        
        if (hasMatches) {
            // Valid move
            this.movesLeft--;
            this.updateUI();
            this.processMatches();
        } else {
            // Invalid move - swap back
            this.board.swapTiles(pos2.col, pos2.row, pos1.col, pos1.row);
        }
    }
    
    checkMatches() {
        const matches = this.board.findMatches();
        if (matches.length > 0) {
            this.processMatches();
        }
    }
    
    processMatches() {
        this.isAnimating = true;
        
        const matches = this.board.findMatches();
        if (matches.length === 0) {
            this.isAnimating = false;
            return;
        }
        
        // Calculate score
        const baseScore = matches.length * 100;
        const comboBonus = this.comboCount * 50;
        const totalScore = baseScore + comboBonus;
        
        this.score += totalScore;
        this.comboCount++;
        
        // Update objectives
        this.updateObjectives(matches);
        
        // Remove matched tiles
        this.board.removeMatches(matches);
        
        // Show score popup
        this.showScorePopup(totalScore);
        
        // Drop tiles and fill empty spaces
        setTimeout(() => {
            this.board.dropTiles();
            this.board.fillEmptySpaces();
            
            setTimeout(() => {
                this.isAnimating = false;
                // Check for new matches (cascade)
                this.checkMatches();
            }, this.animationSpeed);
        }, this.animationSpeed);
        
        this.updateUI();
    }
    
    updateObjectives(matches) {
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (this.objectives[tile.type] > 0) {
                    this.objectives[tile.type]--;
                }
            });
        });
    }
    
    checkGameEnd() {
        // Check win condition
        const objectivesComplete = Object.values(this.objectives).every(count => count <= 0);
        
        if (objectivesComplete) {
            this.endLevel(true);
            return;
        }
        
        // Check lose condition
        if (this.movesLeft <= 0) {
            this.endLevel(false);
            return;
        }
    }
    
    endLevel(won) {
        this.isPlaying = false;
        
        if (won) {
            // Calculate stars based on score and moves left
            const stars = this.calculateStars();
            this.game.completeLevel(this.currentLevel, stars, this.score);
        } else {
            // Show game over modal
            const modal = document.getElementById('game-over-modal');
            if (modal) modal.classList.add('active');
        }
    }
    
    calculateStars() {
        // Simple star calculation - can be made more sophisticated
        if (this.movesLeft >= 10) return 3;
        if (this.movesLeft >= 5) return 2;
        return 1;
    }
    
    handlePowerUpClick(event) {
        const powerUpType = event.target.dataset.type;
        if (this.powerUps.canUse(powerUpType)) {
            this.powerUps.use(powerUpType);
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.game.stateManager.changeState('paused');
        } else {
            this.game.stateManager.changeState('playing');
        }
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
    }
    
    updateUI() {
        // Update moves
        const movesDisplay = document.getElementById('moves-left');
        if (movesDisplay) movesDisplay.textContent = this.movesLeft;
        
        // Update score
        const scoreDisplay = document.getElementById('current-score');
        if (scoreDisplay) scoreDisplay.textContent = this.score;
        
        // Update level
        const levelDisplay = document.getElementById('level-number');
        if (levelDisplay) levelDisplay.textContent = `Level ${this.currentLevel}`;
        
        // Update objectives
        const redTarget = document.getElementById('red-target');
        const blueTarget = document.getElementById('blue-target');
        
        if (redTarget) redTarget.textContent = Math.max(0, this.objectives.red || 0);
        if (blueTarget) blueTarget.textContent = Math.max(0, this.objectives.blue || 0);
    }
    
    renderSelection() {
        if (!this.selectedTile) return;
        
        const { position } = this.selectedTile;
        const tileSize = this.board.tileSize;
        const x = position.col * tileSize;
        const y = position.row * tileSize;
        
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, tileSize, tileSize);
    }
    
    showScorePopup(score) {
        // Create score popup element
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${score}`;
        popup.style.left = '50%';
        popup.style.top = '50%';
        
        document.body.appendChild(popup);
        
        // Remove after animation
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1000);
    }
    
    // Utility methods
    getTileAt(x, y) {
        return this.board.getTileAt(x, y);
    }
    
    getScore() {
        return this.score;
    }
    
    getMovesLeft() {
        return this.movesLeft;
    }
    
    getObjectives() {
        return this.objectives;
    }
}
