// Initialisation des gestionnaires d'événements
document.addEventListener('DOMContentLoaded', () => {
    setupThemeHandlers();
    setupMessageHandlers();
    setupPhotoHandlers();
    setupFlirtyHandlers();
    setupSpicyChallenges();
    setupWishListHandlers();
    setupDateNightHandlers();
    setupRolePlayHandlers();
    setupTruthDareHandlers();
    setupResetHandlers();
    loadSavedData();
    setupHardcoreHandlers();
    setupHardcoreMode();

    // Initialiser la connexion P2P
    initializeConnection();
    
    // Gérer le bouton de connexion
    const connectBtn = document.getElementById('connectBtn');
    const peerIdInput = document.getElementById('peerIdInput');
    
    if (connectBtn && peerIdInput) {
        connectBtn.addEventListener('click', () => {
            const peerId = peerIdInput.value.trim();
            if (peerId) {
                connectToPeer(peerId);
            } else {
                alert('Veuillez entrer un ID valide');
            }
        });
    }

    // Wish List
    const wishInput = document.querySelector('#wishInput');
    const addWishBtn = document.querySelector('#addWishBtn');
    if (wishInput && addWishBtn) {
        addWishBtn.onclick = () => {
            const text = wishInput.value.trim();
            if (text) {
                wishes.addWish(text);
                wishInput.value = '';
            }
        };
        wishes.loadWishes();
    }

    // Date Night
    const dateBtn = document.querySelector('#generateDateBtn');
    if (dateBtn) {
        dateBtn.onclick = generateDateIdea;
    }

    // Truth or Dare
    const truthBtn = document.querySelector('#truthBtn');
    const dareBtn = document.querySelector('#dareBtn');
    if (truthBtn && dareBtn) {
        truthBtn.onclick = getTruth;
        dareBtn.onclick = getDare;
    }

    // Role Play
    const scenarioBtn = document.querySelector('#generateScenarioBtn');
    if (scenarioBtn) {
        scenarioBtn.onclick = generateScenario;
    }

    // Ephemeral Photos
    const photoInput = document.querySelector('#ephemeralPhotoInput');
    const photoPassword = document.querySelector('#photoPassword');
    const photoTimer = document.querySelector('#photoTimer');
    const sendPhotoBtn = document.querySelector('#sendPhotoBtn');
    if (photoInput && photoPassword && photoTimer && sendPhotoBtn) {
        sendPhotoBtn.onclick = () => {
            const file = photoInput.files[0];
            const password = photoPassword.value.trim();
            const duration = parseInt(photoTimer.value) || 0;
            if (file && password) {
                ephemeralPhotos.addPhoto(file, password, duration);
                photoInput.value = '';
                photoPassword.value = '';
                photoTimer.value = '0';
            }
        };
        ephemeralPhotos.loadPhotos();
    }

    // Offline Mode
    setupOfflineMode();

    // Sauvegarder toutes les 30 secondes
    setInterval(saveAllData, 30000);
    
    // Sauvegarder avant de quitter la page
    window.addEventListener('beforeunload', saveAllData);
    
    // Charger les données au démarrage
    loadAllData();
});

// Gestion des thèmes
function setupThemeHandlers() {
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Mettre à jour la classe active
            themeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
    
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        const activeButton = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
}

// Gestion des messages d'amour
function setupMessageHandlers() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    const notesContainer = document.querySelector('.notes-container');

    if (sendButton && messageInput) {
        sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message) {
                const messageId = Date.now().toString();
                addMessage(message, messageId);
                messageInput.value = '';
                
                // Sauvegarder les messages
                saveMessages();
                
                // Envoyer le message via P2P
                if (window.p2p && window.p2p.sendData) {
                    window.p2p.sendData({
                        type: 'loveMessage',
                        content: {
                            id: messageId,
                            text: message,
                            action: 'add'
                        }
                    });
                }
            }
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
    }
}

function addMessage(text, messageId) {
    const container = document.querySelector('.notes-container');
    if (!container) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.dataset.id = messageId;
    
    const messageText = document.createElement('p');
    messageText.textContent = text;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '🗑️';
    deleteButton.onclick = () => deleteMessage(messageElement);
    
    messageElement.appendChild(messageText);
    messageElement.appendChild(deleteButton);
    container.appendChild(messageElement);
}

function deleteMessage(element) {
    if (element && element.parentNode) {
        const messageId = element.dataset.id;
        
        // Envoyer la suppression via P2P
        if (window.p2p && window.p2p.sendData) {
            window.p2p.sendData({
                type: 'loveMessage',
                content: {
                    id: messageId,
                    action: 'delete'
                }
            });
        }
        
        // Ajouter l'animation de suppression
        element.style.animation = 'fadeOut 0.3s ease forwards';
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
                saveMessages();
            }
        }, 300);
    }
}

function saveMessages() {
    const messages = [];
    document.querySelectorAll('.message').forEach(messageElement => {
        const id = messageElement.dataset.id;
        const text = messageElement.querySelector('p').textContent;
        messages.push({ id, text });
    });
    localStorage.setItem('loveMessages', JSON.stringify(messages));
}

function loadMessages() {
    const messages = JSON.parse(localStorage.getItem('loveMessages') || '[]');
    messages.forEach(message => addMessage(message.text, message.id));
}

// Gestion des photos
function setupPhotoHandlers() {
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.querySelector('#ephemeralPhotoInput');
    const passwordInput = document.querySelector('#photoPassword');
    const timerInput = document.querySelector('#photoTimer');
    const uploadBtn = document.querySelector('#sendPhotoBtn');

    if (!uploadArea || !fileInput || !passwordInput || !timerInput || !uploadBtn) {
        console.error('Éléments manquants pour la gestion des photos');
        return;
    }

    // Gestion du glisser-déposer
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handlePhotoUpload(files[0]);
        }
    });

    // Gestion du clic pour sélectionner un fichier
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePhotoUpload(e.target.files[0]);
        }
    });

    // Gestion de l'envoi
    uploadBtn.addEventListener('click', () => {
        const password = passwordInput.value;
        const timer = parseInt(timerInput.value) || 0;
        
        if (!currentPhoto) {
            alert('Veuillez d\'abord sélectionner une photo');
            return;
        }

        if (!password) {
            alert('Veuillez entrer un mot de passe');
            return;
        }

        // Créer l'objet photo
        const photo = {
            id: Date.now().toString(),
            data: currentPhoto,
            password: password,
            timer: timer,
            timestamp: Date.now()
        };

        // Ajouter la photo à la galerie
        addPhotoToGallery(photo);

        // Sauvegarder la photo
        savePhotos();

        // Envoyer la photo via P2P
        if (window.p2p && window.p2p.sendData) {
            window.p2p.sendData({
                type: 'ephemeralPhoto',
                content: {
                    id: photo.id,
                    data: photo.data,
                    password: photo.password,
                    timer: photo.timer,
                    timestamp: photo.timestamp,
                    action: 'add'
                }
            });
        }

        // Réinitialiser
        currentPhoto = null;
        fileInput.value = '';
        passwordInput.value = '';
        timerInput.value = '0';
        uploadArea.classList.remove('has-photo');
    });
}

function handlePhotoUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentPhoto = e.target.result;
        updateUploadPreview(currentPhoto);
    };
    reader.readAsDataURL(file);
}

function updateUploadPreview(photoData) {
    const uploadPrompt = document.querySelector('.upload-prompt');
    uploadPrompt.innerHTML = `
        <img src="${photoData}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
        <p>Photo sélectionnée ! Cliquez sur "Envoyer" pour continuer</p>
    `;
}

function resetPhotoUpload() {
    currentPhoto = null;
    const uploadPrompt = document.querySelector('.upload-prompt');
    uploadPrompt.innerHTML = `
        <div class="upload-icon">📸</div>
        <p>Glissez une photo ici ou cliquez pour sélectionner</p>
    `;
    document.querySelector('#ephemeralPhotoInput').value = '';
    document.querySelector('#photoPassword').value = '';
    document.querySelector('#photoTimer').value = '60';
}

function addPhotoToGallery(photo) {
    const gallery = document.querySelector('.ephemeral-gallery');
    const photoDiv = document.createElement('div');
    photoDiv.className = 'ephemeral-photo';
    
    const img = document.createElement('img');
    img.src = photo.data;
    
    const overlay = document.createElement('div');
    overlay.className = 'password-overlay';
    overlay.innerHTML = `
        <p>Mot de passe requis</p>
        <input type="password" placeholder="Entrez le mot de passe">
        <button class="unlock-btn">Déverrouiller</button>
    `;
    
    const timerSpan = document.createElement('span');
    timerSpan.className = 'timer';
    timerSpan.textContent = `${photo.timer}s`;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => deletePhoto(photoDiv);
    
    photoDiv.appendChild(img);
    photoDiv.appendChild(overlay);
    photoDiv.appendChild(timerSpan);
    photoDiv.appendChild(deleteBtn);
    
    gallery.appendChild(photoDiv);
    
    // Gestion du déverrouillage
    const unlockBtn = overlay.querySelector('.unlock-btn');
    const passwordInput = overlay.querySelector('input[type="password"]');
    
    unlockBtn.onclick = () => {
        if (passwordInput.value === photo.password) {
            overlay.style.display = 'none';
            startPhotoTimer(photoDiv, photo.timer);
        } else {
            alert('Mot de passe incorrect');
        }
    };
    
    savePhotos();
}

