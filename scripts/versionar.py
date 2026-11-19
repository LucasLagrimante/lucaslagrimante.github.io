#!/usr/bin/env python3
"""Versiona o componente: stub estavel (cache curto) -> arquivo com hash (immutable).

Por que existe: o componente tinha nome fixo mas herdava cache longo. Corrigir
um bug exigia purgar a borda; sem permissao de purge, o site ficava preso na
versao antiga ate o TTL expirar.

Como funciona:
  - lagrimante-ticker-v2.css  -> so um @import da versao com hash
  - lagrimante-ticker-v2.js   -> loader que injeta projects.<hash>.js e
                                 ticker.<hash>.js, nesta ordem
  - os arquivos com hash nunca mudam de nome, entao cache longo e seguro

O stub resolve a base pela URL do proprio <script> (document.currentScript).
Caminho absoluto "/lagrimante/..." seria relativo ao dominio do site hospedeiro
e daria 404 em todos menos no host canonico -- foi o bug da primeira versao.

Uso:
    python3 scripts/versionar.py <pasta-lagrimante> [--build <pasta-do-build>]
"""
import hashlib
import io
import os
import re
import shutil
import sys


def h8(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:8]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    dst = os.path.abspath(args[0])
    build = None
    if "--build" in sys.argv:
        build = os.path.abspath(sys.argv[sys.argv.index("--build") + 1])

    if not os.path.isdir(dst):
        sys.exit(f"pasta inexistente: {dst}")

    # 1) atualiza os originais (css/js do componente) a partir do build
    if build:
        for f in ("lagrimante-ticker.css", "lagrimante-ticker.js"):
            src = os.path.join(build, f)
            if not os.path.isfile(src):
                sys.exit(f"faltando no build: {src}")
            shutil.copyfile(src, os.path.join(dst, f))
            print(f"atualizado do build: {f}")

    for f in ("lagrimante-ticker.css", "lagrimante-ticker.js", "lagrimante-projects.js"):
        if not os.path.isfile(os.path.join(dst, f)):
            sys.exit(f"faltando em {dst}: {f}")

    # 2) gera as versoes com hash
    mapa = {}
    for nome in ("lagrimante-ticker.css", "lagrimante-ticker.js", "lagrimante-projects.js"):
        p = os.path.join(dst, nome)
        base, ext = os.path.splitext(nome)
        novo = f"{base}.{h8(p)}{ext}"
        shutil.copyfile(p, os.path.join(dst, novo))
        mapa[nome] = novo
        print(f"{nome} -> {novo}")

    # 3) limpa versoes antigas do mesmo arquivo
    for nome in mapa:
        base, ext = os.path.splitext(nome)
        for f in os.listdir(dst):
            if re.fullmatch(rf"{re.escape(base)}\.[0-9a-f]{{8}}{re.escape(ext)}", f) and f != mapa[nome]:
                os.remove(os.path.join(dst, f))
                print(f"removida: {f}")

    # 4) stub CSS: @import relativo ao proprio arquivo (funciona em qualquer host)
    css = (
        "/* Stub estavel: o conteudo real e versionado por scripts/versionar.py. */\n"
        f'@import url("{mapa["lagrimante-ticker.css"]}");\n'
    )
    io.open(os.path.join(dst, "lagrimante-ticker-v2.css"), "w", encoding="utf-8", newline="\n").write(css)
    print("stub: lagrimante-ticker-v2.css")

    # 5) stub JS: base derivada do src do proprio script (nao do dominio do site)
    js = f"""/* Stub estavel: carrega a versao com hash (scripts/versionar.py).
   O arquivo real muda de nome a cada publicacao, entao cache longo nunca
   entrega componente antigo -- e este stub tem cache curto.

   A base vem do src deste script: um caminho absoluto seria relativo ao
   dominio do site hospedeiro e daria 404 fora do host canonico. */
(function () {{
  var s = document.currentScript || (function () {{
    var all = document.getElementsByTagName("script");
    return all[all.length - 1];
  }})();
  var base = (s && s.src ? s.src : "").replace(/lagrimante-ticker-v2\\.js(\\?.*)?$/, "");
  if (!base) return;

  var fila = ["{mapa['lagrimante-projects.js']}", "{mapa['lagrimante-ticker.js']}"];
  (function proximo() {{
    if (!fila.length) return;
    var el = document.createElement("script");
    el.src = base + fila.shift();
    el.async = false;
    el.onload = proximo;
    el.onerror = proximo;
    (document.head || document.documentElement).appendChild(el);
  }})();
}})();
"""
    io.open(os.path.join(dst, "lagrimante-ticker-v2.js"), "w", encoding="utf-8", newline="\n").write(js)
    print("stub: lagrimante-ticker-v2.js")
    print("\npronto.")


if __name__ == "__main__":
    main()
