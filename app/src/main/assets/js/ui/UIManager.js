/**
 * UI Manager
 * Handles user interface updates, animations, and interactions
 */
class UIManager {
    constructor(game) {
        this.game = game;
        this.activeModals = [];
        this.notifications = [];
        this.animations = [];
        
        // UI state
        this.isUILocked = false;
        this.currentTooltip = null;
        
        // Animation queues
        this.coinAnimations = [];
        this.starAnimations = [];
        this.scoreAnimations = [];
        
        this.initializeUI();
    }
    
    initializeUI() {
        this.setupEventListeners();
        this.initializeTooltips();
        this.setupKeyboardShortcuts();
        this.createNotificationContainer();
    }
    
    setupEventListeners() {
        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Visibility change (for mobile app switching)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    initializeTooltips() {
        // Add tooltips to elements with data-tooltip attribute
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            this.addTooltip(element);
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case 'p':
                case 'P':
                    if (this.game.puzzleEngine && this.game.puzzleEngine.isPlaying) {
                        this.game.puzzleEngine.togglePause();
                    }
                    break;
                case 'r':
                case 'R':
                    if (this.game.currentScreen === 'renovation-mode') {
                        this.game.renovationManager.showCurrentRoom();
                    }
                    break;
                case 's':
                case 'S':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.game.saveGame();
                    }
                    break;
            }
        });
    }
    
    createNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }
    
    // Modal management
    showModal(modalId, data = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal not found: ${modalId}`);
            return;
        }
        
        // Update modal content if data provided
        this.updateModalContent(modal, data);
        
        // Show modal
        modal.classList.add('active');
        this.activeModals.push(modalId);
        
        // Lock UI if needed
        if (this.shouldLockUI(modalId)) {
            this.lockUI();
        }
        
        // Add animation
        modal.style.animation = 'fadeIn 0.3s ease-out';
        
        console.log(`Showing modal: ${modalId}`);
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Add close animation
        modal.style.animation = 'fadeOut 0.3s ease-out';
        
        setTimeout(() => {
            modal.classList.remove('active');
            modal.style.animation = '';
            
            // Remove from active modals
            const index = this.activeModals.indexOf(modalId);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
            
            // Unlock UI if no modals are active
            if (this.activeModals.length === 0) {
                this.unlockUI();
            }
        }, 300);
        
        console.log(`Closing modal: ${modalId}`);
    }
    
    closeTopModal() {
        if (this.activeModals.length > 0) {
            const topModal = this.activeModals[this.activeModals.length - 1];
            this.closeModal(topModal);
        }
    }
    
    updateModalContent(modal, data) {
        // Update modal content based on data
        Object.entries(data).forEach(([key, value]) => {
            const element = modal.querySelector(`[data-content="${key}"]`);
            if (element) {
                if (element.tagName === 'IMG') {
                    element.src = value;
                } else {
                    element.textContent = value;
                }
            }
        });
    }
    
    shouldLockUI(modalId) {
        const lockingModals = ['game-over-modal', 'level-complete-modal', 'story-dialog'];
        return lockingModals.includes(modalId);
    }
    
    lockUI() {
        this.isUILocked = true;
        document.body.classList.add('ui-locked');
    }
    
    unlockUI() {
        this.isUILocked = false;
        document.body.classList.remove('ui-locked');
    }
    
    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type, duration);
        this.notifications.push(notification);
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification.element);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
        
        return notification.id;
    }
    
    createNotification(message, type, duration) {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        element.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
            pointer-events: auto;
            cursor: pointer;
            max-width: 300px;
            word-wrap: break-word;
        `;
        element.textContent = message;
        
        // Click to dismiss
        element.addEventListener('click', () => {
            this.removeNotification(id);
        });
        
        // Animate in
        setTimeout(() => {
            element.style.transform = 'translateX(0)';
        }, 10);
        
        return { id, element, type, message, createdAt: Date.now() };
    }
    
    getNotificationColor(type) {
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c',
            achievement: '#9b59b6'
        };
        return colors[type] || colors.info;
    }
    
    removeNotification(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;
        
        // Animate out
        notification.element.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            // Remove from array
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    // Currency animations
    showCoinAnimation(amount, startElement = null) {
        const animation = this.createCurrencyAnimation('coins', amount, startElement);
        this.coinAnimations.push(animation);
        this.runCurrencyAnimation(animation);
    }
    
    showStarAnimation(amount, startElement = null) {
        const animation = this.createCurrencyAnimation('stars', amount, startElement);
        this.starAnimations.push(animation);
        this.runCurrencyAnimation(animation);
    }
    
    createCurrencyAnimation(currency, amount, startElement) {
        const id = `currency_anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Get start and end positions
        const startPos = startElement ? 
            this.getElementCenter(startElement) : 
            { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        const endElement = document.querySelector(`#${currency}-display`);
        const endPos = endElement ? 
            this.getElementCenter(endElement) : 
            { x: 100, y: 50 };
        
        return {
            id,
            currency,
            amount,
            startPos,
            endPos,
            progress: 0,
            duration: 1000,
            startTime: Date.now()
        };
    }
    
    runCurrencyAnimation(animation) {
        const element = document.createElement('div');
        element.className = 'currency-animation';
        element.style.cssText = `
            position: fixed;
            left: ${animation.startPos.x}px;
            top: ${animation.startPos.y}px;
            font-size: 24px;
            font-weight: bold;
            color: #4ecdc4;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
        `;
        element.textContent = `+${animation.amount} ${animation.currency === 'coins' ? '💰' : '⭐'}`;
        
        document.body.appendChild(element);
        
        // Animate to target
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            // Easing function
            const eased = this.easeOutQuart(progress);
            
            // Calculate position
            const x = animation.startPos.x + (animation.endPos.x - animation.startPos.x) * eased;
            const y = animation.startPos.y + (animation.endPos.y - animation.startPos.y) * eased;
            
            element.style.left = x + 'px';
            element.style.top = y + 'px';
            element.style.opacity = 1 - progress;
            element.style.transform = `translate(-50%, -50%) scale(${1 + progress * 0.5})`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                
                // Pulse the target element
                this.pulseElement(document.querySelector(`#${animation.currency}-display`));
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Tooltip system
    addTooltip(element) {
        const tooltipText = element.dataset.tooltip;
        if (!tooltipText) return;
        
        element.addEventListener('mouseenter', (e) => {
            this.showTooltip(e.target, tooltipText);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }
    
    showTooltip(element, text) {
        this.hideTooltip(); // Hide any existing tooltip
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            white-space: nowrap;
            z-index: 10001;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - 8;
        
        // Adjust if tooltip goes off screen
        if (left < 0) left = 8;
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 8;
        }
        if (top < 0) {
            top = rect.bottom + 8;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        this.currentTooltip = tooltip;
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            if (this.currentTooltip.parentNode) {
                this.currentTooltip.parentNode.removeChild(this.currentTooltip);
            }
            this.currentTooltip = null;
        }
    }
    
    // Utility methods
    getElementCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    pulseElement(element) {
        if (!element) return;
        
        element.style.animation = 'pulse 0.3s ease-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 300);
    }
    
    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }
    
    // Screen management helpers
    updateProgressBar(selector, progress) {
        const progressBar = document.querySelector(selector);
        if (progressBar) {
            progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
    }
    
    updateCounter(selector, value, animated = true) {
        const element = document.querySelector(selector);
        if (!element) return;
        
        if (animated) {
            this.animateCounter(element, parseInt(element.textContent) || 0, value);
        } else {
            element.textContent = value;
        }
    }
    
    animateCounter(element, from, to, duration = 500) {
        const startTime = Date.now();
        const difference = to - from;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(from + difference * this.easeOutQuart(progress));
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Event handlers
    handleResize() {
        // Handle window resize
        this.hideTooltip();
        
        // Adjust canvas size if needed
        if (this.game.puzzleEngine && this.game.puzzleEngine.canvas) {
            // Canvas resize logic would go here
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden (mobile app switching, etc.)
            if (this.game.puzzleEngine && this.game.puzzleEngine.isPlaying) {
                this.game.puzzleEngine.pause();
            }
        }
    }
    
    // Cleanup
    cleanup() {
        this.hideTooltip();
        this.notifications.forEach(notification => {
            this.removeNotification(notification.id);
        });
        this.activeModals.forEach(modalId => {
            this.closeModal(modalId);
        });
    }
}
