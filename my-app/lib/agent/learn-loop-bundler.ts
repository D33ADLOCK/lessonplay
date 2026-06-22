import 'server-only'

import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

import { getLearnLoopDraftFileMap } from './learn-loop-draft-store'

const require = createRequire(import.meta.url)

type BundleLearnLoopDraftInput = {
  chatId: string
  title: string
  tempParentDir?: string
}

type ViteBuildError = Error & {
  frame?: string
  plugin?: string
  id?: string
}

function findWorkspaceRoot() {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..')]

  for (const candidate of candidates) {
    const coreRoot = path.join(candidate, 'packages', 'learn-loop-core')

    try {
      require('node:fs').statSync(path.join(coreRoot, 'package.json'))
      return candidate
    } catch {
      // Try the next likely root.
    }
  }

  throw new Error('Could not find packages/learn-loop-core from the app working directory')
}

function defaultIndexHtml(title: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function assetPathFromHtmlReference(reference: string) {
  return reference.replace(/^\/+/, '').replace(/^\.\//, '')
}

async function inlineBuiltAssets({ distDir }: { distDir: string }) {
  const htmlPath = path.join(distDir, 'index.html')
  let html = await readFile(htmlPath, 'utf8')

  html = await replaceAsync(
    html,
    /<link\b([^>]*?)\bhref="([^"]+)"([^>]*?)>/g,
    async (tag, before, href, after) => {
      if (!/\brel="stylesheet"/.test(`${before} ${after}`)) {
        return tag
      }

      const cssPath = path.join(distDir, assetPathFromHtmlReference(href))
      const css = await readFile(cssPath, 'utf8')

      return `<style>\n${css}\n</style>`
    },
  )

  html = await replaceAsync(
    html,
    /<script\b([^>]*?)\bsrc="([^"]+)"([^>]*?)><\/script>/g,
    async (_tag, before, src, after) => {
      const scriptPath = path.join(distDir, assetPathFromHtmlReference(src))
      const js = await readFile(scriptPath, 'utf8')
      const attributes = `${before} ${after}`
      const type = /\btype="module"/.test(attributes) ? ' type="module"' : ''

      return `<script${type}>\n${js}\n</script>`
    },
  )

  return html
}

async function replaceAsync(
  input: string,
  pattern: RegExp,
  replacer: (...args: string[]) => Promise<string>,
) {
  const replacements = await Promise.all(
    Array.from(input.matchAll(pattern), (match) => replacer(...(match as unknown as string[]))),
  )

  let index = 0
  return input.replace(pattern, () => replacements[index++])
}

async function writeDraftToTempProject({
  tempDir,
  title,
  fileMap,
}: {
  tempDir: string
  title: string
  fileMap: Record<string, string>
}) {
  await writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify({ type: 'module', private: true }, null, 2),
  )

  const files = {
    ...fileMap,
    'index.html': fileMap['index.html'] ?? defaultIndexHtml(title),
  }

  await Promise.all(
    Object.entries(files).map(async ([filePath, content]) => {
      const absolutePath = path.join(tempDir, filePath)
      await mkdir(path.dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, content)
    }),
  )
}

export function formatLearnLoopBuildError(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error)
  }

  const viteError = error as ViteBuildError
  const details = [viteError.message]

  if (viteError.id) {
    details.push(`File: ${viteError.id}`)
  }

  if (viteError.plugin) {
    details.push(`Plugin: ${viteError.plugin}`)
  }

  if (viteError.frame) {
    details.push(viteError.frame)
  }

  return details.join('\n')
}

export async function bundleLearnLoopDraft({
  chatId,
  title,
  tempParentDir = os.tmpdir(),
}: BundleLearnLoopDraftInput) {
  const fileMap = getLearnLoopDraftFileMap(chatId)

  if (Object.keys(fileMap).length === 0) {
    throw new Error('Cannot bundle Learn Loop draft with no files')
  }

  const workspaceRoot = findWorkspaceRoot()
  const learnLoopCoreRoot = path.join(workspaceRoot, 'packages', 'learn-loop-core')
  const tempDir = await realpath(await mkdtemp(path.join(tempParentDir, 'learn-loop-build-')))
  const distDir = path.join(tempDir, 'dist')

  try {
    await writeDraftToTempProject({ tempDir, title, fileMap })

    const [{ build }, react] = await Promise.all([import('vite'), import('@vitejs/plugin-react')])
    const reactEntry = require.resolve('react')
    const reactJsxRuntimeEntry = require.resolve('react/jsx-runtime')
    const reactJsxDevRuntimeEntry = require.resolve('react/jsx-dev-runtime')
    const reactDomEntry = require.resolve('react-dom')
    const reactDomClientEntry = require.resolve('react-dom/client')

    const originalCwd = process.cwd()

    try {
      process.chdir(tempDir)

      await build({
        root: tempDir,
        configFile: false,
        logLevel: 'silent',
        plugins: [react.default()],
        resolve: {
          alias: [
            {
              find: '@learn-loop/core/ui/styles.css',
              replacement: path.join(learnLoopCoreRoot, 'src', 'ui', 'sandboxLab.css'),
            },
            {
              find: '@learn-loop/core/ui',
              replacement: path.join(learnLoopCoreRoot, 'src', 'ui', 'index.ts'),
            },
            {
              find: '@learn-loop/core',
              replacement: path.join(learnLoopCoreRoot, 'src', 'index.ts'),
            },
            { find: 'react/jsx-runtime.js', replacement: reactJsxRuntimeEntry },
            { find: 'react/jsx-runtime', replacement: reactJsxRuntimeEntry },
            {
              find: 'react/jsx-dev-runtime.js',
              replacement: reactJsxDevRuntimeEntry,
            },
            {
              find: 'react/jsx-dev-runtime',
              replacement: reactJsxDevRuntimeEntry,
            },
            { find: 'react', replacement: reactEntry },
            { find: 'react-dom/client.js', replacement: reactDomClientEntry },
            { find: 'react-dom/client', replacement: reactDomClientEntry },
            { find: 'react-dom', replacement: reactDomEntry },
          ],
        },
        build: {
          outDir: 'dist',
          emptyOutDir: true,
          minify: false,
          sourcemap: false,
          cssCodeSplit: false,
          rollupOptions: {
            input: 'index.html',
          },
        },
      })
    } finally {
      process.chdir(originalCwd)
    }

    return await inlineBuiltAssets({ distDir })
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

export async function listTempLearnLoopBuildDirs(tempParentDir: string) {
  const entries = await readdir(tempParentDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('learn-loop-build-'))
    .map((entry) => entry.name)
    .sort()
}
