// Nome versionato: incrementarlo quando cambiano le regole o gli asset da gestire.
var CACHE_NAME = 'cap-nord-static-v1';

// Durata massima della cache: ogni risorsa viene considerata scaduta dopo 30 giorni.
var CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Limita la cache agli asset statici same-origin, evitando HTML, PDF e richieste API.
var STATIC_ASSET = /\.(?:css|js|png|jpe?g|webp|svg|woff2?)$/i;
var CACHED_AT_HEADER = 'X-Cap-Nord-Cached-At';

self.addEventListener('install', function (event) {
    // install: evento di prima installazione o aggiornamento del worker;
    // event.waitUntil mantiene la fase aperta finché skipWaiting non termina.
    // Attiva subito la nuova versione del service worker senza attendere la chiusura delle schede.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
    // activate: evento eseguito dopo install, usato per migrare e ripulire le cache.
    // Rimuove le versioni precedenti della cache e gli asset già più vecchi di 30 giorni.
    event.waitUntil(
        // caches.keys() elenca tutte le cache di questo sito.
        caches.keys().then(function (cacheNames) {
            // Elimina solo le cache di questo progetto, preservando cache di altri componenti.
            return Promise.all(
                cacheNames
                    .filter(function (cacheName) {
                        return cacheName.indexOf('cap-nord-static-') === 0 &&
                            cacheName !== CACHE_NAME;
                    })
                    .map(function (cacheName) {
                        // delete() rimuove la cache scelta e restituisce una Promise.
                        return caches.delete(cacheName);
                    })
            );
        }).then(function () {
            // Apre la cache della versione corrente, creandola se non esiste ancora.
            return caches.open(CACHE_NAME);
        }).then(function (cache) {
            // keys() restituisce le richieste salvate, così si può controllare l'età di ognuna.
            return cache.keys().then(function (requests) {
                // Scade le risposte senza data valida e quelle oltre il limite temporale.
                return Promise.all(requests.map(function (request) {
                    return cache.match(request).then(function (response) {
                        if (isExpired(response)) {
                            // Elimina la singola risorsa scaduta senza cancellare le altre.
                            return cache.delete(request);
                        }
                    });
                }));
            });
        }).then(function () {
            // Prende in carico le pagine aperte, così le richieste successive usano questo worker.
            return self.clients.claim();
        })
    );
});

// Considera scaduta una risposta priva di data valida o più vecchia del limite configurato.
function isExpired(response) {
    // L'header personalizzato contiene il timestamp di salvataggio in millisecondi.
    var cachedAt = response && Number(response.headers.get(CACHED_AT_HEADER));
    // Date.now() usa lo stesso formato; un dato assente o non numerico viene trattato come scaduto.
    return !cachedAt || Date.now() - cachedAt >= CACHE_MAX_AGE_MS;
}

self.addEventListener('fetch', function (event) {
    // fetch: evento generato per ogni richiesta intercettabile della pagina controllata.
    var request = event.request;
    // URL fornisce origine e percorso per limitare l'intercettazione al sito e agli asset statici.
    var url = new URL(request.url);

    // Lascia al browser le richieste non-GET, cross-origin e i contenuti non statici.
    if (request.method !== 'GET' ||
        url.origin !== self.location.origin ||
        !STATIC_ASSET.test(url.pathname)) {
        return;
    }

    event.respondWith(
        // respondWith() fa restituire al browser la risposta prodotta da questa strategia.
        caches.open(CACHE_NAME).then(function (cache) {
            // Usa la cache solo finché la risorsa non ha superato i 30 giorni.
            return cache.match(request).then(function (cachedResponse) {
                if (cachedResponse && !isExpired(cachedResponse)) {
                    return cachedResponse;
                }

                // Elimina l'eventuale copia scaduta e richiede una versione aggiornata alla rete.
                // Promise.resolve() uniforma il flusso anche quando non c'è una copia da eliminare.
                var removeExpired = cachedResponse ? cache.delete(request) : Promise.resolve();
                return removeExpired.then(function () {
                    // fetch() invia la richiesta alla rete quando non esiste una copia valida.
                    return fetch(request);
                }).then(function (response) {
                    // Cache solo risposte same-origin valide; gli errori non vengono memorizzati.
                    if (!response.ok || response.type !== 'basic') {
                        return response;
                    }

                    // Salva la data di inserimento per poter applicare il limite di 30 giorni.
                    // Le risposte sono immutabili: si ricreano header e Response per aggiungere il timestamp.
                    var headers = new Headers(response.headers);
                    headers.set(CACHED_AT_HEADER, String(Date.now()));
                    // clone() conserva il body della risposta originale per creare una copia cacheable.
                    var responseToCache = new Response(response.clone().body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers
                    });

                    // Attende il salvataggio prima di restituire la risposta al browser.
                    // put() associa la richiesta alla risposta; Promise mantiene l'ordine delle operazioni.
                    return cache.put(request, responseToCache).then(function () {
                        return response;
                    });
                });
            });
        })
    );
});
