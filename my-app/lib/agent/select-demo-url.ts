import type { UIMessage } from 'ai'

import { selectLatestPublishedDemoUrl } from '@/lib/agent/publish-view-model'

/**
 * Derives which game the preview should show from the chat's message stream.
 *
 * Returns the `demoUrl` of the latest successful publishing tool call. Running
 * and failed publishes are ignored, so a prior working preview stays visible.
 *
 * Pure and engine-agnostic: input is the rendered `messages` array, output is
 * a URL or `undefined` when no game has been published yet.
 */
export function selectDemoUrl(messages: UIMessage[]): string | undefined {
  return selectLatestPublishedDemoUrl(messages)
}
