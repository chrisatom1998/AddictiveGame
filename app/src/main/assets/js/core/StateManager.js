/**
 * State Manager
 * Handles game state transitions and state persistence
 */
class StateManager {
    constructor(game) {
        this.game = game;
        this.states = {
            LOADING: 'loading',
            MENU: 'menu',
            LEVEL_SELECT: 'level_select',
            PLAYING: 'playing',
            PAUSED: 'paused',
            LEVEL_COMPLETE: 'level_complete',
            GAME_OVER: 'game_over',
            RENOVATION: 'renovation',
            SHOP: 'shop',
            SETTINGS: 'settings',
            STORY: 'story'
        };
        
        this.currentState = this.states.LOADING;
        this.previousState = null;
        this.stateHistory = [];
        this.stateData = {};
        
        this.initializeStateHandlers();
    }
    
    initializeStateHandlers() {
        this.stateHandlers = {
            [this.states.LOADING]: {
                enter: () => this.enterLoading(),
                exit: () => this.exitLoading(),
                update: () => this.updateLoading()
            },
            [this.states.MENU]: {
                enter: () => this.enterMenu(),
                exit: () => this.exitMenu(),
                update: () => this.updateMenu()
            },
            [this.states.LEVEL_SELECT]: {
                enter: () => this.enterLevelSelect(),
                exit: () => this.exitLevelSelect(),
                update: () => this.updateLevelSelect()
            },
            [this.states.PLAYING]: {
                enter: () => this.enterPlaying(),
                exit: () => this.exitPlaying(),
                update: () => this.updatePlaying()
            },
            [this.states.PAUSED]: {
                enter: () => this.enterPaused(),
                exit: () => this.exitPaused(),
                update: () => this.updatePaused()
            },
            [this.states.LEVEL_COMPLETE]: {
                enter: () => this.enterLevelComplete(),
                exit: () => this.exitLevelComplete(),
                update: () => this.updateLevelComplete()
            },
            [this.states.GAME_OVER]: {
                enter: () => this.enterGameOver(),
                exit: () => this.exitGameOver(),
                update: () => this.updateGameOver()
            },
            [this.states.RENOVATION]: {
                enter: () => this.enterRenovation(),
                exit: () => this.exitRenovation(),
                update: () => this.updateRenovation()
            },
            [this.states.SHOP]: {
                enter: () => this.enterShop(),
                exit: () => this.exitShop(),
                update: () => this.updateShop()
            },
            [this.states.STORY]: {
                enter: () => this.enterStory(),
                exit: () => this.exitStory(),
                update: () => this.updateStory()
            }
        };
    }
    
    changeState(newState, data = {}) {
        if (newState === this.currentState) {
            console.warn(`Already in state: ${newState}`);
            return;
        }
        
        if (!this.states[newState.toUpperCase()]) {
            console.error(`Invalid state: ${newState}`);
            return;
        }
        
        console.log(`State change: ${this.currentState} -> ${newState}`);
        
        // Exit current state
        if (this.stateHandlers[this.currentState]?.exit) {
            this.stateHandlers[this.currentState].exit();
        }
        
        // Update state history
        this.stateHistory.push(this.currentState);
        if (this.stateHistory.length > 10) {
            this.stateHistory.shift();
        }
        
        // Change state
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateData = data;
        
        // Enter new state
        if (this.stateHandlers[this.currentState]?.enter) {
            this.stateHandlers[this.currentState].enter();
        }
        
        // Trigger state change event
        this.onStateChange(newState, this.previousState, data);
    }
    
    goToPreviousState() {
        if (this.previousState) {
            this.changeState(this.previousState);
        }
    }
    
    goBack() {
        if (this.stateHistory.length > 0) {
            const previousState = this.stateHistory.pop();
            this.changeState(previousState);
        }
    }
    
    update() {
        if (this.stateHandlers[this.currentState]?.update) {
            this.stateHandlers[this.currentState].update();
        }
    }
    
    onStateChange(newState, oldState, data) {
        // Override in subclasses or add event listeners
        console.log(`State changed from ${oldState} to ${newState}`, data);
    }
    
    // State Handlers
    enterLoading() {
        this.game.showScreen('loading-screen');
    }
    
    exitLoading() {
        // Loading complete
    }
    
    updateLoading() {
        // Update loading progress
    }
    
    enterMenu() {
        this.game.showScreen('main-menu');
        this.game.updateCurrencyDisplay();
    }
    
    exitMenu() {
        // Clean up menu
    }
    
    updateMenu() {
        // Update menu state
    }
    
