// La cache separata per versione distingue queste immagini dalle copie precedenti.
var CACHE_NAME = 'cap-nord-images-v3'; // Incrementare v3 quando si vuole svuotare la cache immagini.
var IMAGE_ASSET = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i; // Riconosce le estensioni immagine gestite dal worker.

self.addEventListener('install', function (event) { // Riceve l'installazione di una nuova versione del worker.
    event.waitUntil(self.skipWaiting()); // Attiva subito il worker nuovo senza attendere la chiusura delle schede.
}); // Termina la registrazione del gestore install.

self.addEventListener('activate', function (event) { // Riceve l'attivazione del worker appena installato.
    event.waitUntil( // Mantiene l'attivazione aperta fino alla fine della pulizia delle cache.
        caches.keys().then(function (cacheNames) { // Legge i nomi delle cache di questo sito.
            return Promise.all( // Attende che tutte le cache obsolete selezionate siano eliminate.
                cacheNames // Elenco delle cache registrate per l'origine corrente.
                    .filter(function (cacheName) { // Mantiene solo le vecchie cache del progetto.
                        return cacheName !== CACHE_NAME && // Non elimina la cache attualmente in uso.
                            (cacheName.indexOf('cap-nord-static-') === 0 || // Riconosce vecchie cache statiche del progetto.
                                cacheName.indexOf('cap-nord-images-') === 0); // Riconosce vecchie versioni della cache immagini.
                    }) // Termina il filtro delle cache da rimuovere.
                    .map(function (cacheName) { // Avvia la rimozione di ogni cache obsoleta.
                        return caches.delete(cacheName); // Elimina la cache selezionata e restituisce la sua Promise.
                    }) // Termina la creazione dell'elenco di eliminazioni.
            ); // Termina l'attesa parallela delle eliminazioni.
        }).then(function () { // Prosegue dopo la pulizia delle cache obsolete.
            return self.clients.claim(); // Fa controllare subito al nuovo worker le pagine già aperte.
        }) // Termina la catena asincrona dell'attivazione.
    ); // Termina l'attesa dell'attivazione.
}); // Termina la registrazione del gestore activate.

self.addEventListener('fetch', function (event) { // Riceve le richieste di rete delle pagine controllate dal worker.
    var request = event.request; // Memorizza la richiesta originale del browser.
    var url = new URL(request.url); // Separa origine e percorso della risorsa richiesta.

    if (request.method !== 'GET' || // Esclude le richieste che non sono letture GET.
        url.origin !== self.location.origin || // Esclude risorse ospitate su un'origine diversa dal sito.
        !IMAGE_ASSET.test(url.pathname)) { // Esclude file che non hanno un'estensione immagine supportata.
        return; // Lascia al browser la gestione standard di HTML, CSS, JS, PDF e altre risorse.
    } // Termina il controllo delle richieste escluse.

    event.respondWith( // Affida al worker la risposta per le sole richieste immagine selezionate.
        caches.open(CACHE_NAME).then(function (cache) { // Apre la cache corrente o la crea al primo utilizzo.
            return cache.match(request).then(function (cachedResponse) { // Cerca prima l'immagine nella cache locale.
                if (cachedResponse) { // Controlla se la cache contiene già una risposta per questa richiesta.
                    return cachedResponse; // Restituisce subito l'immagine salvata senza accedere alla rete.
                } // Termina il ramo cache hit.

                return fetch(request).then(function (response) { // Se manca in cache, richiede l'immagine alla rete.
                    if (response.ok && response.type === 'basic') { // Memorizza solo risposte riuscite della stessa origine.
                        event.waitUntil(cache.put(request, response.clone())); // Salva una copia senza consumare il body restituito alla pagina.
                    } // Termina il controllo della risposta memorizzabile.
                    return response; // Restituisce al browser la risposta di rete, anche in caso di errore HTTP.
                }); // Termina la richiesta di rete usata come fallback della cache.
            }); // Termina la ricerca cache-first seguita, se serve, dalla rete.
        }) // Termina l'apertura della cache e la gestione della richiesta.
    ); // Termina la registrazione della risposta asincrona.
}); // Termina la registrazione del gestore fetch.
