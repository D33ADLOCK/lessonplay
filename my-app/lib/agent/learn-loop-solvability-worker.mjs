import { readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

/**
 * Build-time solvability gate worker.
 *
 * Runs in a child process (mirrors learn-loop-bundler-worker.mjs) so it can use
 * the app's Vite + the workspace `@learn-loop/core` source. It SSR-loads the
 * draft's data modules (the `.ts` files under `src/`, which hold the authored
 * mission data; `.tsx` component files are skipped because they touch the DOM),
 * finds every exported value shaped like a `SandboxLabMission`, and runs the
 * combined `validateSandboxLabMission` (structural + deterministic solver) on
 * each. It returns the merged, named errors so an unsolvable mission can fail
 * publish before any version or artifact is produced.
 */

async function collectDataModules(srcDir) {
  const modules = []

  async function walk(currentDir) {
    let entries
    try {
      entries = await readdir(currentDir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue
      }
      const entryPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath)
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        modules.push(entryPath)
      }
    }
  }

  await walk(srcDir)
  return modules.sort()
}

function isMissionShaped(value) {
  if (!value || typeof value !== 'object') {
    return false
  }
  const scenario = value.scenario
  const presentation = value.presentation
  return (
    !!scenario &&
    typeof scenario === 'object' &&
    !!presentation &&
    typeof presentation === 'object' &&
    Array.isArray(presentation.stages) &&
    Array.isArray(presentation.conclusions) &&
    Array.isArray(presentation.interactions)
  )
}

/**
 * An ExperimentLab `ExperimentGame`: a rule-driven discovery game gated by
 * `validateExperimentMission` rather than the SandboxLab solver. Shaped as
 * `{ definition: { samples, tools, ruleSet }, categories[], levels[] }`.
 */
function isExperimentGameShaped(value) {
  if (!value || typeof value !== 'object') {
    return false
  }
  const definition = value.definition
  return (
    !!definition &&
    typeof definition === 'object' &&
    Array.isArray(definition.samples) &&
    Array.isArray(definition.tools) &&
    !!definition.ruleSet &&
    typeof definition.ruleSet === 'object' &&
    Array.isArray(value.categories) &&
    Array.isArray(value.levels)
  )
}

function collectShaped(moduleNamespace, predicate) {
  const found = []
  for (const exported of Object.values(moduleNamespace)) {
    if (predicate(exported)) {
      found.push(exported)
    } else if (Array.isArray(exported)) {
      for (const item of exported) {
        if (predicate(item)) {
          found.push(item)
        }
      }
    }
  }
  return found
}

function missionLabel(mission, fallbackIndex) {
  return (
    mission?.scenario?.id ??
    mission?.presentation?.scenarioId ??
    `mission-${fallbackIndex + 1}`
  )
}

function experimentGameLabel(game, fallbackIndex) {
  return game?.id ?? game?.title ?? `experiment-${fallbackIndex + 1}`
}

async function main() {
  const input = JSON.parse(process.argv[2] ?? '{}')
  const { appRoot, workspaceRoot, tempDir } = input

  if (!appRoot || !workspaceRoot || !tempDir) {
    throw new Error('Missing required Learn Loop solvability worker input')
  }

  const learnLoopCoreRoot = path.join(workspaceRoot, 'packages', 'learn-loop-core')
  const learnLoopTemplateRoot = path.join(workspaceRoot, 'packages', 'learn-loop-template')
  const appRequire = createRequire(path.join(appRoot, 'package.json'))
  const reactEntry = appRequire.resolve('react')
  const reactJsxRuntimeEntry = appRequire.resolve('react/jsx-runtime')
  const reactJsxDevRuntimeEntry = appRequire.resolve('react/jsx-dev-runtime')
  const reactDomEntry = appRequire.resolve('react-dom')
  const reactDomClientEntry = appRequire.resolve('react-dom/client')

  const { createServer } = await import('vite')

  const server = await createServer({
    root: tempDir,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    resolve: {
      alias: [
        {
          find: '@learn-loop/core/ui/styles.css',
          replacement: path.join(learnLoopCoreRoot, 'src', 'ui', 'sandboxLab.css'),
        },
        {
          find: '@learn-loop/core/ui/experiment.css',
          replacement: path.join(learnLoopCoreRoot, 'src', 'ui', 'experimentLab.css'),
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
  })

  try {
    const core = await server.ssrLoadModule(
      path.join(learnLoopCoreRoot, 'src', 'index.ts'),
    )
    const validateSandboxLabMission = core.validateSandboxLabMission
    if (typeof validateSandboxLabMission !== 'function') {
      throw new Error('validateSandboxLabMission is not exported from @learn-loop/core')
    }
    const validateExperimentMission = core.validateExperimentMission

    const dataModules = await collectDataModules(path.join(tempDir, 'src'))
    const missions = []
    const experimentGames = []
    const seen = new Set()

    for (const modulePath of dataModules) {
      let namespace
      try {
        namespace = await server.ssrLoadModule(modulePath)
      } catch {
        // A module that fails to evaluate server-side (e.g. it imports a DOM-only
        // helper) is left for the bundler/build to surface; it is not a mission.
        continue
      }
      for (const mission of collectShaped(namespace, isMissionShaped)) {
        if (!seen.has(mission)) {
          seen.add(mission)
          missions.push(mission)
        }
      }
      for (const game of collectShaped(namespace, isExperimentGameShaped)) {
        if (!seen.has(game)) {
          seen.add(game)
          experimentGames.push(game)
        }
      }
    }

    const errors = []
    missions.forEach((mission, index) => {
      const result = validateSandboxLabMission(mission)
      if (!result.ok) {
        const label = missionLabel(mission, index)
        for (const error of result.errors) {
          errors.push(`Mission "${label}": ${error}`)
        }
      }
    })
    if (experimentGames.length > 0 && typeof validateExperimentMission !== 'function') {
      errors.push(
        'ExperimentLab game found, but validateExperimentMission is not exported from @learn-loop/core',
      )
    } else {
      experimentGames.forEach((game, index) => {
        const result = validateExperimentMission(game)
        if (!result.ok) {
          const label = experimentGameLabel(game, index)
          for (const error of result.errors) {
            errors.push(`Experiment "${label}": ${error}`)
          }
        }
      })
    }

    return {
      ok: errors.length === 0,
      missionCount: missions.length + experimentGames.length,
      errors,
    }
  } finally {
    await server.close()
  }
}

main()
  .then((result) => {
    process.stdout.write(JSON.stringify(result))
  })
  .catch((error) => {
    process.stdout.write(
      JSON.stringify({
        ok: false,
        errors: [error instanceof Error ? error.message : String(error)],
        fatal: true,
      }),
    )
    process.exitCode = 1
  })
