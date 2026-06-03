import 'server-only'

import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

import {
  addGameVersion,
  getChat,
  updateChatTitle,
  updateChatLatestHtml,
} from '@/lib/db/queries'
import { SKILLS_DIR } from './skills'

async function readSafeSkillFile(relativePath: string) {
  const normalizedPath = relativePath.replace(/\\/g, '/')

  if (path.isAbsolute(normalizedPath)) {
    throw new Error('Skill reference path must be relative')
  }

  const root = await realpath(SKILLS_DIR)
  const resolvedPath = await realpath(path.resolve(root, normalizedPath))

  if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) {
    throw new Error('Skill reference path escapes the skills directory')
  }

  return readFile(resolvedPath, 'utf8')
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

        return { ok: true, versionId: version.id }
      },
    },
  }
}
