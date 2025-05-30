/**
 * Dressage Calculator - Logica di calcolo per le tabelle di valutazione
 * Gestisce i calcoli per múltiples riprese con supporto per multipli binomi
 */

// Configurazione delle riprese (numero di figure per test)
const DRESSAGE_CONFIG = {
    e100: { figureCount: 4, maxScore: 10 },
    e200: { figureCount: 16, maxScore: 10 },
    f100: { figureCount: 24, maxScore: 10 },
    f400: { figureCount: 31, maxScore: 10 },
    m_junior: { figureCount: 31, maxScore: 10 },
    grand_prix_d51: { figureCount: 35, maxScore: 10 },
    intermediate_a_d41: { figureCount: 29, maxScore: 10 },
    st_georges_d2: { figureCount: 28, maxScore: 10 },
    m100: { figureCount: 25, maxScore: 10 },
    novilla2025: { figureCount: 25, maxScore: 10 },
    primera2025: { figureCount: 26, maxScore: 10 },
    rlm_ibiza: { figureCount: 18, maxScore: 10 },
    rlm_bailarina: { figureCount: 23, maxScore: 10 },
    rlm_carmencita: { figureCount: 23, maxScore: 10 },
    rlm_fandango: { figureCount: 23, maxScore: 10 },
    rlm_flamenca: { figureCount: 23, maxScore: 10 },
    rlm_iberica: { figureCount: 23, maxScore: 10 },
    rlm_lusitania: { figureCount: 23, maxScore: 10 },
    arte_eleganza: { figureCount: 14, maxScore: 10 } // Nuova scheda
};

// window.DEFAULT_COEFFICIENTS è definito globalmente in index.html

let binomiData = [];
let currentBinomioIndex = 0;

function initializeDressageCalculator() {
    initializeBinomi();
    Object.keys(DRESSAGE_CONFIG).forEach(testType => {
        if (document.getElementById(testType)) {
            calculateTotals(testType);
        }
    });
    addInputValidation();
    updateBinomioInterface();
    console.log('Dressage Calculator inizializzato per tutte le riprese.');
}

function initializeBinomi() {
    if (binomiData.length === 0) {
        binomiData.push(createEmptyBinomio());
        currentBinomioIndex = 0;
    }
}

function createEmptyBinomio() {
    const binomio = {
        id: generateBinomioId(),
        riderName: '',
        riderSurname: '',
        horseName: '',
    };
    Object.keys(DRESSAGE_CONFIG).forEach(testType => {
        binomio[testType] = {};
        for (let i = 1; i <= DRESSAGE_CONFIG[testType].figureCount; i++) {
            binomio[testType][`figure${i}`] = {
                coeff: getDefaultCoeff(testType, i),
                judgeA: '', judgeB: '', judgeC: ''
            };
        }
    });
    return binomio;
}

function generateBinomioId() {
    return 'binomio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function addNewBinomio() {
    saveBinomioData();
    binomiData.push(createEmptyBinomio());
    currentBinomioIndex = binomiData.length - 1;
    loadBinomioData();
    updateBinomioInterface();
    showNotification('Nuovo binomio aggiunto', 'success');
}

function previousBinomio() {
    if (currentBinomioIndex > 0) {
        saveBinomioData();
        currentBinomioIndex--;
        loadBinomioData();
        updateBinomioInterface();
    }
}

function nextBinomio() {
    if (currentBinomioIndex < binomiData.length - 1) {
        saveBinomioData();
        currentBinomioIndex++;
        loadBinomioData();
        updateBinomioInterface();
    }
}

function deleteBinomio() {
    if (binomiData.length <= 1) {
        showNotification('Non puoi eliminare l\'ultimo binomio', 'warning');
        return;
    }
    const currentBinomioObj = binomiData[currentBinomioIndex];
    const binomioName = getBinomioDisplayName(currentBinomioObj);
    if (!confirm(`Sei sicuro di voler eliminare il binomio "${binomioName}"?`)) {
        return;
    }
    binomiData.splice(currentBinomioIndex, 1);
    if (currentBinomioIndex >= binomiData.length) {
        currentBinomioIndex = binomiData.length - 1;
    }
    loadBinomioData();
    updateBinomioInterface();
    showNotification('Binomio eliminato', 'success');
}

