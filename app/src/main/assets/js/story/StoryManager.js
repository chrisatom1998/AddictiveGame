/**
 * Story Manager
 * Handles narrative progression, character interactions, and story content
 */
class StoryManager {
    constructor(game) {
        this.game = game;
        this.currentStoryline = 'main';
        this.storyProgress = 0;
        this.unlockedStories = ['intro'];
        this.characters = new Map();
        this.dialogHistory = [];
        
        // Story triggers
        this.levelTriggers = new Map();
        this.roomTriggers = new Map();
        this.achievementTriggers = new Map();
        
        this.initializeStory();
    }
    
    initializeStory() {
        this.loadCharacters();
        this.loadStoryContent();
        this.setupTriggers();
        this.checkStoryProgress();
    }
    
    loadCharacters() {
        const characters = [
            {
                id: 'emma',
                name: 'Emma',
                role: 'Designer',
                description: 'Your helpful interior design assistant',
                avatar: 'emma_avatar.png',
                personality: 'friendly',
                unlocked: true
            },
            {
                id: 'marcus',
                name: 'Marcus',
                role: 'Contractor',
                description: 'Experienced home renovation expert',
                avatar: 'marcus_avatar.png',
                personality: 'practical',
                unlocked: false
            },
            {
                id: 'sophia',
                name: 'Sophia',
                role: 'Neighbor',
                description: 'Friendly neighbor with great decorating tips',
                avatar: 'sophia_avatar.png',
                personality: 'cheerful',
                unlocked: false
            }
        ];
        
        characters.forEach(character => {
            this.characters.set(character.id, character);
        });
    }
    
    loadStoryContent() {
        // In production, this would load from JSON files
        this.storyContent = {
            intro: {
                id: 'intro',
                title: 'Welcome Home',
                character: 'emma',
                dialogs: [
                    {
                        speaker: 'emma',
                        text: "Welcome to your new home! I'm Emma, and I'll be helping you transform this place into your dream home.",
                        choices: [
                            { text: "I'm excited to get started!", next: 'intro_2' },
                            { text: "This place needs a lot of work...", next: 'intro_alt' }
                        ]
                    }
                ],
                rewards: {
                    coins: 100,
                    furniture: ['plant_herbs']
                },
                unlockRequirement: null
            },
            kitchen_start: {
                id: 'kitchen_start',
                title: 'Kitchen Renovation',
                character: 'emma',
                dialogs: [
                    {
                        speaker: 'emma',
                        text: "Let's start with the kitchen - the heart of every home! Complete some puzzle levels to earn coins for new appliances.",
                        choices: [
                            { text: "Let's do this!", next: null }
                        ]
                    }
                ],
                rewards: {
                    coins: 50
                },
                unlockRequirement: { type: 'level', value: 1 }
            },
            first_furniture: {
                id: 'first_furniture',
                title: 'Your First Purchase',
                character: 'emma',
                dialogs: [
                    {
                        speaker: 'emma',
                        text: "Great job! You've earned enough coins to buy your first piece of furniture. Every item you place makes your home more comfortable.",
                        choices: [
                            { text: "I love decorating!", next: null }
                        ]
                    }
                ],
                rewards: {
                    stars: 1
                },
                unlockRequirement: { type: 'furniture_purchased', value: 1 }
            },
            room_complete: {
                id: 'room_complete',
                title: 'Room Completed',
                character: 'emma',
                dialogs: [
                    {
                        speaker: 'emma',
                        text: "Wonderful! You've completed your first room. The kitchen looks amazing! Ready to unlock the next area?",
                        choices: [
                            { text: "What's next?", next: 'unlock_living_room' }
                        ]
                    }
                ],
                rewards: {
                    stars: 2,
                    coins: 200
                },
                unlockRequirement: { type: 'room_stars', room: 'kitchen', stars: 3 }
            }
        };
    }
    
    setupTriggers() {
        // Level completion triggers
        this.levelTriggers.set(1, 'kitchen_start');
        this.levelTriggers.set(5, 'first_furniture');
        this.levelTriggers.set(10, 'room_complete');
        
        // Room completion triggers
        this.roomTriggers.set('kitchen_3_stars', 'room_complete');
        
        // Achievement triggers
        this.achievementTriggers.set('first_purchase', 'first_furniture');
    }
    
