/* ==========================================================================
   lagrimante-ticker.js — assinatura de projetos de Lucas Lagrimante
   v1.0.0

   Depende de window.LAGRIMANTE_PROJECTS (lagrimante-projects.js).
   Se a lista não existir, busca de https://lagrimante.com.br e, falhando,
   remove o componente sem erro no console (falha silenciosa).
   ========================================================================== */

/* lagrimante-ticker · variante "rotativo"
   Uso: <nav data-lagrimante-ticker="rotativo" aria-label="..."></nav>
   Atributos opcionais: data-current="slug", data-label, data-label-short */
(function () {
  'use strict';
  var doc = document;
  var REDUZIR = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Logo do projeto.
  //
  // Ordem de resolução:
  //   1. window.LAGRIMANTE_LOGOS[slug]  -> mapa slug->arquivo publicado pelo
  //      script de publicação (nomes com hash de conteúdo, ex.: eloara.e5af24.png).
  //      É o que permite Cache-Control: immutable sem congelar logo antigo.
  //   2. <data-logo-base><slug>.png    -> fallback para pacote local sem hash.
  //   3. /lagrimante/logos/<slug>.png  -> fallback absoluto (host de origem).
  function logo(slug, cls, size, base) {
    var L = window.LAGRIMANTE_LOGOS;
    var i = el('img', cls);
    var arquivo = (L && L[slug]) || (slug + '.png');
    var raiz = base || window.LAGRIMANTE_LOGO_BASE || '/lagrimante/logos/';
    // o mapa já traz "logos/arquivo.png" quando publicado com hash
    i.src = (L && L[slug] && arquivo.indexOf('/') !== -1)
      ? raiz.replace(/logos\/?$/, '') + arquivo
      : raiz + arquivo;
    i.alt = '';
    i.width = size; i.height = size;
    i.decoding = 'async';
    // logo quebrado: some sem erro, o fundo do slot continua marcando o lugar
    i.addEventListener('error', function () { i.style.visibility = 'hidden'; }, { once: true });
    return i;
  }

  // links para outros domínios abrem em nova aba
  function externo(a, url) {
    try {
      if (new URL(url, location.href).host !== location.host) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    } catch (e) { /* url inválida: deixa como está */ }
  }

  // descobre qual projeto é o site atual (data-current tem prioridade)
  function atual(node, list) {
    var forcado = node.getAttribute('data-current');
    if (forcado) return forcado;
    var aqui = location.host.replace(/^www\./, '') + location.pathname;
    var melhor = '', tam = 0;
    list.forEach(function (p) {
      try {
        var u = new URL(p.url);
        var chave = u.host.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
        if (aqui.indexOf(chave) === 0 && chave.length > tam) { melhor = p.slug; tam = chave.length; }
      } catch (e) { /* ignora */ }
    });
    return melhor;
  }

  function render(node, todos) {
    if (node.getAttribute('data-ready')) return;
    var cur = atual(node, todos);
    var list = todos.filter(function (p) { return p && p.slug && p.name && p.url && p.slug !== cur; });
    if (!list.length) { node.remove(); return; }
    node.setAttribute('data-ready', '1');
    node.textContent = '';
    var base = node.getAttribute('data-logo-base') || '';

    var row = el('div', 'llr__row');
    // a assinatura é o link para o portfólio: assim o "Lagrimante — Portfólio"
    // não precisa aparecer como item da lista, o que seria circular
    var by = el('a', 'llr__by');
    by.href = node.getAttribute('data-portfolio') || 'https://lagrimante.com.br';
    by.target = '_blank';
    by.rel = 'noopener noreferrer';
    by.title = 'Lucas Lagrimante — portfólio';
    // "feito por Lucas": o crédito é do autor, e o portfólio é o destino do
    // link — não um item da lista. A versão curta só aparece em telas estreitas.
    by.appendChild(el('span', 'llr__by-l', node.getAttribute('data-label') || 'feito por Lucas'));
    by.appendChild(el('span', 'llr__by-s', node.getAttribute('data-label-short') || 'por Lucas'));

    // palco é só visual: duplica a informação da doca, por isso fica fora da árvore de acessibilidade
    var stage = el('div', 'llr__stage');
    stage.setAttribute('aria-hidden', 'true');
    var dock = el('ul', 'llr__dock');
    dock.setAttribute('role', 'list');

    var cards = [], pips = [];
    list.forEach(function (p, i) {
      var c = el('a', 'llr__card');
      c.href = p.url; c.tabIndex = -1; externo(c, p.url);
      c.appendChild(logo(p.slug, 'llr__logo', 20, base));
      c.appendChild(el('span', 'llr__name', p.name));
      if (p.tagline) c.appendChild(el('span', 'llr__tag', p.tagline));
      stage.appendChild(c); cards.push(c);

      var li = el('li');
      var a = el('a', 'llr__pip');
      a.href = p.url; externo(a, p.url);
      a.setAttribute('aria-label', p.name + (p.tagline ? ', ' + p.tagline : ''));
      a.setAttribute('data-i', i);
      a.appendChild(logo(p.slug, '', 18, base));
      a.appendChild(el('i', 'llr__bar'));
      li.appendChild(a); dock.appendChild(li); pips.push(a);
    });

    row.appendChild(by); row.appendChild(stage); row.appendChild(dock);
    node.appendChild(row);

    var idx = -1;
    // trava: duas trocas no mesmo frame deixam dois cards "is-on" empilhados
    var travado = false;
    function mostrar(n, salto) {
      n = (n + list.length) % list.length;
      if (n === idx) return;
      if (travado) return;
      travado = true;
      setTimeout(function () { travado = false; }, 60);
      var ant = idx; idx = n;
      // escolha direta (hover/teclado) troca mais rápido que a rotação automática
      if (salto) {
        node.classList.add('is-jump');
        clearTimeout(mostrar._t);
        mostrar._t = setTimeout(function () { node.classList.remove('is-jump'); }, 240);
      }
      // só troca classes: a transição é transform + opacity no CSS.
      // Escreve classes em dois passos: 1) marca a saída do atual, 2) no frame seguinte
      // aplica a entrada. Sem isso, um card limpo e marcado no mesmo reflow pula a
      // transição (o browser não vê o estado inicial) e a troca vira corte seco.
      for (var k = 0; k < cards.length; k++) {
        cards[k].classList.remove('is-on');
        if (k !== ant) cards[k].classList.remove('is-off');
        pips[k].classList.remove('is-on');
      }
      if (ant >= 0) cards[ant].classList.add('is-off');
      pips[n].classList.add('is-on');
      cards[n].classList.remove('is-off');
      // força o estilo a ser lido para o browser registrar o estado "fora da fenda"
      void cards[n].offsetHeight;
      cards[n].classList.add('is-on');
    }

    // o fim da barra de progresso avança para o próximo; sem setInterval
    dock.addEventListener('animationend', function (e) {
      if (e.animationName === 'llr-fill') mostrar(idx + 1);
    });
    function escolher(e) {
      var a = e.target.closest ? e.target.closest('.llr__pip') : null;
      if (a) mostrar(+a.getAttribute('data-i'), true);
    }
    dock.addEventListener('mouseover', escolher);
    dock.addEventListener('focusin', escolher);

    // começa num projeto sorteado: quem volta ao site vê outro
    mostrar(Math.floor(Math.random() * list.length));

    // fora da tela ou aba oculta: pausa a barra (e, com ela, a rotação)
    var visivel = true;
    function ocioso() { node.classList.toggle('is-idle', !visivel || doc.hidden); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visivel = es[es.length - 1].isIntersecting; ocioso();
      }).observe(node);
    }
    doc.addEventListener('visibilitychange', ocioso);
  }

  function boot() {
    // :not([data-manual]) — navegadores de SPA (React/Vue) controlam o nó e chamam
    // LagrimanteTicker.mount depois da hidratação. Se o boot automático preencher
    // antes, o React encontra DOM diferente do SSR e a hidratação falha (#418/#423).
    var nodes = doc.querySelectorAll('[data-lagrimante-ticker="rotativo"]:not([data-manual])');
    if (!nodes.length) return;
    function go(list) {
      var ok = Array.isArray(list) && list.length > 0;
      Array.prototype.forEach.call(nodes, function (n) {
        // falha silenciosa: qualquer problema remove o componente, sem erro no console
        try { if (ok) render(n, list); else n.remove(); } catch (e) { n.remove(); }
      });
    }
    if (window.LAGRIMANTE_PROJECTS) return go(window.LAGRIMANTE_PROJECTS);
    var s = doc.createElement('script');
    s.src = 'https://lagrimante.com.br/lagrimante-projects.js';
    s.async = true;
    s.onload = function () { go(window.LAGRIMANTE_PROJECTS); };
    s.onerror = function () { go(null); };
    doc.head.appendChild(s);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();

  // API pública: permite montar em SPAs (React/Vue/Svelte), onde o elemento
  // nasce depois do DOMContentLoaded. Autossuficiente: busca a lista se faltar.
  window.LagrimanteTicker = {
    mount: function (el) {
      if (!el) return;
      if (window.LAGRIMANTE_PROJECTS) {
        try { render(el, window.LAGRIMANTE_PROJECTS); } catch (e) { el.remove(); }
        return;
      }
      var s = doc.createElement('script');
      s.src = 'https://lagrimante.com.br/lagrimante-projects.js';
      s.async = true;
      s.onload = function () {
        try { render(el, window.LAGRIMANTE_PROJECTS); } catch (e) { el.remove(); }
      };
      s.onerror = function () { el.remove(); };
      doc.head.appendChild(s);
    }
  };
})();
