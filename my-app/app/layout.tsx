import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { SWRProvider } from '@/components/providers/swr-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'LessonPlay — Turn any lesson into a playable game',
    template: '%s · LessonPlay',
  },
  description:
    'LessonPlay helps teachers and educational creators turn concepts and textbook chapters into playable learning games with AI.',
  applicationName: 'LessonPlay',
  keywords: [
    'AI education',
    'educational games',
    'teacher tools',
    'game-based learning',
    'lesson generator',
  ],
  openGraph: {
    title: 'LessonPlay — Turn any lesson into a playable game',
    description:
      'Describe a concept or textbook chapter. LessonPlay helps you choose, build, preview, and publish a playable learning experience.',
    siteName: 'LessonPlay',
    type: 'website',
    images: [{ url: '/brand/lessonplay-social.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LessonPlay — Turn any lesson into a playable game',
    description:
      'AI game creation for teachers and educational creators.',
    images: ['/brand/lessonplay-social.png'],
  },
  icons: {
    icon: '/brand/lessonplay-mark.svg',
    shortcut: '/brand/lessonplay-mark.svg',
    apple: '/brand/lessonplay-mark-180.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                
                // Listen for changes in system preference
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                  if (e.matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <SWRProvider>{children}</SWRProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