    checkLevelCompletion(levelNumber) {
        const storyId = this.levelTriggers.get(levelNumber);
        if (storyId && this.canUnlockStory(storyId)) {
            this.triggerStory(storyId);
        }
    }
    
    checkRoomCompletion(roomId, stars) {
        const triggerKey = `${roomId}_${stars}_stars`;
        const storyId = this.roomTriggers.get(triggerKey);
        if (storyId && this.canUnlockStory(storyId)) {
            this.triggerStory(storyId);
        }
    }
    
    checkAchievement(achievementId) {
        const storyId = this.achievementTriggers.get(achievementId);
        if (storyId && this.canUnlockStory(storyId)) {
            this.triggerStory(storyId);
        }
    }
    
    canUnlockStory(storyId) {
        if (this.unlockedStories.includes(storyId)) {
            return false; // Already unlocked
        }
        
        const story = this.storyContent[storyId];
        if (!story) return false;
        
        if (!story.unlockRequirement) return true;
        
        const req = story.unlockRequirement;
        switch (req.type) {
            case 'level':
                return this.game.playerData.level >= req.value;
            case 'furniture_purchased':
                return this.game.renovationManager.inventory.getTotalItemCount() >= req.value;
            case 'room_stars':
                const room = this.game.renovationManager.rooms.get(req.room);
                return room && room.calculateStars() >= req.stars;
            default:
                return false;
        }
    }
    
    triggerStory(storyId) {
        const story = this.storyContent[storyId];
        if (!story) {
            console.warn(`Story not found: ${storyId}`);
            return;
        }
        
        console.log(`Triggering story: ${story.title}`);
        
        // Mark as unlocked
        if (!this.unlockedStories.includes(storyId)) {
            this.unlockedStories.push(storyId);
        }
        
        // Show story dialog
        this.showStoryDialog(story);
        
        // Award rewards
        if (story.rewards) {
            this.awardStoryRewards(story.rewards);
        }
        
        // Update progress
        this.storyProgress++;
        
        // Save progress
        this.game.saveGame();
    }
    
    showStoryDialog(story) {
        const character = this.characters.get(story.character);
        if (!character) {
            console.warn(`Character not found: ${story.character}`);
            return;
        }
        
        // Get first dialog
        const dialog = story.dialogs[0];
        if (!dialog) return;
        
        // Show dialog modal
        this.displayDialog(character, dialog, story);
    }
    
    displayDialog(character, dialog, story) {
        const modal = document.getElementById('story-dialog');
        const characterName = document.getElementById('character-name');
        const characterImage = document.getElementById('character-image');
        const dialogMessage = document.getElementById('dialog-message');
        const continueBtn = document.getElementById('dialog-continue');
        
        if (!modal || !characterName || !dialogMessage || !continueBtn) {
            console.warn('Story dialog elements not found');
            return;
        }
        
        // Update dialog content
        characterName.textContent = character.name;
        dialogMessage.textContent = dialog.text;
        
        if (characterImage) {
            characterImage.src = `assets/images/characters/${character.avatar}`;
            characterImage.alt = character.name;
        }
        
        // Handle choices or continue
        if (dialog.choices && dialog.choices.length > 1) {
            this.showDialogChoices(dialog.choices, story);
        } else {
            // Simple continue button
            const newContinueBtn = continueBtn.cloneNode(true);
            continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
            
            newContinueBtn.addEventListener('click', () => {
                this.closeStoryDialog();
            });
        }
        
        // Show modal
        modal.classList.add('active');
        
        // Record dialog in history
        this.recordDialog(character.id, dialog.text, story.id);
    }
    
    showDialogChoices(choices, story) {
        const continueBtn = document.getElementById('dialog-continue');
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'dialog-choices';
        
        choices.forEach(choice => {
            const choiceBtn = document.createElement('button');
            choiceBtn.className = 'btn choice-btn';
            choiceBtn.textContent = choice.text;
            
            choiceBtn.addEventListener('click', () => {
                if (choice.next) {
                    // Continue to next dialog
                    this.handleDialogChoice(choice.next, story);
                } else {
                    // End dialog
                    this.closeStoryDialog();
                }
            });
            
            choicesContainer.appendChild(choiceBtn);
        });
        
        // Replace continue button with choices
        continueBtn.parentNode.replaceChild(choicesContainer, continueBtn);
    }
    