function startPhotoTimer(photoDiv, duration) {
    const timerSpan = photoDiv.querySelector('.timer');
    let timeLeft = duration;
    
    const timer = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = `${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            photoDiv.remove();
            savePhotos();
        }
    }, 1000);
}

function deletePhoto(element) {
    element.classList.add('deleting');
    setTimeout(() => {
        element.remove();
        savePhotos();
    }, 300);
}

function savePhotos() {
    const photos = [];
    document.querySelectorAll('.photo-item img').forEach(img => {
        photos.push(img.src);
    });
    localStorage.setItem('photos', JSON.stringify(photos));
}

function loadPhotos() {
    const photos = JSON.parse(localStorage.getItem('photos') || '[]');
    photos.forEach(photo => addPhotoToGallery(photo));
}

// Gestion des messages coquins
function setupFlirtyHandlers() {
    const flirtyInput = document.getElementById('flirtyInput');
    const sendFlirtyBtn = document.getElementById('sendFlirty');
    const randomFlirtyBtn = document.getElementById('randomFlirty');
    const flirtyContainer = document.querySelector('.flirty-container');

    if (sendFlirtyBtn && flirtyInput) {
        sendFlirtyBtn.addEventListener('click', () => {
            const message = flirtyInput.value.trim();
            if (message) {
                const messageId = Date.now().toString();
                addFlirtyMessage(message, messageId);
                flirtyInput.value = '';
                
                // Sauvegarder les messages
                saveFlirtyMessages();
                
                // Envoyer le message via P2P
                if (window.p2p && window.p2p.sendData) {
                    window.p2p.sendData({
                        type: 'flirtyMessage',
                        content: {
                            id: messageId,
                            text: message,
                            action: 'add'
                        }
                    });
                }
            }
        });

        flirtyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendFlirtyBtn.click();
            }
        });
    }

    // Ajouter le bouton pour les messages aléatoires
    if (randomFlirtyBtn) {
        randomFlirtyBtn.addEventListener('click', () => {
            const randomMessage = flirtyMessages[Math.floor(Math.random() * flirtyMessages.length)];
            const messageId = Date.now().toString();
            addFlirtyMessage(randomMessage, messageId);
            
            // Sauvegarder les messages
            saveFlirtyMessages();
            
            // Envoyer le message via P2P
            if (window.p2p && window.p2p.sendData) {
                window.p2p.sendData({
                    type: 'flirtyMessage',
                    content: {
                        id: messageId,
                        text: randomMessage,
                        action: 'add'
                    }
                });
            }
        });
    }
}

function addFlirtyMessage(text, messageId) {
    const flirtyContainer = document.querySelector('.flirty-container');
    if (!flirtyContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'flirty-message';
    messageElement.dataset.id = messageId;
    messageElement.innerHTML = `
        <p>${text}</p>
        <button class="delete-btn" onclick="deleteFlirtyMessage(this.parentElement)">🗑️</button>
    `;
    flirtyContainer.appendChild(messageElement);
}

function deleteFlirtyMessage(element) {
    if (element && element.parentNode) {
        const messageId = element.dataset.id;
        
        // Envoyer la suppression via P2P
        if (window.p2p && window.p2p.sendData) {
            window.p2p.sendData({
                type: 'flirtyMessage',
                content: {
                    id: messageId,
                    action: 'delete'
                }
            });
        }
        
        element.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            element.parentNode.removeChild(element);
            saveFlirtyMessages();
        }, 300);
    }
}

function saveFlirtyMessages() {
    const flirtyContainer = document.querySelector('.flirty-container');
    if (!flirtyContainer) return;
    
    const messages = [];
    flirtyContainer.querySelectorAll('.flirty-message').forEach(messageElement => {
        const id = messageElement.dataset.id;
        const text = messageElement.querySelector('p').textContent;
        messages.push({ id, text });
    });
    
    localStorage.setItem('flirtyMessages', JSON.stringify(messages));
}

function loadFlirtyMessages() {
    const flirtyContainer = document.querySelector('.flirty-container');
    if (!flirtyContainer) return;
    
    const savedMessages = localStorage.getItem('flirtyMessages');
    if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        flirtyContainer.innerHTML = ''; // Vider le conteneur
        
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'flirty-message';
            messageElement.dataset.id = message.id;
            messageElement.innerHTML = `
                <p>${message.text}</p>
                <button class="delete-btn" onclick="deleteFlirtyMessage(this.parentElement)">🗑️</button>
            `;
            flirtyContainer.appendChild(messageElement);
        });
    }
}

// Exposer la fonction deleteFlirtyMessage globalement
window.deleteFlirtyMessage = deleteFlirtyMessage;

// Mise à jour de la fonction handleIncomingData pour gérer les messages d'amour
function handleIncomingData(data) {
    console.log('Données reçues:', data);
    
    if (data.type === 'flirtyMessage') {
        const { id, text, action } = data.content;
        
        if (action === 'add') {
            // Ajouter un nouveau message coquin
            addFlirtyMessage(text, id);
            saveFlirtyMessages();
        } else if (action === 'delete') {
            // Supprimer un message coquin existant
            const messageElement = document.querySelector(`.flirty-message[data-id="${id}"]`);
            if (messageElement) {
                messageElement.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    messageElement.parentNode.removeChild(messageElement);
                    saveFlirtyMessages();
                }, 300);
            }
        }
    } else if (data.type === 'loveMessage') {
        const { id, text, action } = data.content;
        
        if (action === 'add') {
            // Ajouter un nouveau message d'amour
            addMessage(text, id);
            saveMessages();
        } else if (action === 'delete') {
            // Supprimer un message d'amour existant
            const messageElement = document.querySelector(`.message[data-id="${id}"]`);
            if (messageElement) {
                messageElement.classList.add('deleting');
                setTimeout(() => {
                    messageElement.remove();
                    saveMessages();
                }, 300);
            }
        }
    } else if (data.type === 'challenge') {
        displayChallenge(data.content);
    } else if (data.type === 'wish') {
        switch (data.action) {
            case 'add':
                wishes.list.push(data.data);
                wishes.saveWishes();
                wishes.displayWishes();
                break;
            case 'delete':
                wishes.deleteWish(data.data.id);
                break;
            case 'toggle':
                wishes.toggleWish(data.data.id);
                break;
        }
    } else if (data.type === 'date') {
        if (data.action === 'new') {
            document.querySelector('.date-text').textContent = data.data.idea;
        }
    } else if (data.type === 'game') {
        if (data.action === 'truth') {
            document.querySelector('.game-content').textContent = data.data.question;
        } else if (data.action === 'dare') {
            document.querySelector('.game-content').textContent = data.data.action;
        }
    } else if (data.type === 'scenario') {
        if (data.action === 'new') {
            const text = `
                Setting: ${data.data.setting}
                Rôles: ${data.data.roles.join(' & ')}
                Plot: ${data.data.plot}
            `;
            document.querySelector('.scenario-text').textContent = text;
        }
    } else if (data.type === 'photo') {
        switch (data.action) {
            case 'add':
                ephemeralPhotos.list.push(data.data);
                ephemeralPhotos.savePhotos();
                ephemeralPhotos.displayPhotos();
                break;
            case 'delete':
                ephemeralPhotos.deletePhoto(data.data.id);
                break;
        }
    } else if (data.type === 'reset' && data.content.action === 'resetAll') {
        resetAllData();
        return;
    } else if (data.type === 'photo' && data.content.action === 'clearAll') {
        clearPhotos();
        return;
    } else if (data.type === 'loveMessage' && data.content.action === 'clearAll') {
        clearMessages();
        return;
    } else if (data.type === 'flirtyMessage' && data.content.action === 'clearAll') {
        clearFlirtyMessages();
        return;
    } else if (data.type === 'challenge' && data.content.action === 'clear') {
        clearChallenges();
        return;
    } else if (data.type === 'wish' && data.content.action === 'clearAll') {
        clearWishes();
        return;
    } else if (data.type === 'date' && data.content.action === 'clear') {
        clearDates();
        return;
    } else if (data.type === 'game' && data.content.action === 'clear') {
        clearTruthDare();
        return;
    } else if (data.type === 'scenario' && data.content.action === 'clear') {
        clearScenarios();
        return;
    } else if (data.type === 'ephemeralPhoto' && data.content.action === 'clearAll') {
        clearEphemeralPhotos();
        return;
    } else if (data.type === 'hardcore-challenge') {
        const display = document.querySelector('.challenge-display');
        display.innerHTML = `
            <div class="challenge-text">${data.challenge}</div>
            <div class="challenge-level">${data.level === 'soft' ? '🔥' : data.level === 'medium' ? '🔥🔥' : '🔥🔥🔥'}</div>
        `;
    } else if (data.type === 'hardcore-message') {
        const display = document.querySelector('.message-display');
        display.textContent = data.message;
    } else if (data.type === 'hardcore-command') {
        const display = document.querySelector('.command-display');
        display.textContent = data.command;
    } else if (data.type === 'sync-data') {
        // Sauvegarder les données reçues
        localStorage.setItem('coupleAppData', JSON.stringify(data.data));
        // Recharger les données
        loadAllData();
    }
}

// Exposer la fonction handleIncomingData globalement
window.handleIncomingData = handleIncomingData;

// Liste des défis coquins
const spicyChallenges = {
    soft: [
        "Faire un massage des pieds pendant 10 minutes",
        "Faire un compliment sincère sur l'apparence",
        "Regarder un film romantique ensemble",
        "Faire un câlin pendant 5 minutes",
        "Faire un massage des épaules",
        "Faire un compliment sur la personnalité",
        "Faire un massage des mains",
        "Faire un compliment sur le sourire",
        "Faire un massage du cuir chevelu",
        "Faire un compliment sur les yeux"
    ],
    medium: [
        "Faire un massage complet du corps",
        "Faire un strip-tease pour l'autre",
        "Faire un jeu de rôle érotique",
        "Faire un massage avec de l'huile",
        "Faire un jeu de séduction",
        "Faire un massage avec des glaçons",
        "Faire un jeu de devinettes coquines",
        "Faire un massage avec des plumes",
        "Faire un jeu de vérité ou action",
        "Faire un massage avec du chocolat"
    ],
    hot: [
        "Faire un massage intime avec de l'huile chaude",
        "Faire un jeu de domination/soumission intense",
        "Faire un jeu de fétichisme avec des accessoires",
        "Faire un massage érotique complet",
        "Faire un jeu de bondage avec des liens",
        "Faire un massage avec des accessoires coquins",
        "Faire un jeu de rôle très osé",
        "Faire un massage avec des bougies chaudes",
        "Faire un jeu de voyeurisme et d'exhibitionnisme",
        "Faire un massage avec des accessoires de plaisir",
        "Faire un jeu de séduction très intense",
        "Faire un massage avec des glaçons et du chocolat chaud",
        "Faire un jeu de rôle de fantasme très explicite",
        "Faire un massage avec des plumes et de l'huile chaude",
        "Faire un jeu de vérité ou action très osé",
        "Faire un massage avec des accessoires de bondage",
        "Faire un jeu de rôle de domination intense",
        "Faire un massage avec des accessoires de fétichisme",
        "Faire un jeu de voyeurisme et d'exhibitionnisme avancé",
        "Faire un massage avec des accessoires de plaisir intense",
        "Faire un jeu de séduction avec des accessoires coquins",
        "Faire un massage avec des bougies et de l'huile chaude",
        "Faire un jeu de rôle de fantasme très détaillé",
        "Faire un massage avec des plumes et des glaçons",
        "Faire un jeu de vérité ou action très explicite",
        "Faire un massage avec des accessoires de bondage avancé",
        "Faire un jeu de rôle de domination très intense",
        "Faire un massage avec des accessoires de fétichisme avancé",
        "Faire un jeu de voyeurisme et d'exhibitionnisme très osé",
        "Faire un massage avec des accessoires de plaisir très intense"
    ]
};

// Gestion des défis coquins
function setupSpicyChallenges() {
    const newChallengeBtn = document.getElementById('newChallenge');
    if (newChallengeBtn) {
        newChallengeBtn.addEventListener('click', () => {
            const challenge = getRandomChallenge();
            displayChallenge(challenge);
            
            // Envoyer le défi via P2P
            if (window.p2p && window.p2p.sendData) {
                window.p2p.sendData({
                    type: 'challenge',
                    content: challenge
                });
            }
        });
    }
}

function getRandomChallenge() {
    // Choisir un niveau aléatoire avec des probabilités différentes
    const random = Math.random();
    let level;
    
    if (random < 0.5) {
        level = 'soft';
    } else if (random < 0.8) {
        level = 'medium';
    } else {
        level = 'hot';
    }
    
    // Choisir un défi aléatoire dans ce niveau
    const challenges = spicyChallenges[level];
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    return {
        text: challenge,
        level: level
    };
}

function displayChallenge(challenge) {
    const challengeText = document.querySelector('.challenge-text');
    const challengeLevel = document.querySelector('.challenge-level');
    
    if (challengeText && challengeLevel) {
        challengeText.textContent = challenge.text;
        
        // Afficher le niveau avec une icône appropriée
        let levelIcon = '🌶️';
        if (challenge.level === 'soft') {
            levelIcon = '🌱';
        } else if (challenge.level === 'medium') {
            levelIcon = '🌶️';
        } else if (challenge.level === 'hot') {
            levelIcon = '🔥';
        }
        
        challengeLevel.textContent = levelIcon;
        challengeLevel.className = 'challenge-level ' + challenge.level;
    }
}

// Chargement initial des données
function loadSavedData() {
    loadMessages();
    loadPhotos();
    loadFlirtyMessages();
}

// Wish List
const wishes = {
    list: [],
    addWish(text) {
        const wish = {
            id: Date.now().toString(),
            text,
            completed: false
        };
        this.list.push(wish);
        this.saveWishes();
        this.displayWishes();
        if (window.p2pConnection) {
            window.p2pConnection.send({
                type: 'wish',
                action: 'add',
                data: wish
            });
        }
    },
    deleteWish(id) {
        this.list = this.list.filter(wish => wish.id !== id);
        this.saveWishes();
        this.displayWishes();
        if (window.p2pConnection) {
            window.p2pConnection.send({
                type: 'wish',
                action: 'delete',
                data: { id }
            });
        }
    },
    toggleWish(id) {
        const wish = this.list.find(w => w.id === id);
        if (wish) {
            wish.completed = !wish.completed;
            this.saveWishes();
            this.displayWishes();
            if (window.p2pConnection) {
                window.p2pConnection.send({
                    type: 'wish',
                    action: 'toggle',
                    data: { id, completed: wish.completed }
                });
            }
        }
    },
    saveWishes() {
        localStorage.setItem('wishes', JSON.stringify(this.list));
    },
    loadWishes() {
        const saved = localStorage.getItem('wishes');
        if (saved) {
            this.list = JSON.parse(saved);
            this.displayWishes();
        }
    },
    displayWishes() {
        const container = document.querySelector('.wish-list');
        container.innerHTML = '';
        this.list.forEach(wish => {
            const div = document.createElement('div');
            div.className = `wish-item ${wish.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <span>${wish.text}</span>
                <div>
                    <button onclick="wishes.toggleWish('${wish.id}')" class="toggle-btn">
                        ${wish.completed ? '✓' : '○'}
                    </button>
                    <button onclick="wishes.deleteWish('${wish.id}')" class="delete-btn">×</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
};

// Date Night Generator
const dateIdeas = [
    "Dîner aux chandelles à la maison",
    "Massage romantique",
    "Jeu de rôle cosplay",
    "Soirée cinéma en pyjama",
    "Dégustation de vins",
    "Cours de cuisine ensemble",
    "Escape game à deux",
    "Spa day à la maison",
    "Soirée jeux de société",
    "Concert en streaming",
    "Dance party privée",
    "Soirée karaoké",
    "Atelier peinture ensemble",
    "Dégustation de chocolats",
    "Soirée quiz en couple"
];

function generateDateIdea() {
    const idea = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
    document.querySelector('.date-text').textContent = idea;
    if (window.p2pConnection) {
        window.p2pConnection.send({
            type: 'date',
            action: 'new',
            data: { idea }
        });
    }
}

// Truth or Dare
const truthQuestions = [
    "Quel est ton fantasme le plus secret ?",
    "Quelle est ta position préférée ?",
    "Quel est ton endroit préféré pour faire l'amour ?",
    "Quelle est ta partie du corps préférée sur ton partenaire ?",
    "Quel est ton moment le plus excitant avec moi ?"
];

const dareActions = [
    "Fais-moi un strip-tease lent",
    "Envoie-moi une photo coquine",
    "Fais-moi un massage érotique",
    "Joue avec toi-même devant moi",
    "Porte un accessoire coquin pendant 1 heure"
];

function getTruth() {
    const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
    document.querySelector('.game-content').textContent = question;
    if (window.p2pConnection) {
        window.p2pConnection.send({
            type: 'game',
            action: 'truth',
            data: { question }
        });
    }
}

function getDare() {
    const action = dareActions[Math.floor(Math.random() * dareActions.length)];
    document.querySelector('.game-content').textContent = action;
    if (window.p2pConnection) {
        window.p2pConnection.send({
            type: 'game',
            action: 'dare',
            data: { action }
        });
    }
}

// Role Play Scenarios
const scenarios = [
    {
        setting: "Hôtel de luxe",
        roles: ["Client riche", "Escorte de luxe"],
        plot: "Une rencontre secrète dans une suite présidentielle"
    },
    {
        setting: "Cabinet médical",
        roles: ["Docteur", "Patient(e)"],
        plot: "Un examen médical qui tourne au coquin"
    },
    {
        setting: "École",
        roles: ["Professeur", "Étudiant(e)"],
        plot: "Une leçon particulière après les cours"
    },
    {
        setting: "Restaurant",
        roles: ["Serveur(se)", "Client(e)"],
        plot: "Un service très personnel"
    },
    {
        setting: "Spa",
        roles: ["Masseur(se)", "Client(e)"],
        plot: "Un massage qui devient intime"
    }
];

function generateScenario() {
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const text = `
        Setting: ${scenario.setting}
        Rôles: ${scenario.roles.join(' & ')}
        Plot: ${scenario.plot}
    `;
    document.querySelector('.scenario-text').textContent = text;
    if (window.p2pConnection) {
        window.p2pConnection.send({
            type: 'scenario',
            action: 'new',
            data: scenario
        });
    }
}

// Ephemeral Photos
const ephemeralPhotos = {
    list: [],
    addPhoto(file, password, duration = 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photo = {
                id: Date.now().toString(),
                data: e.target.result,
                password,
                timestamp: Date.now(),
                duration: duration * 60 * 1000, // Convertir les minutes en millisecondes
                expiryTime: duration > 0 ? Date.now() + (duration * 60 * 1000) : null
            };
            this.list.push(photo);
            this.savePhotos();
            this.displayPhotos();
            
            // Si une durée est définie, programmer la suppression automatique
            if (duration > 0) {
                setTimeout(() => {
                    this.deletePhoto(photo.id);
                }, duration * 60 * 1000);
            }
            
            if (window.p2pConnection) {
                window.p2pConnection.send({
                    type: 'photo',
                    action: 'add',
                    data: photo
                });
            }
        };
        reader.readAsDataURL(file);
    },
    deletePhoto(id) {
        this.list = this.list.filter(photo => photo.id !== id);
        this.savePhotos();
        this.displayPhotos();
        if (window.p2pConnection) {
            window.p2pConnection.send({
                type: 'photo',
                action: 'delete',
                data: { id }
            });
        }
    },
    savePhotos() {
        localStorage.setItem('ephemeralPhotos', JSON.stringify(this.list));
    },
    loadPhotos() {
        const saved = localStorage.getItem('ephemeralPhotos');
        if (saved) {
            this.list = JSON.parse(saved);
            
            // Vérifier les photos expirées
            const now = Date.now();
            this.list = this.list.filter(photo => {
                if (photo.expiryTime && photo.expiryTime < now) {
                    return false; // Supprimer les photos expirées
                }
                return true;
            });
            
            this.displayPhotos();
        }
    },
    displayPhotos() {
        const container = document.querySelector('.ephemeral-gallery');
        container.innerHTML = '';
        this.list.forEach(photo => {
            const div = document.createElement('div');
            div.className = 'ephemeral-photo';
            
            // Calculer le temps restant si applicable
            let timeLeft = '';
            if (photo.expiryTime) {
                const remaining = photo.expiryTime - Date.now();
                if (remaining > 0) {
                    const minutes = Math.floor(remaining / 60000);
                    const seconds = Math.floor((remaining % 60000) / 1000);
                    timeLeft = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                }
            }
            
            div.innerHTML = `
                <img src="${photo.data}" alt="Photo éphémère">
                <div class="password-overlay" onclick="ephemeralPhotos.showPhoto('${photo.id}')">
                    🔒 Cliquez pour voir
                    ${timeLeft ? `<span class="timer">⏱️ ${timeLeft}</span>` : ''}
                </div>
                <button class="delete-btn" onclick="ephemeralPhotos.deletePhoto('${photo.id}')">🗑️</button>
            `;
            container.appendChild(div);
        });
        
        // Mettre à jour les minuteurs toutes les secondes
        this.updateTimers();
    },
    updateTimers() {
        // Arrêter le timer précédent s'il existe
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Démarrer un nouveau timer
        this.timerInterval = setInterval(() => {
            let needsUpdate = false;
            
            this.list.forEach(photo => {
                if (photo.expiryTime) {
                    const remaining = photo.expiryTime - Date.now();
                    
                    // Si le temps est écoulé, supprimer la photo
                    if (remaining <= 0) {
                        this.deletePhoto(photo.id);
                        needsUpdate = true;
                    }
                }
            });
            
            // Mettre à jour l'affichage si nécessaire
            if (needsUpdate) {
                this.displayPhotos();
            }
        }, 1000);
    },
    showPhoto(id) {
        const photo = this.list.find(p => p.id === id);
        if (photo) {
            const password = prompt('Entrez le mot de passe :');
            if (password === photo.password) {
                const img = document.createElement('img');
                img.src = photo.data;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '80vh';
                
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.right = '0';
                modal.style.bottom = '0';
                modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.style.zIndex = '1000';
                
                modal.onclick = () => {
                    document.body.removeChild(modal);
                };
                
                modal.appendChild(img);
                document.body.appendChild(modal);
            } else {
                alert('Mot de passe incorrect');
            }
        }
    }
};

