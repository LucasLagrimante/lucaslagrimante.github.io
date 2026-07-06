(function () {
  "use strict";

  var dict = {
    en: {
      "skip": "Skip to content",
      "hero.eyebrow": "Juiz de Fora, Brazil — Remote",
      "hero.role": "Senior Software Engineer · AI-Powered Data Migration · ETL Architecture",
      "about.eyebrow": "About",
      "about.body": "I build enterprise systems, AI-assisted data migration pipelines and financial platforms — turning fragile manual processes into reliable, automated infrastructure. I founded MinhaGrana, a fintech platform for investment tracking and portfolio management.",
      "exp.eyebrow": "Experience",
      "exp.minhagrana": "Fintech SaaS for investment management — React 19, Supabase Edge Functions, Capacitor mobile, Gemini AI portfolio analysis.",
      "exp.coord": "AI-driven ETL coordination with Claude AI + MCPs. Error rate cut from 15–20% to 2–4%; onboarding time from weeks to days.",
      "exp.eng": "Built a 45-step ETL framework across 13+ systems processing 500k+ records, PIX and banking integrations, fiscal ERP systems.",
      "exp.infra": "Network infrastructure, hardware recovery and IT support.",
      "stack.eyebrow": "Stack",
      "contact.eyebrow": "Contact",
      "contact.title": "Open to remote<br>opportunities"
    },
    pt: {
      "skip": "Pular para o conteúdo",
      "hero.eyebrow": "Juiz de Fora, Brasil — Remoto",
      "hero.role": "Engenheiro de Software Sênior · Migração de Dados com IA · Arquitetura ETL",
      "about.eyebrow": "Sobre",
      "about.body": "Construo sistemas enterprise, pipelines de migração de dados com IA e plataformas financeiras — transformando processos manuais frágeis em infraestrutura automatizada e confiável. Fundei o MinhaGrana, uma plataforma fintech para gestão de investimentos.",
      "exp.eyebrow": "Experiência",
      "exp.minhagrana": "SaaS fintech para gestão de investimentos — React 19, Supabase Edge Functions, mobile com Capacitor, análise de portfólio com Gemini AI.",
      "exp.coord": "Coordenação de ETL com IA usando Claude AI + MCPs. Taxa de erro reduzida de 15–20% para 2–4%; onboarding de semanas para dias.",
      "exp.eng": "Framework ETL de 45 etapas integrando 13+ sistemas, processando 500k+ registros, integrações PIX e bancárias, ERP fiscal.",
      "exp.infra": "Infraestrutura de redes, recuperação de hardware e suporte de TI.",
      "stack.eyebrow": "Stack",
      "contact.eyebrow": "Contato",
      "contact.title": "Aberto a oportunidades<br>remotas"
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
