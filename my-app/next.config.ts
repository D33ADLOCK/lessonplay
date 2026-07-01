import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enable strict mode for better development experience
  serverExternalPackages: ['vite', '@vitejs/plugin-react', 'esbuild', 'rollup'],
  // Pin Turbopack's workspace root to this app. Without this, Turbopack walks up
  // and finds the repo-root package-lock.json, treats that as the root, and fails
  // to resolve `next` (which is only installed here via pnpm) -> "Next.js package not found".
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
