/**
 * Normaliza os logos dos cards para o MESMO tamanho visual.
 *
 * Por que existe: cada logo chega com resolução, proporção e margem diferentes
 * (favicon 32x32 em SVG, PNG 640x640, wordmark 540x150). Escalar pela caixa do
 * arquivo — ou por uma altura fixa — deixa uns enormes e outros miúdos. Aqui a
 * medida é a TINTA VISÍVEL: o que de fato contrasta com o fundo do card. Cada
 * marca é recortada por essa tinta e escalada para a mesma área óptica, então
 * todos parecem do mesmo tamanho independentemente do arquivo de origem. Todos
 * saem na mesma caixa 256x256, com fundo transparente.
 *
 * Uso:
 *   node scripts/normalize_project_logos.mjs           # escreve em assets/projects/
 *   node scripts/normalize_project_logos.mjs --dry-run # só relata as medidas
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT_DIR = join(ROOT, 'assets', 'projects')
const SRC_DIR = join(ROOT, 'assets', 'projects-src')

/** Caixa final: todos os logos saem daqui, então o CSS nunca precisa redimensionar. */
const BOX = 256

/** Fundo real do card (`.domain-visual` em css/style.css). A tinta só conta se aparece sobre ele. */
const CARD_BG = [0x0b, 0x0e, 0x0c]

/** Diferença mínima de canal (0-255) para um pixel composto sobre o card contar como tinta visível. */
const INK_THRESHOLD = 20

/** Lado do quadrado de área equivalente que toda marca ocupa na caixa BOX. */
const TARGET_SIDE = 184

/** Teto do maior lado: marca larga encosta aqui; o glow do hover vaza da caixa do img sem cortar. */
const MAX_SIDE = 252

/**
 * Compensação óptica: marca vazada (traço fino, pouca tinta na caixa) parece
 * um pouco menor que um azulejo cheio do mesmo tamanho. A escala cresce com
 * (1 / preenchimento) ^ DENSITY_EXP, limitada a DENSITY_MAX. É deliberadamente
 * suave: o objetivo é TAMANHO percebido igual, não peso igual — com 0.12/1.15 o
 * chevron do ShareNote passava a parecer maior que os azulejos.
 */
const DENSITY_EXP = 0.06
const DENSITY_MAX = 1.08

/** SVG é rasterizado com o maior lado neste tamanho, para nunca ampliar bitmap pequeno. */
const SVG_RENDER_SIDE = 1024

/**
 * Cada entrada diz só de onde vem a arte e o que nela é fundo; o tamanho sai da medida.
 *
 * - `source`: arquivo em assets/projects-src (SVG ou PNG com alfa).
 * - `extract`: recorte em px da origem, quando só parte do arquivo é símbolo.
 * - `dropColor`: cor de um azulejo de fundo que no card é invisível; vira alfa
 *   por distância de cor, para não inflar a caixa medida nem desenhar a silhueta
 *   do azulejo no glow do hover.
 */
const LOGOS = [
  {
    out: 'rivals.png',
    // Logo oficial do Marvel Rivals (400x400, fundo já removido): wordmark largo,
    // então o teto MAX_SIDE limita pela largura.
    source: 'rivals.png',
  },
  {
    out: 'minhagrana.png',
    // Logo oficial do MinhaGrana (public/logo.png, 268x266, alfa correto):
    // quadrado verde com a carteira, visível inteiro sobre o card.
    source: 'minhagrana.png',
  },
  {
    out: 'sharenote.png',
    // Favicon do ShareNote: chevron verde sobre azulejo #08090b. O azulejo é
    // praticamente a cor do card, então só o chevron tem leitura e só ele é medido.
    source: 'sharenote.svg',
    dropColor: [0x08, 0x09, 0x0b],
  },
  {
    out: 'pulse.png',
    // Favicon do Pulse: mesmo azulejo #08090b do ShareNote, com o traço de pulso
    // âmbar e a moldura azul-ardósia. Mesmo tratamento: mede-se só o desenho.
    source: 'pulse.svg',
    dropColor: [0x08, 0x09, 0x0b],
  },
  {
    out: 'ai-radar.png',
    // Emblema oficial do AI Radar (dashboard/logo.svg do repo ai-radar): azulejo
    // petróleo com o mostrador de radar. O azulejo contrasta com o card e é marca.
    source: 'ai-radar.svg',
  },
  {
    out: 'lucasdrone.png',
    // O logo-dark do site é um wordmark 540x150: asas + câmera à esquerda e o
    // nome "LUCAS DRONE JF" à direita. No card só o símbolo tem leitura —
    // o texto já está no título do card. O símbolo ocupa x=7..199, y=26..107;
    // a linha de texto começa em y=116, então o recorte não pega o wordmark.
    source: 'lucasdrone.png',
    extract: { left: 7, top: 26, width: 193, height: 82 },
  },
  {
    out: 'acervogamer.png',
    // Ícone do Acervo Gamer (640x640, alfa correto): joystick magenta.
    source: 'acervogamer.png',
  },
]

