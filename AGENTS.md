# AGENTS.md

Orientações para agentes de IA trabalhando neste repositório.

## Arquivo canônico de instruções (leia antes de criar qualquer outro)

**`AGENTS.md` é o único arquivo de instrução de agente deste repositório.**

Proibido criar `CLAUDE.md`, `GEMINI.md` ou `AGENTS.local.md` aqui, e **proibido symlink**
apontando para o `AGENTS.md`. As ferramentas legem `AGENTS.md` nativamente, então o alias
só gerava edição no arquivo errado.

- Regra de agente nova → edite o `AGENTS.md`. Só ele.
- `README.md` é descrição do portfólio **para humanos** (o que é o site, como ver, como
  publicar). Não é lugar de instrução de agente.

---

## O que é este repositório

Site de portfólio pessoal, **estático e sem build**: é a raiz do GitHub Pages
(`lucaslagrimante.github.io`), servida como está. Não há `package.json`, bundler, framework
nem transpilação — o que está no repositório é exatamente o que o navegador recebe.

```
index.html          # página única, todas as seções
css/style.css       # estilo único do site (tokens por custom properties)
js/main.js          # comportamento de UI (navegação, menu, animações de entrada)
js/particles.js     # canvas de partículas do hero (autônomo, sem dependência)
assets/             # favicons, og image, ícones
Profile.pdf         # currículo em PDF servido como link de download
```

## Onde mexer

- **Seções da página**: cada `<section>` tem um `id` estável — `hero`, `about`, `work`,
  `experience`, `education`, `stack`, `contact`. É o que o menu e as âncoras navegam.
  Renomear um `id` quebra o link interno correspondente; prefira adicionar em vez de renomear.
- **Visual**: as cores e espaçamentos saem das custom properties no topo de `css/style.css`.
  Alterar um valor ali propaga para o site inteiro — não espalhe literais pelo resto do CSS.
- **Partículas do hero**: `js/particles.js` é autocontido. Ao mexer, respeite o
  `prefers-reduced-motion` (partículas desligadas) — é o que mantém o site usável para quem
  pede menos movimento no sistema.

## Regras

1. **HTML, CSS e JS são vanilla**, sem framework e sem dependência externa. Não introduza
   biblioteca, CDN ou step de build: isso quebraria a premissa de "o repo é o site".
2. **O site é público e tem que abrir sem JS**: o conteúdo textual das seções fica no
   `index.html`, não é injetado por script. JavaScript só adiciona comportamento.
3. **Acessibilidade**: mantenha `alt` nas imagens, rótulos associáveis aos campos de contato
   e foco visível. Navegação por teclado é requisito, não um bônus.
4. **Meta e SEO**: `<title>` e `<meta name="description">` no `<head>` do `index.html` são o
   que o Google e o WhatsApp mostram ao linkar o site — atualize junto com o conteúdo.
5. **Idioma**: conteúdo em português brasileiro ou inglês, conforme a seção já esteja;
   código e comentários em português.

## Como verificar

Sem build, a verificação é abrir e olhar:

```bash
python3 -m http.server 8000     # sirva a raiz e abra http://localhost:8000/
```

- Confira no console do navegador que não há erro nem 404 (o site é 100% local, então
  qualquer request externo é bug).
- Teste em largura de mobile e desktop, e com tema claro/escuro se o site oferecer.
- Ao mexer em `js/`, rode o console: erro silencioso em canvas ou listener derruba a página
  inteira sem mensagem útil.

## Deploy

Publicação é pelo próprio GitHub Pages servindo a branch padrão. **Não** existe pipeline de
build — não crie um. Depois de push para a branch de publicação, a atualização leva alguns
minutos; use *hard reload* ao validar.
