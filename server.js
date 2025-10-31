const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { buildContribution } = require('./utils/contributionValidation');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'contributions.json');

function ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
    }
}

async function readContributions() {
    try {
        const raw = await fsp.readFile(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (error) {
        console.error('Erreur de lecture des contributions', error);
    }
    return [];
}

async function writeContributions(entries) {
    await fsp.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

ensureStorage();

app.use(express.json({ limit: '30mb' }));
app.use(express.static(path.join(__dirname, 'JNFGKML')));

app.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, 'JNFGKML', 'help.html'));
});

app.get('/api/contributions', async (req, res) => {
    const entries = await readContributions();
    res.json(entries);
});

app.post('/api/contributions', async (req, res) => {
    let contribution;

    try {
        contribution = buildContribution(req.body || {});
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    try {
        const entries = await readContributions();
        entries.push(contribution);
        await writeContributions(entries);
        res.status(201).json(contribution);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde', error);
        res.status(500).json({ message: 'Impossible de sauvegarder ce souvenir pour le moment.' });
    }
});

app.delete('/api/contributions', async (req, res) => {
    try {
        await writeContributions([]);
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation', error);
        res.status(500).json({ message: 'Impossible de vider le mur actuellement.' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'JNFGKML', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur prêt sur http://localhost:${PORT}`);
});
