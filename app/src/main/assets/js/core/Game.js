/**
 * Main Game Controller
 * Manages overall game state, screen transitions, and core game loop
 */
class Game {
    constructor() {
        this.currentScreen = 'loading-screen';
        this.gameState = 'menu'; // menu, playing, renovation, shop
        this.isInitialized = false;
        
        // Core systems
        this.stateManager = null;
        this.saveSystem = null;
        this.puzzleEngine = null;
        this.renovationManager = null;
        this.currencyManager = null;
        this.storyManager = null;
        this.uiManager = null;
        
        // Game data
        this.playerData = {
            level: 1,
            coins: 1000,
            stars: 5,
            lives: 5,
            maxLives: 5,
            lastLifeTime: Date.now(),
            currentRoom: 'kitchen',
            unlockedRooms: ['kitchen'],
            completedLevels: [],
            ownedFurniture: [],
            achievements: [],
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                vibrationEnabled: true
            }
        };
        
        // Game configuration
        this.config = {
            lifeRegenTime: 30 * 60 * 1000, // 30 minutes
            maxLevel: 100,
            coinsPerLevel: 150,
            starsPerThreeStars: 1,
            adRewardCoins: 50,
            adRewardMoves: 5
        };
        
        this.bindEvents();
    }
    
    async init() {
        try {
            console.log('Initializing Home Sweet Puzzle...');
            
            // Show loading screen
            this.showScreen('loading-screen');
            this.updateLoadingProgress(10);
            
            // Initialize core systems
            await this.initializeSystems();
            this.updateLoadingProgress(40);
            
            // Load player data
            await this.loadPlayerData();
            this.updateLoadingProgress(60);
            
            // Initialize UI
            this.initializeUI();
            this.updateLoadingProgress(80);
            
            // Setup game data
            this.setupGameData();
            this.updateLoadingProgress(100);
            
            // Start life regeneration
            this.startLifeRegeneration();
            
            // Show main menu after loading
            setTimeout(() => {
                this.showScreen('main-menu');
                this.gameState = 'menu';
                this.isInitialized = true;
                console.log('Game initialized successfully!');
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }
    
    async initializeSystems() {
        // Initialize state manager
        this.stateManager = new StateManager(this);
        
        // Initialize save system
        this.saveSystem = new SaveSystem(this);
        
        // Initialize currency manager
        this.currencyManager = new Currency(this);
        
        // Initialize UI manager
        this.uiManager = new UIManager(this);
        
        // Initialize puzzle engine
        this.puzzleEngine = new PuzzleEngine(this);
        
        // Initialize renovation manager
        this.renovationManager = new RenovationManager(this);
        
        // Initialize story manager
        this.storyManager = new StoryManager(this);
    }
    
    async loadPlayerData() {
        const savedData = await this.saveSystem.load();
        if (savedData) {
            this.playerData = { ...this.playerData, ...savedData };
            console.log('Loaded player data:', this.playerData);
        } else {
            console.log('No saved data found, using defaults');
        }
        
        // Update lives based on time passed
        this.updateLives();
    }
    
    initializeUI() {
        // Update currency displays
        this.updateCurrencyDisplay();
        
        // Generate level grid
        this.generateLevelGrid();
        
        // Initialize renovation UI
        this.renovationManager.initializeUI();
        
        // Setup shop
        this.setupShop();
    }
    
    setupGameData() {
        // Load level data, furniture data, etc.
        // This would typically load from JSON files
        console.log('Setting up game data...');
    }
    
    bindEvents() {
        // Menu buttons
        document.addEventListener('DOMContentLoaded', () => {
            const playBtn = document.getElementById('play-btn');
            const renovationBtn = document.getElementById('renovation-btn');
            const shopBtn = document.getElementById('shop-btn');
            const settingsBtn = document.getElementById('settings-btn');
            
            if (playBtn) playBtn.addEventListener('click', () => this.showLevelSelect());
            if (renovationBtn) renovationBtn.addEventListener('click', () => this.showRenovation());
            if (shopBtn) shopBtn.addEventListener('click', () => this.showShop());
            if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
            
            // Back buttons
            const backToMenu = document.getElementById('back-to-menu');
            const backToGame = document.getElementById('back-to-game');
            const backFromShop = document.getElementById('back-from-shop');
            
            if (backToMenu) backToMenu.addEventListener('click', () => this.showMainMenu());
            if (backToGame) backToGame.addEventListener('click', () => this.showMainMenu());
            if (backFromShop) backFromShop.addEventListener('click', () => this.showMainMenu());
            
            // Modal buttons
            const continueBtn = document.getElementById('continue-btn');
            const replayBtn = document.getElementById('replay-btn');
            const retryBtn = document.getElementById('retry-btn');
            
            if (continueBtn) continueBtn.addEventListener('click', () => this.handleLevelComplete());
            if (replayBtn) replayBtn.addEventListener('click', () => this.replayLevel());
            if (retryBtn) retryBtn.addEventListener('click', () => this.retryLevel());
        });
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    }
    
    showMainMenu() {
        this.showScreen('main-menu');
        this.gameState = 'menu';
        this.updateCurrencyDisplay();
    }
    
    showLevelSelect() {
        this.showScreen('level-select');
        this.generateLevelGrid();
    }
    
    showRenovation() {
        this.showScreen('renovation-mode');
        this.gameState = 'renovation';
        this.renovationManager.showCurrentRoom();
    }
    
    showShop() {
        this.showScreen('shop-screen');
        this.gameState = 'shop';
        this.updateShopCurrency();
    }
    
    showSettings() {
        // TODO: Implement settings screen
        console.log('Settings not implemented yet');
    }
    
    startLevel(levelNumber) {
        if (!this.canPlayLevel(levelNumber)) {
            this.showError('Not enough lives or level locked!');
            return;
        }
        
        this.playerData.lives--;
        this.currentLevel = levelNumber;
        this.showScreen('puzzle-game');
        this.gameState = 'playing';
        
        // Initialize puzzle for this level
        this.puzzleEngine.startLevel(levelNumber);
        this.updateCurrencyDisplay();
    }
    
    canPlayLevel(levelNumber) {
        return this.playerData.lives > 0 && levelNumber <= this.getMaxUnlockedLevel();
    }
    
    getMaxUnlockedLevel() {
        return Math.max(1, this.playerData.completedLevels.length + 1);
    }
    
    completeLevel(levelNumber, stars, score) {
        // Update player progress
        if (!this.playerData.completedLevels.includes(levelNumber)) {
            this.playerData.completedLevels.push(levelNumber);
        }
        
        // Award coins
        const coinsEarned = this.config.coinsPerLevel + (stars * 50);
        this.addCoins(coinsEarned);
        
        // Award stars for 3-star completion
        if (stars === 3) {
            this.addStars(this.config.starsPerThreeStars);
        }
        
        // Show completion modal
        this.showLevelCompleteModal(stars, coinsEarned);
        
        // Save progress
        this.saveGame();
        
        // Check for story progression
        this.storyManager.checkLevelCompletion(levelNumber);
    }
    
    addCoins(amount) {
        this.playerData.coins += amount;
        this.updateCurrencyDisplay();
        this.uiManager.showCoinAnimation(amount);
    }
    
    addStars(amount) {
        this.playerData.stars += amount;
        this.updateCurrencyDisplay();
    }
    
    spendCoins(amount) {
        if (this.playerData.coins >= amount) {
            this.playerData.coins -= amount;
            this.updateCurrencyDisplay();
            return true;
        }
        return false;
    }
    
    spendStars(amount) {
        if (this.playerData.stars >= amount) {
            this.playerData.stars -= amount;
            this.updateCurrencyDisplay();
            return true;
        }
        return false;
    }
    
    updateCurrencyDisplay() {
        const coinsDisplays = document.querySelectorAll('#coins-display, #shop-coins');
        const starsDisplays = document.querySelectorAll('#stars-display, #shop-stars');
        const livesDisplay = document.getElementById('lives-display');
        
        coinsDisplays.forEach(display => {
            if (display) display.textContent = this.playerData.coins;
        });
        
        starsDisplays.forEach(display => {
            if (display) display.textContent = this.playerData.stars;
        });
        
        if (livesDisplay) {
            livesDisplay.textContent = this.playerData.lives;
        }
    }
    
    updateLives() {
        const now = Date.now();
        const timePassed = now - this.playerData.lastLifeTime;
        const livesToAdd = Math.floor(timePassed / this.config.lifeRegenTime);
        
        if (livesToAdd > 0 && this.playerData.lives < this.playerData.maxLives) {
            this.playerData.lives = Math.min(
                this.playerData.maxLives,
                this.playerData.lives + livesToAdd
            );
            this.playerData.lastLifeTime = now;
            this.updateCurrencyDisplay();
        }
    }
    
    startLifeRegeneration() {
        setInterval(() => {
            this.updateLives();
        }, 60000); // Check every minute
    }
    
    updateLoadingProgress(percent) {
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
    }
    
    generateLevelGrid() {
        const levelGrid = document.getElementById('level-grid');
        if (!levelGrid) return;
        
        levelGrid.innerHTML = '';
        const maxLevel = Math.min(this.config.maxLevel, this.getMaxUnlockedLevel() + 5);
        
        for (let i = 1; i <= maxLevel; i++) {
            const levelItem = document.createElement('button');
            levelItem.className = 'level-item';
            levelItem.textContent = i;
            
            if (i <= this.getMaxUnlockedLevel()) {
                if (this.playerData.completedLevels.includes(i)) {
                    levelItem.classList.add('completed');
                    levelItem.innerHTML = `${i}<div class="level-stars">⭐⭐⭐</div>`;
                }
                levelItem.addEventListener('click', () => this.startLevel(i));
            } else {
                levelItem.classList.add('locked');
                levelItem.innerHTML = '🔒';
            }
            
            levelGrid.appendChild(levelItem);
        }
    }
    
    setupShop() {
        // TODO: Implement shop setup
        console.log('Setting up shop...');
    }
    
    updateShopCurrency() {
        this.updateCurrencyDisplay();
    }
    
    showLevelCompleteModal(stars, coinsEarned) {
        const modal = document.getElementById('level-complete-modal');
        const coinsEarnedDisplay = document.getElementById('coins-earned');
        
        if (modal && coinsEarnedDisplay) {
            coinsEarnedDisplay.textContent = coinsEarned;
            modal.classList.add('active');
        }
    }
    
    handleLevelComplete() {
        const modal = document.getElementById('level-complete-modal');
        if (modal) modal.classList.remove('active');
        this.showLevelSelect();
    }
    
    replayLevel() {
        const modal = document.getElementById('level-complete-modal');
        if (modal) modal.classList.remove('active');
        this.startLevel(this.currentLevel);
    }
    
    retryLevel() {
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
        this.startLevel(this.currentLevel);
    }
    
    showError(message) {
        console.error(message);
        // TODO: Implement error display
    }
    
    async saveGame() {
        try {
            await this.saveSystem.save(this.playerData);
            console.log('Game saved successfully');
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }
}
