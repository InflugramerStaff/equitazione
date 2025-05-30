/**
 * File Manager per Dressage Calculator
 * Gestisce salvataggio, caricamento e auto-salvataggio dei dati per multipli binomi
 */

const FILE_MANAGER_CONFIG = {
    autoSaveKey: 'dressage_autosave_data_v3.3',
    autoSaveInterval: 30000,
    filePrefix: 'dressage_binomi_',
    fileExtension: '.json'
};

// --- Inizio Sezione Duplicata/Adattata da dressage-calculator.js per l'uso locale in file-manager.js ---
// Queste costanti e funzioni sono usate specificamente dalle funzioni di esportazione CSV (exportSummary, exportSingleBinomio)
// per garantire che abbiano le loro dipendenze senza problemi di scope o timing con lo script principale.

const DRESSAGE_CONFIG_FM = {
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
    arte_eleganza: { figureCount: 14, maxScore: 10 }
};

const DEFAULT_COEFFICIENTS_FM = {
    e100: {},
    e200: {6:2, 9:2, 14:2, 15:2, 16:2},
    f100: {12:2, 15:2, 22:2, 23:2},
    f400: {4:2, 7:2, 12:2, 18:2, 23:2, 25:2, 29:2, 30:2},
    m_junior: {5:2, 11:2, 14:2, 30:2},
    grand_prix_d51: {3:2, 4:2, 8:2, 11:2, 12:2, 15:2, 22:2, 23:2, 24:2, 26:2, 30:2, 34:2},
    intermediate_a_d41: {4:2, 9:2, 10:2, 18:2, 22:2, 28:2},
    st_georges_d2: {5:2, 10:2, 13:2, 14:2, 18:2, 20:2, 27:2},
    m100: {5:2, 9:2, 11:2, 12:2, 15:2, 18:2, 23:2, 24:2},
    novilla2025: {21:2, 22:2, 23:2, 24:2, 25:2},
    primera2025: {22:2, 23:2, 24:2, 25:2, 26:2},
    rlm_ibiza: {1:2, 6:2, 7:2, 12:2, 13:2, 17:10, 18:10},
    rlm_bailarina: {2:2, 11:2, 12:2, 13:2, 14:2, 19:4, 20:4, 21:4, 22:4, 23:4},
    rlm_carmencita: {1:2, 4:2, 5:2, 13:2, 14:2, 15:2, 19:4, 20:4, 21:4, 22:4, 23:4},
    rlm_fandango: {2:2, 6:2, 7:2, 12:2, 13:2, 19:4, 20:4, 21:4, 22:4, 23:4},
    rlm_flamenca: {1:2, 5:2, 6:2, 12:2, 13:2, 19:4, 20:4, 21:4, 22:4, 23:4},
    rlm_iberica: {2:2, 11:2, 12:2, 13:2, 14:2, 19:4, 20:4, 21:4, 22:4, 23:4},
    rlm_lusitania: {2:2, 6:2, 7:2, 13:2, 14:2, 19:4, 20:4, 21:4, 22:4, 23:4},
    arte_eleganza: {3:2, 10:2}
};

function fm_getDefaultCoeff(testType, figureIndex) {
    if (DEFAULT_COEFFICIENTS_FM[testType] && DEFAULT_COEFFICIENTS_FM[testType][figureIndex]) {
        return DEFAULT_COEFFICIENTS_FM[testType][figureIndex].toString();
    }
    return '1';
}

function fm_getBinomioDisplayName(binomio) {
    // Se currentBinomioIndex non è disponibile globalmente qui, potremmo doverlo passare o gestire diversamente.
    // Per ora, assumiamo che il nome del binomio sia nel suo oggetto.
    const defaultName = "Binomio Sconosciuto"; // Fallback se non possiamo ottenere l'indice globale
    if (!binomio) return defaultName;
    if (binomio.riderName || binomio.riderSurname || binomio.horseName) {
        const parts = [binomio.riderName, binomio.riderSurname, binomio.horseName ? `(${binomio.horseName})` : '']
            .filter(Boolean).join(' ');
        return parts || defaultName;
    }
    return defaultName;
}

