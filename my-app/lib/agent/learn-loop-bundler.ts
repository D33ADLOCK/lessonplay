import 'server-only'

import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { statSync } from 'node:fs'
import { execFile } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { getLearnLoopDraftFileMap } from './learn-loop-draft-store'

const execFileAsync = promisify(execFile)

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

type WorkerResult = {
  ok: boolean
  error?: string
}

function findWorkspaceRoot() {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..')]

  for (const candidate of candidates) {
    const coreRoot = path.join(candidate, 'packages', 'learn-loop-core')

    try {
      statSync(path.join(coreRoot, 'package.json'))
      return candidate
    } catch {
      // Try the next likely root.
    }
  }

  throw new Error('Could not find packages/learn-loop-core from the app working directory')
}

function findAppRoot() {
  const candidates = [process.cwd(), path.join(findWorkspaceRoot(), 'my-app')]

  for (const candidate of candidates) {
    try {
      statSync(path.join(candidate, 'package.json'))
      statSync(path.join(candidate, 'lib', 'agent', 'learn-loop-bundler-worker.mjs'))
      return candidate
    } catch {
      // Try the next likely app root.
    }
  }

  throw new Error('Could not find my-app root from the current working directory')
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

async function runViteBundleWorker({
  appRoot,
  workspaceRoot,
  tempDir,
  distDir,
  outputPath,
}: {
  appRoot: string
  workspaceRoot: string
  tempDir: string
  distDir: string
  outputPath: string
}) {
  const workerPath = path.join(appRoot, 'lib', 'agent', 'learn-loop-bundler-worker.mjs')

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        workerPath,
        JSON.stringify({
          appRoot,
          workspaceRoot,
          tempDir,
          distDir,
          outputPath,
        }),
      ],
      {
        cwd: appRoot,
        maxBuffer: 1024 * 1024,
      },
    )

    const result = JSON.parse(stdout || '{"ok":true}') as WorkerResult

    if (!result.ok) {
      throw new Error(result.error || 'Learn Loop Vite worker failed')
    }
  } catch (error) {
    if (error instanceof Error && 'stdout' in error) {
      const stdout = String((error as Error & { stdout?: unknown }).stdout ?? '').trim()
      if (stdout) {
        let result: WorkerResult | undefined
        try {
          result = JSON.parse(stdout) as WorkerResult
        } catch {
          result = undefined
        }

        if (result && !result.ok && result.error) {
          throw new Error(result.error)
        }
      }
    }

    if (error instanceof Error && 'stderr' in error) {
      const stderr = String((error as Error & { stderr?: unknown }).stderr ?? '').trim()
      if (stderr) {
        throw new Error(stderr)
      }
    }

    throw error
  }
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
  const appRoot = findAppRoot()
  const tempDir = await realpath(await mkdtemp(path.join(tempParentDir, 'learn-loop-build-')))
  const distDir = path.join(tempDir, 'dist')
  const outputPath = path.join(tempDir, 'bundle.html')

  try {
    await writeDraftToTempProject({ tempDir, title, fileMap })

    await runViteBundleWorker({
      appRoot,
      workspaceRoot,
      tempDir,
      distDir,
      outputPath,
    })

    return await readFile(outputPath, 'utf8')
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
