const crypto = require('crypto');

const MAX_MEDIA_CHAR_LENGTH = 35 * 1024 * 1024; // ~35 MB en base64

function generateId() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeText(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

function sanitizeLink(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return '';
    }

    try {
        const url = new URL(value.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
            return '';
        }
        return url.toString().slice(0, 500);
    } catch (error) {
        return '';
    }
}

function sanitizeMedia(data, type) {
    if (!data && !type) {
        return { mediaData: '', mediaType: '' };
    }

    if (!data || !type) {
        throw new Error('Format média non supporté');
    }

    if (typeof data !== 'string' || !data.startsWith('data:')) {
        throw new Error('Format média non supporté');
    }

    if (data.length > MAX_MEDIA_CHAR_LENGTH) {
        throw new Error('Fichier trop volumineux');
    }

    if (!['image', 'video'].includes(type)) {
        throw new Error('Type média non supporté');
    }

    return { mediaData: data, mediaType: type };
}

function buildContribution(payload = {}) {
    const { name, message, mediaData, mediaType, videoLink } = payload;

    const sanitizedName = sanitizeText(name, 60);
    const sanitizedMessage = sanitizeText(message, 1200);
    const sanitizedLink = sanitizeLink(videoLink);

    let storedMediaData = '';
    let storedMediaType = '';

    try {
        const media = sanitizeMedia(mediaData, mediaType);
        storedMediaData = media.mediaData;
        storedMediaType = media.mediaType;
    } catch (error) {
        throw new Error(error.message || 'Format média non supporté');
    }

    if (!sanitizedMessage && !storedMediaData && !sanitizedLink) {
        throw new Error("Ajoute au moins un message, un média ou un lien.");
    }

    return {
        id: generateId(),
        name: sanitizedName,
        message: sanitizedMessage,
        mediaData: storedMediaData,
        mediaType: storedMediaType,
        videoLink: sanitizedLink,
        createdAt: new Date().toISOString()
    };
}

module.exports = {
    MAX_MEDIA_CHAR_LENGTH,
    buildContribution,
    sanitizeLink,
    sanitizeMedia,
    sanitizeText
};
