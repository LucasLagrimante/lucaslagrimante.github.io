# Eloara portfolio QA

- Ordem: MinhaGrana, ShareNote, Pulse, Eloara, AI Radar, Lucas Drone JF, Marvel Rivals Coach, Acervo Gamer. Alto valor estratégico em saúde, mas desenvolvimento inicial: não ultrapassa produtos consolidados.
- Teste builtin: `python3 scripts/test_eloara_card.py`. RED real 7 != 8; GREEN passa. Verifica oito cards, índices 01..08, ordem, HTTPS/rel/target, descrição factual e preservação dos sete blocos originais exceto índices.
- SHA-256: `baseline-hashes.json` e `preservation.json`: 54 arquivos preexistentes, apenas index.html e AGENTS.md alterados; 52 preservados byte por byte, incluindo CSS, JS, normalizador, sete PNG e fontes de logo.
- Chrome via Playwright já disponível/Node 24.18.0 WSL, servidor próprio 127.0.0.1, finalizado em finally. Duas rodadas em lote. Screenshots desktop/mobile work e domains. Sem temas alternativos implementados no CSS/JS existente.
- Desktop 1440 e mobile 390, DPR2: scrollWidth == clientWidth; oito logos carregados; zero console/page errors e zero HTTP >=400. Foco solid e troca de idioma continuam funcionando. Texto Eloara em PT-BR intencional, independente do dicionário existente para preservar JS.
- LIMITAÇÃO: emulação solicitada isMobile/hasTouch e CDP setTouchEmulationEnabled, mas navigator.maxTouchPoints retornou 0 mesmo após confirmação. NÃO declarar touch real validado. Parent deve investigar se precisa gate de touch estrito; limite de duas rodadas visuais atingido.
- Detector Impeccable executado, exit 2: alertas do desenho incumbente (glows, tamanhos de labels, contraste de decoração, eyebrow). Mantidos por escopo explícito de não redesign e CSS preservado. Não declarar gate global de acessibilidade aprovado.
- Inspeção visual mobile: Eloara completo/alinhado; URL elidida conforme padrão dos oito cards. Ícone favicon E da LP, #97D5C9/#203533 correspondem aos tokens brand.secondary/primitive.ink. Título HTML acessível.
- Sem build/package/framework; git diff --check sem achados. Sem stage/commit/push/deploy ou escrita nos repos Eloara.

## Atualizações posteriores

- 14/11/2026: o grid passou a ter **9 cards** (VagaCheck, `09 / CAREER`). `scripts/test_eloara_card.py` foi atualizado para 9 cards/índices 01..09 e ganhou asserts do card novo; os asserts da Eloara continuam.
- `scripts/qa_eloara_browser.cjs` deixou de fixar o hash do npx: usa `playwright` do projeto, `PW_MODULE` ou o cache do npx, e aceita `QA_BASE` / `QA_OUT` / `QA_SHOTS=0`.
- Os PNGs, logs e o `baseline-index.html` desta pasta saíram do repositório para `~/qa-archive/eloara-2026-11-04/`; aqui ficam só README e os JSONs de resultado — `docs/` é servido pelo GitHub Pages e não deve carregar esse peso. O teste detecta a ausência do baseline e pula só a checagem de preservação; ordem, índices, URLs e conteúdo dos cards continuam validados.


## Confirmação posterior do parent

Review independente deleg_f359fd63 passou sem achados de segurança/lógica. Parent refez teste de1cardset/8cards e hashes:52arquivos originais permanecem byteidênticos; css/JS/normalizador/logos preexistentes intactos. Probe novo com AndroidUA/isMobile/touch/DPR2 confirmou viewport390/client390/scroll390, pointercoarse e navigator.maxTouchPoints1; recebeu1touchstart real ao tocar o card, abriu popup exato https://eloara.lagrimante.com.br/ e carregou a landing pública200comSobConsulta. A limitação maxTouchPoints0 pertence ao harness/captura inicial e foi resolvida na confirmação separada. Evidência do probe em eloara-lp/docs/evidence/publication-browser.json; screenshotparent-mobile-touch.png. Não houve redesign nem novas alterações em arquivos de produto. Portfólio continua LOCAL, sem commit/push/deploy e aguardando aprovação para publicação.


## Publicação aprovada e concluída

Lucas autorizou commit/push SOMENTE de index.html e assets/projects/eloara.svg. Commitf5bc8fa6b148b9d110a7a9fd0eb5568289cf804a contém exatamente esses2paths; normalizador/CSS/7logos e demais trabalhos não foram staged nem publicados. CI Deploy41954293372 e GitHubPages41954293031 success paraessehead; CloudflarePageshome deployment57b7866a-a34e-4e14-b711-5aeb67777644 success. Domínioslagrimante.com.br,www.lagrimante.com.br e lucaslagrimante.github.io servem HTML/ícone byteidênticos ao commit. Browserpúblico desktop1440/mobile390DPR2comtouch1:8cards,0overflow,focovisível, Eloara carregado e toqueabrealandingpública. publication.json e public-browser.json são evidência final. O relato anterior de portfólio apenasLOCAL é histórico e foi superado por esta autorização. InstruçãoAGENTSlocal corrigida para o workflowCloudflareefetivo; arquivo ignorado não foi forçado ao commit.
