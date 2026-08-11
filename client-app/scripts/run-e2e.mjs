import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const signalExitCodes = new Map([
  ['SIGHUP', 129],
  ['SIGINT', 130],
  ['SIGTERM', 143],
])

function waitForChild(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })
}

export async function runE2E(playwrightArgs = []) {
  let child
  let requestedSignal
  let server

  const forwardSignal = (signal) => {
    requestedSignal ??= signal
    if (child && child.exitCode === null && child.signalCode === null) child.kill(signal)
  }
  const signalHandlers = new Map(
    [...signalExitCodes.keys()].map((signal) => [signal, () => forwardSignal(signal)]),
  )
  for (const [signal, handler] of signalHandlers) process.once(signal, handler)

  try {
    server = await createServer({
      root: clientRoot,
      mode: 'e2e',
      server: {
        host: '127.0.0.1',
        port: 4173,
        strictPort: true,
      },
    })
    await server.listen()

    child = spawn(process.execPath, [playwrightCli, 'test', ...playwrightArgs], {
      cwd: clientRoot,
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
    })
    if (requestedSignal) child.kill(requestedSignal)

    const result = await waitForChild(child)
    if (requestedSignal) return signalExitCodes.get(requestedSignal) ?? 1
    if (result.signal) {
      console.error(`Playwright exited from signal ${result.signal}`)
      return signalExitCodes.get(result.signal) ?? 1
    }
    return result.code ?? 1
  } finally {
    for (const [signal, handler] of signalHandlers) process.off(signal, handler)
    if (child && child.exitCode === null && child.signalCode === null) child.kill()
    if (server) await server.close()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await runE2E(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error))
    process.exitCode = 1
  }
}
