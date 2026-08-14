import { mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'public', 'themes')
const outDir = join(srcDir, 'cards')

await mkdir(outDir, { recursive: true })
const files = (await readdir(srcDir)).filter((name) => /^template\d+\.png$/i.test(name))

for (const file of files) {
  const id = file.replace(/\.png$/i, '')
  const input = join(srcDir, file)
  const webp = join(outDir, `${id}.webp`)
  const png = join(outDir, `${id}.png`)
  await sharp(input).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72 }).toFile(webp)
  await sharp(input).resize({ width: 480, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(png)
  console.log(`cards/${id}.webp + .png`)
}

console.log(`optimized ${files.length} theme cards`)
