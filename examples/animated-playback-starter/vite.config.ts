import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      onLog(level, log, defaultHandler) {
        if (
          log.code === "MODULE_LEVEL_DIRECTIVE" &&
          log.id?.includes("framer-motion")
        ) {
          return;
        }

        defaultHandler(level, log);
      },
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
