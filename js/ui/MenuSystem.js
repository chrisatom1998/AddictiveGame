/**
 * Menu System
 * Handles navigation between different game screens and menus
 */
class MenuSystem {
    constructor(game) {
        this.game = game;
        this.currentMenu = 'main-menu';
        this.menuHistory = [];
        this.menuTransitions = new Map();
        
        this.initializeMenuSystem();
    }
    
    initializeMenuSystem() {
        this.setupMenuTransitions();
        this.bindMenuEvents();
    }
    
    setupMenuTransitions() {
        // Define allowed transitions between menus
        this.menuTransitions.set('main-menu', ['level-select', 'renovation-mode', 'shop-screen', 'settings']);
        this.menuTransitions.set('level-select', ['main-menu', 'puzzle-game']);
        this.menuTransitions.set('puzzle-game', ['level-select', 'main-menu']);
        this.menuTransitions.set('renovation-mode', ['main-menu']);
        this.menuTransitions.set('shop-screen', ['main-menu']);
    }
    
    bindMenuEvents() {
        // Navigation buttons
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.dataset.navigate) {
                this.navigateTo(target.dataset.navigate);
            }
        });
    }
    
    navigateTo(menuId) {
        if (this.canNavigateTo(menuId)) {
            this.menuHistory.push(this.currentMenu);
            this.currentMenu = menuId;
            this.game.showScreen(menuId);
        }
    }
    
    canNavigateTo(menuId) {
        const allowedTransitions = this.menuTransitions.get(this.currentMenu);
        return allowedTransitions && allowedTransitions.includes(menuId);
    }
    
    goBack() {
        if (this.menuHistory.length > 0) {
            const previousMenu = this.menuHistory.pop();
            this.currentMenu = previousMenu;
            this.game.showScreen(previousMenu);
        }
    }
}
