import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..', '..', '..')
const corpusPath = path.join(root, 'scripts/fixtures/m036-s01-syntax-corpus.json')
const sharedGrammarPath = path.join(root, 'tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json')
const shikiLightThemePath = path.join(root, 'website/docs/.vitepress/theme/shiki/mesh-light.json')
const shikiDarkThemePath = path.join(root, 'website/docs/.vitepress/theme/shiki/mesh-dark.json')
const clusterDecoratorFixturePath = path.join(root, 'scripts/fixtures/m048-s04-cluster-decorators.mpl')

const BEGIN_SCOPE = 'punctuation.section.interpolation.begin.mesh'
const END_SCOPE = 'punctuation.section.interpolation.end.mesh'
const META_SCOPE = 'meta.interpolation.mesh'
const ANNOTATION_PUNCTUATION_SCOPE = 'punctuation.definition.annotation.mesh'
const CLUSTER_DECORATOR_SCOPE = 'storage.modifier.annotation.cluster.mesh'
const INTEGER_SCOPE = 'constant.numeric.integer.mesh'
const VARIABLE_SCOPE = 'variable.other.mesh'
const STRING_SCOPE_BY_KIND = {
  double: 'string.quoted.double.mesh',
  triple: 'string.quoted.triple.mesh',
}

function readText(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`[m036-s01] missing ${label}: ${path.relative(root, absolutePath)}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function readJson(absolutePath, label) {
  return JSON.parse(readText(absolutePath, label))
}

async function importRepoModule(relativePath, label) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`[m036-s01] missing ${label}: ${relativePath}`)
  }
  return import(pathToFileURL(absolutePath).href)
}

async function withTimeout(label, timeoutMs, promiseFactory) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`[m036-s01] ${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  try {
    return await Promise.race([Promise.resolve().then(promiseFactory), timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

function relativePath(absolutePath) {
  return path.relative(root, absolutePath).replace(/\\/g, '/')
}

function offsetToLineColumn(text, offset) {
  const normalized = text.slice(0, offset).replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  return {
    line: lines.length,
    column: lines.at(-1).length + 1,
  }
}

function formatRange(text, start, end) {
  const startPos = offsetToLineColumn(text, start)
  const endPos = offsetToLineColumn(text, end)
  return `${startPos.line}:${startPos.column}-${endPos.line}:${endPos.column}`
}

function findRequiredOffset(text, search, label, filePath) {
  const offset = text.indexOf(search)
  if (offset === -1) {
    throw new Error(`[m036-s01] cluster decorator fixture drift: missing ${label} ${JSON.stringify(search)} in ${filePath}`)
  }
  return offset
}

function lineSlice(text, startLine, endLine) {
  const lines = text.split(/\r?\n/)
  const startIndex = startLine - 1
  const endIndex = endLine
  return lines.slice(startIndex, endIndex).join('\n')
}

function scanInterpolations(code, caseDef) {
  const matches = []
  for (let index = 0; index < code.length - 1; index += 1) {
    const opener = code.slice(index, index + 2)
    if (opener !== '#{' && opener !== '${') continue

    const form = opener === '#{' ? 'hash' : 'dollar'
    let braceDepth = 0
    let cursor = index + 2
    for (; cursor < code.length; cursor += 1) {
      const char = code[cursor]
      if (char === '{') {
        braceDepth += 1
      } else if (char === '}') {
        if (braceDepth === 0) break
        braceDepth -= 1
      }
    }

    if (cursor >= code.length) {
      throw new Error(`[m036-s01] corpus case ${caseDef.id} (${caseDef.path}) has an unterminated ${form} interpolation`)
    }

    matches.push({
      form,
      opener,
      start: index,
      openEnd: index + 2,
      exprStart: index + 2,
      exprEnd: cursor,
      endStart: cursor,
      endEnd: cursor + 1,
      expression: code.slice(index + 2, cursor),
      text: code.slice(index, cursor + 1),
    })

    index = cursor
  }
  return matches
}

function loadCorpusCases() {
  const corpus = readJson(corpusPath, 'syntax corpus manifest')
  assert.equal(corpus.contractVersion, 'm036-s01-syntax-corpus-v1', 'unexpected corpus contract version')
  assert.ok(Array.isArray(corpus.cases) && corpus.cases.length > 0, 'corpus must declare at least one case')

  return corpus.cases.map((caseDef) => {
    const absolutePath = path.join(root, caseDef.path)
    const sourceText = readText(absolutePath, `corpus source for ${caseDef.id}`)
    const snippet = lineSlice(sourceText, caseDef.startLine, caseDef.endLine)

    if (!snippet.trim()) {
      throw new Error(`[m036-s01] corpus case ${caseDef.id} (${caseDef.path}) selected an empty snippet (lines ${caseDef.startLine}-${caseDef.endLine})`)
    }

    const matches = scanInterpolations(snippet, caseDef)
    if (caseDef.expectNoInterpolation) {
      if (matches.length !== 0) {
        throw new Error(`[m036-s01] corpus case ${caseDef.id} (${caseDef.path}) expected no interpolation but found ${matches.map((match) => match.opener).join(', ')}`)
      }
    } else {
      if (!Array.isArray(caseDef.expectedForms) || caseDef.expectedForms.length === 0) {
        throw new Error(`[m036-s01] corpus case ${caseDef.id} (${caseDef.path}) must declare expectedForms or expectNoInterpolation`)
      }
      if (matches.length === 0) {
        throw new Error(`[m036-s01] corpus case ${caseDef.id} (${caseDef.path}) did not contain either interpolation form`)
      }
      const actualForms = [...new Set(matches.map((match) => match.form))].sort()
      const expectedForms = [...new Set(caseDef.expectedForms)].sort()
      assert.deepEqual(actualForms, expectedForms, `[m036-s01] corpus case ${caseDef.id} (${caseDef.path}) drifted from its declared interpolation forms`)
    }

    assert.ok(STRING_SCOPE_BY_KIND[caseDef.expectedStringKind], `[m036-s01] corpus case ${caseDef.id} (${caseDef.path}) has an unsupported expectedStringKind`)

    return {
      ...caseDef,
      absolutePath,
      snippet,
      matches,
    }
  })
}

function loadClusterDecoratorFixture() {
  const absolutePath = clusterDecoratorFixturePath
  const filePath = relativePath(absolutePath)
  const snippet = readText(absolutePath, 'cluster decorator fixture')

  if (!snippet.trim()) {
    throw new Error(`[m036-s01] cluster decorator fixture drift: ${filePath} is empty`)
  }

  const plainDecoratorStart = findRequiredOffset(snippet, '@cluster pub fn add()', 'plain decorator declaration', filePath)
  const countedDecoratorStart = findRequiredOffset(snippet, '@cluster(3) pub fn sync_todos()', 'counted decorator declaration', filePath)
  const bareIdentifierStart = findRequiredOffset(snippet, 'let cluster = 1', 'bare cluster identifier declaration', filePath)

  return {
    absolutePath,
    path: filePath,
    snippet,
    cases: [
      {
        id: 'plain-decorator-at',
        start: plainDecoratorStart,
        end: plainDecoratorStart + 1,
        expectedScopes: [ANNOTATION_PUNCTUATION_SCOPE],
      },
      {
        id: 'plain-decorator-cluster',
        start: plainDecoratorStart + 1,
        end: plainDecoratorStart + '@cluster'.length,
        expectedScopes: [CLUSTER_DECORATOR_SCOPE],
        unexpectedScopes: [VARIABLE_SCOPE],
      },
      {
        id: 'counted-decorator-at',
        start: countedDecoratorStart,
        end: countedDecoratorStart + 1,
        expectedScopes: [ANNOTATION_PUNCTUATION_SCOPE],
      },
      {
        id: 'counted-decorator-cluster',
        start: countedDecoratorStart + 1,
        end: countedDecoratorStart + '@cluster'.length,
        expectedScopes: [CLUSTER_DECORATOR_SCOPE],
        unexpectedScopes: [VARIABLE_SCOPE],
      },
      {
        id: 'counted-decorator-count',
        start: countedDecoratorStart + '@cluster('.length,
        end: countedDecoratorStart + '@cluster(3'.length,
        expectedScopes: [INTEGER_SCOPE],
      },
      {
        id: 'bare-cluster-identifier',
        start: bareIdentifierStart + 'let '.length,
        end: bareIdentifierStart + 'let cluster'.length,
        expectedScopes: [VARIABLE_SCOPE],
        unexpectedScopes: [ANNOTATION_PUNCTUATION_SCOPE, CLUSTER_DECORATOR_SCOPE],
      },
    ],
  }
}

function tokenizeSnippet(grammar, code) {
  const normalized = code.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const segments = []
  let lineOffset = 0
  let state = null

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    const result = grammar.tokenizeLine(line, state)
    state = result.ruleStack

    for (const token of result.tokens) {
      segments.push({
        line: lineIndex + 1,
        start: lineOffset + token.startIndex,
        end: lineOffset + token.endIndex,
        scopes: token.scopes,
        text: line.slice(token.startIndex, token.endIndex),
      })
    }

    lineOffset += line.length
    if (lineIndex < lines.length - 1) lineOffset += 1
  }

  return segments
}

function scopesForRange(segments, start, end) {
  const scopes = new Set()
  for (const segment of segments) {
    if (segment.start < end && start < segment.end) {
      for (const scope of segment.scopes) scopes.add(scope)
    }
  }
  return scopes
}

function scopesToSignature(segments) {
  return segments.map((segment) => ({
    start: segment.start,
    end: segment.end,
    scopes: segment.scopes,
  }))
}

function describeScopes(scopes) {
  return [...scopes].sort().join(', ') || '(none)'
}

function assertScopeContract(engineName, fixture, segments, caseDef) {
  const actualScopes = scopesForRange(segments, caseDef.start, caseDef.end)
  const range = formatRange(fixture.snippet, caseDef.start, caseDef.end)

  for (const scope of caseDef.expectedScopes ?? []) {
    assert.ok(
      actualScopes.has(scope),
      `[m036-s01] shared-surface syntax drift detected: engine=${engineName} file=${fixture.path} case=${caseDef.id} range=${range} issue=missing ${scope} actual=${describeScopes(actualScopes)}`,
    )
  }

  for (const scope of caseDef.unexpectedScopes ?? []) {
    assert.ok(
      !actualScopes.has(scope),
      `[m036-s01] shared-surface syntax drift detected: engine=${engineName} file=${fixture.path} case=${caseDef.id} range=${range} issue=unexpected ${scope} actual=${describeScopes(actualScopes)}`,
    )
  }
}

function verifyContract(engineName, corpusCase, segments) {
  const drifts = []
  const expectedStringScope = STRING_SCOPE_BY_KIND[corpusCase.expectedStringKind]
  const overallStringScopes = scopesForRange(segments, 0, corpusCase.snippet.length)
  if (!overallStringScopes.has(expectedStringScope)) {
    drifts.push({
      engine: engineName,
      file: corpusCase.path,
      caseId: corpusCase.id,
      form: corpusCase.expectNoInterpolation ? 'none' : corpusCase.expectedForms.join('+'),
      issue: `missing ${expectedStringScope} anywhere in the snippet`,
      actualScopes: describeScopes(overallStringScopes),
    })
  }

  if (corpusCase.expectNoInterpolation) {
    const noInterpolationScopes = [BEGIN_SCOPE, META_SCOPE, END_SCOPE].filter((scope) => overallStringScopes.has(scope))
    if (noInterpolationScopes.length > 0) {
      drifts.push({
        engine: engineName,
        file: corpusCase.path,
        caseId: corpusCase.id,
        form: 'none',
        issue: `unexpected interpolation scopes in a plain string`,
        actualScopes: noInterpolationScopes.join(', '),
      })
    }
    return drifts
  }

  for (const match of corpusCase.matches) {
    const startScopes = scopesForRange(segments, match.start, match.openEnd)
    if (!startScopes.has(BEGIN_SCOPE)) {
      drifts.push({
        engine: engineName,
        file: corpusCase.path,
        caseId: corpusCase.id,
        form: match.form,
        issue: `missing ${BEGIN_SCOPE} for ${JSON.stringify(match.opener)}`,
        actualScopes: describeScopes(startScopes),
      })
    }

    const expressionScopes = scopesForRange(segments, match.exprStart, Math.max(match.exprStart + 1, match.exprEnd))
    if (!expressionScopes.has(META_SCOPE)) {
      drifts.push({
        engine: engineName,
        file: corpusCase.path,
        caseId: corpusCase.id,
        form: match.form,
        issue: `missing ${META_SCOPE} for expression ${JSON.stringify(match.expression)}`,
        actualScopes: describeScopes(expressionScopes),
      })
    }

    const endScopes = scopesForRange(segments, match.endStart, match.endEnd)
    if (!endScopes.has(END_SCOPE)) {
      drifts.push({
        engine: engineName,
        file: corpusCase.path,
        caseId: corpusCase.id,
        form: match.form,
        issue: `missing ${END_SCOPE} for ${JSON.stringify(match.text)}`,
        actualScopes: describeScopes(endScopes),
      })
    }
  }

  return drifts
}

function formatDrifts(drifts) {
  return [
    '[m036-s01] shared-surface syntax drift detected:',
    ...drifts.map((drift) => `- engine=${drift.engine} file=${drift.file} case=${drift.caseId} form=${drift.form} issue=${drift.issue} actual=${drift.actualScopes}`),
  ].join('\n')
}

async function createTextMateHarness(options = {}) {
  const registryModulePath = options.registryModulePath ?? 'website/node_modules/@shikijs/vscode-textmate/dist/index.js'
  const engineModulePath = options.engineModulePath ?? 'website/node_modules/@shikijs/engine-javascript/dist/index.mjs'
  const grammarPath = options.grammarPath ?? relativePath(sharedGrammarPath)
  const [{ Registry }, { createJavaScriptRegexEngine }] = await Promise.all([
    importRepoModule(registryModulePath, 'TextMate dependency'),
    importRepoModule(engineModulePath, 'TextMate regex engine dependency'),
  ])

  const grammar = readJson(path.join(root, grammarPath), 'shared grammar')
  const regexEngine = createJavaScriptRegexEngine()
  const registry = new Registry({
    onigLib: {
      createOnigScanner(patterns) {
        return regexEngine.createScanner(patterns)
      },
      createOnigString(text) {
        return regexEngine.createString(text)
      },
    },
    loadGrammar(scopeName) {
      return scopeName === grammar.scopeName ? grammar : null
    },
  })

  const loadedGrammar = registry.loadGrammar(grammar.scopeName)
  if (!loadedGrammar) {
    throw new Error(`[m036-s01] failed to load textmate grammar from ${grammarPath}`)
  }

  return {
    tokenize(code) {
      return tokenizeSnippet(loadedGrammar, code)
    },
  }
}

async function createShikiHarness(options = {}) {
  const shikiModulePath = options.shikiModulePath ?? 'website/node_modules/shiki/dist/index.mjs'
  const grammarPath = options.grammarPath ?? relativePath(sharedGrammarPath)
  const [shikiModule] = await Promise.all([
    importRepoModule(shikiModulePath, 'Shiki dependency'),
  ])

  const grammar = readJson(path.join(root, grammarPath), 'shared grammar')
  const meshLight = readJson(shikiLightThemePath, 'mesh light theme')
  const meshDark = readJson(shikiDarkThemePath, 'mesh dark theme')

  const highlighter = await withTimeout('shiki highlighter load', 5000, () =>
    shikiModule.createHighlighter({
      themes: [meshLight, meshDark],
      langs: [{ ...grammar, name: 'mesh' }],
    }),
  )

  const loadedGrammar = highlighter.getLanguage('mesh')
  if (!loadedGrammar || typeof loadedGrammar.tokenizeLine !== 'function') {
    throw new Error(`[m036-s01] failed to resolve the docs-side shiki grammar for mesh from ${grammarPath}`)
  }

  return {
    render(code) {
      return highlighter.codeToHtml(code, {
        lang: 'mesh',
        themes: { light: 'mesh-light', dark: 'mesh-dark' },
        defaultColor: false,
      })
    },
    tokenize(code) {
      return tokenizeSnippet(loadedGrammar, code)
    },
    dispose() {
      highlighter.dispose()
    },
  }
}

test('corpus manifest resolves audited repo snippets and keeps cases named', () => {
  const cases = loadCorpusCases()
  assert.ok(cases.length >= 10, 'expected a non-toy syntax corpus')
  for (const corpusCase of cases) {
    assert.ok(corpusCase.id, 'case ids must be present')
    assert.ok(corpusCase.path, `case ${corpusCase.id} must carry its source path`)
    assert.ok(corpusCase.snippet.includes('"'), `case ${corpusCase.id} should resolve string-bearing source text`)
  }
})

test('verifier helpers fail closed for malformed corpus entries and broken loader paths', async () => {
  const missingSourcePath = path.join(root, 'scripts/fixtures/m036-s01/missing.mpl')
  assert.throws(() => readText(missingSourcePath, 'corpus source for missing-source'), /missing corpus source for missing-source: scripts\/fixtures\/m036-s01\/missing\.mpl/)

  const emptySelectionCase = {
    id: 'empty-selection',
    path: 'tests/fixtures/interpolation.mpl',
    startLine: 99,
    endLine: 99,
    expectedForms: ['dollar'],
    expectedStringKind: 'double',
  }
  const interpolationFixture = readText(path.join(root, emptySelectionCase.path), 'test interpolation fixture')
  assert.throws(
    () => {
      const snippet = lineSlice(interpolationFixture, emptySelectionCase.startLine, emptySelectionCase.endLine)
      if (!snippet.trim()) {
        throw new Error(`[m036-s01] corpus case ${emptySelectionCase.id} (${emptySelectionCase.path}) selected an empty snippet (lines ${emptySelectionCase.startLine}-${emptySelectionCase.endLine})`)
      }
    },
    /corpus case empty-selection \(tests\/fixtures\/interpolation\.mpl\) selected an empty snippet/,
  )

  const malformedCase = {
    id: 'missing-form-contract',
    path: 'tests/fixtures/interpolation.mpl',
    startLine: 4,
    endLine: 4,
    expectedStringKind: 'double',
  }
  const malformedSnippet = lineSlice(interpolationFixture, malformedCase.startLine, malformedCase.endLine)
  assert.throws(
    () => {
      const matches = scanInterpolations(malformedSnippet, malformedCase)
      if (!Array.isArray(malformedCase.expectedForms) || malformedCase.expectedForms.length === 0) {
        throw new Error(`[m036-s01] corpus case ${malformedCase.id} (${malformedCase.path}) must declare expectedForms or expectNoInterpolation`)
      }
      return matches
    },
    /corpus case missing-form-contract \(tests\/fixtures\/interpolation\.mpl\) must declare expectedForms or expectNoInterpolation/,
  )

  await assert.rejects(
    () => createTextMateHarness({ registryModulePath: 'website/node_modules/@shikijs/vscode-textmate/dist/does-not-exist.js' }),
    /missing TextMate dependency: website\/node_modules\/@shikijs\/vscode-textmate\/dist\/does-not-exist\.js/,
  )

  await assert.rejects(
    () => createShikiHarness({ grammarPath: 'tools/editors/vscode-mesh/syntaxes/does-not-exist.json' }),
    /missing shared grammar: tools\/editors\/vscode-mesh\/syntaxes\/does-not-exist\.json/,
  )

  await assert.rejects(
    () => withTimeout('shiki stalled engine', 25, () => new Promise(() => {})),
    /shiki stalled engine timed out after 25ms/,
  )
})

test('shared grammar matches the audited interpolation contract in both TextMate and Shiki', async () => {
  const corpusCases = loadCorpusCases()
  const [textmate, shiki] = await Promise.all([createTextMateHarness(), createShikiHarness()])
  const drifts = []

  try {
    for (const corpusCase of corpusCases) {
      const textmateTokens = textmate.tokenize(corpusCase.snippet)
      const shikiTokens = shiki.tokenize(corpusCase.snippet)
      const rendered = shiki.render(corpusCase.snippet)

      assert.match(rendered, /<pre class="shiki /, `[m036-s01] shiki render output drifted for ${corpusCase.id}`)

      drifts.push(...verifyContract('textmate', corpusCase, textmateTokens))
      drifts.push(...verifyContract('shiki', corpusCase, shikiTokens))

      const textmateSignature = scopesToSignature(textmateTokens)
      const shikiSignature = scopesToSignature(shikiTokens)
      if (JSON.stringify(textmateSignature) !== JSON.stringify(shikiSignature)) {
        drifts.push({
          engine: 'textmate',
          file: corpusCase.path,
          caseId: corpusCase.id,
          form: corpusCase.expectNoInterpolation ? 'none' : corpusCase.expectedForms.join('+'),
          issue: 'token signature diverged from shiki',
          actualScopes: JSON.stringify(textmateSignature),
        })
        drifts.push({
          engine: 'shiki',
          file: corpusCase.path,
          caseId: corpusCase.id,
          form: corpusCase.expectNoInterpolation ? 'none' : corpusCase.expectedForms.join('+'),
          issue: 'token signature diverged from textmate',
          actualScopes: JSON.stringify(shikiSignature),
        })
      }
    }
  } finally {
    shiki.dispose()
  }

  assert.equal(drifts.length, 0, formatDrifts(drifts))
})

test('shared grammar scopes @cluster decorators consistently in both TextMate and Shiki', async () => {
  const fixture = loadClusterDecoratorFixture()
  const [textmate, shiki] = await Promise.all([createTextMateHarness(), createShikiHarness()])

  try {
    const textmateTokens = textmate.tokenize(fixture.snippet)
    const shikiTokens = shiki.tokenize(fixture.snippet)
    const rendered = shiki.render(fixture.snippet)

    assert.match(rendered, /<pre class="shiki /, `[m036-s01] shiki render output drifted for ${fixture.path}`)

    const textmateSignature = scopesToSignature(textmateTokens)
    const shikiSignature = scopesToSignature(shikiTokens)
    assert.equal(
      JSON.stringify(textmateSignature),
      JSON.stringify(shikiSignature),
      `[m036-s01] shared-surface syntax drift detected: engine=both file=${fixture.path} case=cluster-decorator-signature issue=token signature diverged actual=textmate=${JSON.stringify(textmateSignature)} shiki=${JSON.stringify(shikiSignature)}`,
    )

    for (const caseDef of fixture.cases) {
      assertScopeContract('textmate', fixture, textmateTokens, caseDef)
      assertScopeContract('shiki', fixture, shikiTokens, caseDef)
    }
  } finally {
    shiki.dispose()
  }
})
