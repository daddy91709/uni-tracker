// Inizializza il tema il prima possibile per evitare FOUC (Flash of Unstyled Content)
(function () {
    const savedTheme = localStorage.getItem('uni-tracker-theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Ascolta i cambiamenti del tema di sistema in tempo reale
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('uni-tracker-theme', newTheme);

            // Se la funzione è già disponibile (es. cambio a pagina caricata), aggiorna il bottone
            if (typeof aggiornaPulsanteTema === 'function') {
                aggiornaPulsanteTema(newTheme);
            }
        });
    }
})();

// Funzione helper per gestire l'agibilità della casella "Lode"
function impostaLogicaLode(inputVoto, inputLode) {
    if (!inputVoto || !inputLode) return;

    const aggiornaLode = () => {
        if (inputVoto.value === '30') {
            inputLode.disabled = false;
        } else {
            inputLode.disabled = true;
            inputLode.checked = false;
        }
    };

    // Imposta lo stato iniziale
    aggiornaLode();

    // Ascolta modifiche per aggiornare lo stato in tempo reale
    inputVoto.addEventListener('input', aggiornaLode);
}

function aggiungiRiga() {
    const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
    const nuovaRiga = tabella.insertRow();

    // Cella per nome esame
    const cellaNome = nuovaRiga.insertCell(0);
    const inputNome = document.createElement('input');
    inputNome.type = 'text';
    inputNome.placeholder = 'Nome esame';
    inputNome.addEventListener('change', salvaInLocalStorage);
    cellaNome.appendChild(inputNome);

    // Cella per CFU
    const cellaCFU = nuovaRiga.insertCell(1);
    const inputCFU = document.createElement('input');
    inputCFU.type = 'number';
    inputCFU.min = '1';
    inputCFU.max = '30';
    inputCFU.placeholder = 'CFU';
    inputCFU.addEventListener('change', salvaInLocalStorage);
    cellaCFU.appendChild(inputCFU);

    // Cella per voto
    const cellaVoto = nuovaRiga.insertCell(2);
    const divVoto = document.createElement('div');
    divVoto.className = 'voto-container';

    const inputVoto = document.createElement('input');
    inputVoto.type = 'number';
    inputVoto.min = '18';
    inputVoto.max = '30';
    inputVoto.placeholder = 'Voto';
    inputVoto.className = 'voto-input';
    inputVoto.addEventListener('change', salvaInLocalStorage);

    const labelLode = document.createElement('label');
    labelLode.className = 'lode-label';
    labelLode.title = 'Con Lode';

    const inputLode = document.createElement('input');
    inputLode.type = 'checkbox';
    inputLode.className = 'lode-checkbox';
    inputLode.addEventListener('change', salvaInLocalStorage);

    // Imposta la logica dinamica per abilitare la Lode solo col 30
    impostaLogicaLode(inputVoto, inputLode);

    labelLode.appendChild(inputLode);
    labelLode.appendChild(document.createTextNode(' Lode'));

    divVoto.appendChild(inputVoto);
    divVoto.appendChild(labelLode);
    cellaVoto.appendChild(divVoto);

    // Cella per azioni
    const cellaAzioni = nuovaRiga.insertCell(3);
    const btnRimuovi = document.createElement('button');
    btnRimuovi.className = 'remove-icon';
    btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
    btnRimuovi.onclick = function () { rimuoviRiga(this); };
    cellaAzioni.appendChild(btnRimuovi);

    // Salva in LocalStorage dopo aver aggiunto la riga
    salvaInLocalStorage();
}

function rimuoviRiga(btn) {
    const riga = btn.parentNode.parentNode;
    riga.parentNode.removeChild(riga);

    // Salva in LocalStorage dopo la rimozione
    salvaInLocalStorage();
}

function calcolaMetriche() {
    const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
    const righe = tabella.getElementsByTagName('tr');

    let esami = [];

    // Raccolta dati esami
    for (let i = 0; i < righe.length; i++) {
        const inputNome = righe[i].querySelector('td:nth-child(1) input');
        const inputCFU = righe[i].querySelector('td:nth-child(2) input');
        const inputVotoNum = righe[i].querySelector('td:nth-child(3) input[type="number"]');
        const inputLode = righe[i].querySelector('td:nth-child(3) input[type="checkbox"]');

        const nome = inputNome ? inputNome.value.trim() : '';
        const cfu = inputCFU ? parseInt(inputCFU.value) : NaN;
        const votoInput = inputVotoNum ? inputVotoNum.value.trim() : '';

        // Verifica che ci siano valori validi
        if (nome && !isNaN(cfu)) {
            let voto = votoInput ? parseInt(votoInput) : null;
            if (voto === 30 && inputLode && inputLode.checked) {
                voto = 31;
            }
            esami.push({ nome, cfu, voto });
        }
    }

    // Calcola media ponderata normale
    const mediaPonderata = calcolaMedia(esami);
    document.getElementById('mediaPonderata').textContent =
        mediaPonderata ? mediaPonderata.toFixed(2) : 'Nessun esame con voto';

    // Calcola media ponderata con sconto
    const mediaPonderataSconto = calcolaMediaConSconto(esami);
    document.getElementById('mediaPonderataSconto').textContent =
        mediaPonderataSconto ? mediaPonderataSconto.toFixed(2) : 'Nessun esame con voto';

    // Previsione voto di laurea basata sulla media ponderata
    const previsioneLaureaMedia = mediaPonderata ? (mediaPonderata / 30 * 110).toFixed(2) : '-';
    document.getElementById('previsioneLaureaMedia').textContent = previsioneLaureaMedia;

    // Previsione voto di laurea basata sulla media ponderata con sconto
    const previsioneLaurea = mediaPonderataSconto ? (mediaPonderataSconto / 30 * 110).toFixed(2) : '-';
    document.getElementById('previsioneLaurea').textContent = previsioneLaurea;

    // Aggiorna Grafici
    if (typeof aggiornaGrafici === 'function') {
        aggiornaGrafici(esami);
    }

    // Salva in LocalStorage dopo il calcolo
    salvaInLocalStorage();
}

