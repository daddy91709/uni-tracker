function aggiungiRiga() {
    const tabella = document.getElementById('tabellaEsami').getElementsByTagName('tbody')[0];
    const nuovaRiga = tabella.insertRow();
    
    // Cella per nome esame
    const cellaNome = nuovaRiga.insertCell(0);
    const inputNome = document.createElement('input');
    inputNome.type = 'text';
    inputNome.placeholder = 'Nome esame';
    cellaNome.appendChild(inputNome);
    
    // Cella per CFU
    const cellaCFU = nuovaRiga.insertCell(1);
    const inputCFU = document.createElement('input');
    inputCFU.type = 'number';
    inputCFU.min = '1';
    inputCFU.max = '30';
    inputCFU.placeholder = 'CFU';
    cellaCFU.appendChild(inputCFU);
    
    // Cella per voto
    const cellaVoto = nuovaRiga.insertCell(2);
    const inputVoto = document.createElement('input');
    inputVoto.type = 'number';
    inputVoto.min = '18';
    inputVoto.max = '30';
    inputVoto.placeholder = 'Voto';
    cellaVoto.appendChild(inputVoto);
    
    // Cella per azioni
    const cellaAzioni = nuovaRiga.insertCell(3);
    const btnRimuovi = document.createElement('button');
    btnRimuovi.className = 'remove-icon';
    btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
    btnRimuovi.onclick = function() { rimuoviRiga(this); };
    cellaAzioni.appendChild(btnRimuovi);
}

function rimuoviRiga(btn) {
    const riga = btn.parentNode.parentNode;
    riga.parentNode.removeChild(riga);
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
    const mediaMax = calcolaMediaConSconto(esamiMax);
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
        const mediaConSconto = calcolaMediaConSconto(esamiProvvisori);
        return mediaConSconto ? (mediaConSconto / 30 * 110) : 0;
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
                cellaNome.appendChild(inputNome);
                
                const cellaCFU = nuovaRiga.insertCell(1);
                const inputCFU = document.createElement('input');
                inputCFU.type = 'number';
                inputCFU.min = '1';
                inputCFU.max = '30';
                inputCFU.placeholder = 'CFU';
                inputCFU.value = cfu || '';
                cellaCFU.appendChild(inputCFU);
                
                const cellaVoto = nuovaRiga.insertCell(2);
                const inputVoto = document.createElement('input');
                inputVoto.type = 'number';
                inputVoto.min = '18';
                inputVoto.max = '30';
                inputVoto.placeholder = 'Voto';
                inputVoto.value = voto || '';
                cellaVoto.appendChild(inputVoto);
                
                const cellaAzioni = nuovaRiga.insertCell(3);
                const btnRimuovi = document.createElement('button');
                btnRimuovi.className = 'remove-icon';
                btnRimuovi.innerHTML = '<i class="fas fa-trash-alt"></i>';
                btnRimuovi.onclick = function() { rimuoviRiga(this); };
                cellaAzioni.appendChild(btnRimuovi);
            }
        });        // Aggiorna i calcoli
        calcolaMetriche();
        
        // Resetta l'input file
        input.value = '';
        
        // Mostra notifica di successo
        mostraNotifica('Dati importati con successo!');
    };
    reader.readAsText(file);
}
