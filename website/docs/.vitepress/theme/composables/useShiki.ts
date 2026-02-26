import type { Highlighter } from 'shiki'

let highlighter: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null

export async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter
  if (highlighterPromise) return highlighterPromise

  highlighterPromise = (async () => {
    const { createHighlighter } = await import('shiki')
    const meshGrammar = (await import('../../../../../tools/editors/vscode-mesh/syntaxes/mesh.tmLanguage.json')).default
    const meshLight = (await import('../shiki/mesh-light.json')).default
    const meshDark = (await import('../shiki/mesh-dark.json')).default

    highlighter = await createHighlighter({
      themes: [meshLight as any, meshDark as any],
      langs: [{ ...meshGrammar, name: 'mesh' } as any],
    })
    return highlighter!
  })()

  return highlighterPromise
}

export function highlightCode(hl: Highlighter, code: string): string {
  return hl.codeToHtml(code, {
    lang: 'mesh',
    themes: { light: 'mesh-light', dark: 'mesh-dark' },
    defaultColor: false,
  })
}
