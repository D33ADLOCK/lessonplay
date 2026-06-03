import { getToolName, isToolUIPart, type UIMessage } from 'ai'

const PUBLISH_GAME_TOOL = 'publishGame'

/**
 * Reads the `demoUrl` off a completed `publishGame` tool output.
 *
 * The tool's `output` is structurally untyped here on purpose: this module is
 * imported by a client component, so it must not pull in the `server-only`
 * tools definition just to borrow its return type. We narrow defensively.
 */
function readDemoUrl(output: unknown): string | undefined {
  if (
    output &&
    typeof output === 'object' &&
    'demoUrl' in output &&
    typeof (output as { demoUrl: unknown }).demoUrl === 'string'
  ) {
    const demoUrl = (output as { demoUrl: string }).demoUrl
    return demoUrl.length > 0 ? demoUrl : undefined
  }

  return undefined
}

/**
 * Derives which game the preview should show from the chat's message stream.
 *
 * Returns the `demoUrl` of the **latest completed** `publishGame` tool call.
 * Tool calls that are still streaming (no `output-available` state yet) are
 * ignored, so the preview never flips to a half-built game mid-generation —
 * it keeps showing the previous completed game until a new one finishes.
 *
 * Pure and engine-agnostic: input is the rendered `messages` array, output is
 * a URL or `undefined` when no game has been published yet.
 */
export function selectDemoUrl(messages: UIMessage[]): string | undefined {
  let latest: string | undefined

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue
      if (getToolName(part) !== PUBLISH_GAME_TOOL) continue
      if (part.state !== 'output-available') continue

      const demoUrl = readDemoUrl(part.output)
      if (demoUrl) {
        latest = demoUrl
      }
    }
  }

  return latest
}
