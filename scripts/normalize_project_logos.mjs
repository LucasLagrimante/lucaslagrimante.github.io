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
    build: () => readFile(join(SRC_DIR, 'rivals.png')),
    // O monograma é largo e achatado (251×132 após o trim). Altura menor que a
    // dosQuadrados para que a área visual percebida fique equivalente.
    height: 116,
  },
  {
    out: 'minhagrana.png',
    build: async () => {
      // favicon-32x32 sem alfa: preto sólido nas bordas. Converte luminância em
      // alfa, preservando o verde e a forma arredondada.
      const raw = await readFile(join(SRC_DIR, 'minhagrana.png'))
      const { data, info } = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const out = Buffer.alloc(info.width * info.height * 4)

      for (let i = 0; i < info.width * info.height; i += 1) {
        const r = data[i * 4]
        const g = data[i * 4 + 1]
        const b = data[i * 4 + 2]
        const a = data[i * 4 + 3]
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        const alpha = Math.max(0, Math.min(255, Math.round((lum - 0.14) * 255 * 1.45)))
        out[i * 4] = r
        out[i * 4 + 1] = g
        out[i * 4 + 2] = b
        out[i * 4 + 3] = a >= 250 ? alpha : Math.round((a * alpha) / 255)
      }

      return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
    },
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
    // Wordmark horizontal já recortado (asas + câmera), alfa correto.
    // Altura menor de propósito: é largo, então igualar a altura deixaria o
    // desenho imenso em largura.
    build: () => readFile(join(SRC_DIR, 'lucasdrone.png')),
    height: 96,
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