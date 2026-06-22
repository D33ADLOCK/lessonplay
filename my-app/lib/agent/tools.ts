import 'server-only'

import { readdir, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

import {
  addGameVersion,
  getChat,
  setGameVersionDemoUrl,
  updateChatTitle,
  updateChatLatestHtml,
} from '@/lib/db/queries'
import { uploadGameHtml } from '@/lib/storage'
import { bundleLearnLoopDraft, formatLearnLoopBuildError } from './learn-loop-bundler'
import { writeLearnLoopDraftFiles } from './learn-loop-draft-store'
import { persistLearnLoopSourceDraft } from './learn-loop-source-persistence'
import { SKILLS_DIR } from './skills'

const LEARN_LOOP_REFERENCE_DIR = path.join(SKILLS_DIR, 'learn-loop-chapter-game')
const EXCLUDED_REFERENCE_DIRS = new Set(['node_modules', 'dist', '.git'])

async function resolveSafeFile(rootDir: string, relativePath: string, label: string) {
  const normalizedPath = relativePath.replace(/\\/g, '/')

  if (path.isAbsolute(normalizedPath)) {
    throw new Error(`${label} path must be relative`)
  }

  const root = await realpath(rootDir)
  const resolvedPath = await realpath(path.resolve(root, normalizedPath))

  if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${label} path escapes the allowed directory`)
  }

  return resolvedPath
}

async function readSafeSkillFile(relativePath: string) {
  const resolvedPath = await resolveSafeFile(SKILLS_DIR, relativePath, 'Skill reference')

  return readFile(resolvedPath, 'utf8')
}

function shouldSkipReferenceEntry(entryName: string) {
  if (EXCLUDED_REFERENCE_DIRS.has(entryName)) {
    return true
  }

  return entryName.startsWith('.')
}

export async function listLearnLoopReferenceFiles() {
  const root = await realpath(LEARN_LOOP_REFERENCE_DIR)
  const files: string[] = []

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      if (shouldSkipReferenceEntry(entry.name)) {
        continue
      }

      const entryPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(entryPath)
        continue
      }

      if (!entry.isFile()) {
        continue
      }

      files.push(path.relative(root, entryPath).replace(/\\/g, '/'))
    }
  }

  await walk(root)

  return files.sort()
}

export async function readLearnLoopReferenceFile(relativePath: string) {
  try {
    const resolvedPath = await resolveSafeFile(
      LEARN_LOOP_REFERENCE_DIR,
      relativePath,
      'Learn Loop reference',
    )

    return await readFile(resolvedPath, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Learn Loop reference file not found: ${relativePath}`)
    }

    throw error
  }
}

export function createGameTools({
  chatId,
  clerkUserId,
}: {
  chatId: string
  clerkUserId: string
}) {
  return {
    readSkillReference: {
      description:
        'Read deeper game-design reference material from my-app/skills by relative path.',
      inputSchema: z.object({
        path: z
          .string()
          .min(1)
          .describe(
            'Path relative to the skills directory, for example designing-one-button-games/references/one-button-design-guide.md',
          ),
      }),
      execute: async ({ path: referencePath }: { path: string }) => {
        return readSafeSkillFile(referencePath)
      },
    },
    listLearnLoopReferenceFiles: {
      description:
        'List Learn Loop chapter-game skill and reference files available to read.',
      inputSchema: z.object({}),
      execute: async () => {
        return { files: await listLearnLoopReferenceFiles() }
      },
    },
    readLearnLoopReference: {
      description:
        'Read a Learn Loop chapter-game skill or reference file by path relative to my-app/skills/learn-loop-chapter-game.',
      inputSchema: z.object({
        path: z
          .string()
          .min(1)
          .describe(
            'Path relative to learn-loop-chapter-game, for example references/learn-loop-core/src/model/sandboxLab.ts',
          ),
      }),
      execute: async ({ path: referencePath }: { path: string }) => {
        return readLearnLoopReferenceFile(referencePath)
      },
    },
    writeLearnLoopFiles: {
      description:
        'Write or replace Learn Loop virtual project files for this chat. Use for src/, tests/, index.html, or README.md files before calling publishLearnLoopGame.',
      inputSchema: z.object({
        files: z
          .array(
            z.object({
              path: z
                .string()
                .min(1)
                .describe('Project-relative path such as src/content/missions.ts'),
              content: z.string().describe('Complete file contents. Replaces prior content.'),
            }),
          )
          .min(1)
          .max(20),
      }),
      execute: async ({
        files,
      }: {
        files: Array<{ path: string; content: string }>
      }) => {
        return {
          ok: true,
          files: writeLearnLoopDraftFiles({ chatId, files }),
        }
      },
    },
    publishLearnLoopGame: {
      description:
        'Bundle and publish the current Learn Loop virtual project. Call exactly once after writeLearnLoopFiles has saved the complete source files.',
      inputSchema: z.object({
        title: z.string().min(1).max(255),
      }),
      execute: async ({ title }: { title: string }) => {
        const chat = await getChat({ id: chatId, clerkUserId })

        if (!chat) {
          throw new Error('Chat not found')
        }

        const snapshot = await persistLearnLoopSourceDraft({ chatId })
        let html: string

        try {
          html = await bundleLearnLoopDraft({ chatId, title })
        } catch (error) {
          return {
            ok: false,
            error: formatLearnLoopBuildError(error),
            snapshot,
          }
        }

        const version = await addGameVersion({
          chatId,
          clerkUserId,
          title,
          html,
          sourceSnapshotId: snapshot.snapshotId,
          sourceManifestKey: snapshot.manifestKey,
          sourceManifestUrl: snapshot.manifestUrl,
        })

        if (!version) {
          throw new Error('Failed to publish Learn Loop game')
        }

        const { url: demoUrl } = await uploadGameHtml({ chatId, html })

        await setGameVersionDemoUrl({
          versionId: version.id,
          chatId,
          clerkUserId,
          demoUrl,
        })

        return {
          ok: true,
          versionId: version.id,
          demoUrl,
          snapshot,
        }
      },
    },
    publishGame: {
      description:
        'Publish the final self-contained HTML game for preview and persistence. Call exactly once after the game is complete.',
      inputSchema: z.object({
        title: z.string().min(1).max(255),
        html: z.string().min(1),
      }),
      execute: async ({ title, html }: { title: string; html: string }) => {
        const chat = await getChat({ id: chatId, clerkUserId })

        if (!chat) {
          throw new Error('Chat not found')
        }

        const version = await addGameVersion({
          chatId,
          clerkUserId,
          title,
          html,
        })

        if (!version) {
          throw new Error('Failed to publish game')
        }

        await updateChatTitle({ id: chatId, clerkUserId, title })
        await updateChatLatestHtml({ id: chatId, clerkUserId, latestHtml: html })

        const { url: demoUrl } = await uploadGameHtml({ chatId, html })

        await setGameVersionDemoUrl({
          versionId: version.id,
          chatId,
          clerkUserId,
          demoUrl,
        })

        return { ok: true, versionId: version.id, demoUrl }
      },
    },
  }
}
