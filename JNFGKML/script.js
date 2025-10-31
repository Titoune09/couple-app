const compliments = [
    "La reine du soleil parisien, même quand il pleut des cordes.",
    "Ton rire vaut plus cher que toutes les boutiques de la rue de Rivoli réunies.",
    "On devrait écrire un roman: 'Eva, 16 ans et déjà légende'.",
    "Noah + toi = duo plus lumineux qu'une guirlande de fête foraine.",
    "Ton énergie transforme chaque plan en aventure épique.",
    "À chaque sourire, tu déclenches des mini-feux d'artifice dans nos cœurs.",
    "Ta joie est un sport extrême : impossible de suivre ton rythme !"
];

const confettiColors = ["#f72585", "#7209b7", "#4cc9f0", "#4361ee", "#ff9f1c"];

const confettiPieces = [];
let confettiActive = false;
let contributionsCache = [];
const CONTRIBUTION_ENDPOINT = '/api/contributions';

function setupTypewriter() {
    const element = document.querySelector('.typewriter');
    if (!element) return;

    const fullText = element.dataset.text || element.textContent;
    element.textContent = '';
    let index = 0;

    const interval = setInterval(() => {
        element.textContent = fullText.slice(0, index);
        index += 1;
        if (index > fullText.length) {
            clearInterval(interval);
        }
    }, 45);
}

