/**
 * Notifications System
 * Handles in-game notifications, alerts, and feedback messages
 */
class Notifications {
    constructor(game) {
        this.game = game;
        this.activeNotifications = [];
        this.notificationQueue = [];
        this.maxNotifications = 5;
        
        this.initializeNotifications();
    }
    
    initializeNotifications() {
        this.createNotificationStyles();
    }
    
    createNotificationStyles() {
        // Add notification styles to document
        const style = document.createElement('style');
        style.textContent = `
            @keyframes notificationSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes notificationSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes notificationPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .notification {
                animation: notificationSlideIn 0.3s ease-out;
            }
            
            .notification.removing {
                animation: notificationSlideOut 0.3s ease-out;
            }
            
            .notification.pulse {
                animation: notificationPulse 0.6s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    show(message, type = 'info', duration = 3000, options = {}) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            duration,
            options,
            createdAt: Date.now()
        };
        
        if (this.activeNotifications.length >= this.maxNotifications) {
            this.notificationQueue.push(notification);
        } else {
            this.displayNotification(notification);
        }
        
        return notification.id;
    }
    
    displayNotification(notification) {
        this.activeNotifications.push(notification);
        
        const element = this.createElement(notification);
        const container = this.getContainer();
        container.appendChild(element);
        
        // Auto-remove after duration
        if (notification.duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, notification.duration);
        }
    }
    
    createElement(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.notificationId = notification.id;
        
        const icon = this.getIcon(notification.type);
        const closeBtn = notification.options.closable !== false ? 
            '<button class="notification-close">×</button>' : '';
        
        element.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${notification.message}</span>
                ${closeBtn}
            </div>
        `;
        
        // Add click handlers
        if (notification.options.closable !== false) {
            const closeButton = element.querySelector('.notification-close');
            closeButton.addEventListener('click', () => {
                this.remove(notification.id);
            });
        }
        
        if (notification.options.onClick) {
            element.addEventListener('click', notification.options.onClick);
        }
        
        return element;
    }
    
    getIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            achievement: '🏆',
            coins: '💰',
            stars: '⭐',
            lives: '❤️'
        };
        return icons[type] || icons.info;
    }
    
    getContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }
    
    remove(notificationId) {
        const notification = this.activeNotifications.find(n => n.id === notificationId);
        if (!notification) return;
        
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            element.classList.add('removing');
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
        
        // Remove from active notifications
        const index = this.activeNotifications.findIndex(n => n.id === notificationId);
        if (index > -1) {
            this.activeNotifications.splice(index, 1);
        }
        
        // Show next queued notification
        if (this.notificationQueue.length > 0) {
            const nextNotification = this.notificationQueue.shift();
            setTimeout(() => {
                this.displayNotification(nextNotification);
            }, 100);
        }
    }
    
    clear() {
        this.activeNotifications.forEach(notification => {
            this.remove(notification.id);
        });
        this.notificationQueue = [];
    }
    
    generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Convenience methods
    success(message, duration = 3000, options = {}) {
        return this.show(message, 'success', duration, options);
    }
    
    error(message, duration = 5000, options = {}) {
        return this.show(message, 'error', duration, options);
    }
    
    warning(message, duration = 4000, options = {}) {
        return this.show(message, 'warning', duration, options);
    }
    
    info(message, duration = 3000, options = {}) {
        return this.show(message, 'info', duration, options);
    }
    
    achievement(message, duration = 5000, options = {}) {
        return this.show(message, 'achievement', duration, { ...options, closable: false });
    }
}