function calcolaMedia(esami) {
    let sommaVotiPesati = 0;
    let sommaCFU = 0;

    for (const esame of esami) {
        if (esame.voto !== null) {
            sommaVotiPesati += esame.voto * esame.cfu;
            sommaCFU += esame.cfu;
        }
    }

    return sommaCFU > 0 ? sommaVotiPesati / sommaCFU : null;
}

function calcolaMediaConSconto(esami) {
    // Se non ci sono abbastanza esami con voto, ritorna null
    const esamiConVoto = esami.filter(e => e.voto !== null);
    if (esamiConVoto.length === 0) return null;

    // Ordina esami per voto (crescente)
    const esamiOrdinati = [...esamiConVoto].sort((a, b) => a.voto - b.voto);

    // Trova l'esame con voto più basso
    const esamePeggiore = esamiOrdinati[0];

    // Applica lo sconto (riduzione di 5 CFU)
    let sommaVotiPesati = 0;
    let sommaCFU = 0;

    for (const esame of esamiConVoto) {
        if (esame === esamePeggiore) {
            // Applica lo sconto: se l'esame ha meno di 5 CFU, non conta per nulla
            const cfuEffettivi = Math.max(0, esame.cfu - 5);
            sommaVotiPesati += esame.voto * cfuEffettivi;
            sommaCFU += cfuEffettivi;
        } else {
            sommaVotiPesati += esame.voto * esame.cfu;
            sommaCFU += esame.cfu;
        }
    }

    return sommaCFU > 0 ? sommaVotiPesati / sommaCFU : null;
}