function saveBinomioData() {
    if (currentBinomioIndex < 0 || currentBinomioIndex >= binomiData.length) return;
    const currentBinomio = binomiData[currentBinomioIndex];

    currentBinomio.riderName = document.getElementById('riderName')?.value || '';
    currentBinomio.riderSurname = document.getElementById('riderSurname')?.value || '';
    currentBinomio.horseName = document.getElementById('horseName')?.value || '';

    Object.keys(DRESSAGE_CONFIG).forEach(testType => {
        if (!currentBinomio[testType]) currentBinomio[testType] = {};
        for (let i = 1; i <= DRESSAGE_CONFIG[testType].figureCount; i++) {
            if (!currentBinomio[testType][`figure${i}`]) currentBinomio[testType][`figure${i}`] = {};
            currentBinomio[testType][`figure${i}`].coeff = document.getElementById(`${testType}_coeff${i}`)?.value || getDefaultCoeff(testType, i);
            currentBinomio[testType][`figure${i}`].judgeA = document.getElementById(`${testType}_judgeA${i}`)?.value || '';
            currentBinomio[testType][`figure${i}`].judgeB = document.getElementById(`${testType}_judgeB${i}`)?.value || '';
            currentBinomio[testType][`figure${i}`].judgeC = document.getElementById(`${testType}_judgeC${i}`)?.value || '';
        }
    });
}

function getDefaultCoeff(testType, figureIndex) {
    if (window.DEFAULT_COEFFICIENTS && window.DEFAULT_COEFFICIENTS[testType] && window.DEFAULT_COEFFICIENTS[testType][figureIndex]) {
        return window.DEFAULT_COEFFICIENTS[testType][figureIndex].toString();
    }
    return '1';
}

function loadBinomioData() {
    if (currentBinomioIndex < 0 || currentBinomioIndex >= binomiData.length) return;
    const currentBinomio = binomiData[currentBinomioIndex];

    document.getElementById('riderName').value = currentBinomio.riderName || '';
    document.getElementById('riderSurname').value = currentBinomio.riderSurname || '';
    document.getElementById('horseName').value = currentBinomio.horseName || '';

    Object.keys(DRESSAGE_CONFIG).forEach(testType => {
        if (!currentBinomio[testType]) {
            currentBinomio[testType] = {}; // Inizializza se non presente (es. caricamento da file vecchio)
        }
        for (let i = 1; i <= DRESSAGE_CONFIG[testType].figureCount; i++) {
            if (!currentBinomio[testType][`figure${i}`]) { // Inizializza figura se non presente
                 currentBinomio[testType][`figure${i}`] = {
                    coeff: getDefaultCoeff(testType, i), judgeA: '', judgeB: '', judgeC: ''
                };
            }
            const figureData = currentBinomio[testType][`figure${i}`];
            const coeffInput = document.getElementById(`${testType}_coeff${i}`);
            const judgeAInput = document.getElementById(`${testType}_judgeA${i}`);
            const judgeBInput = document.getElementById(`${testType}_judgeB${i}`);
            const judgeCInput = document.getElementById(`${testType}_judgeC${i}`);

            if (coeffInput && judgeAInput && judgeBInput && judgeCInput) {
                coeffInput.value = figureData?.coeff || getDefaultCoeff(testType, i);
                judgeAInput.value = figureData?.judgeA || '';
                judgeBInput.value = figureData?.judgeB || '';
                judgeCInput.value = figureData?.judgeC || '';
            }
        }
    });

    Object.keys(DRESSAGE_CONFIG).forEach(testType => {
        if (document.getElementById(testType)) {
            calculateTotals(testType);
        }
    });
    addInputValidation();
}


function updateBinomioInterface() {
    document.getElementById('currentBinomio').textContent = currentBinomioIndex + 1;
    document.getElementById('totalBinomi').textContent = binomiData.length;

    const currentBinomioObj = binomiData[currentBinomioIndex];
    const displayName = getBinomioDisplayName(currentBinomioObj);

    Object.keys(DRESSAGE_CONFIG).forEach(testType => {
        const titleElement = document.getElementById(`${testType}-binomio-title`);
        if (titleElement) {
            let tabName = testType.toUpperCase().replace(/_/g, ' ');
            const tabButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => btn.getAttribute('onclick') === `showTab('${testType}')`);
            if (tabButton) tabName = tabButton.textContent;
            titleElement.textContent = `${displayName} - ${tabName}`;
        }
    });

    document.getElementById('prevBtn').disabled = currentBinomioIndex === 0;
    document.getElementById('nextBtn').disabled = currentBinomioIndex === binomiData.length - 1;
    document.getElementById('deleteBtn').disabled = binomiData.length <= 1;
}

function getBinomioDisplayName(binomio) {
    if (!binomio) return `Binomio ${currentBinomioIndex + 1}`;
    if (binomio.riderName || binomio.riderSurname || binomio.horseName) {
        const parts = [binomio.riderName, binomio.riderSurname, binomio.horseName ? `(${binomio.horseName})` : '']
            .filter(Boolean).join(' ');
        return parts || `Binomio ${currentBinomioIndex + 1}`;
    }
    return `Binomio ${currentBinomioIndex + 1}`;
}

function updateBinomioData() {
    saveBinomioData();
    updateBinomioInterface();
}

