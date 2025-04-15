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
        peer = new Peer();
        
        peer.on('open', (id) => {
            console.log('Mon ID:', id);
            const connectionInfo = document.getElementById('connectionInfo');
            if (connectionInfo) {
                connectionInfo.value = id;
                connectionInfo.style.display = 'block';
            }
            
            // Mettre à jour l'ID dans la page d'aide
            const peerIdElement = document.getElementById('peerId');
            if (peerIdElement) {
                peerIdElement.textContent = id;
            }
        });

        peer.on('connection', (conn) => {
            console.log('Nouvelle connexion reçue !');
            connection = conn;
            setupConnection();
        });

        peer.on('error', (err) => {
            console.error('Erreur de connexion:', err);
            alert('Erreur de connexion: ' + err.message);
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        alert('Erreur lors de l\'initialisation: ' + error.message);
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
            connectionStatus.style.color = 'green';
        }
    });

    connection.on('data', (data) => {
        console.log('Données reçues:', data);
        // Utiliser la fonction handleIncomingData définie dans script.js
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
            connectionStatus.style.color = 'red';
        }
    });
}

// Connexion à un pair
function connectToPeer(peerId) {
    console.log('Tentative de connexion à:', peerId);
    
    if (!peer) {
        console.error('Peer non initialisé');
        alert('Erreur: La connexion n\'est pas initialisée');
        return;
    }
    
    try {
        connection = peer.connect(peerId);
        setupConnection();
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        alert('Erreur lors de la connexion: ' + error.message);
    }
}

// Envoi de données
function sendData(data) {
    console.log('Envoi de données:', data);
    
    if (!connection || !connection.open) {
        console.error('Pas de connexion active');
        alert('Erreur: Pas de connexion active');
        return;
    }
    
    try {
        connection.send(data);
    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        alert('Erreur lors de l\'envoi: ' + error.message);
    }
}

// Export des fonctions nécessaires
window.p2p = {
    initializeConnection,
    connectToPeer,
    sendData
};

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de P2P...');
    initializeConnection();
}); 