function setupCompliments() {
    const complimentBtn = document.getElementById('complimentBtn');
    const display = document.querySelector('.compliment-display');

    if (!complimentBtn || !display) return;

    complimentBtn.addEventListener('click', () => {
        const text = compliments[Math.floor(Math.random() * compliments.length)];
        display.textContent = text;
        display.classList.remove('pop');
        void display.offsetWidth;
        display.classList.add('pop');
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function normaliseYouTubeLink(link) {
    try {
        const url = new URL(link);
        if (url.hostname.includes('youtu.be')) {
            const id = url.pathname.slice(1);
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (url.hostname.includes('youtube.com')) {
            if (url.searchParams.has('v')) {
                return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
            }
            const segments = url.pathname.split('/').filter(Boolean);
            if (segments[0] === 'shorts' && segments[1]) {
                return `https://www.youtube.com/embed/${segments[1]}`;
            }
            if (segments[0] === 'embed' && segments[1]) {
                return `https://www.youtube.com/embed/${segments[1]}`;
            }
        }
    } catch (error) {
        return null;
    }
    return null;
}

async function fetchContributionsFromServer() {
    const response = await fetch(CONTRIBUTION_ENDPOINT, {
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error('Réponse réseau invalide');
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error('Format de données inattendu');
    }

    return data;
}

async function saveContributionToServer(contribution) {
    const response = await fetch(CONTRIBUTION_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(contribution)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || 'Impossible d\'enregistrer le souvenir');
    }

    return response.json();
}

async function clearContributionsOnServer() {
    const response = await fetch(CONTRIBUTION_ENDPOINT, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || 'Impossible de vider le mur');
    }

    return response.json();
}

function setStatus(statusElement, message, type = 'info') {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.classList.remove('success', 'error', 'info');
    statusElement.classList.add(type);
}

function toggleFormDisabled(form, disabled) {
    if (!form) return;
    [...form.elements].forEach(element => {
        if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.disabled = disabled;
        }
    });
}

function renderContributions(contributions, wallElement) {
    if (!wallElement) return;

    wallElement.innerHTML = '';

    if (!contributions.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = "Personne n'a encore écrit. Lance-toi et ouvre le bal des souvenirs !";
        wallElement.appendChild(empty);
        return;
    }

    contributions
        .slice()
        .sort((a, b) => {
            const timeA = new Date(a?.createdAt || 0).getTime();
            const timeB = new Date(b?.createdAt || 0).getTime();
            return timeB - timeA;
        })
        .forEach(contribution => {
            const card = document.createElement('article');
            card.className = 'contribution-card';

            const header = document.createElement('div');
            header.className = 'contribution-header';

            const author = document.createElement('span');
            author.textContent = contribution.name || 'Ami secret';
            header.appendChild(author);

            if (contribution.createdAt) {
                const date = new Date(contribution.createdAt);
                if (!Number.isNaN(date.valueOf())) {
                    const dateLabel = document.createElement('span');
                    dateLabel.className = 'contribution-date';
                    dateLabel.textContent = date.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    header.appendChild(dateLabel);
                }
            }

            card.appendChild(header);

            if (contribution.message) {
                const message = document.createElement('p');
                message.className = 'contribution-message';
                message.textContent = contribution.message;
                card.appendChild(message);
            }

            if (contribution.mediaData && contribution.mediaType) {
                const wrapper = document.createElement('div');
                wrapper.className = 'contribution-media';

                if (contribution.mediaType === 'image') {
                    const img = document.createElement('img');
                    img.src = contribution.mediaData;
                    img.alt = `Souvenir partagé par ${contribution.name || 'un ami'}`;
                    wrapper.appendChild(img);
                } else if (contribution.mediaType === 'video') {
                    const video = document.createElement('video');
                    video.src = contribution.mediaData;
                    video.controls = true;
                    video.playsInline = true;
                    wrapper.appendChild(video);
                }

                card.appendChild(wrapper);
            }

            if (contribution.videoLink) {
                const embedUrl = normaliseYouTubeLink(contribution.videoLink);
                if (embedUrl) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'contribution-media';
                    const iframe = document.createElement('iframe');
                    iframe.src = embedUrl;
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                    iframe.allowFullscreen = true;
                    wrapper.appendChild(iframe);
                    card.appendChild(wrapper);
                } else {
                    const link = document.createElement('a');
                    link.className = 'contribution-link';
                    link.href = contribution.videoLink;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.textContent = 'Voir la vidéo partagée';
                    card.appendChild(link);
                }
            }

            wallElement.appendChild(card);
        });
}

function renderError(wallElement, message) {
    if (!wallElement) return;
    wallElement.innerHTML = '';
    const errorMessage = document.createElement('p');
    errorMessage.className = 'empty-state';
    errorMessage.textContent = message;
    wallElement.appendChild(errorMessage);
}

async function syncContributions(wallElement, statusElement) {
    try {
        const fetched = await fetchContributionsFromServer();
        contributionsCache = fetched;
        renderContributions(contributionsCache, wallElement);
        setStatus(statusElement, 'Mur synchronisé avec toute la team ✨', 'success');
    } catch (error) {
        console.error('Erreur de chargement des souvenirs', error);
        renderError(wallElement, 'Impossible de charger le mur partagé pour le moment. Réessaie un peu plus tard.');
        setStatus(statusElement, 'Impossible de récupérer les souvenirs partagés. Vérifie la connexion et réessaie.', 'error');
    }
}

function setupContributionForm() {
    const form = document.getElementById('contributionForm');
    const wall = document.querySelector('.contribution-wall');
    const clearBtn = document.getElementById('clearContributions');

    if (!form || !wall) return;

    const status = form.querySelector('.form-status');
    setStatus(status, 'Chargement du mur partagé…', 'info');
    syncContributions(wall, status);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        setStatus(status, 'Envoi en cours…', 'info');
        toggleFormDisabled(form, true);

        const formData = new FormData(form);
        const name = (formData.get('name') || '').toString().trim();
        const message = (formData.get('message') || '').toString().trim();
        const videoLink = (formData.get('videoLink') || '').toString().trim();
        const mediaFile = formData.get('media');

        const hasFile = mediaFile instanceof File && mediaFile.size > 0;
        if (!message && !hasFile && !videoLink) {
            setStatus(status, 'Ajoute au moins un message, un média ou un lien pour participer.', 'error');
            toggleFormDisabled(form, false);
            return;
        }

        if (hasFile && mediaFile.size > 20 * 1024 * 1024) {
            setStatus(status, 'Le fichier est trop lourd. Essaie avec un média plus léger (max 20 Mo).', 'error');
            toggleFormDisabled(form, false);
            return;
        }

        let mediaData = null;
        let mediaType = null;

        if (hasFile) {
            try {
                mediaData = await readFileAsDataURL(mediaFile);
                mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
            } catch (error) {
                console.error('Erreur de lecture du fichier', error);
                setStatus(status, 'Impossible de lire ce fichier. Réessaie avec un autre format.', 'error');
                toggleFormDisabled(form, false);
                return;
            }
        }

        let sanitizedLink = '';
        if (videoLink) {
            try {
                const validated = new URL(videoLink);
                if (['http:', 'https:'].includes(validated.protocol)) {
                    sanitizedLink = validated.href;
                } else {
                    throw new Error('Invalid protocol');
                }
            } catch (error) {
                setStatus(status, 'Le lien vidéo semble invalide. Vérifie et réessaie.', 'error');
                toggleFormDisabled(form, false);
                return;
            }
        }

        const contribution = {
            name,
            message,
            mediaData,
            mediaType,
            videoLink: sanitizedLink
        };

        try {
            const saved = await saveContributionToServer(contribution);
            contributionsCache.push(saved);
            renderContributions(contributionsCache, wall);
            form.reset();
            setStatus(status, 'Souvenir ajouté ! Prépare le prochain 💌', 'success');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du souvenir', error);
            setStatus(status, error.message || 'Impossible d\'enregistrer ce souvenir. Réessaie plus tard.', 'error');
        } finally {
            toggleFormDisabled(form, false);
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const confirmation = window.confirm('Tu es sûr·e ? Cette action effacera le mur pour tout le monde.');
            if (!confirmation) return;

            setStatus(status, 'Nettoyage du mur…', 'info');
            toggleFormDisabled(form, true);

            clearContributionsOnServer()
                .then(() => {
                    contributionsCache = [];
                    renderContributions(contributionsCache, wall);
                    setStatus(status, 'Mur réinitialisé pour toute la team. On recommence la fête !', 'success');
                })
                .catch(error => {
                    console.error('Erreur lors de la réinitialisation', error);
                    setStatus(status, error.message || 'Impossible de vider le mur pour le moment.', 'error');
                })
                .finally(() => {
                    toggleFormDisabled(form, false);
                });
        });
    }
}