function showTab(tabId) {
    saveBinomioData();
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active');
    const activeButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => btn.getAttribute('onclick') === `showTab('${tabId}')`);
    if (activeButton) activeButton.classList.add('active');
    
    if (document.getElementById(tabId)) {
        calculateTotals(tabId);
    }
}

function calculateTotals(testType) {
    if (!DRESSAGE_CONFIG[testType]) return;
    const config = DRESSAGE_CONFIG[testType];
    let totalA = 0, totalB = 0, totalC = 0, maxPossible = 0;

    for (let i = 1; i <= config.figureCount; i++) {
        const coeffEl = document.getElementById(`${testType}_coeff${i}`);
        if (!coeffEl) continue;

        const coeff = parseFloat(coeffEl.value) || 1;
        const scoreA = parseFloat(document.getElementById(`${testType}_judgeA${i}`)?.value) || 0;
        const scoreB = parseFloat(document.getElementById(`${testType}_judgeB${i}`)?.value) || 0;
        const scoreC = parseFloat(document.getElementById(`${testType}_judgeC${i}`)?.value) || 0;
        totalA += scoreA * coeff;
        totalB += scoreB * coeff;
        totalC += scoreC * coeff;
        maxPossible += config.maxScore * coeff;
    }
    updateTotalElements(testType, totalA, totalB, totalC, maxPossible);
}

function updateTotalElements(testType, totalA, totalB, totalC, maxPossible) {
    const totalAEl = document.getElementById(`${testType}_totalA`);
    if(totalAEl) totalAEl.textContent = totalA.toFixed(1);
    const totalBEl = document.getElementById(`${testType}_totalB`);
    if(totalBEl) totalBEl.textContent = totalB.toFixed(1);
    const totalCEl = document.getElementById(`${testType}_totalC`);
    if(totalCEl) totalCEl.textContent = totalC.toFixed(1);

    const activeJudges = getActiveJudges(testType);
    const judgeCount = activeJudges.length;
    let sumTotals = 0;
    if (activeJudges.includes('A')) sumTotals += totalA;
    if (activeJudges.includes('B')) sumTotals += totalB;
    if (activeJudges.includes('C')) sumTotals += totalC;

    const average = judgeCount > 0 ? sumTotals / judgeCount : 0;
    const avgEl = document.getElementById(`${testType}_avgTotal`);
    if(avgEl) avgEl.textContent = average.toFixed(1);

    const percentage = maxPossible > 0 ? (average / maxPossible) * 100 : 0;
    const percEl = document.getElementById(`${testType}_percentage`);
    if(percEl) percEl.textContent = percentage.toFixed(1) + '%';
}

function getActiveJudges(testType) {
    const config = DRESSAGE_CONFIG[testType];
    if (!config) return [];
    const active = new Set();
    for (let i = 1; i <= config.figureCount; i++) {
        if (document.getElementById(`${testType}_judgeA${i}`) && parseFloat(document.getElementById(`${testType}_judgeA${i}`).value) > 0) active.add('A');
        if (document.getElementById(`${testType}_judgeB${i}`) && parseFloat(document.getElementById(`${testType}_judgeB${i}`).value) > 0) active.add('B');
        if (document.getElementById(`${testType}_judgeC${i}`) && parseFloat(document.getElementById(`${testType}_judgeC${i}`).value) > 0) active.add('C');
    }
    return Array.from(active);
}

function addInputValidation() {
    document.querySelectorAll('input[type="number"][id*="judge"]').forEach(input => {
        input.addEventListener('input', function() { validateScoreInput(this); });
        input.addEventListener('blur', function() { formatScoreInput(this); });
    });
    document.querySelectorAll('input[type="number"][id*="coeff"]').forEach(input => {
        input.addEventListener('input', function() { validateCoeffInput(this); });
    });
}

function validateScoreInput(input) {
    let value = parseFloat(input.value);
    if (isNaN(value)) { input.style.borderColor = '#dadce0'; return; }
    value = Math.max(0, Math.min(10, value));
    
    if (value >= 8) input.style.borderColor = '#34a853';
    else if (value >= 6) input.style.borderColor = '#fbbc04';
    else if (value > 0) input.style.borderColor = '#ea4335';
    else input.style.borderColor = '#dadce0';
}

function formatScoreInput(input) {
    const value = parseFloat(input.value);
    if (!isNaN(value)) input.value = value.toFixed(1);
    else input.value = '';
}

function validateCoeffInput(input) {
    let value = parseInt(input.value);
    value = Math.max(1, Math.min(10, value || 1)); 
    input.value = value;
    if (value >= 4) input.style.borderColor = '#1a73e8'; 
    else if (value === 3) input.style.borderColor = '#ea4335';
    else if (value === 2) input.style.borderColor = '#fbbc04';
    else input.style.borderColor = '#34a853';
}

