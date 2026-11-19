/* Stub estavel: carrega a versao com hash (scripts/versionar.py).
   O arquivo real muda de nome a cada publicacao, entao cache longo nunca
   entrega componente antigo -- e este stub tem cache curto.

   A base vem do src deste script: um caminho absoluto seria relativo ao
   dominio do site hospedeiro e daria 404 fora do host canonico. */
(function () {
  var s = document.currentScript || (function () {
    var all = document.getElementsByTagName("script");
    return all[all.length - 1];
  })();
  var base = (s && s.src ? s.src : "").replace(/lagrimante-ticker-v2\.js(\?.*)?$/, "");
  if (!base) return;

  var fila = ["lagrimante-projects.8a3d4c6f.js", "lagrimante-ticker.8f281770.js"];
  (function proximo() {
    if (!fila.length) return;
    var el = document.createElement("script");
    el.src = base + fila.shift();
    el.async = false;
    el.onload = proximo;
    el.onerror = proximo;
    (document.head || document.documentElement).appendChild(el);
  })();
})();
