// Afficher la date du jour automatiquement
const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('current-date').innerText = new Date().toLocaleDateString('fr-FR', dateOptions);

// Utilisation d'un proxy CORS gratuit pour pouvoir interroger la Freebox depuis le navigateur
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"; 
const FREEBOX_API_URL = "http://mafreebox.freebox.fr/api/v3/tv/epg/by_time";

async function fetchTVPrograms() {
    const guideContainer = document.getElementById('tv-guide');
    
    try {
        // 1. Définir l'heure cible (ex: ce soir à 21h00 / 9h de soir)
        const ceSoir = new Date();
        ceSoir.setHours(21, 0, 0, 0);
        const timestampCeSoir = Math.floor(ceSoir.getTime() / 1000);

        // 2. Appel à l'API Freebox (via le proxy)
        // Note : Si le proxy bloque, vous pouvez tester temporairement sans "CORS_PROXY +" si vous lancez votre site localement
        const response = await fetch(`${CORS_PROXY}${FREEBOX_API_URL}/${timestampCeSoir}`);
        
        if (!response.ok) {
            throw new Error("Impossible de joindre l'API Freebox");
        }

        const result = await response.json();

        // La Freebox renvoie un objet avec "success: true" et les données dans "result"
        if (result.success && result.result) {
            const programmes = result.result;

            // On trie ou filtre pour ne garder que les chaînes principales si nécessaire
            // Ici on nettoie le conteneur
            guideContainer.innerHTML = "";

            if (programmes.length === 0) {
                guideContainer.innerHTML = "<p class='loading'>Aucun programme trouvé pour cette heure.</p>";
                return;
            }

            // 3. Boucle pour afficher chaque programme de l'API
            programmes.forEach(item => {
                // L'API Freebox donne les infos du programme dans 'program' et les infos de la chaîne à la racine
                const programmeInfo = item.program;
                
                if (!programmeInfo) return; // Si pas de programme sur cette chaîne à cette heure, on passe

                const card = document.createElement('div');
                card.className = 'tv-card';

                // Formater l'heure de début du programme
                const heureDebut = new Date(programmeInfo.date * 1000).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                card.innerHTML = `
                    <div class="channel-badge">${item.channel_name || 'Chaîne'}</div>
                    <div class="card-content">
                        <p class="time">⏰ ${heureDebut}</p>
                        <h3>${programmeInfo.title}</h3>
                        ${programmeInfo.sub_title ? `<h4>${programmeInfo.sub_title}</h4>` : ''}
                        <p><strong>Genre :</strong> ${programmeInfo.category_name || 'Inconnu'}</p>
                        <p>${programmeInfo.description || 'Aucune description disponible.'}</p>
                    </div>
                `;
                guideContainer.appendChild(card);
            });
        } else {
            document.getElementById('tv-guide').innerHTML = "<p class='loading'>Erreur lors de la lecture des données Freebox.</p>";
        }

    } catch (error) {
        console.error("Erreur API Freebox :", error);
        document.getElementById('tv-guide').innerHTML = `
            <div class="loading">
                <p>⚠️ Erreur de connexion à la Freebox.</p>
                <p style="font-size: 0.9rem; color: #cc5555;">
                    Vérifiez que vous êtes bien connecté au Wi-Fi de votre Freebox.<br>
                    Si le problème persiste, le proxy CORS est peut-être saturé.
                </p>
            </div>
        `;
    }
}

// Lancer le chargement au démarrage de la page
window.onload = fetchTVPrograms;