// Offline Mode
function setupOfflineMode() {
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.textContent = 'Mode hors ligne';
    document.body.appendChild(indicator);

    window.addEventListener('online', () => {
        indicator.classList.remove('show');
    });

    window.addEventListener('offline', () => {
        indicator.classList.add('show');
    });
}

// Gestion de la Wish List
function setupWishListHandlers() {
    const wishInput = document.querySelector('#wishInput');
    const addWishBtn = document.querySelector('#addWish');
    
    if (wishInput && addWishBtn) {
        addWishBtn.addEventListener('click', () => {
            const text = wishInput.value.trim();
            if (text) {
                wishes.addWish(text);
                wishInput.value = '';
            }
        });
        
        // Permettre l'ajout avec la touche Entrée
        wishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = wishInput.value.trim();
                if (text) {
                    wishes.addWish(text);
                    wishInput.value = '';
                }
            }
        });
        
        // Charger les wishes existants
        wishes.loadWishes();
    }
}

// Gestion de Date Night
function setupDateNightHandlers() {
    const generateDateBtn = document.querySelector('#generateDate');
    
    if (generateDateBtn) {
        generateDateBtn.addEventListener('click', generateDateIdea);
    }
}

// Gestion des scénarios de rôle
function setupRolePlayHandlers() {
    const generateScenarioBtn = document.querySelector('#generateScenario');
    
    if (generateScenarioBtn) {
        generateScenarioBtn.addEventListener('click', generateScenario);
    }
}

