/* Stub estavel: carrega a versao com hash (scripts/versionar.py).
   O nome do arquivo real muda a cada publicacao, entao cache longo nunca
   entrega componente antigo -- e este stub tem cache curto. */
(function () {
  var doc = document;
  var fila = ["lagrimante-projects.8a3d4c6f.js", "lagrimante-ticker.e9af983d.js"];
  (function proximo() {
    if (!fila.length) return;
    var s = doc.createElement("script");
    s.src = "/lagrimante/" + fila.shift();
    s.async = false;
    s.onload = proximo;
    s.onerror = proximo;
    (doc.head || doc.documentElement).appendChild(s);
  })();
})();
