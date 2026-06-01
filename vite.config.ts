import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/__devtools": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
