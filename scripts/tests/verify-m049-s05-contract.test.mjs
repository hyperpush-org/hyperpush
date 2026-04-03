import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..', '..')
const verifierPath = 'scripts/verify-m049-s05.sh'

function readFrom(baseRoot, relativePath) {
  const absolutePath = path.join(baseRoot, relativePath)
  assert.ok(fs.existsSync(absolutePath), `missing ${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
}

function writeTo(baseRoot, relativePath, content) {
  const absolutePath = path.join(baseRoot, relativePath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, content)
}

function copyRepoFile(baseRoot, relativePath) {
  writeTo(baseRoot, relativePath, readFrom(root, relativePath))
}

function mkTmpDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  return dir
}

function requireIncludes(errors, relativePath, text, needles) {
  for (const needle of needles) {
    if (!text.includes(needle)) {
      errors.push(`${relativePath} missing ${JSON.stringify(needle)}`)
    }
  }
}

function requireExcludes(errors, relativePath, text, needles) {
  for (const needle of needles) {
    if (text.includes(needle)) {
      errors.push(`${relativePath} still contains stale text ${JSON.stringify(needle)}`)
    }
  }
}

function requireOrdered(errors, relativePath, text, labels) {
  let previousIndex = -1
  for (const label of labels) {
    const index = text.indexOf(label)
    if (index === -1) {
      errors.push(`${relativePath} missing ordered marker ${JSON.stringify(label)}`)
      return
    }
    if (index <= previousIndex) {
      errors.push(`${relativePath} drifted order around ${JSON.stringify(label)}`)
      return
    }
    previousIndex = index
  }
}

function validateVerifierContract(baseRoot) {
  const errors = []
  const verifier = readFrom(baseRoot, verifierPath)

  requireIncludes(errors, verifierPath, verifier, [
    'node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs',
    'cargo test -p mesh-pkg m049_s0 -- --nocapture',
    'cargo test -p meshc --test tooling_e2e test_init_todo_template_ -- --nocapture',
    'cargo build -q -p meshc',
    'node scripts/tests/verify-m049-s03-materialize-examples.mjs --check',
    'cargo test -p meshc --test e2e_m049_s01 -- --nocapture',
    'cargo test -p meshc --test e2e_m049_s02 -- --nocapture',
    'cargo test -p meshc --test e2e_m049_s03 -- --nocapture',
    'bash scripts/verify-m039-s01.sh',
    'bash scripts/verify-m045-s02.sh',
    'bash scripts/verify-m047-s05.sh',
    'bash scripts/verify-m048-s05.sh',
    '.tmp/m049-s01/local-postgres/connection.env',
    'm049-s01-env-preflight',
    'meshc-build-preflight',
    'm049-s03-materialize-direct',
    'm049-s05-bundle-shape',
    'retained-m039-s01-verify',
    'retained-m045-s02-verify',
    'retained-m047-s05-verify',
    'retained-m048-s05-verify',
    'retained-m049-s01-artifacts',
    'retained-m049-s02-artifacts',
    'retained-m049-s03-artifacts',
    'latest-proof-bundle.txt',
    'status.txt',
    'current-phase.txt',
    'phase-report.txt',
    'full-contract.log',
  ])

  requireExcludes(errors, verifierPath, verifier, [
    'bash scripts/verify-m049-s04.sh',
    'npm --prefix website run build',
    'cargo run -q -p meshc -- build cluster-proof',
    'cargo run -q -p meshc -- test cluster-proof/tests',
    'cargo run -q -p meshc -- build tiny-cluster',
    'cargo run -q -p meshc -- test tiny-cluster/tests',
    'source "$ROOT_DIR/.env"',
    'cat .env',
    'echo "$DATABASE_URL"',
    'printf \"%s\\n\" \"$DATABASE_URL\"',
  ])

  requireOrdered(errors, verifierPath, verifier, [
    'node --test scripts/tests/verify-m049-s04-onboarding-contract.test.mjs',
    'cargo test -p mesh-pkg m049_s0 -- --nocapture',
    'cargo test -p meshc --test tooling_e2e test_init_todo_template_ -- --nocapture',
    'cargo build -q -p meshc',
    'node scripts/tests/verify-m049-s03-materialize-examples.mjs --check',
    'cargo test -p meshc --test e2e_m049_s01 -- --nocapture',
    'cargo test -p meshc --test e2e_m049_s02 -- --nocapture',
    'cargo test -p meshc --test e2e_m049_s03 -- --nocapture',
    'bash scripts/verify-m039-s01.sh',
    'bash scripts/verify-m045-s02.sh',
    'bash scripts/verify-m047-s05.sh',
    'bash scripts/verify-m048-s05.sh',
  ])

  return errors
}

test('current repo publishes the assembled M049 S05 verifier contract', () => {
  const errors = validateVerifierContract(root)
  assert.deepEqual(errors, [], errors.join('\n'))
})

test('contract fails closed when the assembled replay order drifts', (t) => {
  const tmpRoot = mkTmpDir(t, 'verify-m049-s05-order-')
  copyRepoFile(tmpRoot, verifierPath)

  let mutated = readFrom(tmpRoot, verifierPath)
  mutated = mutated.replace(
    'cargo build -q -p meshc',
    'cargo build -q -p meshc # moved-later',
  )
  mutated = mutated.replace(
    'node scripts/tests/verify-m049-s03-materialize-examples.mjs --check',
    'cargo build -q -p meshc',
  )
  mutated = mutated.replace(
    'cargo build -q -p meshc # moved-later',
    'node scripts/tests/verify-m049-s03-materialize-examples.mjs --check',
  )
  mutated = mutated.replace(
    'bash scripts/verify-m048-s05.sh',
    'bash scripts/verify-m047-s05.sh',
  )
  mutated = mutated.replace(
    'bash scripts/verify-m047-s05.sh',
    'bash scripts/verify-m048-s05.sh',
  )
  writeTo(tmpRoot, verifierPath, mutated)

  const errors = validateVerifierContract(tmpRoot)
  assert.ok(errors.some((error) => error.includes('drifted order')), errors.join('\n'))
})

test('contract fails closed when Postgres fallback and retained bundle markers disappear', (t) => {
  const tmpRoot = mkTmpDir(t, 'verify-m049-s05-bundle-')
  copyRepoFile(tmpRoot, verifierPath)

  let mutated = readFrom(tmpRoot, verifierPath)
  mutated = mutated.replaceAll('.tmp/m049-s01/local-postgres/connection.env', '.tmp/m049-s01/verify/connection.env')
  mutated = mutated.replaceAll('retained-m045-s02-verify', 'retained-m045-s02-copy')
  mutated = mutated.replaceAll('retained-m049-s03-artifacts', 'retained-m049-s03-copy')
  writeTo(tmpRoot, verifierPath, mutated)

  const errors = validateVerifierContract(tmpRoot)
  assert.ok(errors.some((error) => error.includes('missing ".tmp/m049-s01/local-postgres/connection.env"')), errors.join('\n'))
  assert.ok(errors.some((error) => error.includes('missing "retained-m045-s02-verify"')), errors.join('\n'))
  assert.ok(errors.some((error) => error.includes('missing "retained-m049-s03-artifacts"')), errors.join('\n'))
})
