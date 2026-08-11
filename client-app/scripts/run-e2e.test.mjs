import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const runnerPath = path.join(clientRoot, 'scripts', 'run-e2e.mjs')
const focusedArgs = [
  'e2e/states.spec.ts',
  '--grep',
  '加载状态由固定测试夹具独立复现并保留导航',
]

function runRunner(timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runnerPath, ...focusedArgs], {
      cwd: clientRoot,
      env: { ...process.env, NO_COLOR: '1' },
      shell: false,
      windowsHide: true,
    })
    let output = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`E2E runner did not exit within ${timeoutMs}ms\n${output}`))
    }, timeoutMs)

    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ code, signal, output })
    })
  })
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(4173, '127.0.0.1', resolve)
  })
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

test('runner waits for Playwright and releases its Vite port before exiting', async () => {
  const result = await runRunner()
  assert.equal(result.signal, null, result.output)
  assert.equal(result.code, 0, result.output)

  const probe = net.createServer()
  await listen(probe)
  await close(probe)
})

test('runner fails closed when its port is occupied and leaves the occupant intact', async () => {
  const occupant = net.createServer((socket) => socket.end('known-occupant'))
  await listen(occupant)

  try {
    const result = await runRunner(5_000)
    assert.notEqual(result.code, 0, result.output)
    assert.match(result.output, /EADDRINUSE|Port 4173 is already in use/i)
    assert.equal(occupant.listening, true)
  } finally {
    await close(occupant)
  }
})
