/**
 * Dialog System
 * Handles dialog display, choices, and conversation flow
 */
class DialogSystem {
    constructor(storyManager) {
        this.storyManager = storyManager;
        this.currentDialog = null;
        this.dialogQueue = [];
        this.isDialogActive = false;
        
        // Dialog display settings
        this.typewriterSpeed = 50; // ms per character
        this.autoAdvanceDelay = 3000; // ms
        this.enableTypewriter = true;
        this.enableAutoAdvance = false;
        
        this.initializeDialogSystem();
    }
    
    initializeDialogSystem() {
        this.setupDialogEvents();
    }
    
    setupDialogEvents() {
        // Handle dialog continue clicks
        document.addEventListener('click', (e) => {
            if (e.target.id === 'dialog-continue' && this.isDialogActive) {
                this.advanceDialog();
            }
        });
        
        // Handle keyboard input for dialog
        document.addEventListener('keydown', (e) => {
            if (this.isDialogActive) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.advanceDialog();
                } else if (e.key === 'Escape') {
                    this.closeDialog();
                }
            }
        });
    }
    
    showDialog(character, text, choices = null, callback = null) {
        this.currentDialog = {
            character,
            text,
            choices,
            callback,
            displayedText: '',
            typewriterIndex: 0
        };
        
        this.isDialogActive = true;
        this.displayCurrentDialog();
    }
    
    displayCurrentDialog() {
        const modal = document.getElementById('story-dialog');
        const characterName = document.getElementById('character-name');
        const characterImage = document.getElementById('character-image');
        const dialogMessage = document.getElementById('dialog-message');
        
        if (!modal || !characterName || !dialogMessage) return;
        
        // Set character info
        characterName.textContent = this.currentDialog.character.name;
        if (characterImage) {
            characterImage.src = `assets/images/characters/${this.currentDialog.character.avatar}`;
        }
        
        // Show modal
        modal.classList.add('active');
        
        // Start typewriter effect or show full text
        if (this.enableTypewriter) {
            this.startTypewriter(dialogMessage);
        } else {
            dialogMessage.textContent = this.currentDialog.text;
            this.showDialogControls();
        }
    }
    
    startTypewriter(element) {
        element.textContent = '';
        this.currentDialog.displayedText = '';
        this.currentDialog.typewriterIndex = 0;
        
        const typeNextCharacter = () => {
            if (this.currentDialog.typewriterIndex < this.currentDialog.text.length) {
                this.currentDialog.displayedText += this.currentDialog.text[this.currentDialog.typewriterIndex];
                element.textContent = this.currentDialog.displayedText;
                this.currentDialog.typewriterIndex++;
                
                setTimeout(typeNextCharacter, this.typewriterSpeed);
            } else {
                // Typewriter complete
                this.showDialogControls();
            }
        };
        
        typeNextCharacter();
    }
    
    showDialogControls() {
        if (this.currentDialog.choices && this.currentDialog.choices.length > 1) {
            this.showChoices();
        } else {
            this.showContinueButton();
        }
        
        // Auto-advance if enabled
        if (this.enableAutoAdvance && (!this.currentDialog.choices || this.currentDialog.choices.length <= 1)) {
            setTimeout(() => {
                if (this.isDialogActive) {
                    this.advanceDialog();
                }
            }, this.autoAdvanceDelay);
        }
    }
    
    showChoices() {
        const continueBtn = document.getElementById('dialog-continue');
        if (!continueBtn) return;
        
        // Create choices container
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'dialog-choices';
        choicesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
        `;
        
        this.currentDialog.choices.forEach((choice, index) => {
            const choiceBtn = document.createElement('button');
            choiceBtn.className = 'btn choice-btn';
            choiceBtn.textContent = choice.text;
            choiceBtn.style.cssText = `
                padding: 10px 15px;
                border: 2px solid #667eea;
                background: white;
                color: #667eea;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            choiceBtn.addEventListener('mouseenter', () => {
                choiceBtn.style.background = '#667eea';
                choiceBtn.style.color = 'white';
            });
            
            choiceBtn.addEventListener('mouseleave', () => {
                choiceBtn.style.background = 'white';
                choiceBtn.style.color = '#667eea';
            });
            
            choiceBtn.addEventListener('click', () => {
                this.handleChoice(choice, index);
            });
            
            choicesContainer.appendChild(choiceBtn);
        });
        
        // Replace continue button with choices
        continueBtn.parentNode.replaceChild(choicesContainer, continueBtn);
    }
    
    showContinueButton() {
        const continueBtn = document.getElementById('dialog-continue');
        if (continueBtn) {
            continueBtn.style.display = 'block';
            continueBtn.textContent = 'Continue';
        }
    }
    
    handleChoice(choice, index) {
        console.log(`Player chose: ${choice.text}`);
        
        // Record choice in story manager
        this.storyManager.recordDialog(
            this.currentDialog.character.id,
            `Choice: ${choice.text}`,
            'player_choice'
        );
        
        // Handle choice callback
        if (choice.callback) {
            choice.callback(choice, index);
        }
        
        // Continue to next dialog or close
        if (choice.next) {
            // Load next dialog
            this.loadNextDialog(choice.next);
        } else {
            this.closeDialog();
        }
    }
    
    loadNextDialog(nextDialogId) {
        // In a more complex system, this would load the next dialog from data
        console.log(`Loading next dialog: ${nextDialogId}`);
        this.closeDialog();
    }
    
    advanceDialog() {
        if (this.enableTypewriter && this.currentDialog.typewriterIndex < this.currentDialog.text.length) {
            // Skip typewriter effect
            const dialogMessage = document.getElementById('dialog-message');
            if (dialogMessage) {
                dialogMessage.textContent = this.currentDialog.text;
                this.currentDialog.typewriterIndex = this.currentDialog.text.length;
                this.showDialogControls();
            }
        } else {
            // Close dialog or handle callback
            if (this.currentDialog.callback) {
                this.currentDialog.callback();
            }
            this.closeDialog();
        }
    }
    
    closeDialog() {
        const modal = document.getElementById('story-dialog');
        if (modal) {
            modal.classList.remove('active');
        }
        
        this.isDialogActive = false;
        this.currentDialog = null;
        
        // Process next dialog in queue
        if (this.dialogQueue.length > 0) {
            const nextDialog = this.dialogQueue.shift();
            setTimeout(() => {
                this.showDialog(nextDialog.character, nextDialog.text, nextDialog.choices, nextDialog.callback);
            }, 500);
        }
    }
    
    queueDialog(character, text, choices = null, callback = null) {
        this.dialogQueue.push({ character, text, choices, callback });
        
        if (!this.isDialogActive) {
            const nextDialog = this.dialogQueue.shift();
            this.showDialog(nextDialog.character, nextDialog.text, nextDialog.choices, nextDialog.callback);
        }
    }
    
    // Settings
    setTypewriterSpeed(speed) {
        this.typewriterSpeed = Math.max(10, Math.min(200, speed));
    }
    
    setAutoAdvanceDelay(delay) {
        this.autoAdvanceDelay = Math.max(1000, Math.min(10000, delay));
    }
    
    enableTypewriterEffect(enabled) {
        this.enableTypewriter = enabled;
    }
    
    enableAutoAdvanceDialog(enabled) {
        this.enableAutoAdvance = enabled;
    }
    
    // Utility methods
    isActive() {
        return this.isDialogActive;
    }
    
    hasQueuedDialogs() {
        return this.dialogQueue.length > 0;
    }
    
    clearQueue() {
        this.dialogQueue = [];
    }
    
    getCurrentDialog() {
        return this.currentDialog;
    }
}
