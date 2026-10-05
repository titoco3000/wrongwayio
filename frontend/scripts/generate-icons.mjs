// Renders every raster icon from public/pigeon.svg. Run: npm run icons
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const svg = await readFile('public/pigeon.svg')
const BG = '#ffffff'

/** Pigeon centered on a size x size canvas, taking `scale` of its width. */
async function render(file, size, { scale = 1, background = null } = {}) {
  const inner = Math.round(size * scale)
  const pigeon = await sharp(svg, { density: 600 }).resize(inner, inner).png().toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: pigeon, gravity: 'center' }])
    .png()
    .toFile(file)
  console.log('wrote', file)
}

await render('public/icons/icon-192.png', 192, { scale: 0.9 })
await render('public/icons/icon-512.png', 512, { scale: 0.9 })
// maskable: full-bleed background, content inside the 80% safe zone
await render('public/icons/maskable-512.png', 512, { scale: 0.62, background: BG })
// iOS does not round or mask: opaque square
await render('public/icons/apple-touch-icon.png', 180, { scale: 0.8, background: BG })

// sources for @capacitor/assets (npm run assets)
await render('assets/icon-only.png', 1024, { scale: 0.7, background: BG })
await render('assets/icon-foreground.png', 1024, { scale: 0.5 })
await render('assets/icon-background.png', 1024, { scale: 0.01, background: BG })
await render('assets/splash.png', 2732, { scale: 0.25, background: BG })
await render('assets/splash-dark.png', 2732, { scale: 0.25, background: '#111827' })
