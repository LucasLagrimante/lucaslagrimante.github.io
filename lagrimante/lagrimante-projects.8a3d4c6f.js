/**
 * lagrimante-projects.js — fonte única da lista de projetos.
 * Usado por todos os sites (MinhaGrana, ShareNote, VagaCheck, etc).
 * Formato consumido pelo componente lagrimante-ticker.
 *
 * As taglines descrevem o que o produto FAZ hoje, conferido no README/PRODUCT.md
 * de cada repo. Evitar rótulo genérico ("consultoria", "foco e hábitos") que não
 * corresponde ao escopo real. Máximo ~26 caracteres: acima disso a V2 corta com
 * reticências no palco estreito.
 */
window.LAGRIMANTE_PROJECTS = [
  { slug: 'minhagrana',     name: 'MinhaGrana',     tagline: 'Investimentos e finanças',    url: 'https://minhagrana.com.br' },
  { slug: 'sharenote',      name: 'ShareNote',      tagline: 'Editor com links cifrados',   url: 'https://sharenote.com.br' },
  { slug: 'vagacheck',      name: 'VagaCheck',      tagline: 'Vagas com fit explicável',    url: 'https://vagacheck.lagrimante.com.br' },
  { slug: 'ai-radar',       name: 'AI Radar',       tagline: 'Monitor diário de modelos',   url: 'https://ai-radar.lagrimante.com.br' },
  { slug: 'pulse',          name: 'Pulse',          tagline: 'Diagnóstico do Windows 11',   url: 'https://pulse.lagrimante.com.br' },
  { slug: 'eloara',         name: 'Eloara',         tagline: 'Gestão para saúde',           url: 'https://eloara.lagrimante.com.br' },
  { slug: 'brawldraft',     name: 'BrawlDraft',     tagline: 'Builds por mapa',             url: 'https://brawldraft.lagrimante.com.br' },
  { slug: 'rivals',         name: 'Rivals Coach',   tagline: 'Guia de Marvel Rivals',       url: 'https://rivals.lagrimante.com.br' },
  { slug: 'workspaceships', name: 'WorkspaceShips', tagline: 'Jogo social multiplayer',     url: 'https://workspaceships.lagrimante.com.br' },
  { slug: 'acervogamer',    name: 'Acervo Gamer',   tagline: 'Coleção pessoal de jogos',    url: 'https://acervo.lagrimante.com.br' },
  { slug: 'lucasdrone',     name: 'Lucas Drone',    tagline: 'Filmagem aérea de eventos',   url: 'https://lucasdrone.lagrimante.com.br' }
];

/** Caminho base dos logos. O componente resolve nesta ordem:
 *  data-logo-base do elemento > esta variável > /lagrimante/logos/ */
window.LAGRIMANTE_LOGO_BASE = '/lagrimante/logos/';

window.LAGRIMANTE_LOGOS = {
  "acervogamer": "logos/acervogamer.1f2d9f.png",
  "ai-radar": "logos/ai-radar.ccd090.png",
  "brawldraft": "logos/brawldraft.88988b.png",
  "eloara": "logos/eloara.e5af24.png",
  "lucasdrone": "logos/lucasdrone.649ffc.png",
  "minhagrana": "logos/minhagrana.c3956b.png",
  "pulse": "logos/pulse.c3dc07.png",
  "rivals": "logos/rivals.92d676.png",
  "sharenote": "logos/sharenote.b19700.png",
  "vagacheck": "logos/vagacheck.0e4f43.png",
  "workspaceships": "logos/workspaceships.92f48d.png",
};
