const { buildContribution } = require('../utils/contributionValidation');

const STORAGE_KEY = 'contributions.json';

function withCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }
    if (!chunks.length) {
        return {};
    }

    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw) {
        return {};
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error('Format JSON invalide');
    }
}

async function loadEntries() {
    ensureBlobToken();
    const { list } = await import('@vercel/blob');

    const { blobs } = await list({ prefix: STORAGE_KEY, limit: 1 });
    if (!blobs.length) {
        return [];
    }

    const target = blobs[0];
    try {
        const response = await fetch(target.downloadUrl || target.url, {
            cache: 'no-store'
        });
        if (!response.ok) {
            return [];
        }
        const json = await response.json().catch(() => []);
        return Array.isArray(json) ? json : [];
    } catch (error) {
        console.error('Erreur de lecture Blob', error);
        return [];
    }
}

async function saveEntries(entries) {
    ensureBlobToken();
    const { put } = await import('@vercel/blob');

    await put(STORAGE_KEY, JSON.stringify(entries, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        cacheControlMaxAge: 0
    });
}

async function clearEntries() {
    ensureBlobToken();
    const { del } = await import('@vercel/blob');

    try {
        await del(STORAGE_KEY);
    } catch (error) {
        if (error?.status !== 404) {
            console.error('Erreur lors de la suppression du Blob', error);
            throw error;
        }
    }
}

function ensureBlobToken() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN manquant. Configure-le dans les variables d\'environnement Vercel.');
    }
}

module.exports = async function handler(req, res) {
    withCors(res);
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            const entries = await loadEntries();
            res.status(200).json(entries);
        } catch (error) {
            console.error('GET /api/contributions', error);
            const message = error?.message?.includes('BLOB_READ_WRITE_TOKEN')
                ? 'Configure la variable BLOB_READ_WRITE_TOKEN avant de déployer sur Vercel.'
                : 'Impossible de récupérer les souvenirs.';
            res.status(500).json({ message });
        }
        return;
    }

    if (req.method === 'POST') {
        let contribution;
        try {
            const payload = await readBody(req);
            contribution = buildContribution(payload);
        } catch (error) {
            res.status(400).json({ message: error.message || 'Données invalides.' });
            return;
        }

        try {
            const entries = await loadEntries();
            entries.push(contribution);
            await saveEntries(entries);
            res.status(201).json(contribution);
        } catch (error) {
            console.error('POST /api/contributions', error);
            const message = error?.message?.includes('BLOB_READ_WRITE_TOKEN')
                ? 'Configure la variable BLOB_READ_WRITE_TOKEN avant de déployer sur Vercel.'
                : 'Impossible de sauvegarder ce souvenir pour le moment.';
            res.status(500).json({ message });
        }
        return;
    }

    if (req.method === 'DELETE') {
        try {
            await clearEntries();
            await saveEntries([]);
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('DELETE /api/contributions', error);
            const message = error?.message?.includes('BLOB_READ_WRITE_TOKEN')
                ? 'Configure la variable BLOB_READ_WRITE_TOKEN avant de déployer sur Vercel.'
                : 'Impossible de vider le mur actuellement.';
            res.status(500).json({ message });
        }
        return;
    }

    res.setHeader('Allow', 'GET,POST,DELETE,OPTIONS');
    res.status(405).json({ message: 'Méthode non autorisée.' });
};
