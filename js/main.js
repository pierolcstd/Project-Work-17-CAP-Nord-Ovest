/* =========================================================
   main.js – Comportamenti condivisi tra le pagine

   Lo script è caricato in fondo al body: gli elementi HTML sono già disponibili
   quando vengono cercati. Le funzioni controllano la presenza dei componenti,
   così ogni pagina può condividere il file anche se non contiene tutte le UI.
   ========================================================= */

/* ----- Menu hamburger (mobile, in tutte le pagine) -----
   Il pulsante .menu-toggle e il nav .menu sono definiti nell'header HTML.
   Al click, la classe open viene aggiunta/rimossa: il CSS usa .menu.open per
   mostrare il menu e .menu-toggle.open per animare le tre linee dell'icona.
   aria-expanded viene aggiornato nello stesso momento per esporre lo stato
   del menu anche alle tecnologie assistive. Se uno dei due elementi manca,
   questa pagina non ha il componente e non viene registrato alcun listener.
*/
(function () {
    var btn = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.menu');
    if (btn && nav) {
        btn.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            btn.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', open);
        });
    }
})();

/* ----- Selettore report (report.html) -----
   Il select della pagina report chiama showReport(this.value) al cambio.
   Ogni pannello ha classe report-panel e un id nel formato report-<anno>.
   Prima si disattivano tutti i pannelli; poi si attiva quello con l'id
   corrispondente. In style.css .report-panel è nascosto e .active lo mostra.
*/
function showReport(year) {
    document.querySelectorAll('.report-panel').forEach(function (p) {
        p.classList.remove('active');
    });
    var target = document.getElementById('report-' + year);
    if (target) target.classList.add('active');
}

/* ----- Cache delle immagini per uso offline -----
   I browser che supportano i service worker registrano sw.js allo stesso
   percorso del sito. La logica di cache e le richieste intercettate sono
   definite nel service worker; in questo file la registrazione è soltanto
   avviata. Un errore viene scritto in console senza bloccare la pagina.
*/
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (error) {
        console.error('Registrazione del service worker non riuscita:', error);
    });
}
