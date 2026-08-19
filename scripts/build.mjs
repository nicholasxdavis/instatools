import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv[2] || 'root'

if (target !== 'root' && target !== 'github-pages') {
  console.error(`Unknown deploy target "${target}". Use "root" or "github-pages".`)
  process.exit(1)
}

const env = { ...process.env, DEPLOY_TARGET: target }

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log(`build target: ${target}`)
run('vite', ['build'])
run('node', ['scripts/seo-prerender.mjs'])