function fm_calculateBinomioTotals(binomio, testType) {
    if (!binomio || !binomio[testType] || !DRESSAGE_CONFIG_FM[testType]) {
        return { totalA: '0.0', totalB: '0.0', totalC: '0.0', average: '0.0', percentage: '0.0', activeJudges: [] };
    }
    const config = DRESSAGE_CONFIG_FM[testType];
    let totalA = 0, totalB = 0, totalC = 0, maxPossible = 0;
    const activeJudgesSet = new Set();

    for (let i = 1; i <= config.figureCount; i++) {
        const figure = binomio[testType][`figure${i}`];
        if (figure) {
            const coeff = parseFloat(figure.coeff || fm_getDefaultCoeff(testType, i));
            const scoreA = parseFloat(figure.judgeA) || 0;
            const scoreB = parseFloat(figure.judgeB) || 0;
            const scoreC = parseFloat(figure.judgeC) || 0;

            totalA += scoreA * coeff;
            totalB += scoreB * coeff;
            totalC += scoreC * coeff;
            maxPossible += config.maxScore * coeff;

            if (scoreA > 0) activeJudgesSet.add('A');
            if (scoreB > 0) activeJudgesSet.add('B');
            if (scoreC > 0) activeJudgesSet.add('C');
        }
    }
    const activeJudges = Array.from(activeJudgesSet);
    let sumTotals = 0;
    if (activeJudges.includes('A')) sumTotals += totalA;
    if (activeJudges.includes('B')) sumTotals += totalB;
    if (activeJudges.includes('C')) sumTotals += totalC;

    const average = activeJudges.length > 0 ? sumTotals / activeJudges.length : 0;
    const percentage = maxPossible > 0 ? (average / maxPossible) * 100 : 0;

    return {
        totalA: totalA.toFixed(1), totalB: totalB.toFixed(1), totalC: totalC.toFixed(1),
        average: average.toFixed(1), percentage: percentage.toFixed(1), activeJudges
    };
}
// --- Fine Sezione Duplicata/Adattata ---


let autoSaveEnabled = false;
let autoSaveTimer = null;
let lastSaveTime = null;

function initializeFileManager() {
    checkAutoSavedData();
    setupAutoSaveListeners();
    console.log('File Manager inizializzato.');
}

function saveToFile() {
    try {
        const data = window.getAllBinomiData();
        data.metadata = {
            savedAt: new Date().toISOString(),
            version: '3.3',
            application: 'Dressage Calculator - Multi Binomi',
            totalBinomi: data.totalBinomi,
            description: 'File contenente tutti i dati dei binomi per le riprese di dressage.'
        };
        const jsonString = JSON.stringify(data, null, 2);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `${FILE_MANAGER_CONFIG.filePrefix}${timestamp}${FILE_MANAGER_CONFIG.fileExtension}`;
        downloadFile(jsonString, filename, 'application/json');
        lastSaveTime = new Date();
        showNotification(`${data.totalBinomi} binomi salvati con successo!`, 'success');
    } catch (error) {
        console.error('Errore durante il salvataggio:', error);
        showNotification('Errore durante il salvataggio del file', 'error');
    }
}