    enterLevelSelect() {
        this.game.showScreen('level-select');
        this.game.generateLevelGrid();
    }
    
    exitLevelSelect() {
        // Clean up level select
    }
    
    updateLevelSelect() {
        // Update level select
    }
    
    enterPlaying() {
        this.game.showScreen('puzzle-game');
        if (this.stateData.level) {
            this.game.puzzleEngine.startLevel(this.stateData.level);
        }
    }
    
    exitPlaying() {
        // Pause or stop puzzle engine
        if (this.game.puzzleEngine) {
            this.game.puzzleEngine.pause();
        }
    }
    
    updatePlaying() {
        // Update puzzle game
        if (this.game.puzzleEngine) {
            this.game.puzzleEngine.update();
        }
    }
    
    enterPaused() {
        // Show pause menu
        this.showPauseMenu();
    }
    
    exitPaused() {
        // Hide pause menu
        this.hidePauseMenu();
    }
    
    updatePaused() {
        // Update pause state
    }
    
    enterLevelComplete() {
        const { stars, score, coinsEarned } = this.stateData;
        this.game.showLevelCompleteModal(stars, coinsEarned);
    }
    
    exitLevelComplete() {
        // Hide level complete modal
        const modal = document.getElementById('level-complete-modal');
        if (modal) modal.classList.remove('active');
    }
    
    updateLevelComplete() {
        // Update level complete state
    }
    
    enterGameOver() {
        this.showGameOverModal();
    }
    
    exitGameOver() {
        // Hide game over modal
        const modal = document.getElementById('game-over-modal');
        if (modal) modal.classList.remove('active');
    }
    
    updateGameOver() {
        // Update game over state
    }
    
    enterRenovation() {
        this.game.showScreen('renovation-mode');
        if (this.game.renovationManager) {
            this.game.renovationManager.showCurrentRoom();
        }
    }
    
    exitRenovation() {
        // Clean up renovation
    }
    
    updateRenovation() {
        // Update renovation state
        if (this.game.renovationManager) {
            this.game.renovationManager.update();
        }
    }
    
    enterShop() {
        this.game.showScreen('shop-screen');
        this.game.updateShopCurrency();
    }
    
    exitShop() {
        // Clean up shop
    }
    
    updateShop() {
        // Update shop state
    }
    
    enterStory() {
        const { character, message, callback } = this.stateData;
        this.showStoryDialog(character, message, callback);
    }
    
    exitStory() {
        // Hide story dialog
        const modal = document.getElementById('story-dialog');
        if (modal) modal.classList.remove('active');
    }
    
    updateStory() {
        // Update story state
    }
    
    // Helper methods
    showPauseMenu() {
        // TODO: Implement pause menu
        console.log('Showing pause menu');
    }
    
    hidePauseMenu() {
        // TODO: Implement pause menu hiding
        console.log('Hiding pause menu');
    }
    
    showGameOverModal() {
        const modal = document.getElementById('game-over-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    showStoryDialog(character, message, callback) {
        const modal = document.getElementById('story-dialog');
        const characterName = document.getElementById('character-name');
        const dialogMessage = document.getElementById('dialog-message');
        const continueBtn = document.getElementById('dialog-continue');
        
        if (modal && characterName && dialogMessage && continueBtn) {
            characterName.textContent = character;
            dialogMessage.textContent = message;
            
            // Remove previous event listeners
            const newContinueBtn = continueBtn.cloneNode(true);
            continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
            
            // Add new event listener
            newContinueBtn.addEventListener('click', () => {
                this.changeState(this.states.MENU);
                if (callback) callback();
            });
            
            modal.classList.add('active');
        }
    }
    
    // State queries
    isPlaying() {
        return this.currentState === this.states.PLAYING;
    }
    
    isPaused() {
        return this.currentState === this.states.PAUSED;
    }
    
    isInMenu() {
        return this.currentState === this.states.MENU;
    }
    
    isInGame() {
        return [
            this.states.PLAYING,
            this.states.PAUSED,
            this.states.LEVEL_COMPLETE,
            this.states.GAME_OVER
        ].includes(this.currentState);
    }
    
    canPause() {
        return this.currentState === this.states.PLAYING;
    }
    
    canResume() {
        return this.currentState === this.states.PAUSED;
    }
    
    // Save/Load state
    getStateData() {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            stateHistory: this.stateHistory,
            stateData: this.stateData
        };
    }
    
    loadStateData(data) {
        if (data) {
            this.currentState = data.currentState || this.states.MENU;
            this.previousState = data.previousState;
            this.stateHistory = data.stateHistory || [];
            this.stateData = data.stateData || {};
        }
    }
}
