(function () {
  "use strict";

  var dict = {
    en: {
      "skip": "Skip to content",
      "nav.about": "About",
      "nav.experience": "Experience",
      "nav.contact": "Contact",
      "hero.eyebrow": "Juiz de Fora, Brazil — Available remotely",
      "hero.kicker": "I turn complex data into systems people can trust.",
      "hero.role": "Senior Software Engineer working where data migration, artificial intelligence and financial products intersect.",
      "hero.cta": "Start a conversation",
      "hero.scroll": "Explore the system",
      "about.eyebrow": "About / Approach",
      "about.title": "Engineering clarity<br>out of complexity.",
      "about.body": "I build enterprise systems, AI-assisted data migration pipelines and financial products — turning fragile manual processes into reliable infrastructure.",
      "about.note": "My work connects the whole system: how data moves, how teams operate, how software behaves and, ultimately, how people experience the product.",
      "metrics.records": "records processed",
      "metrics.systems": "systems connected",
      "metrics.steps": "ETL validation steps",
      "metrics.error": "error rate after automation",
      "work.eyebrow": "Selected systems",
      "work.title": "Not just code.<br>Systems that move.",
      "work.intro": "Two examples of the work I care about most: removing operational friction and turning complex information into useful decisions.",
      "work.migration.title": "Migration, rebuilt as an intelligent system.",
      "work.migration.body": "A 45-step ETL framework across 13+ systems, now coordinated with AI to catch inconsistencies earlier and turn onboarding from weeks into days.",
      "work.product.title": "A financial product built around better decisions.",
      "work.product.body": "MinhaGrana brings investments, portfolio management and AI analysis into one coherent experience across web and mobile.",
      "exp.eyebrow": "Experience / Timeline",
      "exp.minhagrana": "Fintech SaaS for investment management — React 19, Supabase Edge Functions, Capacitor mobile and Gemini AI portfolio analysis.",
      "exp.coord": "AI-driven ETL coordination with Claude AI + MCPs. Error rate cut from 15–20% to 2–4%; onboarding time from weeks to days.",
      "exp.eng": "Built a 45-step ETL framework across 13+ systems processing 500k+ records, PIX and banking integrations and fiscal ERP systems.",
      "exp.infra": "Network infrastructure, hardware recovery and IT support.",
      "stack.eyebrow": "Capabilities / Toolkit",
      "stack.title": "The right layer<br>for every problem.",
      "stack.backend": "Backend systems",
      "stack.data": "Data architecture",
      "stack.ai": "Applied intelligence",
      "stack.product": "Product engineering",
      "contact.eyebrow": "Contact / Open channel",
      "contact.overline": "Have a difficult system to untangle?",
      "contact.title": "Let's build<br>what comes next.",
      "footer.note": "Designed as a living system."
    },
    pt: {
      "skip": "Pular para o conteúdo",
      "nav.about": "Sobre",
      "nav.experience": "Experiência",
      "nav.contact": "Contato",
      "hero.eyebrow": "Juiz de Fora, Brasil — Disponível para trabalho remoto",
      "hero.kicker": "Transformo dados complexos em sistemas nos quais as pessoas podem confiar.",
      "hero.role": "Engenheiro de Software Sênior atuando na interseção entre migração de dados, inteligência artificial e produtos financeiros.",
      "hero.cta": "Iniciar uma conversa",
      "hero.scroll": "Explorar o sistema",
      "about.eyebrow": "Sobre / Abordagem",
      "about.title": "Engenharia para extrair<br>clareza da complexidade.",
      "about.body": "Construo sistemas enterprise, pipelines de migração de dados com IA e produtos financeiros — transformando processos manuais frágeis em infraestrutura confiável.",
      "about.note": "Meu trabalho conecta o sistema inteiro: como os dados circulam, como os times operam, como o software se comporta e, no fim, como as pessoas vivem o produto.",
      "metrics.records": "registros processados",
      "metrics.systems": "sistemas conectados",
      "metrics.steps": "etapas de validação ETL",
      "metrics.error": "taxa de erro após automação",
      "work.eyebrow": "Sistemas selecionados",
      "work.title": "Mais que código.<br>Sistemas que avançam.",
      "work.intro": "Dois exemplos do trabalho que mais me move: remover atrito operacional e transformar informação complexa em decisões úteis.",
      "work.migration.title": "Migração reconstruída como sistema inteligente.",
      "work.migration.body": "Um framework ETL de 45 etapas entre 13+ sistemas, agora coordenado com IA para encontrar inconsistências mais cedo e reduzir o onboarding de semanas para dias.",
      "work.product.title": "Um produto financeiro pensado para decisões melhores.",
      "work.product.body": "O MinhaGrana reúne investimentos, gestão de portfólio e análise com IA em uma experiência coerente para web e mobile.",
      "exp.eyebrow": "Experiência / Linha do tempo",
      "exp.minhagrana": "SaaS fintech para gestão de investimentos — React 19, Supabase Edge Functions, mobile com Capacitor e análise de portfólio com Gemini AI.",
      "exp.coord": "Coordenação de ETL com IA usando Claude AI + MCPs. Taxa de erro reduzida de 15–20% para 2–4%; onboarding de semanas para dias.",
      "exp.eng": "Framework ETL de 45 etapas integrando 13+ sistemas, processando 500k+ registros, integrações PIX e bancárias, ERP fiscal.",
      "exp.infra": "Infraestrutura de redes, recuperação de hardware e suporte de TI.",
      "stack.eyebrow": "Competências / Ferramentas",
      "stack.title": "A camada certa<br>para cada problema.",
      "stack.backend": "Sistemas de backend",
      "stack.data": "Arquitetura de dados",
      "stack.ai": "Inteligência aplicada",
      "stack.product": "Engenharia de produto",
      "contact.eyebrow": "Contato / Canal aberto",
      "contact.overline": "Tem um sistema difícil para destravar?",
      "contact.title": "Vamos construir<br>o que vem depois.",
      "footer.note": "Projetado como um sistema vivo."
    }
  };

  var STORAGE_KEY = "ll-lang";
  var toggle = document.getElementById("lang-toggle");
  var enLabel = toggle.querySelector(".lang-en");
  var ptLabel = toggle.querySelector(".lang-pt");

  function applyLang(lang) {
    var strings = dict[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (strings[key]) el.innerHTML = strings[key];
    });
    enLabel.classList.toggle("active", lang === "en");
    ptLabel.classList.toggle("active", lang === "pt");
    toggle.setAttribute("aria-label", lang === "pt" ? "Mudar idioma para inglês" : "Switch language to Portuguese");
    document.title = lang === "pt"
      ? "Lucas Lagrimante — Engenheiro de Software Sênior"
      : "Lucas Lagrimante — Senior Software Engineer";
    localStorage.setItem(STORAGE_KEY, lang);
  }

  toggle.addEventListener("click", function () {
    var current = document.documentElement.lang === "pt" ? "pt" : "en";
    applyLang(current === "en" ? "pt" : "en");
  });

  var saved = localStorage.getItem(STORAGE_KEY);
  applyLang(saved === "pt" ? "pt" : "en");

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    revealObserver.observe(el);
  });
})();
