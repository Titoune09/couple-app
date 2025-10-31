const path = require('path');
const fs = require('fs/promises');
const { buildContribution } = require('../utils/contributionValidation');

const JSON_STORAGE_URL = process.env.JSON_STORAGE_URL;
const JSON_STORAGE_SECRET = process.env.JSON_STORAGE_SECRET;
const DATA_FILE = path.join(__dirname, '..', 'data', 'contributions.json');

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

function useRemoteStorage() {
    return Boolean(JSON_STORAGE_URL);
}

async function readLocalEntries() {
    try {
        const raw = await fs.readFile(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Lecture locale impossible', error);
        return [];
    }
}

async function writeLocalEntries(entries) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

function buildRemoteHeaders(base = {}) {
    const headers = { ...base };
    if (JSON_STORAGE_SECRET) {
        headers['secret-key'] = JSON_STORAGE_SECRET;
    }
    return headers;
}

async function loadEntries() {
    if (!useRemoteStorage()) {
        return readLocalEntries();
    }

    try {
        const response = await fetch(JSON_STORAGE_URL, {
            headers: buildRemoteHeaders({ Accept: 'application/json' }),
            cache: 'no-store'
        });

        if (response.status === 404) {
            return [];
        }

        if (!response.ok) {
            console.error('Réponse de stockage distante invalide', response.status, await response.text());
            throw new Error('Impossible de récupérer les souvenirs distants.');
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Erreur de lecture du stockage distant', error);
        throw new Error("Impossible de récupérer les souvenirs distants.");
    }
}

async function saveEntries(entries) {
    if (!useRemoteStorage()) {
        return writeLocalEntries(entries);
    }

    const response = await fetch(JSON_STORAGE_URL, {
        method: 'PUT',
        headers: buildRemoteHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(entries, null, 2)
    });

    if (!response.ok) {
        console.error('Erreur de sauvegarde distante', response.status, await response.text());
        throw new Error('Impossible de sauvegarder dans le stockage distant.');
    }
}

async function clearEntries() {
    await saveEntries([]);
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
            const message = useRemoteStorage()
                ? 'Impossible de récupérer les souvenirs distants.'
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
            const message = useRemoteStorage()
                ? "Impossible de sauvegarder ce souvenir dans le stockage distant."
                : 'Impossible de sauvegarder ce souvenir pour le moment.';
            res.status(500).json({ message });
        }
        return;
    }

    if (req.method === 'DELETE') {
        try {
            await clearEntries();
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('DELETE /api/contributions', error);
            const message = useRemoteStorage()
                ? 'Impossible de vider le mur dans le stockage distant.'
                : 'Impossible de vider le mur actuellement.';
            res.status(500).json({ message });
        }
        return;
    }

    res.setHeader('Allow', 'GET,POST,DELETE,OPTIONS');
    res.status(405).json({ message: 'Méthode non autorisée.' });
};