function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.json')) {
        showNotification('Seleziona un file JSON valido', 'error');
        if(file) event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            if (validateBinomiFileData(jsonData)) {
                if (window.hasExistingBinomiData() && !confirm('Questo sovrascriverà tutti i binomi esistenti. Continuare?')) {
                    event.target.value = '';
                    return;
                }
                if (window.loadAllBinomiData(jsonData)) {
                    const binomiCount = jsonData.totalBinomi || jsonData.binomi?.length || 0;
                    showNotification(`${binomiCount} binomi caricati con successo!`, 'success');
                } else {
                    showNotification('Errore durante il caricamento dei dati.', 'error');
                }
            } else {
                showNotification('File non valido o formato non compatibile.', 'error');
            }
        } catch (error) {
            console.error('Errore durante la lettura del file:', error);
            showNotification('Errore durante la lettura del file JSON.', 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.onerror = function() {
        showNotification('Errore durante la lettura del file.', 'error');
        event.target.value = '';
    };
    reader.readAsText(file);
}

function exportSummary() {
    try {
        window.saveBinomioData();
        const data = window.getAllBinomiData();
        let csvContent = `RIASSUNTO DETTAGLIATO BINOMI DRESSAGE\n`;
        csvContent += `Data Export: ${new Date().toLocaleString()}\n`;
        csvContent += `Totale Binomi: ${data.totalBinomi}\n\n`;

        data.binomi.forEach((binomio, binomioIndex) => {
            const binomioDisplayName = fm_getBinomioDisplayName(binomio); // Usa la funzione locale fm_

            csvContent += `---------------------------------------------------\n`;
            csvContent += `BINOMIO ${binomioIndex + 1}: ${binomioDisplayName}\n`;
            csvContent += `---------------------------------------------------\n\n`;

            Object.keys(DRESSAGE_CONFIG_FM).forEach(testType => { // Usa la copia locale DRESSAGE_CONFIG_FM
                let hasDataForTest = false;
                if (binomio[testType]) {
                    for (let i = 1; i <= DRESSAGE_CONFIG_FM[testType].figureCount; i++) {
                        const figure = binomio[testType][`figure${i}`];
                        if (figure && (figure.judgeA || figure.judgeB || figure.judgeC)) {
                            hasDataForTest = true;
                            break;
                        }
                    }
                }

                if (hasDataForTest) {
                    const tabButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => btn.getAttribute('onclick') === `showTab('${testType}')`);
                    const testTypeName = tabButton ? tabButton.textContent : testType.toUpperCase().replace(/_/g, ' ');
                    const totals = fm_calculateBinomioTotals(binomio, testType); // Usa la funzione locale

                    csvContent += `SCHEDA: ${testTypeName}\n`;
                    csvContent += `Media Giudici: ${totals.average}, Percentuale: ${totals.percentage}%\n`;
                    csvContent += `Totali per Giudice -> A: ${totals.totalA}, B: ${totals.totalB}, C: ${totals.totalC}\n`;
                    csvContent += `Figura,Coefficiente,Giudice A,Giudice B,Giudice C\n`;

                    for (let i = 1; i <= DRESSAGE_CONFIG_FM[testType].figureCount; i++) {
                        const figure = binomio[testType][`figure${i}`];
                        csvContent += `${i},${figure?.coeff || fm_getDefaultCoeff(testType, i)},${figure?.judgeA || ''},${figure?.judgeB || ''},${figure?.judgeC || ''}\n`;
                    }
                    csvContent += `\n`;
                }
            });
            csvContent += `\n\n`;
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `dressage_dettaglio_binomi_${timestamp}.csv`;
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
        showNotification(`Dettaglio di ${data.totalBinomi} binomi esportato`, 'success');
    } catch (error) {
        console.error('Errore durante l\'esportazione del dettaglio binomi:', error);
        showNotification('Errore durante l\'esportazione del dettaglio: ' + error.message, 'error');
    }
}


function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    const autoSaveText = document.getElementById('autoSaveText');
    if (autoSaveEnabled) {
        startAutoSave();
        if (autoSaveText) autoSaveText.textContent = '🔄 Disattiva Salvataggio Automatico';
        showNotification('Salvataggio automatico attivato', 'info');
    } else {
        stopAutoSave();
        if (autoSaveText) autoSaveText.textContent = '🔄 Attiva Salvataggio Automatico';
        showNotification('Salvataggio automatico disattivato', 'info');
    }
}

function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => { if (window.hasDataChanged()) performAutoSave(); }, FILE_MANAGER_CONFIG.autoSaveInterval);
}

function stopAutoSave() {
    if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null; }
}

function performAutoSave() {
    try {
        const data = window.getAllBinomiData();
        data.autoSaveTimestamp = new Date().toISOString();
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem(FILE_MANAGER_CONFIG.autoSaveKey, JSON.stringify(data));
            lastSaveTime = new Date();
            console.log(`Auto-salvataggio completato per ${data.totalBinomi} binomi.`);
        }
    } catch (error) { console.error('Errore auto-salvataggio:', error); }
}

function checkAutoSavedData() {
    if (typeof(Storage) === "undefined") return;
    try {
        const savedData = localStorage.getItem(FILE_MANAGER_CONFIG.autoSaveKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            const saveDate = new Date(data.autoSaveTimestamp);
            if ((new Date() - saveDate) / (1000 * 60 * 60) < 24) {
                const count = data.totalBinomi || data.binomi?.length || 0;
                if (confirm(`Trovati ${count} binomi salvati automaticamente il ${saveDate.toLocaleString()}. Vuoi ripristinarli?`)) {
                    if (window.loadAllBinomiData(data)) showNotification(`${count} binomi auto-salvati ripristinati.`, 'success');
                }
            } else {
                localStorage.removeItem(FILE_MANAGER_CONFIG.autoSaveKey);
            }
        }
    } catch (error) { console.error('Errore controllo dati auto-salvati:', error); }
}

function setupAutoSaveListeners() {
    document.addEventListener('input', function(event) {
        if (autoSaveEnabled && (event.target.matches('input[type="number"]') || event.target.matches('input[type="text"]'))) {
            clearTimeout(window.autoSaveDebounce);
            window.autoSaveDebounce = setTimeout(() => { if (window.hasDataChanged()) performAutoSave(); }, 2000);
        }
    });
}

