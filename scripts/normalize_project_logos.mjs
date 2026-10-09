/**
 * Normaliza os logos dos cards para a mesma caixa visual.
 *
 * Por que existe: cada favicon tem resolução e proporção diferentes (32x32,
 * 48x48, wordmark 540x150). Exibir pelo tamanho nativo deixa os cards
 * desalinhados; exibir por um `max-height` comum amplia os arquivos pequenos e
 * pixeliza. Aqui cada logo é tratado explicitamente — nada de heurística que
 * possa apagar arte — e sai na mesma caixa 256x256, com fundo transparente.
 *
 * Uso:
 *   node scripts/normalize_project_logos.mjs           # escreve em assets/projects/
 *   node scripts/normalize_project_logos.mjs --dry-run # so relata
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

/**
 * Cada entrada é montada à mão porque os quatro casos são diferentes:
 *
 * - `fillTo` remove um fundo sólido para sobrar só o desenho (usado onde o
 *   favicon de origem não tem alfa). `keepDark: true` preserva as partes
 *   escuras que SÃO arte, em vez de tratá-las como fundo.
 * - `render` é o arquivo já pronto, quando não há o que corrigir.
 * - `trim` corta o caixa pelo conteúdo opaco antes de escalar.
 */
const LOGOS = [
  {
    out: 'rivals.png',
    build: async () => {
      // Favicon real do Marvel Rivals: o "R" com raio sobre um azulejo
      // azul-escuro semitransparente. O azulejo é preenchimento do ícone, não
      // arte — em card escuro vira um bloco que briga com o fundo.
      const raw = await readFile(join(SRC_DIR, 'rivals.png'))
      const { data, info } = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const out = Buffer.alloc(info.width * info.height * 4)

      for (let i = 0; i < info.width * info.height; i += 1) {
        const r = data[i * 4]
        const g = data[i * 4 + 1]
        const b = data[i * 4 + 2]
        // Azulejo: azul domina e é escuro. O branco (255,255,255) e o amarelo
        // (243,209,42) do monograma não satisfazem "azul > vermelho".
        const isTile = b > r + 6 && b > g + 6 && r < 140
        const alpha = data[i * 4 + 3]
        out[i * 4] = r
        out[i * 4 + 1] = g
        out[i * 4 + 2] = b
        // Resíduo de alfa baixo nas bordas do azulejo viraria faixa no trim.
        out[i * 4 + 3] = isTile ? 0 : alpha > 40 ? alpha : 0
      }

      return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
    },
    // O monograma é largo e achatado (251x132 depois do trim): altura menor
    // para equivaler a área dos quadrados.
    height: 116,
  },
  {
    out: 'minhagrana.png',
    // Logo oficial do MinhaGrana (public/logo.png, 268x266, alfa correto):
    // quadrado verde com a carteira. Não precisa de remoção de fundo — usar o
    // favicon de 32px era o que dava qualidade péssima.
    build: () => readFile(join(SRC_DIR, 'minhagrana.png')),
    height: 120,
  },
  {
    out: 'sharenote.png',
    // O ShareNote tem um azulejo escuro próprio no desenho (o `rect` do SVG):
    // é parte da marca, então entra sem tratamento de fundo. Só renderiza.
    build: () => readFile(join(SRC_DIR, 'sharenote.svg')),
    height: 120,
  },
  {
    out: 'lucasdrone.png',
    // O logo-dark do site é um wordmark 540x150: asas + câmera à esquerda e o
    // nome "LUCAS DRONE JF" à direita. No card só o símbolo tem leitura —
    // o texto já está no título do card. Recorta em x=0..196 para ficar só as
    // asas, mantendo a resolução original (nunca reamostrar a arte).
    build: async () => {
      // Geometria medida do logo-dark 540x150: o símbolo (asas + câmera) ocupa
      // x=7..199, y=26..107. A linha de texto "LUCAS DRONE JF" começa em
      // y=116, então y=26..108 recorta só o símbolo, sem sobra do wordmark.
      const raw = await readFile(join(SRC_DIR, 'lucasdrone.png'))
      return sharp(raw).extract({ left: 7, top: 26, width: 193, height: 82 }).png().toBuffer()
    },
    // Wordmark é largo: altura menor para equivaler a área dos quadrados.
    height: 104,
  },
]

/** Recorta pela caixa envolvente do conteúdo visível. */
async function trimAlpha(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  // Corta o canal alfa antes de medir: resíduo de fundo com alfa baixo vira
  // faixa na borda do logo.
  const cleaned = Buffer.from(data)
  for (let i = 0; i < info.width * info.height; i += 1) {
    const a = cleaned[i * 4 + 3]
    if (a < 40) cleaned[i * 4 + 3] = 0
  }

  let minX = info.width
  let maxX = -1
  let minY = info.height
  let maxY = -1

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (cleaned[(y * info.width + x) * 4 + 3] > 16) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return null
  return sharp(cleaned, { raw: { width: info.width, height: info.height, channels: 4 } }).extract({
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  })
}

/** Escala pela altura alvo e centraliza na caixa BOX. */
async function frame(buffer, targetHeight) {
  const trimmed = await trimAlpha(buffer)
  if (!trimmed) throw new Error('conteudo opaco vazio')

  const scaled = await trimmed.resize({ height: targetHeight, fit: 'inside', kernel: 'lanczos3' }).png().toBuffer()
  const meta = await sharp(scaled).metadata()

  const padY = Math.max(0, Math.round((BOX - meta.height) / 2))
  const padX = Math.max(0, Math.round((BOX - meta.width) / 2))

  return sharp(scaled)
    .extend({
      top: padY,
      bottom: padY,
      left: padX,
      right: padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer({ resolveWithObject: true })
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  for (const logo of LOGOS) {
    try {
      const { data, info } = await frame(await logo.build(), logo.height)
      if (!dryRun) await writeFile(join(OUT_DIR, logo.out), data)
      console.log(`${dryRun ? 'plan ' : 'ok   '} ${logo.out.padEnd(16)} ${info.width}x${info.height}  ${data.length} B`)
    } catch (error) {
      console.log(`FALHA ${logo.out}: ${error.message}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})