// Gestion de Truth or Dare
function setupTruthDareHandlers() {
    const truthBtn = document.querySelector('#truthBtn');
    const dareBtn = document.querySelector('#dareBtn');
    
    if (truthBtn && dareBtn) {
        truthBtn.addEventListener('click', getTruth);
        dareBtn.addEventListener('click', getDare);
    }
}

// Gestion des fonctions de réinitialisation
function setupResetHandlers() {
    // Bouton de réinitialisation globale
    const resetAllBtn = document.getElementById('resetAll');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir tout réinitialiser ? Cette action est irréversible.')) {
                resetAllData();
            }
        });
    }

    // Boutons de suppression par catégorie
    const clearPhotosBtn = document.getElementById('clearPhotos');
    if (clearPhotosBtn) {
        clearPhotosBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer toutes les photos ?')) {
                clearPhotos();
            }
        });
    }

    const clearMessagesBtn = document.getElementById('clearMessages');
    if (clearMessagesBtn) {
        clearMessagesBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer tous les messages d\'amour ?')) {
                clearMessages();
            }
        });
    }

    const clearFlirtyMessagesBtn = document.getElementById('clearFlirtyMessages');
    if (clearFlirtyMessagesBtn) {
        clearFlirtyMessagesBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer tous les messages coquins ?')) {
                clearFlirtyMessages();
            }
        });
    }

    const clearChallengesBtn = document.getElementById('clearChallenges');
    if (clearChallengesBtn) {
        clearChallengesBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir effacer l\'historique des défis ?')) {
                clearChallenges();
            }
        });
    }

    const clearWishesBtn = document.getElementById('clearWishes');
    if (clearWishesBtn) {
        clearWishesBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer tous les souhaits ?')) {
                clearWishes();
            }
        });
    }

    const clearDatesBtn = document.getElementById('clearDates');
    if (clearDatesBtn) {
        clearDatesBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir effacer l\'historique des dates ?')) {
                clearDates();
            }
        });
    }

    const clearTruthDareBtn = document.getElementById('clearTruthDare');
    if (clearTruthDareBtn) {
        clearTruthDareBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir effacer l\'historique de Truth or Dare ?')) {
                clearTruthDare();
            }
        });
    }

    const clearScenariosBtn = document.getElementById('clearScenarios');
    if (clearScenariosBtn) {
        clearScenariosBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir effacer l\'historique des scénarios ?')) {
                clearScenarios();
            }
        });
    }

    const clearEphemeralPhotosBtn = document.getElementById('clearEphemeralPhotos');
    if (clearEphemeralPhotosBtn) {
        clearEphemeralPhotosBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer toutes les photos éphémères ?')) {
                clearEphemeralPhotos();
            }
        });
    }
}

