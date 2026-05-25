const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('current-date').innerText = new Date().toLocaleDateString('fr-FR', dateOptions);

const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"; 
const FREEBOX_API_URL = "http://mafreebox.freebox.fr/api/v3/tv/epg/by_time";

async function fetchTVPrograms() {
    const guideContainer = document.getElementById('tv-guide');
    
    // Créer un mécanisme d'annulation si la Freebox est trop longue à répondre (Timeout de 3s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
        const ceSoir = new Date();
        ceSoir.setHours(21, 0, 0, 0);
        const timestampCeSoir = Math.floor(ceSoir.getTime() / 1000);

        // Appel API avec sécurité Timeout
        const response = await fetch(`${CORS_PROXY}${FREEBOX_API_URL}/${timestampCeSoir}`, { signal: controller.signal });
        clearTimeout(timeoutId); // Tout s'est bien passé, on annule le timeout

        const result = await response.json();

        if (result.success && result.result) {
            renderPrograms(result.result);
        } else {
            throw new Error("Données invalides reçues de Free");
        }

    } catch (error) {
        console.warn("Mode secours activé : Impossible de joindre la Freebox.", error);
        clearTimeout(timeoutId);
        
        // AFFICHAGE DE SECOURS AUTOMATIQUE
        // Permet au site de fonctionner même sans Freebox sous la main
        const fauxProgrammes = [
            { channel_name: "TF1", program: { title: "Dune", date: Date.now()/1000, category_name: "Cinéma", description: "Le chef-d'œuvre de science-fiction de Denis Villeneuve." }},
            { channel_name: "France 2", program: { title: "Crime à l'unisson", date: Date.now()/1000, category_name: "Série", description: "Une enquête exclusive au cœur des Alpes." }},
            { channel_name: "M6", program: { title: "Cauchemar en Cuisine", date: Date.now()/1000, category_name: "Divertissement", description: "Philippe Etchebest vient en aide à un restaurant en détresse." }},
            { channel_name: "Arte", program: { title: "Aux origines de l'humanité", date: Date.now()/1000, category_name: "Documentaire", description: "Une plongée fascinante dans l'histoire de nos ancêtres." }}
        ];
        
        renderPrograms(fauxProgrammes);
    }
}

// Fonction pour injecter les éléments dans le HTML
function renderPrograms(liste) {
    const guideContainer = document.getElementById('tv-guide');
    guideContainer.innerHTML = "";

    liste.forEach(item => {
        const pro = item.program;
        if (!pro) return;

        const card = document.createElement('div');
        card.className = 'tv-card';

        const heureDebut = new Date(pro.date * 1000).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        card.innerHTML = `
            <div class="channel-badge">${item.channel_name || 'Chaîne'}</div>
            <div class="card-content">
                <p class="time">⏰ ${heureDebut}</p>
                <h3>${pro.title}</h3>
                <p><strong>Genre :</strong> ${pro.category_name || 'Inconnu'}</p>
                <p>${pro.description || 'Aucune description disponible.'}</p>
            </div>
        `;
        guideContainer.appendChild(card);
    });
}

window.onload = fetchTVPrograms;
