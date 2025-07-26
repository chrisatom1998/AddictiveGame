/**
 * Renovation Manager
 * Handles the home renovation and decoration system
 */
class RenovationManager {
    constructor(game) {
        this.game = game;
        this.currentRoom = 'kitchen';
        this.rooms = new Map();
        this.inventory = null;
        this.selectedFurniture = null;
        this.isPlacingFurniture = false;
        
        // Room progression
        this.roomUnlockRequirements = {
            kitchen: { level: 1, stars: 0 },
            living_room: { level: 10, stars: 15 },
            bedroom: { level: 20, stars: 30 },
            bathroom: { level: 30, stars: 45 },
            garden: { level: 40, stars: 60 }
        };
        
        // Furniture categories
        this.categories = ['essential', 'decorative', 'premium'];
        this.currentCategory = 'essential';
        
        this.initializeRooms();
        this.bindEvents();
    }
    
    initializeRooms() {
        // Initialize room objects
        const roomConfigs = {
            kitchen: {
                name: 'Kitchen',
                background: 'kitchen_bg.jpg',
                size: { width: 800, height: 600 },
                essentialItems: ['stove', 'refrigerator', 'sink', 'counter'],
                decorativeItems: ['plants', 'artwork', 'curtains'],
                premiumItems: ['island', 'wine_rack', 'chandelier']
            },
            living_room: {
                name: 'Living Room',
                background: 'living_room_bg.jpg',
                size: { width: 800, height: 600 },
                essentialItems: ['sofa', 'coffee_table', 'tv', 'bookshelf'],
                decorativeItems: ['rug', 'lamps', 'cushions'],
                premiumItems: ['fireplace', 'piano', 'art_collection']
            },
            bedroom: {
                name: 'Bedroom',
                background: 'bedroom_bg.jpg',
                size: { width: 800, height: 600 },
                essentialItems: ['bed', 'wardrobe', 'nightstand', 'dresser'],
                decorativeItems: ['mirror', 'plants', 'photos'],
                premiumItems: ['canopy_bed', 'vanity', 'reading_nook']
            }
        };
        
        Object.entries(roomConfigs).forEach(([roomId, config]) => {
            this.rooms.set(roomId, new Room(roomId, config));
        });
        
        // Initialize inventory
        this.inventory = new Inventory(this);
    }
    