function hasExistingBinomiData() {
    if (!window.binomiData || window.binomiData.length === 0) return false;
    return window.binomiData.some(binomio => {
        if (binomio.riderName || binomio.riderSurname || binomio.horseName) return true;
        for (const testType in DRESSAGE_CONFIG_FM) { // Usa la copia locale per coerenza interna
            if (binomio[testType]) {
                for (let i = 1; i <= DRESSAGE_CONFIG_FM[testType].figureCount; i++) {
                    const figure = binomio[testType][`figure${i}`];
                    if (figure && (figure.judgeA || figure.judgeB || figure.judgeC)) return true;
                }
            }
        }
        return false;
    });
}

function hasDataChanged() {
    if (!lastSaveTime) return hasExistingBinomiData(); // Usa la versione locale che usa DRESSAGE_CONFIG_FM
    return hasExistingBinomiData(); // Usa la versione locale che usa DRESSAGE_CONFIG_FM
}


function validateBinomiFileData(data) {
    if (!data || typeof data !== 'object' || !data.binomi || !Array.isArray(data.binomi)) return false;
    for (let binomio of data.binomi) {
        if (!binomio || typeof binomio !== 'object') return false;
    }
    return true;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    Object.assign(notification.style, {
        position: 'fixed', top: '20px', right: '20px', padding: '15px 20px',
        borderRadius: '4px', color: 'white', fontWeight: '500', zIndex: '10000',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transform: 'translateX(120%)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', maxWidth: '400px', wordWrap: 'break-word',
        backgroundColor: { success: '#34a853', error: '#ea4335', warning: '#fbbc04', info: '#1a73e8' }[type] || '#1a73e8'
    });
    document.body.appendChild(notification);
    requestAnimationFrame(() => { notification.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 300);
    }, 4000);
}

function exportSingleBinomio(binomioIndex) {
    // Se window.currentBinomioIndex non fosse definito/accessibile, si potrebbe passare l'indice come parametro.
    // Per ora, si assume che window.currentBinomioIndex sia disponibile da dressage-calculator.js
    const actualIndex = typeof binomioIndex === 'number' ? binomioIndex : window.currentBinomioIndex;

    try {
        if (actualIndex < 0 || actualIndex >= window.binomiData.length) {
            showNotification('Binomio non valido', 'error'); return;
        }
        const binomio = window.binomiData[actualIndex];
        const binomioDisplayName = fm_getBinomioDisplayName(binomio);

        let csvContent = `BINOMIO: ${binomioDisplayName}\nData Export: ${new Date().toLocaleString()}\n\n`;

        Object.keys(DRESSAGE_CONFIG_FM).forEach(testType => {
            if (binomio[testType]) {
                const tabButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => btn.getAttribute('onclick') === `showTab('${testType}')`);
                const testTypeName = tabButton ? tabButton.textContent : testType.toUpperCase().replace(/_/g, ' ');

                csvContent += `RIPRESA ${testTypeName}\nFigura,Coefficiente,Giudice A,Giudice B,Giudice C\n`;
                for (let i = 1; i <= DRESSAGE_CONFIG_FM[testType].figureCount; i++) {
                    const figure = binomio[testType][`figure${i}`];
                    csvContent += `${i},${figure?.coeff || fm_getDefaultCoeff(testType, i)},${figure?.judgeA || ''},${figure?.judgeB || ''},${figure?.judgeC || ''}\n`;
                }
                const totals = fm_calculateBinomioTotals(binomio, testType);
                csvContent += `\nTOTALI ${testTypeName}\nTotale A,${totals.totalA}\nTotale B,${totals.totalB}\nTotale C,${totals.totalC}\nMedia,${totals.average}\nPercentuale,${totals.percentage}%\n\n`;
            }
        });

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const safeName = binomioDisplayName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `dressage_${safeName}_${timestamp}.csv`;
        downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
        showNotification(`Binomio "${binomioDisplayName}" esportato`, 'success');
    } catch (error) {
        console.error('Errore esportazione binomio singolo:', error);
        showNotification('Errore esportazione binomio singolo: ' + error.message, 'error');
    }
}


function clearAutoSavedData() {
    if (typeof(Storage) !== "undefined") {
        localStorage.removeItem(FILE_MANAGER_CONFIG.autoSaveKey);
        showNotification('Dati auto-salvati eliminati', 'info');
    }
}

document.addEventListener('DOMContentLoaded', initializeFileManager);

window.addEventListener('beforeunload', function(event) {
    if (typeof window.hasExistingBinomiData === 'function' && window.hasExistingBinomiData() &&
        typeof window.hasDataChanged === 'function' && window.hasDataChanged()) {
        const message = 'Hai dati non salvati. Vuoi davvero uscire?';
        event.returnValue = message;
        return message;
    }
});
