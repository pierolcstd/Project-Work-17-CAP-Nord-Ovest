// Cache minima delle immagini: intercetta solo richieste GET same-origin con
// estensione immagine. HTML, CSS, JavaScript, PDF, API e risorse esterne restano
// fuori dalla cache. La strategia rete-prima controlla la versione online a
// ogni nuova richiesta e sostituisce la copia salvata se la risposta è valida;
// se la rete non è disponibile, restituisce la copia in cache, se presente.
// L'aggiornamento avviene quindi alla successiva richiesta dell'immagine, ad
// esempio ricaricando o riaprendo la pagina, non mentre la pagina è ferma.
// main.js registra questo worker; activate elimina le vecchie cache del progetto,
// mentre fetch applica la strategia solo alle immagini richieste dalle pagine.
var CACHE_NAME = 'cap-nord-images-v1';
// Espressione regolare che riconosce le estensioni delle immagini ammesse.
var IMAGE_ASSET = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

// Rimuove le versioni precedenti delle cache create da questo progetto.
// addEventListener registra la funzione da eseguire quando il worker si attiva.
self.addEventListener('activate', function (event) {
    // waitUntil mantiene l'attivazione in corso finché la pulizia è terminata.
    event.waitUntil(
        // keys() restituisce i nomi delle cache presenti per questo sito.
        caches.keys().then(function (cacheNames) {
            // Promise.all attende il completamento di tutte le eliminazioni.
            return Promise.all(
                cacheNames
                    // filter seleziona solo le cache vecchie appartenenti al progetto.
                    .filter(function (cacheName) {
                        return cacheName !== CACHE_NAME &&
                            (cacheName.indexOf('cap-nord-static-') === 0 ||
                                cacheName.indexOf('cap-nord-images-') === 0);
                    })
                    // map avvia delete() per ciascuna cache selezionata.
                    .map(function (cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        })
    );
});

// fetch si attiva per ogni richiesta effettuata da una pagina controllata.
self.addEventListener('fetch', function (event) {
    // request contiene metodo e URL della richiesta originale.
    var request = event.request;
    // URL separa origine e percorso per applicare i filtri sottostanti.
    var url = new URL(request.url);

    // Le richieste non selezionate proseguono senza intervento del service worker.
    if (request.method !== 'GET' ||
        url.origin !== self.location.origin ||
        !IMAGE_ASSET.test(url.pathname)) {
        return;
    }

    // Chiede una risposta aggiornata alla rete (con eventuale validazione HTTP);
    // una risposta valida rimpiazza la copia in cache, mentre gli errori HTTP
    // vengono restituiti senza nasconderli. Solo un errore di rete usa la cache.
    // respondWith permette al worker di fornire la risposta in modo asincrono.
    event.respondWith(
        // open() apre la cache del progetto o la crea se non esiste ancora.
        caches.open(CACHE_NAME).then(function (cache) {
            // match() cerca nella cache una risposta associata a questa richiesta.
            return cache.match(request).then(function (cachedResponse) {
                // fetch() interroga la rete; cache: 'no-cache' ne richiede la
                // rivalidazione invece di riusare una copia HTTP non verificata.
                return fetch(request, { cache: 'no-cache' }).then(function (response) {
                    // ok esclude gli errori HTTP; basic identifica una risposta same-origin.
                    if (!response.ok || response.type !== 'basic') {
                        return response;
                    }

                    // clone() duplica la risposta perché put() consuma il suo body.
                    // put() salva/sostituisce la copia; poi si restituisce la risposta online.
                    return cache.put(request, response.clone()).then(function () {
                        return response;
                    });
                }, function (error) {
                    // Il secondo callback di then gestisce errori di rete, non errori HTTP.
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Senza una copia offline, rilancia l'errore originale.
                    throw error;
                });
            });
        })
    );
});
