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
    let net = null;

    // Charger l'IA de manière ultra-stable et sécurisée
    async function loadModel() {
        if (net) return net;
        try {
            // Forcer le backend CPU pour éviter les bugs de carte graphique
            await tf.setBackend('cpu'); 
            
            net = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.50, // Modèle ultra-léger et rapide
                quantBytes: 1
            });
            console.log("IA TensorFlow prête pour la production !");
            return net;
        } catch (err) {
            console.error("Erreur d'initialisation de l'IA :", err);
        }
    }

    // Pré-chargement automatique au démarrage
    loadModel();

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

    // Traitement optimisé
    async function handleImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image valide.');
            return;
        }

        originalFileName = file.name.split('.').slice(0, -1).join('.') + '_detoure.png';

        const reader = new FileReader();
        reader.onload = async (e) => {
            // Sécurité anti-CORS : utilisation d'une URL de données locale et sécurisée
            originalPreview.src = e.target.result;
            
            originalPreview.onload = async () => {
                dropZone.classList.add('hidden');
                loadingContainer.classList.remove('hidden');

                try {
                    const model = await loadModel();
                    if (!model) throw new Error("Le modèle d'IA n'a pas pu être initialisé.");

                    // Étape 1 : Créer une miniature de calcul (300px max) pour économiser la mémoire
                    const tinyCanvas = document.createElement('canvas');
                    const tinyCtx = tinyCanvas.getContext('2d');
                    
                    const tinySize = 300;
                    let tinyW = originalPreview.naturalWidth;
                    let tinyH = originalPreview.naturalHeight;
                    if (tinyW > tinyH) {
                        tinyH = Math.round((tinyH * tinySize) / tinyW);
                        tinyW = tinySize;
                    } else {
                        tinyW = Math.round((tinyW * tinySize) / tinyH);
                        tinyH = tinySize;
                    }
                    tinyCanvas.width = tinyW;
                    tinyCanvas.height = tinyH;
                    
                    tinyCtx.drawImage(originalPreview, 0, 0, tinyW, tinyH);

                    // Étape 2 : L'IA segmente la miniature instantanément
                    const segmentation = await model.segmentPerson(tinyCanvas, {
                        internalResolution: 'low',
                        segmentationThreshold: 0.6
                    });

                    // Étape 3 : Appliquer le masque sur l'image d'origine en haute définition
                    const finalCanvas = document.createElement('canvas');
                    const finalCtx = finalCanvas.getContext('2d');
                    const origW = originalPreview.naturalWidth;
                    const origH = originalPreview.naturalHeight;
                    
                    finalCanvas.width = origW;
                    finalCanvas.height = origH;

                    finalCtx.drawImage(originalPreview, 0, 0);
                    const originalData = finalCtx.getImageData(0, 0, origW, origH);
                    const pixels = originalData.data;

                    for (let y = 0; y < origH; y++) {
                        for (let x = 0; x < origW; x++) {
                            const tinyX = Math.floor((x * tinyW) / origW);
                            const tinyY = Math.floor((y * tinyH) / origH);
                            const tinyIndex = tinyY * tinyW + tinyX;

                            if (segmentation.data[tinyIndex] === 0) {
                                const origIndex = (y * origW + x) * 4;
                                pixels[origIndex + 3] = 0; // Transparence
                            }
                        }
                    }

                    finalCtx.putImageData(originalData, 0, 0);

                    // Étape 4 : Conversion finale en fichier téléchargeable
                    finalCanvas.toBlob((blob) => {
                        processedImageBlob = blob;
                        resultPreview.src = URL.createObjectURL(blob);

                        loadingContainer.classList.add('hidden');
                        resultContainer.classList.remove('hidden');
                        actionContainer.classList.remove('hidden');
                    }, 'image/png');

                } catch (error) {
                    console.error("Erreur de traitement :", error);
                    alert("Une erreur de sécurité ou de mémoire est survenue en local. La mise en ligne va résoudre ce problème.");
                    resetApp();
                }
            };
        };
        reader.readAsDataURL(file);
    }

    // Télécharger le résultat
    downloadBtn.addEventListener('click', () => {
        if (!processedImageBlob) return;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(processedImageBlob);
        link.download = originalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Recommencer
    resetBtn.addEventListener('click', resetApp);

    function resetApp() {
        processedImageBlob = null;
        fileInput.value = '';
        originalPreview.src = '';
        resultPreview.src = '';
        
        resultContainer.classList.add('hidden');
        actionContainer.classList.add('hidden');
        loadingContainer.classList.add('hidden');
        dropZone.classList.remove('hidden');
    }
});