import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow phone testing through an ngrok tunnel. The leading dot matches all
    // subdomains, so a new random ngrok URL each run still works.
    allowedHosts: [".ngrok-free.app", ".ngrok.io", ".ngrok.app"],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: "./tests/setup.ts",
  },
});