function prevediVoti() {
    const votoTarget = parseFloat(document.getElementById('votoTarget').value);
    const messaggioImpossibile = document.getElementById('messaggioImpossibile');
    const usaSconto = document.getElementById('toggleSconto').checked;

    if (!votoTarget || votoTarget < 60 || votoTarget > 110) {
        alert('Inserisci un voto target valido (60-110)');
        return;
    }

    const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
    const righe = tabella.getElementsByTagName('tr');
    let esami = [];
    let esamiDaCompletare = [];

    // Raccogli gli esami esistenti e quelli da completare
    for (let i = 0; i < righe.length; i++) {
        const inputNome = righe[i].querySelector('td:nth-child(1) input');
        const inputCFU = righe[i].querySelector('td:nth-child(2) input');
        const inputVotoNum = righe[i].querySelector('td:nth-child(3) input[type="number"]');
        const inputLode = righe[i].querySelector('td:nth-child(3) input[type="checkbox"]');

        const nome = inputNome ? inputNome.value.trim() : '';
        const cfuInput = inputCFU ? inputCFU.value.trim() : '';

        if (nome && cfuInput) {
            const cfu = parseInt(cfuInput);
            let voto = inputVotoNum && inputVotoNum.value.trim() ? parseInt(inputVotoNum.value) : null;
            if (voto === 30 && inputLode && inputLode.checked) {
                voto = 31;
            }

            if (voto) {
                esami.push({ nome, cfu, voto });
            } else if (inputVotoNum) {
                esamiDaCompletare.push({ index: i, cfu, input: inputVotoNum, lodeInput: inputLode });
            }
        }
    }    // Verifica se è possibile raggiungere il target con tutti 31
    const esamiMax = [...esami];
    for (const esame of esamiDaCompletare) {
        esamiMax.push({ nome: "", cfu: esame.cfu, voto: 31 });
    }
    // Usa la funzione appropriata in base al toggle
    const mediaMax = usaSconto ? calcolaMediaConSconto(esamiMax) : calcolaMedia(esamiMax);
    const previsioneMax = mediaMax ? (mediaMax / 30 * 110) : 0;

    if (previsioneMax < votoTarget) {
        messaggioImpossibile.style.display = 'block';
        return;
    }

    // Inizializza tutti i voti a 18
    const votiMigliori = Array(esamiDaCompletare.length).fill(18);

    // Funzione per calcolare la previsione con i voti correnti
    const calcolaPrevisione = (voti) => {
        const esamiProvvisori = [...esami];
        esamiDaCompletare.forEach((esame, index) => {
            esamiProvvisori.push({ nome: "", cfu: esame.cfu, voto: voti[index] });
        });
        // Usa la funzione appropriata in base al toggle
        const media = usaSconto ? calcolaMediaConSconto(esamiProvvisori) : calcolaMedia(esamiProvvisori);
        return media ? (media / 30 * 110) : 0;
    };

    // Ottimizza ogni voto individualmente
    let previsioneCorrente = calcolaPrevisione(votiMigliori);

    while (previsioneCorrente < votoTarget) {
        let miglioramentoMassimo = 0;
        let indiceMigliore = -1;

        // Trova l'esame che, se aumentato di 1, dà il miglior incremento
        for (let i = 0; i < votiMigliori.length; i++) {
            if (votiMigliori[i] < 31) {
                votiMigliori[i]++;
                const nuovaPrevisione = calcolaPrevisione(votiMigliori);
                const miglioramento = nuovaPrevisione - previsioneCorrente;
                if (miglioramento > miglioramentoMassimo) {
                    miglioramentoMassimo = miglioramento;
                    indiceMigliore = i;
                }
                votiMigliori[i]--;
            }
        }

        // Aumenta il voto dell'esame che dà il miglior incremento
        if (indiceMigliore !== -1) {
            votiMigliori[indiceMigliore]++;
            previsioneCorrente = calcolaPrevisione(votiMigliori);
        } else {
            break; // Non è possibile migliorare ulteriormente
        }
    } messaggioImpossibile.style.display = 'none';

    // Imposta i voti trovati
    esamiDaCompletare.forEach((esame, index) => {
        let votoTrovato = votiMigliori[index];
        if (votoTrovato === 31) {
            esame.input.value = 30;
            if (esame.lodeInput) esame.lodeInput.checked = true;
        } else {
            esame.input.value = votoTrovato;
            if (esame.lodeInput) esame.lodeInput.checked = false;
        }
    });
    // Ricalcola le metriche per aggiornare i risultati
    calcolaMetriche();
}

