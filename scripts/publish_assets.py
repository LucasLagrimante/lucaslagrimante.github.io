#!/usr/bin/env python3
"""Publica o pacote da assinatura em um host canonico.

Responsabilidades:
  1. renomeia cada logo para <slug>.<hash6>.png (hash do conteudo);
  2. reescreve o mapa slug -> arquivo dentro de lagrimante-projects.js;
  3. remove PNGs orfaos (logo de projeto que saiu da lista);
  4. imprime um diff legivel: arquivo renomeado = aquele logo mudou.

Uso:
    python3 publish_assets.py <pasta-do-pacote> [--dry-run]

O hash no nome e o que permite Cache-Control: immutable com max-age de 1 ano.
Sem ele, o visitante recorrente fica com o logo antigo por um ano e nao ha como
empurrar a atualizacao.
"""
import hashlib
import os
import re
import sys


def hash6(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:6]


def slug_of(filename):
    # aceita tanto 'eloara.png' quanto 'eloara.a3f9c1.png' (idempotente)
    return filename.split(".")[0]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pkg = sys.argv[1]
    dry = "--dry-run" in sys.argv
    logos = os.path.join(pkg, "logos")
    projects_js = os.path.join(pkg, "lagrimante-projects.js")

    if not os.path.isdir(logos):
        sys.exit(f"sem pasta de logos em {logos}")
    if not os.path.isfile(projects_js):
        sys.exit(f"sem projects.js em {projects_js}")

    # 1) renomeia com hash -------------------------------------------------
    renomeados = []
    for name in sorted(os.listdir(logos)):
        if not name.endswith(".png"):
            continue
        slug = slug_of(name)
        novo = f"{slug}.{hash6(os.path.join(logos, name))}.png"
        if name != novo:
            renomeados.append((name, novo))
            if not dry:
                os.replace(os.path.join(logos, name), os.path.join(logos, novo))

    # 2) mapeia slug -> arquivo e reescreve no projects.js ------------------
    mapa = {}
    for name in sorted(os.listdir(logos)):
        if name.endswith(".png"):
            mapa[slug_of(name)] = name

    with open(projects_js, encoding="utf-8") as f:
        js = f.read()

    linhas = "\n".join(f'  "{k}": "logos/{v}",' for k, v in sorted(mapa.items()))
    bloco = f"window.LAGRIMANTE_LOGOS = {{\n{linhas}\n}};\n"

    if "window.LAGRIMANTE_LOGOS" in js:
        js = re.sub(
            r"window\.LAGRIMANTE_LOGOS\s*=\s*\{.*?\};\n?",
            bloco,
            js,
            flags=re.S,
        )
    else:
        js = js.rstrip() + "\n\n" + bloco

    if not dry:
        with open(projects_js, "w", encoding="utf-8", newline="\n") as f:
            f.write(js)

    # 3) orfaos: PNG cujo slug nao esta na lista de projetos ----------------
    slugs = set(re.findall(r"slug:\s*['\"]([^'\"]+)", js))
    orfaos = sorted(s for s in mapa if s not in slugs)

    # 4) relatorio ---------------------------------------------------------
    print(f"logos publicados: {len(mapa)}")
    if renomeados:
        print("\nlogo alterado (nome mudou, cache invalidado):")
        for antes, depois in renomeados:
            print(f"  {antes} -> {depois}")
    else:
        print("\nnenhum logo mudou desde a ultima publicacao")
    if orfaos:
        print("\nORFAOS (nao estao na lista de projetos, apague se nao for fallback):")
        for s in orfaos:
            print(f"  {s} -> {mapa[s]}")
    if dry:
        print("\n[dry-run] nada foi escrito")


if __name__ == "__main__":
    main()
