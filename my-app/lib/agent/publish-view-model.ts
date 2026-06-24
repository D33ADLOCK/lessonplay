import { getToolName, isToolUIPart, type UIMessage, type ToolUIPart } from 'ai'

export const PUBLISH_GAME_TOOL = 'publishGame'
export const PUBLISH_LEARN_LOOP_GAME_TOOL = 'publishLearnLoopGame'

export type PublishToolName =
  | typeof PUBLISH_GAME_TOOL
  | typeof PUBLISH_LEARN_LOOP_GAME_TOOL

export type PublishViewModel = {
  tool: PublishToolName
  status: 'running' | 'succeeded' | 'failed'
  title: string
  demoUrl?: string
  error?: string
}

function isPublishToolName(toolName: string): toolName is PublishToolName {
  return (
    toolName === PUBLISH_GAME_TOOL ||
    toolName === PUBLISH_LEARN_LOOP_GAME_TOOL
  )
}

function readStringProperty(value: unknown, property: string) {
  if (!value || typeof value !== 'object' || !(property in value)) {
    return undefined
  }

  const candidate = (value as Record<string, unknown>)[property]
  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate
    : undefined
}

function didOutputFail(output: unknown) {
  return Boolean(
    output &&
      typeof output === 'object' &&
      'ok' in output &&
      (output as { ok?: unknown }).ok === false,
  )
}

export function toPublishViewModel(
  part: ToolUIPart,
): PublishViewModel | undefined {
  const tool = getToolName(part)
  if (!isPublishToolName(tool)) return undefined

  const isLearnLoop = tool === PUBLISH_LEARN_LOOP_GAME_TOOL

  if (part.state === 'output-error') {
    return {
      tool,
      status: 'failed',
      title: isLearnLoop ? 'Build failed' : 'Publish failed',
      error: part.errorText || 'The publisher returned an unknown error.',
    }
  }

  if (part.state === 'output-available') {
    if (didOutputFail(part.output)) {
      return {
        tool,
        status: 'failed',
        title: isLearnLoop ? 'Build failed' : 'Publish failed',
        error:
          readStringProperty(part.output, 'error') ||
          'The publisher returned an unknown error.',
      }
    }

    const demoUrl = readStringProperty(part.output, 'demoUrl')
    if (!demoUrl) {
      return {
        tool,
        status: 'failed',
        title: isLearnLoop ? 'Build failed' : 'Publish failed',
        error: 'Publishing completed without a preview URL.',
      }
    }

    return {
      tool,
      status: 'succeeded',
      title: 'Published successfully',
      demoUrl,
    }
  }

  return {
    tool,
    status: 'running',
    title: isLearnLoop ? 'Building game...' : 'Publishing game...',
  }
}

export function selectLatestPublishedDemoUrl(
  messages: UIMessage[],
): string | undefined {
  let latest: string | undefined

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part)) continue

      const publish = toPublishViewModel(part)
      if (publish?.status === 'succeeded') {
        latest = publish.demoUrl
      }
    }
  }

  return latest
}