function esportaEsami() {
    const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
    const righe = tabella.getElementsByTagName('tr');
    let contenuto = '';

    // Raccogli i dati di ogni riga
    for (let i = 0; i < righe.length; i++) {
        const inputNome = righe[i].querySelector('td:nth-child(1) input');
        const inputCFU = righe[i].querySelector('td:nth-child(2) input');
        const inputVotoNum = righe[i].querySelector('td:nth-child(3) input[type="number"]');
        const inputLode = righe[i].querySelector('td:nth-child(3) input[type="checkbox"]');

        const nome = inputNome ? inputNome.value.trim() : '';
        const cfu = inputCFU ? inputCFU.value.trim() : '';
        let voto = inputVotoNum ? inputVotoNum.value.trim() : '';
        if (voto === '30' && inputLode && inputLode.checked) {
            voto = '31';
        }

        if (nome || cfu || voto) {
            contenuto += `${nome}\t${cfu}\t${voto}\n`;
        }
    }

    // Crea e scarica il file
    const blob = new Blob([contenuto], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const data = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `esami_${data}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function mostraNotifica(messaggio, tipo = 'successo') {
    const notifica = document.getElementById('notifica');
    notifica.textContent = messaggio;
    notifica.className = `notifica ${tipo}`;

    // Mostra la notifica
    setTimeout(() => notifica.classList.add('visibile'), 100);

    // Nascondi la notifica dopo 3 secondi
    setTimeout(() => {
        notifica.classList.remove('visibile');
    }, 3000);
}

function importaEsami(input) {
    const file = input.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        importaExcel(file);
    } else if (fileExtension === 'txt') {
        importaTesto(file);
    } else {
        alert('Formato file non supportato. Usa file .txt, .xlsx o .xls');
    }
}

function importaExcel(file) {
    // Debug per GitHub Pages
    console.log('File selezionato:', file.name, 'Tipo:', file.type, 'Dimensione:', file.size);

    // Controlla se XLSX è disponibile
    if (typeof XLSX === 'undefined') {
        alert('Errore: Libreria XLSX non caricata. Ricarica la pagina e riprova.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            console.log('FileReader completato. Dimensione buffer:', e.target.result.byteLength);

            const data = new Uint8Array(e.target.result);
            console.log('Primi 10 bytes del file:', Array.from(data.slice(0, 10)));

            const workbook = XLSX.read(data, { type: 'array' });
            console.log('Workbook caricato. Fogli disponibili:', workbook.SheetNames);

            // Prendi il primo foglio
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            console.log('Foglio selezionato:', firstSheetName);

            // Converti in JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false
            });

            console.log('Dati convertiti in JSON. Righe trovate:', jsonData.length);

            // Processa i dati
            processaEsamiExcel(jsonData);

        } catch (error) {
            console.error('Errore dettagliato nella lettura del file Excel:', error);
            console.error('Stack trace:', error.stack);
            alert(`Errore nella lettura del file Excel: ${error.message}\nControlla la console per dettagli.`);
        }
    };

    reader.onerror = function (error) {
        console.error('Errore FileReader:', error);
        alert('Errore nella lettura del file. Assicurati che sia un file Excel valido.');
    };

    reader.readAsArrayBuffer(file);
}

function processaEsamiExcel(data) {
    if (!data || data.length === 0) {
        alert('Il file Excel sembra vuoto o non contiene dati validi.');
        return;
    }

    // Trova la riga di intestazione (cerca una riga con almeno 6 colonne)
    let headerIndex = -1;
    let header = null;

    for (let i = 0; i < Math.min(data.length, 10); i++) {
        const riga = data[i];
        if (riga && riga.length > 5) {
            header = riga;
            headerIndex = i;
            break;
        }
    }

    if (!header || header.length < 5) {
        alert('Non riesco a trovare una riga di intestazione valida nel file Excel. Assicurati che il file contenga i dati degli esami esportati dall\'università.');
        return;
    }

    // Ricerca delle colonne necessarie
    const indiceEsame = header.findIndex(col => {
        if (!col) return false;
        const colLower = col.toString().toLowerCase().trim();
        return colLower.includes('esame') ||
            colLower.includes('materia') ||
            colLower.includes('corso') ||
            colLower.includes('denominazione') ||
            colLower.includes('nome');
    });

    const indiceCrediti = header.findIndex(col => {
        if (!col) return false;
        const colLower = col.toString().toLowerCase().trim();
        return (colLower.includes('crediti') || colLower.includes('cfu')) &&
            !colLower.includes('per') &&
            !colLower.includes('media');
    });

    const indiceVoto = header.findIndex(col => {
        if (!col) return false;
        const colLower = col.toString().toLowerCase().trim();
        return colLower === 'voto' || colLower.includes('voto');
    });

    const indiceLode = header.findIndex(col => {
        if (!col) return false;
        const colLower = col.toString().toLowerCase().trim();
        return colLower.includes('lode');
    });

    // Se non trova le colonne per nome, usa le posizioni standard del file universitario
    const indiceEsameFinal = indiceEsame !== -1 ? indiceEsame : 4;      // Colonna "Esame"
    const indiceCreditiFinal = indiceCrediti !== -1 ? indiceCrediti : 6; // Colonna "Crediti"
    const indiceVotoFinal = indiceVoto !== -1 ? indiceVoto : 8;          // Colonna "Voto"
    const indiceLodeFinal = indiceLode !== -1 ? indiceLode : 9;          // Colonna "Lode"

    // Pulisci la tabella esistente
    const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
    while (tabella.rows.length > 1) {
        tabella.deleteRow(1);
    }

    // Pulisci la prima riga
    const primaRiga = tabella.rows[0].getElementsByTagName('input');
    primaRiga[0].value = '';
    primaRiga[1].value = '';
    primaRiga[2].value = '';

    let primaRigaUsata = false;
    let esamiImportati = 0;

    // Processa ogni riga di dati (salta l'header)
    for (let i = headerIndex + 1; i < data.length; i++) {
        const riga = data[i];

        if (!riga || riga.length === 0) continue;

        const nomeEsame = riga[indiceEsameFinal];
        const crediti = parseInt(riga[indiceCreditiFinal]);
        const voto = riga[indiceVotoFinal];
        const lode = indiceLodeFinal !== -1 ? riga[indiceLodeFinal] : null;

        // Salta se non c'è nome esame o se sono solo 1 CFU (idoneità)
        if (!nomeEsame || crediti <= 1 || isNaN(crediti)) {
            continue;
        }

        // Converti il voto se presente
        let votoNumerico = null;
        if (voto && voto !== '' && !isNaN(parseInt(voto))) {
            votoNumerico = parseInt(voto);

            // Se il voto è 30 e c'è la lode, converti a 31
            if (votoNumerico === 30 && lode && lode.toString().toLowerCase() === 'si') {
                votoNumerico = 31;
            }
        }

        // Salta gli esami senza voto (voto nullo o vuoto)
        if (votoNumerico === null || votoNumerico === 0) {
            continue;
        }

        // Pulisci il nome dell'esame e convertilo in maiuscolo
        const nomeEsamePulito = pulisciNomeEsame(nomeEsame).toUpperCase();

        if (!primaRigaUsata) {
            // Usa la prima riga esistente
            primaRiga[0].value = nomeEsamePulito;
            primaRiga[1].value = crediti;
            if (votoNumerico === 31) {
                primaRiga[2].value = 30;
                primaRiga[3].checked = true;
            } else {
                primaRiga[2].value = votoNumerico !== null ? votoNumerico : '';
                primaRiga[3].checked = false;
            }
            primaRigaUsata = true;
        } else {
            // Crea una nuova riga
            const nuovaRiga = tabella.insertRow();

            const cellaNome = nuovaRiga.insertCell(0);
            const inputNome = document.createElement('input');
            inputNome.type = 'text';
            inputNome.placeholder = 'Nome esame';
            inputNome.value = nomeEsamePulito;
            inputNome.addEventListener('change', salvaInLocalStorage);
            cellaNome.appendChild(inputNome);

            const cellaCFU = nuovaRiga.insertCell(1);
            const inputCFU = document.createElement('input');
            inputCFU.type = 'number';
            inputCFU.min = '1';
            inputCFU.max = '30';
            inputCFU.placeholder = 'CFU';
            inputCFU.value = crediti;
            inputCFU.addEventListener('change', salvaInLocalStorage);
            cellaCFU.appendChild(inputCFU);

            const cellaVoto = nuovaRiga.insertCell(2);
            const divVoto = document.createElement('div');
            divVoto.className = 'voto-container';

            const inputVoto = document.createElement('input');
            inputVoto.type = 'number';
            inputVoto.min = '18';
            inputVoto.max = '30';
            inputVoto.placeholder = 'Voto';
            inputVoto.className = 'voto-input';
            if (votoNumerico === 31) {
                inputVoto.value = 30;
            } else {
                inputVoto.value = votoNumerico !== null ? votoNumerico : '';
            }
            inputVoto.addEventListener('change', salvaInLocalStorage);

            const labelLode = document.createElement('label');
            labelLode.className = 'lode-label';
            labelLode.title = 'Con Lode';

            const inputLode = document.createElement('input');
            inputLode.type = 'checkbox';
            inputLode.className = 'lode-checkbox';
            if (votoNumerico === 31) {
                inputLode.checked = true;
            }
            inputLode.addEventListener('change', salvaInLocalStorage);

            impostaLogicaLode(inputVoto, inputLode);

            labelLode.appendChild(inputLode);
            labelLode.appendChild(document.createTextNode(' Lode'));

            divVoto.appendChild(inputVoto);
            divVoto.appendChild(labelLode);
            cellaVoto.appendChild(divVoto);

            const cellaAzioni = nuovaRiga.insertCell(3);
            const btnRimuovi = document.createElement('button');
            btnRimuovi.className = 'remove-icon';
            btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnRimuovi.onclick = function () { rimuoviRiga(this); };
            cellaAzioni.appendChild(btnRimuovi);
        }

        esamiImportati++;
    }

    // Aggiorna i calcoli
    calcolaMetriche();

    // Resetta l'input file
    document.getElementById('inputFile').value = '';

    // Mostra notifica di successo
    mostraNotifica(`${esamiImportati} esami importati con successo dal file Excel!`);

    // Salva in LocalStorage dopo l'importazione
    salvaInLocalStorage();
}

function pulisciNomeEsame(nomeCompleto) {
    if (!nomeCompleto) return '';

    // Rimuovi informazioni sui CFU e codici del corso
    let nome = nomeCompleto.toString();

    // Rimuovi pattern come "X cfu in Y - CODICE"
    nome = nome.replace(/\s+\d+\s+cfu\s+in\s+[A-Z]\s+-\s+[A-Z-\/\d]+.*$/i, '');

    // Rimuovi pattern come "- C11" alla fine
    nome = nome.replace(/\s+-\s+C\d+$/i, '');

    // Capitalizza correttamente
    nome = nome.split(' ')
        .map(word => {
            if (word.length <= 3 && word.match(/^[A-Z]+$/)) {
                return word; // Mantieni acronimi in maiuscolo
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');

    return nome.trim();
}

function importaTesto(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const contenuto = e.target.result;
        const righe = contenuto.trim().split('\n');

        // Rimuovi tutte le righe esistenti tranne la prima
        const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
        while (tabella.rows.length > 1) {
            tabella.deleteRow(1);
        }

        // Pulisci la prima riga
        const primaRiga = tabella.rows[0].getElementsByTagName('input');
        primaRiga[0].value = '';
        primaRiga[1].value = '';
        primaRiga[2].value = '';

        // Inserisci i dati dal file
        righe.forEach((riga, index) => {
            const [nome, cfu, voto] = riga.split('\t');
            if (index === 0) {
                // Usa la prima riga esistente
                primaRiga[0].value = nome || '';
                primaRiga[1].value = cfu || '';
                if (voto === '31') {
                    primaRiga[2].value = '30';
                    primaRiga[3].checked = true;
                } else {
                    primaRiga[2].value = voto || '';
                    primaRiga[3].checked = false;
                }
            } else {
                // Aggiungi nuove righe per i dati rimanenti
                const nuovaRiga = tabella.insertRow();

                const cellaNome = nuovaRiga.insertCell(0);
                const inputNome = document.createElement('input');
                inputNome.type = 'text';
                inputNome.placeholder = 'Nome esame';
                inputNome.value = nome || '';
                inputNome.addEventListener('change', salvaInLocalStorage);
                cellaNome.appendChild(inputNome);

                const cellaCFU = nuovaRiga.insertCell(1);
                const inputCFU = document.createElement('input');
                inputCFU.type = 'number';
                inputCFU.min = '1';
                inputCFU.max = '30';
                inputCFU.placeholder = 'CFU';
                inputCFU.value = cfu || '';
                inputCFU.addEventListener('change', salvaInLocalStorage);
                cellaCFU.appendChild(inputCFU);

                const cellaVoto = nuovaRiga.insertCell(2);
                const divVoto = document.createElement('div');
                divVoto.className = 'voto-container';

                const inputVoto = document.createElement('input');
                inputVoto.type = 'number';
                inputVoto.min = '18';
                inputVoto.max = '30';
                inputVoto.placeholder = 'Voto';
                inputVoto.className = 'voto-input';
                if (voto === '31') {
                    inputVoto.value = '30';
                } else {
                    inputVoto.value = voto || '';
                }
                inputVoto.addEventListener('change', salvaInLocalStorage);

                const labelLode = document.createElement('label');
                labelLode.className = 'lode-label';
                labelLode.title = 'Con Lode';

                const inputLode = document.createElement('input');
                inputLode.type = 'checkbox';
                inputLode.className = 'lode-checkbox';
                if (voto === '31') {
                    inputLode.checked = true;
                }
                inputLode.addEventListener('change', salvaInLocalStorage);

                impostaLogicaLode(inputVoto, inputLode);

                labelLode.appendChild(inputLode);
                labelLode.appendChild(document.createTextNode(' Lode'));

                divVoto.appendChild(inputVoto);
                divVoto.appendChild(labelLode);
                cellaVoto.appendChild(divVoto);

                const cellaAzioni = nuovaRiga.insertCell(3);
                const btnRimuovi = document.createElement('button');
                btnRimuovi.className = 'remove-icon';
                btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
                btnRimuovi.onclick = function () { rimuoviRiga(this); };
                cellaAzioni.appendChild(btnRimuovi);
            }
        });

        // Aggiorna i calcoli
        calcolaMetriche();

        // Resetta l'input file
        document.getElementById('inputFile').value = '';

        // Mostra notifica di successo
        mostraNotifica('Dati importati con successo!');

        // Salva in LocalStorage dopo l'importazione
        salvaInLocalStorage();
    };
    reader.readAsText(file);
}

// ===== FUNZIONI LOCALSTORAGE =====

function salvaInLocalStorage() {
    const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
    const righe = tabella.getElementsByTagName('tr');
    let esami = [];

    // Raccogli tutti gli esami dalla tabella
    for (let i = 0; i < righe.length; i++) {
        const inputNome = righe[i].querySelector('td:nth-child(1) input');
        const inputCFU = righe[i].querySelector('td:nth-child(2) input');
        const inputVotoNum = righe[i].querySelector('td:nth-child(3) input[type="number"]');
        const inputLode = righe[i].querySelector('td:nth-child(3) input[type="checkbox"]');

        const nome = inputNome ? inputNome.value.trim() : '';
        const cfu = inputCFU ? inputCFU.value.trim() : '';
        let voto = inputVotoNum ? inputVotoNum.value.trim() : '';
        if (voto === '30' && inputLode && inputLode.checked) {
            voto = '31';
        }

        // Salva anche le righe vuote per mantenere la struttura
        esami.push({ nome, cfu, voto });
    }

    try {
        localStorage.setItem('uni-tracker-esami', JSON.stringify(esami));
        localStorage.setItem('uni-tracker-last-save', new Date().toISOString());
        console.log('Dati salvati in LocalStorage:', esami.length, 'righe');
        return true;
    } catch (error) {
        console.error('Errore nel salvataggio in LocalStorage:', error);
        return false;
    }
}

function caricaDaLocalStorage() {
    try {
        const datiSalvati = localStorage.getItem('uni-tracker-esami');
        if (!datiSalvati) {
            console.log('Nessun dato salvato in LocalStorage');
            return false;
        }

        const esami = JSON.parse(datiSalvati);
        const lastSave = localStorage.getItem('uni-tracker-last-save');

        console.log('Caricamento da LocalStorage:', esami.length, 'righe');
        if (lastSave) {
            console.log('Ultimo salvataggio:', new Date(lastSave).toLocaleString());
        }

        const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];

        // Rimuovi tutte le righe esistenti
        while (tabella.rows.length > 0) {
            tabella.deleteRow(0);
        }

        // Se non ci sono esami salvati, crea una riga vuota
        if (esami.length === 0) {
            aggiungiRiga();
            return true;
        }

        // Ricrea le righe con i dati salvati
        esami.forEach((esame, index) => {
            const nuovaRiga = tabella.insertRow();

            // Cella nome
            const cellaNome = nuovaRiga.insertCell(0);
            const inputNome = document.createElement('input');
            inputNome.type = 'text';
            inputNome.placeholder = 'Nome esame';
            inputNome.value = esame.nome || '';
            inputNome.addEventListener('change', salvaInLocalStorage);
            cellaNome.appendChild(inputNome);

            // Cella CFU
            const cellaCFU = nuovaRiga.insertCell(1);
            const inputCFU = document.createElement('input');
            inputCFU.type = 'number';
            inputCFU.min = '1';
            inputCFU.max = '30';
            inputCFU.placeholder = 'CFU';
            inputCFU.value = esame.cfu || '';
            inputCFU.addEventListener('change', salvaInLocalStorage);
            cellaCFU.appendChild(inputCFU);

            // Cella Voto
            const cellaVoto = nuovaRiga.insertCell(2);
            const divVoto = document.createElement('div');
            divVoto.className = 'voto-container';

            const inputVoto = document.createElement('input');
            inputVoto.type = 'number';
            inputVoto.min = '18';
            inputVoto.max = '30';
            inputVoto.placeholder = 'Voto';
            inputVoto.className = 'voto-input';
            if (String(esame.voto) === '31') {
                inputVoto.value = '30';
            } else {
                inputVoto.value = esame.voto || '';
            }
            inputVoto.addEventListener('change', salvaInLocalStorage);

            const labelLode = document.createElement('label');
            labelLode.className = 'lode-label';
            labelLode.title = 'Con Lode';

            const inputLode = document.createElement('input');
            inputLode.type = 'checkbox';
            inputLode.className = 'lode-checkbox';
            if (String(esame.voto) === '31') {
                inputLode.checked = true;
            }
            inputLode.addEventListener('change', salvaInLocalStorage);

            impostaLogicaLode(inputVoto, inputLode);

            labelLode.appendChild(inputLode);
            labelLode.appendChild(document.createTextNode(' Lode'));

            divVoto.appendChild(inputVoto);
            divVoto.appendChild(labelLode);
            cellaVoto.appendChild(divVoto);

            // Cella Azioni
            const cellaAzioni = nuovaRiga.insertCell(3);
            const btnRimuovi = document.createElement('button');
            btnRimuovi.className = 'remove-icon';
            btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnRimuovi.onclick = function () { rimuoviRiga(this); };
            cellaAzioni.appendChild(btnRimuovi);
        });

        // Ricalcola le metriche dopo il caricamento
        calcolaMetriche();

        mostraNotifica('Dati caricati dal browser!', 'successo');
        return true;

    } catch (error) {
        console.error('Errore nel caricamento da LocalStorage:', error);
        return false;
    }
}

function cancellaLocalStorage() {
    if (confirm('Sei sicuro di voler cancellare tutti i dati salvati nel browser?')) {
        try {
            localStorage.removeItem('uni-tracker-esami');
            localStorage.removeItem('uni-tracker-last-save');
            console.log('LocalStorage cancellato');
            mostraNotifica('Dati cancellati dal browser!', 'successo');

            // Ricarica la pagina per resettare tutto
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Errore nella cancellazione del LocalStorage:', error);
            alert('Errore nella cancellazione dei dati.');
        }
    }
}

function mostraInfoLocalStorage() {
    try {
        const datiSalvati = localStorage.getItem('uni-tracker-esami');
        const lastSave = localStorage.getItem('uni-tracker-last-save');

        if (!datiSalvati) {
            alert('Nessun dato salvato nel browser.');
            return;
        }

        const esami = JSON.parse(datiSalvati);
        const esamiConDati = esami.filter(e => e.nome || e.cfu || e.voto);
        const dataUltimoSalvataggio = lastSave ? new Date(lastSave).toLocaleString('it-IT') : 'Sconosciuto';

        alert(
            `📊 Informazioni dati salvati:\n\n` +
            `• Righe totali: ${esami.length}\n` +
            `• Esami con dati: ${esamiConDati.length}\n` +
            `• Ultimo salvataggio: ${dataUltimoSalvataggio}`
        );
    } catch (error) {
        console.error('Errore nel recupero info LocalStorage:', error);
        alert('Errore nel recupero delle informazioni.');
    }
}

function aggiornaDescrizioneToggle() {
    const toggle = document.getElementById('toggleSconto');
    const description = document.getElementById('toggleDescription');

    if (toggle.checked) {
        description.innerHTML = '<i class="fas fa-percentage"></i> Calcola con sconto 5 CFU sull\'esame peggiore';
    } else {
        description.innerHTML = '<i class="fas fa-calculator"></i> Calcola con media ponderata normale';
    }
}

// ===== GRAFICI (Chart.js) =====

let chartLineInstance = null;
let chartDoughnutInstance = null;

function aggiornaGrafici(esami) {
    if (typeof Chart === 'undefined') return;

    // Filtrare gli esami che hanno il voto inserito
    const esamiConVoto = esami.filter(e => e.voto !== null && e.voto >= 18);

    const dashboard = document.querySelector('.dashboard-charts');
    if (esamiConVoto.length === 0) {
        if (dashboard) dashboard.style.display = 'none';
        return;
    }

    if (dashboard) dashboard.style.display = 'flex';

    const labels = [];
    const dataMedia = [];
    let sommaVotiPesati = 0;
    let sommaCFU = 0;

    // Distribuzione Voti in Fasce
    const fasceVoti = {
        '18-22': 0,
        '23-26': 0,
        '27-29': 0,
        '30/30L': 0
    };

    esamiConVoto.forEach((esame, i) => {
        // Calcolo progressivo media
        sommaVotiPesati += esame.voto * esame.cfu;
        sommaCFU += esame.cfu;
        const mediaProgressiva = sommaVotiPesati / sommaCFU;

        // Pulisci il nome per la label
        let shortName = (esame.nome || `Esame ${i + 1}`);
        if (shortName.length > 15) shortName = shortName.substring(0, 15) + '...';

        labels.push(shortName);
        dataMedia.push(mediaProgressiva.toFixed(2));

        // Calcolo distribuzione Voti
        if (esame.voto >= 18 && esame.voto <= 22) fasceVoti['18-22']++;
        else if (esame.voto >= 23 && esame.voto <= 26) fasceVoti['23-26']++;
        else if (esame.voto >= 27 && esame.voto <= 29) fasceVoti['27-29']++;
        else if (esame.voto >= 30) fasceVoti['30/30L']++;
    });

    // === CHART LINE (Andamento Media) ===
    const ctxLine = document.getElementById('chartLine').getContext('2d');
    if (chartLineInstance) chartLineInstance.destroy();

    chartLineInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Andamento Media Ponderata',
                data: dataMedia,
                borderColor: '#007BFF',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#007BFF',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Andamento Media', font: { size: 16 } }
            },
            scales: {
                y: { min: 18, max: 31 }
            }
        }
    });

    // === CHART BAR (Distribuzione Voti) ===
    const ctxBar = document.getElementById('chartBar').getContext('2d');
    if (chartDoughnutInstance) chartDoughnutInstance.destroy();

    const barLabels = Object.keys(fasceVoti);
    const barData = Object.values(fasceVoti);

    const barColors = [
        '#dc3545', // 18-22 Rosso
        '#ffc107', // 23-26 Giallo
        '#17a2b8', // 27-29 Azzurro
        '#28a745'  // 30/30L Verde
    ];

    chartDoughnutInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Numero esami per fascia',
                data: barData,
                backgroundColor: barColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Distribuzione Voti', font: { size: 16 } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1 // Mostra solo numeri interi (esami)
                    }
                }
            }
        }
    });
}

// Verifica compatibilità e librerie al caricamento della pagina
document.addEventListener('DOMContentLoaded', function () {
    console.log('Pagina caricata. Verificando librerie...');

    // Verifica se XLSX è caricato
    if (typeof XLSX === 'undefined') {
        console.error('XLSX non è caricato!');
        document.body.insertAdjacentHTML('afterbegin',
            '<div style="background: #ff6b6b; color: white; padding: 10px; text-align: center; font-weight: bold;">' +
            'ATTENZIONE: Libreria Excel non caricata. Ricarica la pagina.' +
            '</div>'
        );
    } else {
        console.log('XLSX caricato correttamente. Versione:', XLSX.version);
    }

    // Verifica se FileReader è supportato
    if (!window.FileReader) {
        console.error('FileReader non supportato!');
        alert('Il tuo browser non supporta la lettura di file. Aggiorna il browser.');
    }

    console.log('User Agent:', navigator.userAgent);
    console.log('URL corrente:', window.location.href);

    // Carica automaticamente i dati salvati
    setTimeout(() => {
        const caricato = caricaDaLocalStorage();
        if (caricato) {
            console.log('Dati caricati automaticamente da LocalStorage');
        } else {
            // Applica la logica lode alla riga iniziale statica in caso di local storage vuoto
            const primaRiga = document.querySelector('#tabellaEsami tbody tr');
            if (primaRiga) {
                const inputV = primaRiga.querySelector('.voto-input');
                const inputL = primaRiga.querySelector('.lode-checkbox');
                if (inputV && inputL) impostaLogicaLode(inputV, inputL);
            }
        }
        // Imposta l'icona corretta del toggle all'avvio
        aggiornaDescrizioneToggle();

        // Imposta il pulsante del tema corretto
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        if (typeof aggiornaPulsanteTema === 'function') {
            aggiornaPulsanteTema(currentTheme);
        }
    }, 100);
});

// ===== THEME MANAGEMENT =====

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('uni-tracker-theme', newTheme);

    aggiornaPulsanteTema(newTheme);
}

function aggiornaPulsanteTema(theme) {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        if (theme === 'dark') {
            themeBtn.innerHTML = '<i class="fas fa-sun"></i> Tema Chiaro';
        } else {
            themeBtn.innerHTML = '<i class="fas fa-moon"></i> Tema Scuro';
        }
    }
}
