import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enable strict mode for better development experience
  serverExternalPackages: ['vite', '@vitejs/plugin-react', 'esbuild', 'rollup'],
}

export default nextConfig
