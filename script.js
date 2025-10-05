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
    const inputVoto = document.createElement('input');
    inputVoto.type = 'number';
    inputVoto.min = '18';
    inputVoto.max = '31';
    inputVoto.placeholder = 'Voto';
    inputVoto.addEventListener('change', salvaInLocalStorage);
    cellaVoto.appendChild(inputVoto);
    
    // Cella per azioni
    const cellaAzioni = nuovaRiga.insertCell(3);
    const btnRimuovi = document.createElement('button');
    btnRimuovi.className = 'remove-icon';
    btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
    btnRimuovi.onclick = function() { rimuoviRiga(this); };
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
        const inputs = righe[i].getElementsByTagName('input');
        const nome = inputs[0].value.trim();
        const cfu = parseInt(inputs[1].value);
        const votoInput = inputs[2].value.trim();
        
        // Verifica che ci siano valori validi
        if (nome && !isNaN(cfu)) {
            const voto = votoInput ? parseInt(votoInput) : null;
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
        const inputs = righe[i].getElementsByTagName('input');
        const nome = inputs[0].value.trim();
        const cfuInput = inputs[1].value.trim();
        const votoInput = inputs[2];
        
        if (nome && cfuInput) {
            const cfu = parseInt(cfuInput);
            const voto = votoInput.value.trim() ? parseInt(votoInput.value) : null;
            
            if (voto) {
                esami.push({ nome, cfu, voto });
            } else {
                esamiDaCompletare.push({ index: i, cfu, input: votoInput });
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
    }    messaggioImpossibile.style.display = 'none';
    
    // Imposta i voti trovati
    esamiDaCompletare.forEach((esame, index) => {
        esame.input.value = votiMigliori[index];
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
        const inputs = righe[i].getElementsByTagName('input');
        const nome = inputs[0].value.trim();
        const cfu = inputs[1].value.trim();
        const voto = inputs[2].value.trim();
        
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
    reader.onload = function(e) {
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
    
    reader.onerror = function(error) {
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
            primaRiga[2].value = votoNumerico;
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
            const inputVoto = document.createElement('input');
            inputVoto.type = 'number';
            inputVoto.min = '18';
            inputVoto.max = '31';
            inputVoto.placeholder = 'Voto';
            inputVoto.value = votoNumerico;
            inputVoto.addEventListener('change', salvaInLocalStorage);
            cellaVoto.appendChild(inputVoto);
            
            const cellaAzioni = nuovaRiga.insertCell(3);
            const btnRimuovi = document.createElement('button');
            btnRimuovi.className = 'remove-icon';
            btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnRimuovi.onclick = function() { rimuoviRiga(this); };
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
    reader.onload = function(e) {
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
                primaRiga[2].value = voto || '';
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
                const inputVoto = document.createElement('input');
                inputVoto.type = 'number';
                inputVoto.min = '18';
                inputVoto.max = '31';
                inputVoto.placeholder = 'Voto';
                inputVoto.value = voto || '';
                inputVoto.addEventListener('change', salvaInLocalStorage);
                cellaVoto.appendChild(inputVoto);
                
                const cellaAzioni = nuovaRiga.insertCell(3);
                const btnRimuovi = document.createElement('button');
                btnRimuovi.className = 'remove-icon';
                btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
                btnRimuovi.onclick = function() { rimuoviRiga(this); };
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
        const inputs = righe[i].getElementsByTagName('input');
        const nome = inputs[0].value.trim();
        const cfu = inputs[1].value.trim();
        const voto = inputs[2].value.trim();
        
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
            const inputVoto = document.createElement('input');
            inputVoto.type = 'number';
            inputVoto.min = '18';
            inputVoto.max = '31';
            inputVoto.placeholder = 'Voto';
            inputVoto.value = esame.voto || '';
            inputVoto.addEventListener('change', salvaInLocalStorage);
            cellaVoto.appendChild(inputVoto);
            
            // Cella Azioni
            const cellaAzioni = nuovaRiga.insertCell(3);
            const btnRimuovi = document.createElement('button');
            btnRimuovi.className = 'remove-icon';
            btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnRimuovi.onclick = function() { rimuoviRiga(this); };
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

// Verifica compatibilità e librerie al caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
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
        }
        // Imposta l'icona corretta del toggle all'avvio
        aggiornaDescrizioneToggle();
    }, 100);
});
