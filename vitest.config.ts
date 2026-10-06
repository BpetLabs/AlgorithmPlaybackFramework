import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/index.ts",
        "src/common/models/animation.ts",
        "src/common/models/arrayControl.ts",
        "src/common/models/batch.ts",
        "src/common/models/graph.ts",
        "src/common/models/gridControl.ts",
        "src/common/models/griditem.ts",
        "src/common/models/snapshot.ts",
      ],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 85,
        lines: 85,
      },
    },
  },
});
