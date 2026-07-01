import 'server-only'

import { readdir, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

import { SKILLS_DIR } from '../../skills'
import {
  buildSkillRegistry,
  type SkillRegistry,
} from './skillIndex'

const LoadSkillInputSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/)
    .describe('Skill id, matching a folder under my-app/skills.'),
})

const ListSkillFilesInputSchema = LoadSkillInputSchema

const ReadSkillFileInputSchema = LoadSkillInputSchema.extend({
  path: z
    .string()
    .min(1)
    .describe(
      'Path relative to the selected skill folder, for example references/template-contract.md or assets/starter/src/ui/App.tsx.',
    ),
})

const ALLOWED_SUPPORT_DIRS = ['references', 'assets', 'scripts'] as const
const EXCLUDED_FILE_NAMES = new Set(['.git', 'node_modules', 'dist'])

let skillRegistryPromise: Promise<SkillRegistry> | undefined

function getSkillRegistry() {
  skillRegistryPromise ??= buildSkillRegistry(SKILLS_DIR)

  return skillRegistryPromise
}

function normalizeSkillFilePath(relativePath: string) {
  return relativePath.replace(/\\/g, '/')
}

function validateSkillFilePath(relativePath: string) {
  const normalizedPath = normalizeSkillFilePath(relativePath)
  const pathSegments = normalizedPath.split('/')

  if (path.isAbsolute(normalizedPath)) {
    throw new Error('Skill file path must be relative')
  }

  if (
    pathSegments.some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    )
  ) {
    throw new Error('Skill file path must not contain empty, current, or parent segments')
  }

  if (ALLOWED_SUPPORT_DIRS.some((directory) => normalizedPath === directory)) {
    throw new Error('Skill file path must include a filename inside the support directory')
  }

  if (
    !ALLOWED_SUPPORT_DIRS.some((directory) =>
      normalizedPath.startsWith(`${directory}/`),
    )
  ) {
    throw new Error(
      `Skill file path must start with one of: ${ALLOWED_SUPPORT_DIRS.join(', ')}`,
    )
  }

  return normalizedPath
}

async function resolveSafeSkillFile(skillDir: string, relativePath: string) {
  const normalizedPath = validateSkillFilePath(relativePath)
  const root = await realpath(skillDir)
  const resolvedPath = await realpath(path.resolve(root, normalizedPath))

  if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) {
    throw new Error('Skill file path escapes the selected skill directory')
  }

  return resolvedPath
}

function shouldSkipFileEntry(entryName: string) {
  return entryName.startsWith('.') || EXCLUDED_FILE_NAMES.has(entryName)
}

async function listSupportFiles(skillDir: string) {
  const root = await realpath(skillDir)
  const files: string[] = []

  async function walk(relativeDir: string) {
    let entries

    try {
      entries = await readdir(path.join(root, relativeDir), { withFileTypes: true })
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return
      }

      throw error
    }

    for (const entry of entries) {
      if (shouldSkipFileEntry(entry.name)) {
        continue
      }

      const relativePath = path
        .join(relativeDir, entry.name)
        .replace(/\\/g, '/')

      if (entry.isDirectory()) {
        await walk(relativePath)
        continue
      }

      if (!entry.isFile()) {
        continue
      }

      files.push(relativePath)
    }
  }

  for (const supportDir of ALLOWED_SUPPORT_DIRS) {
    await walk(supportDir)
  }

  return files.sort()
}

export function createSkillTools() {
  return {
    loadSkill: {
      description:
        'Load the full SKILL.md instructions for one available skill by id. Use this before following a skill; do not guess skill details from the id alone.',
      inputSchema: LoadSkillInputSchema,
      execute: async ({ id }: z.infer<typeof LoadSkillInputSchema>) => {
        const registry = await getSkillRegistry()
        const skill = registry.byId.get(id)

        if (!skill) {
          throw new Error(`Unknown skill id: ${id}`)
        }

        return {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          content: await readFile(skill.skillPath, 'utf8'),
        }
      },
    },
    listSkillFiles: {
      description:
        'List support files available for one loaded skill. Returns paths relative to that skill folder, limited to references/, assets/, and scripts/.',
      inputSchema: ListSkillFilesInputSchema,
      execute: async ({ id }: z.infer<typeof ListSkillFilesInputSchema>) => {
        const registry = await getSkillRegistry()
        const skill = registry.byId.get(id)

        if (!skill) {
          throw new Error(`Unknown skill id: ${id}`)
        }

        return {
          id: skill.id,
          files: await listSupportFiles(skill.skillDir),
        }
      },
    },
    readSkillFile: {
      description:
        'Read one support file from a loaded skill by id and relative path. The path must stay inside that skill folder and start with references/, assets/, or scripts/.',
      inputSchema: ReadSkillFileInputSchema,
      execute: async ({
        id,
        path: filePath,
      }: z.infer<typeof ReadSkillFileInputSchema>) => {
        const registry = await getSkillRegistry()
        const skill = registry.byId.get(id)

        if (!skill) {
          throw new Error(`Unknown skill id: ${id}`)
        }

        try {
          const resolvedPath = await resolveSafeSkillFile(skill.skillDir, filePath)

          return {
            id: skill.id,
            path: normalizeSkillFilePath(filePath),
            content: await readFile(resolvedPath, 'utf8'),
          }
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            throw new Error(`Skill file not found: ${filePath}`)
          }

          throw error
        }
      },
    },
  }
}
