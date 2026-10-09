# lucaslagrimante.github.io

Portfólio pessoal de **Lucas Lagrimante — Senior Software Engineer**.

Site estático publicado pelo GitHub Pages. Uma página, sem build e sem dependência externa:
o que está neste repositório é exatamente o que o navegador recebe.

## Seções

`hero` · `about` · `work` · `experience` · `education` · `stack` · `contact`

## Ver localmente

O site é 100% estático, então basta servir a pasta:

```bash
python3 -m http.server 8000
```

e abrir <http://localhost:8000/>.

## Publicar

Não há pipeline de build. O GitHub Pages serve a branch padrão direto do repositório —
basta fazer push. A atualização leva alguns minutos; ao validar, faça *hard reload*.

## Estrutura

```
index.html      página única com todas as seções
css/style.css   estilo do site (tokens em custom properties)
js/main.js      comportamento de UI
js/particles.js canvas de partículas do hero
assets/         favicons, imagem de preview e ícones
Profile.pdf     currículo para download
```

---

Instruções para agentes de IA que trabalham neste repositório estão em
[AGENTS.md](AGENTS.md).