    handleDialogChoice(nextDialogId, story) {
        // In a more complex system, this would handle branching dialogs
        console.log(`Player chose: ${nextDialogId}`);
        this.closeStoryDialog();
    }
    
    closeStoryDialog() {
        const modal = document.getElementById('story-dialog');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    awardStoryRewards(rewards) {
        if (rewards.coins) {
            this.game.currencyManager.addCoins(rewards.coins, 'story_reward');
        }
        
        if (rewards.stars) {
            this.game.currencyManager.addStars(rewards.stars, 'story_reward');
        }
        
        if (rewards.furniture) {
            rewards.furniture.forEach(furnitureId => {
                this.game.renovationManager.inventory.addFurniture(furnitureId);
            });
        }
        
        // Show reward notification
        this.showRewardNotification(rewards);
    }
    
    showRewardNotification(rewards) {
        let message = 'Story rewards: ';
        const parts = [];
        
        if (rewards.coins) parts.push(`${rewards.coins} coins`);
        if (rewards.stars) parts.push(`${rewards.stars} stars`);
        if (rewards.furniture) parts.push(`${rewards.furniture.length} furniture items`);
        
        message += parts.join(', ');
        
        this.game.uiManager.showNotification(message, 'success', 4000);
    }
    
    recordDialog(characterId, text, storyId) {
        const dialogEntry = {
            id: this.generateDialogId(),
            characterId: characterId,
            text: text,
            storyId: storyId,
            timestamp: Date.now()
        };
        
        this.dialogHistory.unshift(dialogEntry);
        
        // Limit history length
        if (this.dialogHistory.length > 50) {
            this.dialogHistory = this.dialogHistory.slice(0, 50);
        }
    }
    
    generateDialogId() {
        return `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Character management
    unlockCharacter(characterId) {
        const character = this.characters.get(characterId);
        if (character) {
            character.unlocked = true;
            console.log(`Character unlocked: ${character.name}`);
        }
    }
    
    isCharacterUnlocked(characterId) {
        const character = this.characters.get(characterId);
        return character ? character.unlocked : false;
    }
    
    getUnlockedCharacters() {
        return Array.from(this.characters.values()).filter(char => char.unlocked);
    }
    
    // Story progress queries
    getStoryProgress() {
        return {
            currentStoryline: this.currentStoryline,
            progress: this.storyProgress,
            unlockedStories: this.unlockedStories.length,
            totalStories: Object.keys(this.storyContent).length
        };
    }
    
    hasSeenStory(storyId) {
        return this.unlockedStories.includes(storyId);
    }
    
    getDialogHistory(characterId = null, limit = 10) {
        let history = this.dialogHistory;
        
        if (characterId) {
            history = history.filter(dialog => dialog.characterId === characterId);
        }
        
        return history.slice(0, limit);
    }
    
    // Save/Load
    getStoryData() {
        return {
            currentStoryline: this.currentStoryline,
            storyProgress: this.storyProgress,
            unlockedStories: this.unlockedStories,
            dialogHistory: this.dialogHistory,
            characters: Array.from(this.characters.entries())
        };
    }
    
    loadStoryData(data) {
        if (!data) return;
        
        this.currentStoryline = data.currentStoryline || 'main';
        this.storyProgress = data.storyProgress || 0;
        this.unlockedStories = data.unlockedStories || ['intro'];
        this.dialogHistory = data.dialogHistory || [];
        
        if (data.characters) {
            data.characters.forEach(([id, character]) => {
                this.characters.set(id, character);
            });
        }
    }
    
    // Manual story triggers (for testing or special events)
    forceStory(storyId) {
        if (this.storyContent[storyId]) {
            this.triggerStory(storyId);
        }
    }
    
    checkStoryProgress() {
        // Check if any stories should be triggered based on current progress
        Object.keys(this.storyContent).forEach(storyId => {
            if (this.canUnlockStory(storyId)) {
                // Don't auto-trigger, just mark as available
                console.log(`Story available: ${storyId}`);
            }
        });
    }
}
