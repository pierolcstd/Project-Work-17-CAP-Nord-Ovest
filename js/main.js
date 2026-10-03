/* =========================================================
   main.js – Script condiviso per tutto il sito
   ========================================================= */

/* ----- Menu hamburger (mobile) ----- */
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

/* ----- Selettore report (report.html) ----- */
function showReport(year) {
    document.querySelectorAll('.report-panel').forEach(function (p) {
        p.classList.remove('active');
    });
    var target = document.getElementById('report-' + year);
    if (target) target.classList.add('active');
}
