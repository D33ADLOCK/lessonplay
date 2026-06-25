import {
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/ping',
])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 })
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/',
    '/chats/:path*',
    '/projects/:path*',
    '/api/:path*',
    '/sign-in/:path*',
    '/sign-up/:path*',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public files with extensions, including brand images and metadata
     */
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
}
