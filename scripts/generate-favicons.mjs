import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
// Use the real 512px PNG as source for all smaller sizes
const source = join(root, 'public/brand/teeahead-favicon-512.png')

const sizes = [16, 32, 48, 64, 128, 192]

for (const size of sizes) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(join(root, `public/brand/teeahead-favicon-${size}.png`))
  console.log(`✓ teeahead-favicon-${size}.png`)
}

console.log('Done.')
