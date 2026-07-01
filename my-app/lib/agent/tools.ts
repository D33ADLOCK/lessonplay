import 'server-only'

import { z } from 'zod'

import {
  addGameVersion,
  getChatMetadata,
  setGameVersionDemoUrl,
  updateChatTitle,
  updateChatLatestHtml,
} from '@/lib/db/queries'
import { uploadGameHtml } from '@/lib/storage'
import { bundleLearnLoopDraft, formatLearnLoopBuildError } from './learn-loop-bundler'
import { writeLearnLoopDraftFiles } from './learn-loop-draft-store'
import { persistLearnLoopSourceDraft } from './learn-loop-source-persistence'
import { createSkillTools } from './tools/skills/loadSkillTool'

export function createGameTools({
  chatId,
  clerkUserId,
}: {
  chatId: string
  clerkUserId: string
}) {
  return {
    ...createSkillTools(),
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
        const chat = await getChatMetadata({ id: chatId, clerkUserId })

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
        const chat = await getChatMetadata({ id: chatId, clerkUserId })

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