function clearCurrentBinomio() {
    const currentBinomioObj = binomiData[currentBinomioIndex];
    const binomioName = getBinomioDisplayName(currentBinomioObj);
    if (!confirm(`Sei sicuro di voler cancellare tutti i dati del binomio "${binomioName}"?`)) return;

    document.querySelectorAll('input[type="number"][id*="judge"]').forEach(input => { input.value = ''; input.style.borderColor = '#dadce0'; });
    document.getElementById('riderName').value = '';
    document.getElementById('riderSurname').value = '';
    document.getElementById('horseName').value = '';
    resetCoefficients();
    saveBinomioData();
    Object.keys(DRESSAGE_CONFIG).forEach(testType => { if(document.getElementById(testType)) calculateTotals(testType);});
    updateBinomioInterface();
    showNotification('Dati del binomio cancellati', 'success');
}

function clearAllBinomi() {
    if (!confirm('Sei sicuro di voler cancellare TUTTI i binomi? Questa operazione non può essere annullata.')) return;
    binomiData = [createEmptyBinomio()];
    currentBinomioIndex = 0;
    loadBinomioData();
    updateBinomioInterface();
    showNotification('Tutti i binomi sono stati cancellati', 'success');
}

function resetCoefficients() {
    Object.keys(DRESSAGE_CONFIG).forEach(testType => {
        for (let i = 1; i <= DRESSAGE_CONFIG[testType].figureCount; i++) {
            const coeffElement = document.getElementById(`${testType}_coeff${i}`);
            if (coeffElement) {
                coeffElement.value = getDefaultCoeff(testType, i);
                validateCoeffInput(coeffElement);
            }
        }
    });
}

function getAllBinomiData() {
    saveBinomioData();
    return {
        binomi: binomiData,
        currentIndex: currentBinomioIndex,
        timestamp: new Date().toISOString(),
        version: '3.3', // Versione per Arte Eleganza
        totalBinomi: binomiData.length
    };
}

function loadAllBinomiData(data) {
    if (!data || typeof data !== 'object' || !data.binomi || !Array.isArray(data.binomi)) {
        console.error('Dati non validi per il caricamento');
        return false;
    }
    try {
        binomiData = data.binomi.map(b => {
            const newBinomioData = { ...b };
            Object.keys(DRESSAGE_CONFIG).forEach(testType => {
                if (!newBinomioData[testType]) newBinomioData[testType] = {};
                for (let i = 1; i <= DRESSAGE_CONFIG[testType].figureCount; i++) {
                    if (!newBinomioData[testType][`figure${i}`]) {
                        newBinomioData[testType][`figure${i}`] = { coeff: getDefaultCoeff(testType, i), judgeA: '', judgeB: '', judgeC: '' };
                    } else if (typeof newBinomioData[testType][`figure${i}`].coeff === 'undefined') {
                        newBinomioData[testType][`figure${i}`].coeff = getDefaultCoeff(testType, i);
                    }
                }
            });
            return newBinomioData;
        });
        currentBinomioIndex = Math.min(data.currentIndex || 0, binomiData.length - 1);
        if(currentBinomioIndex < 0 && binomiData.length > 0) currentBinomioIndex = 0;
        else if (binomiData.length === 0) initializeBinomi();

        loadBinomioData();
        updateBinomioInterface();
        console.log(`Caricati ${binomiData.length} binomi`);
        return true;
    } catch (error) {
        console.error('Errore durante il caricamento dei dati binomi:', error);
        initializeBinomi();
        loadBinomioData();
        updateBinomioInterface();
        return false;
    }
}

function getAllData() { return getAllBinomiData(); }
function loadAllData(data) { return loadAllBinomiData(data); }

document.addEventListener('DOMContentLoaded', initializeDressageCalculator);

// Esponi le funzioni e le variabili necessarie globalmente
window.DRESSAGE_CONFIG = DRESSAGE_CONFIG; // Già globale per effetto di const fuori da funzioni
// window.DEFAULT_COEFFICIENTS è già definito globalmente in index.html e usato qui

window.binomiData = binomiData; // Rendi accessibile l'array dei dati
window.currentBinomioIndex = currentBinomioIndex; // E l'indice corrente

window.getAllBinomiData = getAllBinomiData;
window.loadAllBinomiData = loadAllBinomiData;
window.saveBinomioData = saveBinomioData;
window.getBinomioDisplayName = getBinomioDisplayName;
window.calculateBinomioTotals = calculateBinomioTotals; // <-- QUESTA È LA CHIAVE PER L'ERRORE
window.getDefaultCoeff = getDefaultCoeff; // Anche questa è utile globalmente
window.hasExistingBinomiData = hasExistingBinomiData; // Funzione usata da file-manager

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initializeDressageCalculator);