    bindEvents() {
        // Category tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                if (category) {
                    this.switchCategory(category);
                }
            });
        });
        
        // Room view click for furniture placement
        const roomView = document.getElementById('room-background');
        if (roomView) {
            roomView.addEventListener('click', (e) => this.handleRoomClick(e));
        }
    }
    
    initializeUI() {
        this.updateRoomDisplay();
        this.updateFurnitureGrid();
        this.updateRoomProgress();
    }
    
    showCurrentRoom() {
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;
        
        // Update room name
        const roomNameElement = document.getElementById('room-name');
        if (roomNameElement) {
            roomNameElement.textContent = room.name;
        }
        
        // Update room background
        this.updateRoomDisplay();
        
        // Update furniture grid
        this.updateFurnitureGrid();
        
        // Update progress
        this.updateRoomProgress();
    }
    
    switchRoom(roomId) {
        if (!this.isRoomUnlocked(roomId)) {
            this.showRoomLockedMessage(roomId);
            return;
        }
        
        this.currentRoom = roomId;
        this.showCurrentRoom();
    }
    
    isRoomUnlocked(roomId) {
        const requirements = this.roomUnlockRequirements[roomId];
        if (!requirements) return false;
        
        const playerLevel = this.game.playerData.level;
        const playerStars = this.game.playerData.stars;
        
        return playerLevel >= requirements.level && playerStars >= requirements.stars;
    }
    
    switchCategory(category) {
        if (!this.categories.includes(category)) return;
        
        this.currentCategory = category;
        
        // Update tab appearance
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            }
        });
        
        // Update furniture grid
        this.updateFurnitureGrid();
    }
    
    updateRoomDisplay() {
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;
        
        const roomBackground = document.getElementById('room-background');
        if (!roomBackground) return;
        
        // Clear existing furniture
        roomBackground.innerHTML = '';
        
        // Set background
        roomBackground.style.backgroundImage = `url('assets/images/rooms/${room.background}')`;
        
        // Render placed furniture
        room.placedFurniture.forEach(furniture => {
            this.renderFurnitureInRoom(furniture, roomBackground);
        });
    }
    
    renderFurnitureInRoom(furniture, container) {
        const furnitureElement = document.createElement('div');
        furnitureElement.className = 'furniture-item';
        furnitureElement.dataset.furnitureId = furniture.id;
        furnitureElement.style.cssText = `
            left: ${furniture.position.x}px;
            top: ${furniture.position.y}px;
            width: ${furniture.size.width}px;
            height: ${furniture.size.height}px;
            background-image: url('assets/images/furniture/${furniture.image}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        `;
        
        // Add click handler for furniture management
        furnitureElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectFurniture(furniture);
        });
        
        container.appendChild(furnitureElement);
    }
    
    updateFurnitureGrid() {
        const furnitureGrid = document.getElementById('furniture-grid');
        if (!furnitureGrid) return;
        
        furnitureGrid.innerHTML = '';
        
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;
        
        const availableFurniture = this.getFurnitureForCategory(this.currentCategory);
        
        availableFurniture.forEach(furniture => {
            const furnitureCard = this.createFurnitureCard(furniture);
            furnitureGrid.appendChild(furnitureCard);
        });
    }
    
    getFurnitureForCategory(category) {
        const room = this.rooms.get(this.currentRoom);
        if (!room) return [];
        
        // This would typically load from a data file
        const furnitureData = this.getFurnitureData(this.currentRoom, category);
        return furnitureData;
    }
    
    getFurnitureData(roomId, category) {
        // Mock furniture data - in production, this would load from JSON files
        const mockData = {
            kitchen: {
                essential: [
                    { id: 'stove_1', name: 'Basic Stove', price: 500, currency: 'coins', image: 'stove_basic.png' },
                    { id: 'fridge_1', name: 'Refrigerator', price: 800, currency: 'coins', image: 'fridge_basic.png' },
                    { id: 'sink_1', name: 'Kitchen Sink', price: 300, currency: 'coins', image: 'sink_basic.png' }
                ],
                decorative: [
                    { id: 'plant_1', name: 'Herb Garden', price: 150, currency: 'coins', image: 'herbs.png' },
                    { id: 'art_1', name: 'Kitchen Art', price: 200, currency: 'coins', image: 'kitchen_art.png' }
                ],
                premium: [
                    { id: 'island_1', name: 'Kitchen Island', price: 5, currency: 'stars', image: 'island_premium.png' },
                    { id: 'chandelier_1', name: 'Crystal Chandelier', price: 10, currency: 'stars', image: 'chandelier.png' }
                ]
            }
        };
        
        return mockData[roomId]?.[category] || [];
    }
    
    createFurnitureCard(furniture) {
        const card = document.createElement('div');
        card.className = 'furniture-card';
        
        const isOwned = this.inventory.hasFurniture(furniture.id);
        const canAfford = this.canAffordFurniture(furniture);
        
        if (isOwned) {
            card.classList.add('owned');
        } else if (furniture.currency === 'stars') {
            card.classList.add('premium');
        }
        
        card.innerHTML = `
            <div class="furniture-image">
                ${this.getFurnitureIcon(furniture.id)}
            </div>
            <div class="furniture-name">${furniture.name}</div>
            <div class="furniture-price">
                <span class="currency">${furniture.currency === 'coins' ? '💰' : '⭐'}</span>
                ${furniture.price}
            </div>
        `;
        
        if (!isOwned) {
            const purchaseBtn = document.createElement('button');
            purchaseBtn.className = `purchase-btn ${furniture.currency === 'stars' ? 'premium' : ''}`;
            purchaseBtn.textContent = canAfford ? 'Buy' : 'Not enough';
            purchaseBtn.disabled = !canAfford;
            
            purchaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.purchaseFurniture(furniture);
            });
            
            card.appendChild(purchaseBtn);
        } else {
            card.addEventListener('click', () => {
                this.selectFurnitureForPlacement(furniture);
            });
        }
        
        return card;
    }
    
    getFurnitureIcon(furnitureId) {
        const icons = {
            stove_1: '🔥',
            fridge_1: '❄️',
            sink_1: '🚿',
            plant_1: '🌿',
            art_1: '🖼️',
            island_1: '🏝️',
            chandelier_1: '💎'
        };
        return icons[furnitureId] || '🪑';
    }
    
    canAffordFurniture(furniture) {
        if (furniture.currency === 'coins') {
            return this.game.playerData.coins >= furniture.price;
        } else if (furniture.currency === 'stars') {
            return this.game.playerData.stars >= furniture.price;
        }
        return false;
    }
    
    purchaseFurniture(furniture) {
        if (!this.canAffordFurniture(furniture)) {
            this.showError('Not enough currency!');
            return;
        }
        
        let success = false;
        if (furniture.currency === 'coins') {
            success = this.game.spendCoins(furniture.price);
        } else if (furniture.currency === 'stars') {
            success = this.game.spendStars(furniture.price);
        }
        
        if (success) {
            this.inventory.addFurniture(furniture.id);
            this.updateFurnitureGrid();
            this.showPurchaseSuccess(furniture.name);
        }
    }
    
    selectFurnitureForPlacement(furniture) {
        this.selectedFurniture = furniture;
        this.isPlacingFurniture = true;
        this.showPlacementInstructions();
    }
    
    handleRoomClick(event) {
        if (!this.isPlacingFurniture || !this.selectedFurniture) return;
        
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.placeFurniture(this.selectedFurniture, { x, y });
    }
    
    placeFurniture(furniture, position) {
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;
        
        const furnitureInstance = new Furniture(furniture.id, furniture, position);
        room.addFurniture(furnitureInstance);
        
        this.updateRoomDisplay();
        this.updateRoomProgress();
        
        this.isPlacingFurniture = false;
        this.selectedFurniture = null;
        this.hidePlacementInstructions();
        
        // Save progress
        this.game.saveGame();
    }
    
    selectFurniture(furniture) {
        // Handle furniture selection for moving/removing
        console.log('Selected furniture:', furniture);
        // TODO: Implement furniture management UI
    }
    
    updateRoomProgress() {
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;
        
        const stars = room.calculateStars();
        const starsContainer = document.querySelector('.stars');
        
        if (starsContainer) {
            const starElements = starsContainer.querySelectorAll('.star');
            starElements.forEach((star, index) => {
                if (index < stars) {
                    star.classList.remove('empty');
                } else {
                    star.classList.add('empty');
                }
            });
        }
    }
    
    showPlacementInstructions() {
        // TODO: Show placement instructions UI
        console.log('Click in the room to place furniture');
    }
    
    hidePlacementInstructions() {
        // TODO: Hide placement instructions UI
    }
    
    showPurchaseSuccess(itemName) {
        // TODO: Show purchase success notification
        console.log(`Purchased: ${itemName}`);
    }
    
    showError(message) {
        // TODO: Show error notification
        console.error(message);
    }
    
    showRoomLockedMessage(roomId) {
        const requirements = this.roomUnlockRequirements[roomId];
        const message = `Room locked! Requires level ${requirements.level} and ${requirements.stars} stars.`;
        this.showError(message);
    }
    
    // Save/Load methods
    getRoomData() {
        const roomData = {};
        this.rooms.forEach((room, roomId) => {
            roomData[roomId] = room.toJSON();
        });
        return {
            currentRoom: this.currentRoom,
            rooms: roomData,
            inventory: this.inventory.toJSON()
        };
    }
    
    loadRoomData(data) {
        if (!data) return;
        
        this.currentRoom = data.currentRoom || 'kitchen';
        
        if (data.rooms) {
            Object.entries(data.rooms).forEach(([roomId, roomData]) => {
                const room = this.rooms.get(roomId);
                if (room) {
                    room.fromJSON(roomData);
                }
            });
        }
        
        if (data.inventory) {
            this.inventory.fromJSON(data.inventory);
        }
    }
    
    update() {
        // Update renovation system
        this.rooms.forEach(room => {
            room.update();
        });
    }
}
