import { defineConfig } from "vitest/config";

export default defineConfig({
  // Tests are pure Node logic — don't load the Next/Tailwind PostCSS pipeline.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