// Fonction de réinitialisation globale
function resetAllData() {
    const resetButton = document.getElementById('resetAll');
    resetButton.classList.add('reset-shake');
    
    setTimeout(() => {
        resetButton.classList.remove('reset-shake');
        
        if (confirm('Êtes-vous sûr de vouloir tout réinitialiser ? Cette action est irréversible et supprimera toutes les données.')) {
            // Effacer toutes les données du localStorage
            localStorage.clear();
            
            // Réinitialiser l'interface
            document.querySelectorAll('.message').forEach(msg => msg.remove());
            document.querySelectorAll('.photo').forEach(photo => photo.remove());
            document.querySelectorAll('.flirty-message').forEach(msg => msg.remove());
            document.querySelectorAll('.challenge').forEach(challenge => challenge.remove());
            document.querySelectorAll('.wish-item').forEach(wish => wish.remove());
            document.querySelectorAll('.date-idea').forEach(date => date.remove());
            document.querySelectorAll('.truth-dare-item').forEach(item => item.remove());
            document.querySelectorAll('.role-play-item').forEach(item => item.remove());
            document.querySelectorAll('.ephemeral-photo').forEach(photo => photo.remove());
            
            // Réinitialiser les inputs
            document.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
            document.querySelectorAll('input[type="password"]').forEach(input => input.value = '');
            document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
            
            // Réinitialiser les conteneurs
            document.querySelector('.photo-gallery').innerHTML = '';
            document.querySelector('.message-container').innerHTML = '';
            document.querySelector('.flirty-container').innerHTML = '';
            document.querySelector('.challenge-container').innerHTML = '';
            document.querySelector('.wish-list').innerHTML = '';
            document.querySelector('.date-container').innerHTML = '';
            document.querySelector('.truth-dare-container').innerHTML = '';
            document.querySelector('.role-play-container').innerHTML = '';
            document.querySelector('.ephemeral-gallery').innerHTML = '';
            
            // Envoyer un signal de réinitialisation via P2P
            if (window.p2pConnection && window.p2pConnection.isConnected()) {
                window.p2pConnection.send({
                    type: 'reset',
                    action: 'all'
                });
            }
            
            // Afficher une notification de succès
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.textContent = 'Toutes les données ont été réinitialisées avec succès !';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }, 500);
}

// Fonctions de suppression par catégorie
function clearPhotos() {
    document.querySelector('.photo-grid').innerHTML = '';
    localStorage.removeItem('photos');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'photo',
            content: {
                action: 'clearAll'
            }
        });
    }
}