/** Lê a origem como RGBA bruto, rasterizando SVG em alta resolução. */
async function rasterize(logo) {
  const file = await readFile(join(SRC_DIR, logo.source))
  let image
  if (logo.source.endsWith('.svg')) {
    // Densidade padrão (72 dpi) renderiza um viewBox 32x32 em 32 px; ampliar isso borra.
    const meta = await sharp(file).metadata()
    const density = Math.ceil((72 * SVG_RENDER_SIDE) / Math.max(meta.width, meta.height))
    image = sharp(file, { density })
  } else {
    image = sharp(file)
  }
  if (logo.extract) image = sharp(await image.extract(logo.extract).png().toBuffer())
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: Buffer.from(data), width: info.width, height: info.height }
}

/** Distância de cor por canal máximo. */
const colorDistance = (data, i, rgb) =>
  Math.max(Math.abs(data[i] - rgb[0]), Math.abs(data[i + 1] - rgb[1]), Math.abs(data[i + 2] - rgb[2]))

/** Torna transparente o azulejo `rgb`, com transição suave na borda antialiasada do desenho. */
function dropTile(raster, rgb) {
  const { data } = raster
  for (let i = 0; i < data.length; i += 4) {
    const d = colorDistance(data, i, rgb)
    const keep = Math.min(1, Math.max(0, (d - 6) / 34))
    data[i + 3] = Math.round(data[i + 3] * keep)
  }
}

/** Caixa envolvente e preenchimento da tinta que aparece sobre o fundo do card. */
function measureInk(raster) {
  const { data, width, height } = raster
  let minX = width
  let maxX = -1
  let minY = height
  let maxY = -1
  let ink = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const a = data[i + 3] / 255
      // Composição sobre o card: o que tem alfa baixo some no fundo e não conta.
      let visible = false
      for (let c = 0; c < 3; c += 1) {
        const composed = data[i + c] * a + CARD_BG[c] * (1 - a)
        if (Math.abs(composed - CARD_BG[c]) > INK_THRESHOLD) visible = true
      }
      if (!visible) continue
      ink += 1
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  return { left: minX, top: minY, width: w, height: h, fill: ink / (w * h) }
}

/** Recorta pela tinta, escala para a área óptica comum e centraliza na caixa BOX. */
async function frame(logo) {
  const raster = await rasterize(logo)
  if (logo.dropColor) dropTile(raster, logo.dropColor)
  const ink = measureInk(raster)
  if (!ink) throw new Error('nenhuma tinta visível sobre o fundo do card')

  const compensation = Math.min(DENSITY_MAX, Math.pow(1 / ink.fill, DENSITY_EXP))
  let scale = (TARGET_SIDE * compensation) / Math.sqrt(ink.width * ink.height)
  scale = Math.min(scale, MAX_SIDE / Math.max(ink.width, ink.height))
  const width = Math.max(1, Math.round(ink.width * scale))
  const height = Math.max(1, Math.round(ink.height * scale))

  const cropped = sharp(raster.data, { raw: { width: raster.width, height: raster.height, channels: 4 } }).extract({
    left: ink.left,
    top: ink.top,
    width: ink.width,
    height: ink.height,
  })
  const scaled = await cropped.resize({ width, height, fit: 'fill', kernel: 'lanczos3' }).png().toBuffer()

  // Padding exato: arredondar os dois lados separadamente gerava caixas de 257 px.
  const left = Math.floor((BOX - width) / 2)
  const top = Math.floor((BOX - height) / 2)
  const result = await sharp(scaled)
    .extend({
      top,
      bottom: BOX - height - top,
      left,
      right: BOX - width - left,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true })
  return { ...result, width, height, fill: ink.fill, compensation }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  for (const logo of LOGOS) {
    try {
      const { data, info, width, height, fill, compensation } = await frame(logo)
      if (!dryRun) await writeFile(join(OUT_DIR, logo.out), data)
      const optical = Math.round(Math.sqrt(width * height))
      console.log(
        `${dryRun ? 'plan ' : 'ok   '} ${logo.out.padEnd(16)} ${info.width}x${info.height}  marca ${width}x${height}` +
          `  área óptica ${optical}px  preenchimento ${fill.toFixed(2)}  compensação ${compensation.toFixed(2)}  ${data.length} B`,
      )
    } catch (error) {
      console.log(`FALHA ${logo.out}: ${error.message}`)
      process.exitCode = 1
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
