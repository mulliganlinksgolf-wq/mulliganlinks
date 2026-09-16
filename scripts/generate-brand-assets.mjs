// Run from the repository root: node scripts/generate-brand-assets.mjs
// Edit the outlined SVG masters in public/brand, then regenerate raster exports.
import fs from 'node:fs/promises'
import sharp from 'sharp'

const logo = await fs.readFile('public/brand/teeahead-logo-primary.svg')
const icon = await fs.readFile('public/brand/teeahead-favicon.svg')
await sharp(logo).resize(984, 188).png().toFile('public/brand/teeahead-logo-final.png')
for (const size of [16, 32, 48, 64, 128, 192, 512]) {
  await sharp(icon).resize(size, size).png().toFile(`public/brand/teeahead-favicon-${size}.png`)
}
await sharp(icon).resize(512, 512).png().toFile('public/logo.png')
await sharp(icon).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp('public/og-image.svg').png().toFile('public/og-image.png')
// ICO directory with PNG entries supported by modern browsers and Windows.
const sizes = [16, 32, 48]
const frames = await Promise.all(sizes.map(size => sharp(icon).resize(size, size).png().toBuffer()))
const header = Buffer.alloc(6 + frames.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(frames.length, 4)
let offset = header.length
frames.forEach((frame, i) => {
  const entry = 6 + i * 16
  header[entry] = header[entry + 1] = sizes[i]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(frame.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += frame.length
})
await fs.writeFile('src/app/favicon.ico', Buffer.concat([header, ...frames]))
console.log('Generated TeeAhead logo, social image, app icons, and favicon.')
