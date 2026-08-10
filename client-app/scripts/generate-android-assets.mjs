import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = path.resolve(clientRoot, '..')
const brandRoot = path.join(projectRoot, 'docs', 'ui-ux', 'brand')
const iconMasterPath = path.join(brandRoot, 'app-icon-master.svg')
const splashPreviewPath = path.join(brandRoot, 'splash-screen-preview.svg')
const iconSize = 1024
const splashSize = 2732

function parseOptions(argv) {
  const options = {
    outputDir: path.join(clientRoot, 'assets'),
    androidResDir: existsSync(path.join(clientRoot, 'android', 'app', 'src', 'main', 'res'))
      ? path.join(clientRoot, 'android', 'app', 'src', 'main', 'res')
      : null,
  }
  for (let index = 0; index < argv.length; index += 2) {
    const option = argv[index]
    const value = argv[index + 1]
    if (!value?.trim()) throw new Error('Usage: node scripts/generate-android-assets.mjs [--output-dir <directory>] [--android-res-dir <directory>]')
    if (option === '--output-dir') options.outputDir = path.resolve(clientRoot, value)
    else if (option === '--android-res-dir') options.androidResDir = path.resolve(clientRoot, value)
    else throw new Error('Usage: node scripts/generate-android-assets.mjs [--output-dir <directory>] [--android-res-dir <directory>]')
  }
  return options
}

function sourceBackground(svg) {
  const match = svg.match(/<rect\s+width="1080"\s+height="2400"\s+fill="(#[0-9A-Fa-f]{6})"\s*\/>/)
  if (!match) throw new Error('Approved splash preview does not declare its background color')
  return match[1]
}

function removeIconBackground(svg) {
  const foreground = svg.replace(/\s*<rect\s+width="1024"\s+height="1024"\s+rx="224"\s+fill="#[0-9A-Fa-f]{6}"\s*\/>/, '')
  if (foreground === svg) throw new Error('Approved icon master does not contain its background layer')
  return foreground
}

function png(image) {
  return image.ensureAlpha().png({ adaptiveFiltering: false, compressionLevel: 9, palette: false })
}

async function renderAndroidResources(androidResDir, iconOnly, iconForeground, splash) {
  const launcherSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  }
  const splashDirectories = [
    'drawable',
    'drawable-land-hdpi', 'drawable-land-mdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi',
    'drawable-port-hdpi', 'drawable-port-mdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi',
  ]
  const writes = []
  for (const [directory, size] of Object.entries(launcherSizes)) {
    const target = path.join(androidResDir, directory)
    await mkdir(target, { recursive: true })
    const [launcher, foreground] = await Promise.all([
      png(sharp(iconOnly).resize(size, size, { fit: 'fill' })).toBuffer(),
      png(sharp(iconForeground).resize(size, size, { fit: 'fill' })).toBuffer(),
    ])
    writes.push(
      writeFile(path.join(target, 'ic_launcher.png'), launcher),
      writeFile(path.join(target, 'ic_launcher_round.png'), launcher),
      writeFile(path.join(target, 'ic_launcher_foreground.png'), foreground),
    )
  }
  for (const directory of splashDirectories) {
    const target = path.join(androidResDir, directory)
    await mkdir(target, { recursive: true })
    writes.push(writeFile(path.join(target, 'splash.png'), splash))
  }
  await Promise.all(writes)
}

async function renderAssets({ outputDir, androidResDir }) {
  const [iconMaster, splashPreview] = await Promise.all([
    readFile(iconMasterPath),
    readFile(splashPreviewPath, 'utf8'),
  ])
  const splashBackground = sourceBackground(splashPreview)
  const foreground = removeIconBackground(iconMaster.toString('utf8'))
  const iconOnly = await png(sharp(iconMaster).resize(iconSize, iconSize, { fit: 'fill' })).toBuffer()
  const iconForeground = await png(sharp(Buffer.from(foreground)).resize(iconSize, iconSize, { fit: 'fill' })).toBuffer()
  const iconBackground = await png(sharp({
    create: { width: iconSize, height: iconSize, channels: 4, background: '#1E3A8A' },
  })).toBuffer()
  const splashIcon = await sharp(iconMaster).resize(iconSize, iconSize, { fit: 'fill' }).png().toBuffer()
  const splash = await png(sharp({
    create: { width: splashSize, height: splashSize, channels: 4, background: splashBackground },
  }).composite([{ input: splashIcon, left: (splashSize - iconSize) / 2, top: (splashSize - iconSize) / 2 }])).toBuffer()

  await mkdir(outputDir, { recursive: true })
  await Promise.all([
    writeFile(path.join(outputDir, 'icon-only.png'), iconOnly),
    writeFile(path.join(outputDir, 'icon-foreground.png'), iconForeground),
    writeFile(path.join(outputDir, 'icon-background.png'), iconBackground),
    writeFile(path.join(outputDir, 'splash.png'), splash),
  ])
  if (androidResDir) await renderAndroidResources(androidResDir, iconOnly, iconForeground, splash)
}

await renderAssets(parseOptions(process.argv.slice(2)))
