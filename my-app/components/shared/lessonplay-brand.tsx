import Link from 'next/link'
import type { MouseEventHandler } from 'react'

import { cn } from '@/lib/utils'

export function LessonPlayMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('size-8', className)}
      viewBox="0 0 64 64"
      fill="none"
    >
      <rect width="64" height="64" rx="18" fill="#4F46E5" />
      <path
        d="M17 18.5C17 15.4624 19.4624 13 22.5 13H41.5C44.5376 13 47 15.4624 47 18.5V45.5C47 48.5376 44.5376 51 41.5 51H22.5C19.4624 51 17 48.5376 17 45.5V18.5Z"
        fill="#EEF2FF"
      />
      <path
        d="M28 24.413C28 22.886 29.652 21.923 30.985 22.667L40.886 28.254C42.238 29.017 42.238 30.983 40.886 31.746L30.985 37.333C29.652 38.077 28 37.114 28 35.587V24.413Z"
        fill="#F97316"
      />
      <path d="M23 43H41" stroke="#A5B4FC" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LessonPlayBrand({
  href = '/',
  className,
  onClick,
}: {
  href?: string
  className?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2.5 text-gray-950 transition-opacity hover:opacity-80 dark:text-white',
        className,
      )}
    >
      <LessonPlayMark />
      <span className="text-lg font-semibold tracking-tight">LessonPlay</span>
    </Link>
  )
}
