let runesData = [];
let currentSortColumn = null;
let isAscending = true;

// Charger les données des runes
async function loadRunesData() {
    try {
        const response = await fetch('runes/data/runes.json');
        if (!response.ok) throw new Error('Erreur lors du chargement des données');
        runesData = await response.json();
        renderTable();
        setupSortingListeners();
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Sauvegarder le prix dans le localStorage
function savePrice(runeName, price) {
    localStorage.setItem(`rune_price_${runeName}`, price);
}

// Récupérer le prix sauvegardé
function getSavedPrice(runeName) {
    return localStorage.getItem(`rune_price_${runeName}`) || '';
}

// Calculer le ratio prix/densité
function calculateRatio(price, density) {
    if (!price || !density || density === '0' || isNaN(density)) return 'N/A';
    return (parseFloat(price) / parseFloat(density)).toFixed(2);
}

// Mettre à jour le ratio pour une ligne
function updateRatio(row) {
    const price = row.querySelector('input[type="number"]').value;
    const density = row.querySelector('[data-density]').dataset.density;
    const ratioCell = row.querySelector('.ratio');
    ratioCell.textContent = calculateRatio(price, density);
}

// Trier les données
function sortData(column) {
    if (currentSortColumn === column) {
        isAscending = !isAscending;
    } else {
        currentSortColumn = column;
        isAscending = true;
    }

    runesData.sort((a, b) => {
        let valueA, valueB;

        switch(column) {
            case 'item-name':
                valueA = a['item-name'];
                valueB = b['item-name'];
                break;
            case 'densité':
                valueA = parseFloat(a['densité']) || 0;
                valueB = parseFloat(b['densité']) || 0;
                break;
            case 'prix':
                valueA = parseFloat(getSavedPrice(a['item-name'])) || 0;
                valueB = parseFloat(getSavedPrice(b['item-name'])) || 0;
                break;
            case 'ratio':
                const priceA = parseFloat(getSavedPrice(a['item-name'])) || 0;
                const priceB = parseFloat(getSavedPrice(b['item-name'])) || 0;
                valueA = priceA && a['densité'] ? priceA / parseFloat(a['densité']) : 0;
                valueB = priceB && b['densité'] ? priceB / parseFloat(b['densité']) : 0;
                break;
            default:
                return 0;
        }

        if (typeof valueA === 'string') {
            return isAscending ? 
                valueA.localeCompare(valueB) : 
                valueB.localeCompare(valueA);
        }

        return isAscending ? valueA - valueB : valueB - valueA;
    });

    renderTable();
}

// Configurer les écouteurs de tri
function setupSortingListeners() {
    const headers = document.querySelectorAll('#runesTable th');
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            const columns = ['item-name', 'item-name', 'densité', 'prix', 'ratio'];
            sortData(columns[index]);
            
            // Mettre à jour les indicateurs de tri
            headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
            header.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
        });
    });
}

// Créer une ligne de tableau
function createTableRow(rune) {
    const row = document.createElement('tr');
    const savedPrice = getSavedPrice(rune['item-name']);
    
    // Ajuster le chemin de l'image pour pointer vers le dossier runes/assets
    const imagePath = `runes/assets/${rune.image_url.split('/').pop()}`;
    
    row.innerHTML = `
        <td><img src="${imagePath}" alt="${rune['item-name']}"></td>
        <td>${rune['item-name']}</td>
        <td data-density="${rune.densité}">${rune.densité}</td>
        <td><input type="number" min="0" step="any" value="${savedPrice}"></td>
        <td class="ratio">${calculateRatio(savedPrice, rune.densité)}</td>
    `;

    const input = row.querySelector('input');
    input.addEventListener('input', (e) => {
        const price = e.target.value;
        savePrice(rune['item-name'], price);
        updateRatio(row);
    });

    return row;
}

// Afficher le tableau
function renderTable() {
    const tbody = document.querySelector('#runesTable tbody');
    tbody.innerHTML = '';
    runesData.forEach(rune => {
        tbody.appendChild(createTableRow(rune));
    });
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', loadRunesData);