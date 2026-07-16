document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const loadingContainer = document.getElementById('loadingContainer');
    const resultContainer = document.getElementById('resultContainer');
    const actionContainer = document.getElementById('actionContainer');
    
    const originalPreview = document.getElementById('originalPreview');
    const resultPreview = document.getElementById('resultPreview');
    
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let processedImageBlob = null;
    let originalFileName = "detoure_pro";

    // Événements d'importation d'image
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImage(e.target.files[0]);
        }
    });

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleImage(e.dataTransfer.files[0]);
        }
    });

    // Traitement de l'image en local sans IA et sans API
    async function handleImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image valide.');
            return;
        }

        originalFileName = file.name.split('.').slice(0, -1).join('.') + '_detoure.png';

        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            
            originalPreview.onload = () => {
                // Afficher le chargement brièvement
                dropZone.classList.add('hidden');
                loadingContainer.classList.remove('hidden');

                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = originalPreview.naturalWidth;
                    canvas.height = originalPreview.naturalHeight;
                    ctx.drawImage(originalPreview, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // 1. Détecter la couleur du fond (on prend le pixel en haut à gauche [0,0])
                    const targetR = data[0];
                    const targetG = data[1];
                    const targetB = data[2];

                    // Seuil de tolérance pour la suppression de couleur (ajustable)
                    const tolerance = 45; 

                    // 2. Parcourir tous les pixels et rendre transparents ceux proches de la couleur cible
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        // Calcul de la différence de couleur (distance euclidienne simple)
                        const diff = Math.sqrt(
                            Math.pow(r - targetR, 2) +
                            Math.pow(g - targetG, 2) +
                            Math.pow(b - targetB, 2)
                        );

                        if (diff < tolerance) {
                            data[i + 3] = 0; // Rendre transparent (Alpha = 0)
                        }
  …
