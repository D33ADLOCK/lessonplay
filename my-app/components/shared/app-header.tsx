'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChatSelector } from './chat-selector'
import { MobileMenu } from './mobile-menu'
import { OpenAIConnectButton } from './openai-connect-button'
import { UserNav } from '@/components/user-nav'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)

  // Handle logo click - reset UI if on homepage, otherwise navigate to homepage
  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault()
      // Add reset parameter to trigger UI reset
      window.location.href = '/?reset=true'
    }
    // If not on homepage, let the Link component handle navigation normally
  }

  return (
    <div
      className={`${!isHomepage ? 'border-b border-border dark:border-input' : ''} ${className}`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Selector */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
            >
              Game Builder
            </Link>
            {/* Hide ChatSelector on mobile */}
            <div className="hidden lg:block">
              <ChatSelector />
            </div>
          </div>

          {/* Desktop right side - OpenAI, What's This, and User */}
          <div className="hidden lg:flex items-center gap-4">
            <OpenAIConnectButton />
            <Button
              variant="outline"
              className="py-1.5 px-2 h-fit text-sm"
              onClick={() => setIsInfoDialogOpen(true)}
            >
              <Info size={16} />
              What's This?
            </Button>
            <UserNav />
          </div>

          {/* Mobile right side - Only menu button and user avatar */}
          <div className="flex lg:hidden items-center gap-2">
            <UserNav />
            <MobileMenu onInfoDialogOpen={() => setIsInfoDialogOpen(true)} />
          </div>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">
              Game Builder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              Game Builder turns a concept or a textbook chapter into a fun,
              interactive educational mini-game. Describe what you want to teach,
              pick from a few game ideas, and watch the playable game build in
              real time.
            </p>
            <p>
              It's built with{' '}
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Next.js
              </a>{' '}
              and provides a full-featured interface with authentication,
              database integration, and real-time streaming responses.
            </p>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setIsInfoDialogOpen(false)}
              className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              Try now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