function clearMessages() {
    document.querySelector('.notes-container').innerHTML = '';
    localStorage.removeItem('loveMessages');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'loveMessage',
            content: {
                action: 'clearAll'
            }
        });
    }
}

function clearFlirtyMessages() {
    document.querySelector('.flirty-container').innerHTML = '';
    localStorage.removeItem('flirtyMessages');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'flirtyMessage',
            content: {
                action: 'clearAll'
            }
        });
    }
}

function clearChallenges() {
    document.querySelector('.challenge-text').textContent = 'Cliquez sur le bouton pour obtenir un défi...';
    document.querySelector('.challenge-level').textContent = '';
    localStorage.removeItem('challenges');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'challenge',
            content: {
                action: 'clear'
            }
        });
    }
}

function clearWishes() {
    document.querySelector('.wish-list').innerHTML = '';
    wishes.list = [];
    wishes.saveWishes();
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'wish',
            content: {
                action: 'clearAll'
            }
        });
    }
}

function clearDates() {
    document.querySelector('.date-text').textContent = 'Cliquez sur le bouton pour générer une idée de date';
    localStorage.removeItem('dates');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'date',
            content: {
                action: 'clear'
            }
        });
    }
}

function clearTruthDare() {
    document.querySelector('.game-text').textContent = 'Choisissez Vérité ou Action';
    localStorage.removeItem('truthDare');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'game',
            content: {
                action: 'clear'
            }
        });
    }
}

function clearScenarios() {
    document.querySelector('.scenario-text').textContent = 'Cliquez pour générer un scénario';
    localStorage.removeItem('scenarios');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'scenario',
            content: {
                action: 'clear'
            }
        });
    }
}

function clearEphemeralPhotos() {
    document.querySelector('.ephemeral-gallery').innerHTML = '';
    localStorage.removeItem('ephemeralPhotos');
    
    if (window.p2p && window.p2p.sendData) {
        window.p2p.sendData({
            type: 'ephemeralPhoto',
            content: {
                action: 'clearAll'
            }
        });
    }
}

const flirtyMessages = [
    "Tu es mon petit jouet préféré",
    "J'ai envie de te dévorer tout cru",
    "Tu es ma petite salope préférée",
    "J'ai envie de te faire crier de plaisir",
    "Tu es mon petit cochon préféré",
    "J'ai envie de te faire jouir encore et encore",
    "Tu es ma petite pute préférée",
    "J'ai envie de te faire perdre la tête",
    "Tu es mon petit esclave préféré",
    "J'ai envie de te faire hurler de plaisir",
    "Tu es ma petite soumise préférée",
    "J'ai envie de te faire crier mon nom",
    "Tu es mon petit soumis préféré",
    "J'ai envie de te faire perdre le contrôle",
    "Tu es ma petite dominée préférée",
    "J'ai envie de te faire jouir sans arrêt",
    "Tu es mon petit masochiste préféré",
    "J'ai envie de te faire crier de douleur",
    "Tu es ma petite masochiste préférée",
    "J'ai envie de te faire perdre la raison",
    "Tu es mon petit fétichiste préféré",
    "J'ai envie de te faire crier de plaisir",
    "Tu es ma petite fétichiste préférée",
    "J'ai envie de te faire jouir encore plus",
    "Tu es mon petit pervers préféré",
    "J'ai envie de te faire crier de plaisir",
    "Tu es ma petite perverse préférée",
    "J'ai envie de te faire perdre le contrôle",
    "Tu es mon petit déviant préféré",
    "J'ai envie de te faire crier mon nom"
];

// Mode Hardcore
const hardcoreChallenges = {
    soft: [
        "Envoie une photo de toi en sous-vêtements",
        "Fais-moi un petit strip-tease en vidéo",
        "Envoie-moi un message vocal coquin",
        "Fais-moi un compliment très osé",
        "Envoie-moi une photo de ta bouche",
        "Décris-moi ce que tu voudrais me faire",
        "Envoie-moi une photo de tes yeux",
        "Fais-moi un petit jeu de séduction en message",
        "Envoie-moi une photo de tes mains",
        "Décris-moi ton fantasme du moment"
    ],
    medium: [
        "Envoie-moi une photo de toi en petite tenue",
        "Fais-moi un strip-tease complet en vidéo",
        "Envoie-moi un message vocal très coquin",
        "Décris-moi en détail ce que tu voudrais me faire",
        "Envoie-moi une photo de toi mouillé(e)",
        "Fais-moi un jeu de rôle en message",
        "Envoie-moi une photo de toi avec un accessoire coquin",
        "Décris-moi ton fantasme le plus fou",
        "Envoie-moi une photo de toi avec de la nourriture",
        "Fais-moi un petit jeu de domination en message"
    ],
    hot: [
        "Envoie-moi une photo de toi complètement nu(e)",
        "Fais-moi une vidéo très coquine",
        "Envoie-moi un message vocal très explicite",
        "Décris-moi en détail ton fantasme le plus osé",
        "Envoie-moi une photo de toi avec un accessoire de plaisir",
        "Fais-moi un jeu de rôle très explicite en message",
        "Envoie-moi une photo de toi en train de te toucher",
        "Décris-moi ce que tu voudrais que je te fasse",
        "Envoie-moi une photo de toi avec un accessoire de bondage",
        "Fais-moi un jeu de domination très intense en message"
    ]
};

const hardcoreMessages = [
    "J'ai envie de te voir nu(e)",
    "Je veux te voir te toucher",
    "J'ai envie de t'entendre gémir",
    "Je veux te voir jouir",
    "J'ai envie de te dominer",
    "Je veux te voir te soumettre",
    "J'ai envie de t'entendre crier",
    "Je veux te voir me supplier",
    "J'ai envie de te voir te tortiller",
    "Je veux te voir perdre le contrôle"
];

