import { defineConfig } from "vitest/config";

// Relative base so the production build can be served from any sub-path
// (the repo hosts many games under games/<slug>/).
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    outDir: "dist",
  },
  test: {
    // Domain/unit tests are pure TypeScript and must not import Phaser.
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
