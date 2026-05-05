/**
 * Gera ícones PNG (192x192, 512x512, maskable) a partir de favicon.svg
 * Requer: npm install --save-dev sharp
 *
 * Uso: npm run generate-icons
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FAVICON = path.join(__dirname, '..', 'public', 'favicon.svg')
const OUTPUT_DIR = path.join(__dirname, '..', 'public')

const sizes = [192, 512]

async function generateIcons() {
  if (!fs.existsSync(FAVICON)) {
    console.error(`Erro: ${FAVICON} não encontrado`)
    process.exit(1)
  }

  try {
    console.log('Gerando ícones...')

    for (const size of sizes) {
      // Ícone padrão
      await sharp(FAVICON)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(OUTPUT_DIR, `icon-${size}.png`))
      console.log(`✓ icon-${size}.png`)

      // Ícone maskable (para Dynamic Adaptive Icons no Android)
      const maskSize = Math.round(size * 0.8)
      await sharp(FAVICON)
        .resize(maskSize, maskSize, { fit: 'contain', background: { r: 245, g: 245, b: 247, alpha: 0 } })
        .extend({
          top: Math.round(size * 0.1),
          bottom: Math.round(size * 0.1),
          left: Math.round(size * 0.1),
          right: Math.round(size * 0.1),
          background: { r: 245, g: 245, b: 247, alpha: 1 },
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, `icon-maskable-${size}.png`))
      console.log(`✓ icon-maskable-${size}.png`)
    }

    console.log('\n✅ Ícones gerados com sucesso!')
  } catch (err) {
    console.error('Erro ao gerar ícones:', err.message)
    process.exit(1)
  }
}

generateIcons()