const hardcoreCommands = [
    "Montre-moi ton corps",
    "Touche-toi pour moi",
    "Fais-moi un strip-tease",
    "Gémis pour moi",
    "Joue avec toi-même",
    "Mets-toi à genoux",
    "Crie mon nom",
    "Supplie-moi",
    "Tortille-toi pour moi",
    "Perds le contrôle pour moi"
];

function setupHardcoreMode() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${target}"]`).classList.add('active');
        });
    });

    // Setup challenge generation
    document.getElementById('new-challenge').addEventListener('click', () => {
        const level = Math.random() < 0.4 ? 'soft' : (Math.random() < 0.7 ? 'medium' : 'hot');
        const challenges = hardcoreChallenges[level];
        const challenge = challenges[Math.floor(Math.random() * challenges.length)];
        
        const display = document.querySelector('.challenge-display');
        display.innerHTML = `
            <div class="challenge-text">${challenge}</div>
            <div class="challenge-level">${level === 'soft' ? '🔥' : level === 'medium' ? '🔥🔥' : '🔥🔥🔥'}</div>
        `;

        // Send via P2P if available
        if (window.p2pConnection) {
            window.p2pConnection.send({
                type: 'hardcore-challenge',
                challenge: challenge,
                level: level
            });
        }
    });

    // Setup message generation
    document.getElementById('new-message').addEventListener('click', () => {
        const message = hardcoreMessages[Math.floor(Math.random() * hardcoreMessages.length)];
        const display = document.querySelector('.message-display');
        display.textContent = message;

        // Send via P2P if available
        if (window.p2pConnection) {
            window.p2pConnection.send({
                type: 'hardcore-message',
                message: message
            });
        }
    });

    // Setup command generation
    document.getElementById('new-command').addEventListener('click', () => {
        const command = hardcoreCommands[Math.floor(Math.random() * hardcoreCommands.length)];
        const display = document.querySelector('.command-display');
        display.textContent = command;

        // Send via P2P if available
        if (window.p2pConnection) {
            window.p2pConnection.send({
                type: 'hardcore-command',
                command: command
            });
        }
    });
}

// Fonction pour sauvegarder toutes les données
function saveAllData() {
    const data = {
        messages: getAllMessages(),
        flirtyMessages: getAllFlirtyMessages(),
        photos: getAllPhotos(),
        wishes: getAllWishes(),
        dates: getAllDates(),
        challenges: getAllChallenges(),
        scenarios: getAllScenarios(),
        ephemeralPhotos: getAllEphemeralPhotos()
    };
    
    localStorage.setItem('coupleAppData', JSON.stringify(data));
    
    // Envoyer les données à l'autre utilisateur si connecté
    if (window.p2pConnection) {
        window.p2pConnection.send({
            type: 'sync-data',
            data: data
        });
    }
}

// Fonction pour charger toutes les données
function loadAllData() {
    const savedData = localStorage.getItem('coupleAppData');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restaurer les messages
        if (data.messages) {
            data.messages.forEach(msg => addMessage(msg.text, msg.id));
        }
        
        // Restaurer les messages coquins
        if (data.flirtyMessages) {
            data.flirtyMessages.forEach(msg => addFlirtyMessage(msg.text, msg.id));
        }
        
        // Restaurer les photos
        if (data.photos) {
            data.photos.forEach(photo => addPhotoToGallery(photo));
        }
        
        // Restaurer les souhaits
        if (data.wishes) {
            data.wishes.forEach(wish => {
                const wishElement = document.createElement('div');
                wishElement.className = 'wish-item';
                wishElement.innerHTML = `
                    <span>${wish.text}</span>
                    <button class="delete-btn" onclick="deleteWish(this.parentElement)">🗑️</button>
                `;
                document.querySelector('.wish-list').appendChild(wishElement);
            });
        }
        
        // Restaurer les dates
        if (data.dates) {
            document.querySelector('.date-text').textContent = data.dates[data.dates.length - 1] || 'Cliquez pour générer une date';
        }
        
        // Restaurer les défis
        if (data.challenges) {
            const lastChallenge = data.challenges[data.challenges.length - 1];
            if (lastChallenge) {
                document.querySelector('.challenge-text').textContent = lastChallenge.text;
                document.querySelector('.challenge-level').textContent = lastChallenge.level;
            }
        }
        
        // Restaurer les scénarios
        if (data.scenarios) {
            document.querySelector('.scenario-text').textContent = data.scenarios[data.scenarios.length - 1] || 'Cliquez pour générer un scénario';
        }
        
        // Restaurer les photos éphémères
        if (data.ephemeralPhotos) {
            data.ephemeralPhotos.forEach(photo => {
                if (photo.expiryTime > Date.now()) {
                    addPhotoToGallery(photo);
                }
            });
        }
    }
}

// Fonctions utilitaires pour récupérer les données
function getAllMessages() {
    const messages = [];
    document.querySelectorAll('.message').forEach(msg => {
        messages.push({
            id: msg.dataset.id,
            text: msg.querySelector('p').textContent
        });
    });
    return messages;
}

function getAllFlirtyMessages() {
    const messages = [];
    document.querySelectorAll('.flirty-message').forEach(msg => {
        messages.push({
            id: msg.dataset.id,
            text: msg.querySelector('p').textContent
        });
    });
    return messages;
}

function getAllPhotos() {
    const photos = [];
    document.querySelectorAll('.photo-item img').forEach(img => {
        photos.push({
            src: img.src,
            id: img.parentElement.dataset.id
        });
    });
    return photos;
}

function getAllWishes() {
    const wishes = [];
    document.querySelectorAll('.wish-item').forEach(wish => {
        wishes.push({
            text: wish.querySelector('span').textContent,
            id: wish.dataset.id
        });
    });
    return wishes;
}

function getAllDates() {
    return [document.querySelector('.date-text').textContent];
}

function getAllChallenges() {
    return [{
        text: document.querySelector('.challenge-text').textContent,
        level: document.querySelector('.challenge-level').textContent
    }];
}

function getAllScenarios() {
    return [document.querySelector('.scenario-text').textContent];
}

function getAllEphemeralPhotos() {
    const photos = [];
    document.querySelectorAll('.ephemeral-photo').forEach(photo => {
        photos.push({
            src: photo.querySelector('img').src,
            id: photo.dataset.id,
            expiryTime: parseInt(photo.dataset.expiryTime)
        });
    });
    return photos;
} 