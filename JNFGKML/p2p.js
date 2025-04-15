// Configuration de la connexion P2P
let peer = null;
let connection = null;

// Initialisation de la connexion
function initializeConnection() {
    console.log('Initialisation de la connexion...');
    
    if (typeof Peer === 'undefined') {
        console.error('PeerJS n\'est pas disponible !');
        return;
    }

    try {
        // Créer un ID unique pour chaque utilisateur
        const userId = 'user_' + Math.random().toString(36).substr(2, 9);
        peer = new Peer(userId, {
            debug: 3,
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        });
        
        peer.on('open', (id) => {
            console.log('Mon ID:', id);
            const peerIdElement = document.getElementById('peerId');
            if (peerIdElement) {
                peerIdElement.textContent = id;
            }
            
            // Mettre à jour le statut de connexion
            const connectionStatus = document.getElementById('connectionStatus');
            if (connectionStatus) {
                connectionStatus.textContent = 'En attente de connexion...';
                connectionStatus.className = 'waiting';
            }
        });

        peer.on('connection', (conn) => {
            console.log('Nouvelle connexion reçue !');
            connection = conn;
            setupConnection();
        });

        peer.on('error', (err) => {
            console.error('Erreur de connexion:', err);
            const connectionStatus = document.getElementById('connectionStatus');
            if (connectionStatus) {
                connectionStatus.textContent = 'Erreur de connexion';
                connectionStatus.className = 'error';
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = 'Erreur d\'initialisation';
            connectionStatus.className = 'error';
        }
    }
}

// Configuration de la connexion établie
function setupConnection() {
    if (!connection) {
        console.error('Pas de connexion à configurer !');
        return;
    }

    connection.on('open', () => {
        console.log('Connexion établie !');
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = 'Connecté';
            connectionStatus.className = 'connected';
        }
        
        // Synchroniser les données au moment de la connexion
        if (typeof window.saveAllData === 'function') {
            window.saveAllData();
        }
    });

    connection.on('data', (data) => {
        console.log('Données reçues:', data);
        if (typeof window.handleIncomingData === 'function') {
            window.handleIncomingData(data);
        } else {
            console.error('La fonction handleIncomingData n\'est pas disponible');
        }
    });

    connection.on('close', () => {
        console.log('Connexion fermée');
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = 'Déconnecté';
            connectionStatus.className = 'disconnected';
        }
        connection = null;
    });
}

// Connexion à un pair
function connectToPeer(peerId) {
    console.log('Tentative de connexion à:', peerId);
    
    if (!peer) {
        console.error('Peer non initialisé');
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = 'Erreur: Connexion non initialisée';
            connectionStatus.className = 'error';
        }
        return;
    }
    
    try {
        if (connection) {
            connection.close();
        }
        connection = peer.connect(peerId);
        setupConnection();
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = 'Erreur de connexion';
            connectionStatus.className = 'error';
        }
    }
}

// Envoi de données
function sendData(data) {
    if (connection && connection.open) {
        connection.send(data);
        return true;
    }
    return false;
}

// Exposer les fonctions globalement
window.initializeConnection = initializeConnection;
window.connectToPeer = connectToPeer;
window.sendData = sendData;

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de P2P...');
    initializeConnection();
}); 