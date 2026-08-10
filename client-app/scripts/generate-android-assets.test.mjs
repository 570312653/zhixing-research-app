import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generatorPath = path.join(clientRoot, 'scripts', 'generate-android-assets.mjs')

function runGenerator(outputDir, androidResDir) {
  const args = [generatorPath, '--output-dir', outputDir]
  if (androidResDir) args.push('--android-res-dir', androidResDir)
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: clientRoot,
      shell: false,
      windowsHide: true,
    })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', reject)
    child.once('close', (code) => resolve({ code, output }))
  })
}

async function pixelAt(filePath, x, y) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const offset = (y * info.width + x) * info.channels
  return [...data.subarray(offset, offset + info.channels)]
}

async function assertPng(filePath, width, height) {
  const metadata = await sharp(filePath).metadata()
  assert.equal(metadata.format, 'png')
  assert.equal(metadata.width, width)
  assert.equal(metadata.height, height)
  assert.equal(metadata.channels, 4)
}

test('资产生成器从批准 SVG 创建固定尺寸和透明语义的 Android 品牌 PNG', async (t) => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'zhixing-assets-'))
  t.after(() => rm(outputDir, { recursive: true, force: true }))

  const result = await runGenerator(outputDir)
  assert.equal(result.code, 0, result.output)

  const iconOnly = path.join(outputDir, 'icon-only.png')
  const foreground = path.join(outputDir, 'icon-foreground.png')
  const background = path.join(outputDir, 'icon-background.png')
  const splash = path.join(outputDir, 'splash.png')
  await Promise.all([
    assertPng(iconOnly, 1024, 1024),
    assertPng(foreground, 1024, 1024),
    assertPng(background, 1024, 1024),
    assertPng(splash, 2732, 2732),
  ])

  assert.deepEqual(await pixelAt(foreground, 0, 0), [0, 0, 0, 0])
  assert.deepEqual(await pixelAt(background, 0, 0), [30, 58, 138, 255])
  assert.deepEqual(await pixelAt(iconOnly, 512, 100), [30, 58, 138, 255])
  assert.deepEqual(await pixelAt(foreground, 650, 364), [125, 211, 252, 255])
  assert.deepEqual(await pixelAt(splash, 0, 0), [244, 247, 250, 255])
  assert.deepEqual(await pixelAt(splash, 1366, 1554), [255, 255, 255, 255])
  assert.deepEqual(await pixelAt(splash, 1366, 2300), [244, 247, 250, 255])
})

test('资产生成器的重复执行产生逐字节一致的输出', async (t) => {
  const firstDir = await mkdtemp(path.join(os.tmpdir(), 'zhixing-assets-first-'))
  const secondDir = await mkdtemp(path.join(os.tmpdir(), 'zhixing-assets-second-'))
  t.after(async () => {
    await Promise.all([
      rm(firstDir, { recursive: true, force: true }),
      rm(secondDir, { recursive: true, force: true }),
    ])
  })

  const [firstRun, secondRun] = await Promise.all([runGenerator(firstDir), runGenerator(secondDir)])
  assert.equal(firstRun.code, 0, firstRun.output)
  assert.equal(secondRun.code, 0, secondRun.output)

  for (const name of ['icon-only.png', 'icon-foreground.png', 'icon-background.png', 'splash.png']) {
    const [first, second] = await Promise.all([
      readFile(path.join(firstDir, name)),
      readFile(path.join(secondDir, name)),
    ])
    assert.equal(createHash('sha256').update(first).digest('hex'), createHash('sha256').update(second).digest('hex'), name)
  }
})

test('资产生成器将图标和无文字启动资源写入指定 Android res 目录', async (t) => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'zhixing-assets-output-'))
  const androidResDir = await mkdtemp(path.join(os.tmpdir(), 'zhixing-android-res-'))
  t.after(async () => {
    await Promise.all([
      rm(outputDir, { recursive: true, force: true }),
      rm(androidResDir, { recursive: true, force: true }),
    ])
  })

  const result = await runGenerator(outputDir, androidResDir)
  assert.equal(result.code, 0, result.output)

  await Promise.all([
    assertPng(path.join(androidResDir, 'mipmap-mdpi', 'ic_launcher.png'), 48, 48),
    assertPng(path.join(androidResDir, 'mipmap-hdpi', 'ic_launcher_foreground.png'), 72, 72),
    assertPng(path.join(androidResDir, 'mipmap-xxxhdpi', 'ic_launcher_round.png'), 192, 192),
    assertPng(path.join(androidResDir, 'drawable', 'splash.png'), 2732, 2732),
  ])
  assert.deepEqual(await pixelAt(path.join(androidResDir, 'mipmap-mdpi', 'ic_launcher_foreground.png'), 0, 0), [0, 0, 0, 0])
  assert.deepEqual(await pixelAt(path.join(androidResDir, 'drawable', 'splash.png'), 0, 0), [244, 247, 250, 255])
})
