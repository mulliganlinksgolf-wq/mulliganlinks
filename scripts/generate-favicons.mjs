import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = readFileSync(join(root, 'public/brand/teeahead-favicon.svg'))

const sizes = [16, 32, 48, 64, 128, 192, 512]

for (const size of sizes) {
  await sharp(svg, { density: Math.ceil(size * 72 / 100) })
    .resize(size, size)
    .png()
    .toFile(join(root, `public/brand/teeahead-favicon-${size}.png`))
  console.log(`✓ teeahead-favicon-${size}.png`)
}

console.log('Done.')
