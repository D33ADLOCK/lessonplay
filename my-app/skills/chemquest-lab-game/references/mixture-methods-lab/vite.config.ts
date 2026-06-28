import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".ngrok-free.app", ".ngrok.io", ".ngrok.app"],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: "./tests/setup.ts",
  },
});
