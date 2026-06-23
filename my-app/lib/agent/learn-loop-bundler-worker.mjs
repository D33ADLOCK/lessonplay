import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

function assetPathFromHtmlReference(reference) {
  return reference.replace(/^\/+/, '').replace(/^\.\//, '')
}

async function replaceAsync(input, pattern, replacer) {
  const replacements = await Promise.all(
    Array.from(input.matchAll(pattern), (match) => replacer(...match)),
  )

  let index = 0
  return input.replace(pattern, () => replacements[index++])
}

async function inlineBuiltAssets({ distDir }) {
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

function formatBuildError(error) {
  if (!(error instanceof Error)) {
    return String(error)
  }

  const details = [error.message]

  if ('id' in error && error.id) {
    details.push(`File: ${error.id}`)
  }

  if ('plugin' in error && error.plugin) {
    details.push(`Plugin: ${error.plugin}`)
  }

  if ('frame' in error && error.frame) {
    details.push(error.frame)
  }

  return details.join('\n')
}

async function main() {
  const input = JSON.parse(process.argv[2] ?? '{}')
  const { appRoot, workspaceRoot, tempDir, distDir, outputPath } = input

  if (!appRoot || !workspaceRoot || !tempDir || !distDir || !outputPath) {
    throw new Error('Missing required Learn Loop bundler worker input')
  }

  const appRequire = createRequire(path.join(appRoot, 'package.json'))
  const [{ build }, react] = await Promise.all([import('vite'), import('@vitejs/plugin-react')])

  const learnLoopCoreRoot = path.join(workspaceRoot, 'packages', 'learn-loop-core')
  const learnLoopTemplateRoot = path.join(workspaceRoot, 'packages', 'learn-loop-template')
  const reactEntry = appRequire.resolve('react')
  const reactJsxRuntimeEntry = appRequire.resolve('react/jsx-runtime')
  const reactJsxDevRuntimeEntry = appRequire.resolve('react/jsx-dev-runtime')
  const reactDomEntry = appRequire.resolve('react-dom')
  const reactDomClientEntry = appRequire.resolve('react-dom/client')

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
          find: '@learn-loop/template/styles.css',
          replacement: path.join(learnLoopTemplateRoot, 'src', 'styles.css'),
        },
        {
          find: '@learn-loop/template',
          replacement: path.join(learnLoopTemplateRoot, 'src', 'index.ts'),
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
        { find: 'react/jsx-dev-runtime.js', replacement: reactJsxDevRuntimeEntry },
        { find: 'react/jsx-dev-runtime', replacement: reactJsxDevRuntimeEntry },
        { find: 'react', replacement: reactEntry },
        { find: 'react-dom/client.js', replacement: reactDomClientEntry },
        { find: 'react-dom/client', replacement: reactDomClientEntry },
        { find: 'react-dom', replacement: reactDomEntry },
      ],
    },
    build: {
      outDir: distDir,
      emptyOutDir: true,
      minify: false,
      sourcemap: false,
      cssCodeSplit: false,
      rollupOptions: {
        input: path.join(tempDir, 'index.html'),
      },
    },
  })

  const html = await inlineBuiltAssets({ distDir })
  await writeFile(outputPath, html)
}

main()
  .then(() => {
    process.stdout.write(JSON.stringify({ ok: true }))
  })
  .catch((error) => {
    process.stdout.write(JSON.stringify({ ok: false, error: formatBuildError(error) }))
    process.exitCode = 1
  })
