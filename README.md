# CAI-CAP Nord Ovest Report
A basic web app with HTML, CSS, and JavaScript

## Cache delle immagini

Il service worker `sw.js`, registrato da `js/main.js`, usa una strategia
cache-first per le immagini same-origin: serve dalla cache quelle gia salvate
e scarica e memorizza le immagini mancanti. Per aggiornare un'immagine
mantenendo lo stesso percorso, incrementare la versione `CACHE_NAME` in `sw.js`
e pubblicare insieme il worker e gli asset aggiornati. La cache non rende
disponibili offline le pagine HTML o il PDF.

## Transizione tra pagine

Il CSS abilita le Cross-Document View Transitions per la navigazione interna:
la pagina sfuma brevemente e l'immagine hero condivide una transizione tra
pagine. Nei browser che supportano questa funzione si applica ai normali link
interni; negli altri, o con movimento ridotto preferito, la navigazione resta
utilizzabile senza dipendere dall'animazione.
