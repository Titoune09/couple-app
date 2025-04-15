// Script pour optimiser les images
// Ce script nécessite Node.js et le package sharp
// Installation: npm install sharp

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, 'assets');
const outputDir = path.join(__dirname, 'assets', 'optimized');

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Fonction pour optimiser une image
async function optimizeImage(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(800, 800, { // Redimensionner à une taille maximale de 800x800
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Compresser en JPEG avec une qualité de 80%
            .toFile(outputPath);
        
        console.log(`Image optimisée: ${path.basename(inputPath)}`);
        
        // Afficher les tailles avant/après
        const originalSize = fs.statSync(inputPath).size;
        const optimizedSize = fs.statSync(outputPath).size;
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
        
        console.log(`  Taille originale: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`  Taille optimisée: ${(optimizedSize / 1024).toFixed(2)} KB`);
        console.log(`  Réduction: ${reduction}%`);
    } catch (error) {
        console.error(`Erreur lors de l'optimisation de ${inputPath}:`, error);
    }
}

// Fonction principale
async function main() {
    const files = fs.readdirSync(assetsDir);
    
    for (const file of files) {
        if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
            const inputPath = path.join(assetsDir, file);
            const outputPath = path.join(outputDir, file.replace(/\.[^.]+$/, '.jpg'));
            
            await optimizeImage(inputPath, outputPath);
        }
    }
    
    console.log('Optimisation terminée !');
}

// Exécuter le script
main().catch(console.error); 