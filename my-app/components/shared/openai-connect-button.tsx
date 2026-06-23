'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { CheckCircle2, Loader2, LogOut, PlugZap } from 'lucide-react'

import { Button } from '@/components/ui/button'

type CodexAuthStatus = {
  connected: boolean
}

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to load OpenAI connection status')
  }

  return (await response.json()) as CodexAuthStatus
}

interface OpenAIConnectButtonProps {
  variant?: 'compact' | 'menu'
  onAction?: () => void
}

export function OpenAIConnectButton({
  variant = 'compact',
  onAction,
}: OpenAIConnectButtonProps) {
  const { data, isLoading, mutate } = useSWR<CodexAuthStatus>(
    '/api/codex-auth/status',
    fetcher,
  )
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const isConnected = Boolean(data?.connected)

  const connect = () => {
    onAction?.()
    window.location.href = '/api/codex-auth/start'
  }

  const disconnect = async () => {
    setIsDisconnecting(true)

    try {
      const response = await fetch('/api/codex-auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect OpenAI')
      }

      await mutate({ connected: false }, false)
      onAction?.()
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (variant === 'menu') {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start h-auto p-3 text-left"
        onClick={isConnected ? disconnect : connect}
        disabled={isLoading || isDisconnecting}
      >
        <div className="flex items-center gap-3 w-full">
          {isLoading || isDisconnecting ? (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <PlugZap className="h-4 w-4 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-medium">
              {isConnected ? 'OpenAI Connected' : 'Connect OpenAI'}
            </div>
            <div className="text-sm text-muted-foreground">
              {isConnected
                ? 'Use ChatGPT subscription auth'
                : 'Login with ChatGPT subscription'}
            </div>
          </div>
          {isConnected && !isDisconnecting && (
            <LogOut className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
        </div>
      </Button>
    )
  }

  return (
    <Button
      variant={isConnected ? 'secondary' : 'outline'}
      className="py-1.5 px-2 h-fit text-sm"
      onClick={isConnected ? disconnect : connect}
      disabled={isLoading || isDisconnecting}
    >
      {isLoading || isDisconnecting ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isConnected ? (
        <CheckCircle2 size={16} className="text-emerald-600" />
      ) : (
        <PlugZap size={16} />
      )}
      {isConnected ? 'OpenAI Connected' : 'Connect OpenAI'}
    </Button>
  )
}