function setupLetters() {
    document.querySelectorAll('.letter').forEach(letter => {
        letter.addEventListener('click', () => {
            const isOpen = letter.classList.toggle('open');
            if (isOpen && letter.dataset.message) {
                const back = letter.querySelector('.letter-back');
                if (back) {
                    back.textContent = letter.dataset.message;
                }
            }
        });
    });
}

function setupFireworks() {
    const buttons = document.querySelectorAll('.firework');
    const message = document.querySelector('.firework-message');

    if (!buttons.length || !message) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.spark || '';
            message.textContent = text;
            launchConfetti();
            btn.classList.remove('pulse');
            void btn.offsetWidth;
            btn.classList.add('pulse');
        });
    });
}

function setupConfettiButton() {
    const button = document.getElementById('confettiBtn');
    if (!button) return;

    button.addEventListener('click', () => {
        launchConfetti();
    });
}

function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const pieces = 180;
    confettiPieces.length = 0;

    for (let i = 0; i < pieces; i++) {
        confettiPieces.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            rotation: Math.random() * 360,
            size: Math.random() * 8 + 6,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            speed: Math.random() * 5 + 3,
            rotationSpeed: Math.random() * 6 - 3,
            opacity: Math.random() * 0.5 + 0.5
        });
    }

    if (!confettiActive) {
        confettiActive = true;
        animateConfetti(ctx, width, height);
    }
}

function animateConfetti(ctx, width, height) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    confettiPieces.forEach(piece => {
        ctx.save();
        ctx.fillStyle = piece.color;
        ctx.globalAlpha = piece.opacity;
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();

        piece.y += piece.speed;
        piece.rotation += piece.rotationSpeed;
        piece.opacity -= 0.007;
    });

    for (let i = confettiPieces.length - 1; i >= 0; i--) {
        if (confettiPieces[i].y > height + 20 || confettiPieces[i].opacity <= 0) {
            confettiPieces.splice(i, 1);
        }
    }

    if (confettiPieces.length > 0) {
        requestAnimationFrame(() => animateConfetti(ctx, canvas.width, canvas.height));
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiActive = false;
    }
}

function handleResize() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function setupPopAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .pop { animation: pop 0.45s ease; }
        @keyframes pop {
            0% { transform: scale(0.9); opacity: 0.2; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); }
        }
        .pulse { animation: pulse 0.7s ease; }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.12); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

window.addEventListener('DOMContentLoaded', () => {
    setupTypewriter();
    setupCompliments();
    setupLetters();
    setupFireworks();
    setupConfettiButton();
    setupContributionForm();
    setupPopAnimation();
    handleResize();
});

window.addEventListener('resize', handleResize);
